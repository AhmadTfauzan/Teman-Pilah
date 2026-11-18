import { Prisma, QrCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isTemporaryBaseUrl } from "@/lib/batch-url";
import { generatePublicBatchCode, normalizeBatchCode } from "./code";
import { AppError } from "./error";

export type QrEntityType = "ECO_ENZYME_BATCH" | "PRODUCT";

export interface ResolveOrCreateQrInput {
  entityType: QrEntityType;
  entityId?: string | null;
  previousEntityId?: string | null;
  entityKey?: string | null;
  entityName: string;
  pathPrefix?: "/b" | "/p";
}

export interface ResolveOrCreateQrResult {
  qrCode: QrCode;
  reused: boolean;
}

export interface SaveQrImageInput {
  qrCodeId?: string | null;
  code?: string | null;
  entityType?: QrEntityType | null;
  entityId?: string | null;
  targetUrl?: string | null;
  qrDataUrl: string;
  force?: boolean;
}

export interface SaveQrImageResult {
  qrCode: QrCode;
  updated: boolean;
}

export interface FindQrInput {
  code?: string | null;
  entityType?: QrEntityType | null;
  entityId?: string | null;
  entityKey?: string | null;
  entityName?: string | null;
}

const DEFAULT_CANONICAL_SITE_URL = "https://teman-pilahfe-main.vercel.app";
const MAX_QR_TX_RETRIES = 5;

export function getCanonicalSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteUrl =
    envUrl && !isTemporaryBaseUrl(envUrl)
      ? envUrl
      : DEFAULT_CANONICAL_SITE_URL;

  return siteUrl.replace(/\/+$/, "");
}

function getDefaultPathPrefix(entityType: QrEntityType, pathPrefix?: "/b" | "/p"): "/b" | "/p" {
  if (pathPrefix) return pathPrefix;
  return entityType === "PRODUCT" ? "/p" : "/b";
}

function normalizeEntityKey(entityKey?: string | null): string | null {
  const trimmed = entityKey?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

function normalizeEntityName(entityName?: string | null): string {
  return (entityName || "").trim().toLowerCase();
}

function buildTargetUrl(prefix: "/b" | "/p", code: string): string {
  return `${getCanonicalSiteUrl()}${prefix}/${encodeURIComponent(code)}`;
}

function isRetryableRaceError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    (err.code === "P2002" || err.code === "P2034")
  );
}

async function generateUniqueBatchQrCode(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generatePublicBatchCode();
    const existingQr = await tx.qrCode.findUnique({ where: { code: candidate } });
    if (existingQr) continue;

    const existingBatchCount = await tx.ecoEnzymeBatch.count({ where: { publicCode: candidate } });
    if (existingBatchCount === 0) {
      return candidate;
    }
  }
  throw new AppError("Gagal menghasilkan kode QR batch unik setelah 5 percobaan", 500);
}

async function generateUniqueProductQrCode(
  tx: Prisma.TransactionClient,
  normalizedKey: string | null
): Promise<string> {
  if (normalizedKey) {
    const sanitizedKey = normalizedKey
      .replace(/[^A-Z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (sanitizedKey) {
      const preferredCode = `PRD-${sanitizedKey}`;
      const existingQr = await tx.qrCode.findUnique({ where: { code: preferredCode } });
      if (!existingQr) {
        return preferredCode;
      }
    }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = generatePublicBatchCode().replace(/^EE-/, "");
    const candidate = `PRD-${suffix}`;
    const existingQr = await tx.qrCode.findUnique({ where: { code: candidate } });
    if (!existingQr) {
      return candidate;
    }
  }

  throw new AppError("Gagal menghasilkan kode QR produk unik setelah 5 percobaan", 500);
}

async function linkQrCodeIfUnset(
  tx: Prisma.TransactionClient,
  entityType: QrEntityType,
  entityId: string | null | undefined,
  qrCodeId: string,
  alreadyLinkedId?: string | null
): Promise<void> {
  if (!entityId || alreadyLinkedId) return;

  if (entityType === "ECO_ENZYME_BATCH") {
    await tx.ecoEnzymeBatch.updateMany({
      where: { id: entityId, qrCodeId: null },
      data: { qrCodeId },
    });
  } else {
    await tx.product.updateMany({
      where: { id: entityId, qrCodeId: null },
      data: { qrCodeId },
    });
  }
}

async function resolveFromLegacyBatch(
  tx: Prisma.TransactionClient,
  batch: { id: string; publicCode: string; batchCode: string; containerName: string; qrCodeId: string | null },
  prefix: "/b" | "/p",
  fallbackKey: string | null,
  fallbackName: string,
  targetEntityId?: string | null
): Promise<QrCode> {
  const legacyCode = normalizeBatchCode(batch.publicCode);
  const existingQr = await tx.qrCode.findFirst({
    where: { code: { equals: legacyCode, mode: "insensitive" } },
  });
  if (existingQr) {
    await linkQrCodeIfUnset(tx, "ECO_ENZYME_BATCH", batch.id, existingQr.id, batch.qrCodeId);
    await linkQrCodeIfUnset(tx, "ECO_ENZYME_BATCH", targetEntityId, existingQr.id);
    return existingQr;
  }

  const created = await tx.qrCode.create({
    data: {
      code: legacyCode,
      entityType: "ECO_ENZYME_BATCH",
      primaryKey: fallbackKey ?? normalizeEntityKey(batch.batchCode),
      primaryName: fallbackName || normalizeEntityName(batch.containerName) || legacyCode.toLowerCase(),
      targetUrl: buildTargetUrl(prefix, legacyCode),
    },
  });
  await linkQrCodeIfUnset(tx, "ECO_ENZYME_BATCH", batch.id, created.id, batch.qrCodeId);
  await linkQrCodeIfUnset(tx, "ECO_ENZYME_BATCH", targetEntityId, created.id);
  return created;
}

type QrClient = Prisma.TransactionClient | typeof prisma;

async function findActiveOrLatestArchivedBatch<T extends Prisma.EcoEnzymeBatchInclude>(
  db: QrClient,
  where: Prisma.EcoEnzymeBatchWhereInput,
  include: T
): Promise<Prisma.EcoEnzymeBatchGetPayload<{ include: T }> | null> {
  const active = await db.ecoEnzymeBatch.findFirst({
    where: { AND: [where, { archivedAt: null }] },
    include,
    orderBy: { createdAt: "desc" },
  });
  if (active) {
    return active as Prisma.EcoEnzymeBatchGetPayload<{ include: T }>;
  }

  const archived = await db.ecoEnzymeBatch.findFirst({
    where: { AND: [where, { archivedAt: { not: null } }] },
    include,
    orderBy: [{ archivedAt: "desc" }, { createdAt: "desc" }],
  });
  return archived as Prisma.EcoEnzymeBatchGetPayload<{ include: T }> | null;
}

type QrCandidate = QrCode & {
  products: Array<{ id: string; productCode: string }>;
  batches: Array<{ id: string; batchCode: string }>;
};

function stripQrRelations(candidate: QrCandidate): QrCode {
  return {
    id: candidate.id,
    code: candidate.code,
    entityType: candidate.entityType,
    primaryKey: candidate.primaryKey,
    primaryName: candidate.primaryName,
    targetUrl: candidate.targetUrl,
    qrDataUrl: candidate.qrDataUrl,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

function hasConflictingEntityKey(candidate: QrCandidate, normalizedKey: string): boolean {
  const candidateKey = normalizeEntityKey(candidate.primaryKey);
  if (candidateKey && candidateKey !== normalizedKey) {
    return true;
  }

  const hasConflictingProduct = candidate.products.some((p) => {
    const key = normalizeEntityKey(p.productCode);
    return Boolean(key && key !== normalizedKey);
  });
  const hasConflictingBatch = candidate.batches.some((b) => {
    const key = normalizeEntityKey(b.batchCode);
    return Boolean(key && key !== normalizedKey);
  });

  return hasConflictingProduct || hasConflictingBatch;
}

async function findMatchingQrByName(
  db: QrClient,
  entityType: QrEntityType | null | undefined,
  normalizedName: string,
  normalizedKey: string | null,
  backfillPrimaryKey: boolean
): Promise<QrCode | null> {
  const where: Prisma.QrCodeWhereInput = {
    ...(entityType ? { entityType } : {}),
    primaryName: { equals: normalizedName, mode: "insensitive" },
    ...(normalizedKey
      ? {
          OR: [
            { primaryKey: null },
            { primaryKey: "" },
            { primaryKey: { equals: normalizedKey, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const candidates = await db.qrCode.findMany({
    where,
    include: {
      products: { select: { id: true, productCode: true } },
      batches: {
        select: { id: true, batchCode: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  for (const candidate of candidates) {
    if (normalizedKey) {
      if (hasConflictingEntityKey(candidate, normalizedKey)) {
        continue;
      }

      if (backfillPrimaryKey && !normalizeEntityKey(candidate.primaryKey)) {
        return db.qrCode.update({
          where: { id: candidate.id },
          data: { primaryKey: normalizedKey },
        });
      }
    }

    return stripQrRelations(candidate);
  }

  return null;
}

async function resolveOrCreateQrCodeInTx(
  tx: Prisma.TransactionClient,
  input: ResolveOrCreateQrInput
): Promise<ResolveOrCreateQrResult> {
  const prefix = getDefaultPathPrefix(input.entityType, input.pathPrefix);
  let normalizedKey = normalizeEntityKey(input.entityKey);
  let normalizedName = normalizeEntityName(input.entityName);

  // 1) Check existing entity by entityId
  if (input.entityId) {
    if (input.entityType === "ECO_ENZYME_BATCH") {
      const existingBatch = await tx.ecoEnzymeBatch.findUnique({
        where: { id: input.entityId },
        include: { qrCode: true },
      });

      if (existingBatch?.qrCode) {
        return { qrCode: existingBatch.qrCode, reused: true };
      }

      if (existingBatch) {
        normalizedKey = normalizedKey ?? normalizeEntityKey(existingBatch.batchCode);
        normalizedName = normalizedName || normalizeEntityName(existingBatch.containerName);

        if (existingBatch.publicCode) {
          const qrCode = await resolveFromLegacyBatch(
            tx,
            existingBatch,
            prefix,
            normalizedKey,
            normalizedName
          );
          return { qrCode, reused: true };
        }
      }
    } else {
      const existingProduct = await tx.product.findUnique({
        where: { id: input.entityId },
        include: { qrCode: true },
      });

      if (existingProduct?.qrCode) {
        return { qrCode: existingProduct.qrCode, reused: true };
      }

      if (existingProduct) {
        normalizedKey = normalizedKey ?? normalizeEntityKey(existingProduct.productCode);
        normalizedName = normalizedName || normalizeEntityName(existingProduct.name);
      }
    }
  }

  // 2) Check previousEntityId for Eco Enzyme gallon succession
  if (input.previousEntityId && input.entityType === "ECO_ENZYME_BATCH") {
    const previousBatch = await tx.ecoEnzymeBatch.findUnique({
      where: { id: input.previousEntityId },
      include: { qrCode: true },
    });

    if (previousBatch?.qrCode) {
      await linkQrCodeIfUnset(tx, "ECO_ENZYME_BATCH", input.entityId, previousBatch.qrCode.id);
      return { qrCode: previousBatch.qrCode, reused: true };
    }

    if (previousBatch?.publicCode) {
      const qrCode = await resolveFromLegacyBatch(
        tx,
        previousBatch,
        prefix,
        normalizeEntityKey(previousBatch.batchCode) ?? normalizedKey,
        normalizeEntityName(previousBatch.containerName) || normalizedName,
        input.entityId
      );
      return { qrCode, reused: true };
    }
  }

  // 3) Check QrCode registry by primaryKey
  if (normalizedKey) {
    const existingByKey = await tx.qrCode.findFirst({
      where: {
        entityType: input.entityType,
        primaryKey: { equals: normalizedKey, mode: "insensitive" },
      },
      orderBy: { createdAt: "asc" },
    });
    if (existingByKey) {
      await linkQrCodeIfUnset(tx, input.entityType, input.entityId, existingByKey.id);
      return { qrCode: existingByKey, reused: true };
    }
  }

  // 4) Check QrCode registry by primaryName only when normalizedKey is empty
  //    or when the target QrCode row has null/empty/matching primaryKey
  if (normalizedName) {
    const existingByName = await findMatchingQrByName(
      tx,
      input.entityType,
      normalizedName,
      normalizedKey,
      true
    );
    if (existingByName) {
      await linkQrCodeIfUnset(tx, input.entityType, input.entityId, existingByName.id);
      return { qrCode: existingByName, reused: true };
    }
  }

  // Fallback for legacy EcoEnzymeBatch rows without QrCode registry entry yet.
  // When normalizedKey is set, only match batches with the same batchCode (never steal another batchCode by containerName).
  if (input.entityType === "ECO_ENZYME_BATCH" && (normalizedKey || normalizedName)) {
    const legacyWhere: Prisma.EcoEnzymeBatchWhereInput = normalizedKey
      ? {
          OR: [
            { batchCode: { equals: normalizedKey, mode: "insensitive" } },
            ...(normalizedName
              ? [
                  {
                    AND: [
                      { batchCode: "" },
                      { containerName: { equals: normalizedName, mode: "insensitive" as const } },
                    ],
                  },
                ]
              : []),
          ],
        }
      : { containerName: { equals: normalizedName, mode: "insensitive" } };

    const legacyBatch = await findActiveOrLatestArchivedBatch(tx, legacyWhere, {
      qrCode: true,
    });

    if (legacyBatch?.qrCode) {
      await linkQrCodeIfUnset(tx, "ECO_ENZYME_BATCH", input.entityId, legacyBatch.qrCode.id);
      return { qrCode: legacyBatch.qrCode, reused: true };
    }

    if (legacyBatch?.publicCode) {
      const qrCode = await resolveFromLegacyBatch(
        tx,
        legacyBatch,
        prefix,
        normalizedKey,
        normalizedName,
        input.entityId
      );
      return { qrCode, reused: true };
    }
  }

  // 5) None of 1-4 matched: generate a new unique code and persist in QrCode registry
  const code =
    input.entityType === "ECO_ENZYME_BATCH"
      ? await generateUniqueBatchQrCode(tx)
      : await generateUniqueProductQrCode(tx, normalizedKey);

  const targetUrl = buildTargetUrl(prefix, code);

  const created = await tx.qrCode.create({
    data: {
      code,
      entityType: input.entityType,
      primaryKey: normalizedKey,
      primaryName: normalizedName || code.toLowerCase(),
      targetUrl,
    },
  });

  await linkQrCodeIfUnset(tx, input.entityType, input.entityId, created.id);
  return { qrCode: created, reused: false };
}

export async function resolveOrCreateQrCode(
  input: ResolveOrCreateQrInput
): Promise<ResolveOrCreateQrResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_QR_TX_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(
        (tx) => resolveOrCreateQrCodeInTx(tx, input),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        }
      );
    } catch (err) {
      if (isRetryableRaceError(err) && attempt < MAX_QR_TX_RETRIES - 1) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export async function findQrByCodeOrEntity(input: FindQrInput): Promise<QrCode | null> {
  if (input.code?.trim()) {
    return prisma.qrCode.findFirst({
      where: { code: { equals: input.code.trim(), mode: "insensitive" } },
    });
  }

  if (input.entityId?.trim()) {
    const entityId = input.entityId.trim();
    const checkBatch = !input.entityType || input.entityType === "ECO_ENZYME_BATCH";
    const checkProduct = !input.entityType || input.entityType === "PRODUCT";

    if (checkBatch) {
      const batch = await prisma.ecoEnzymeBatch.findUnique({
        where: { id: entityId },
        include: { qrCode: true },
      });
      if (batch?.qrCode) return batch.qrCode;
      if (batch?.publicCode) {
        const byPublicCode = await prisma.qrCode.findFirst({
          where: { code: { equals: batch.publicCode, mode: "insensitive" } },
        });
        if (byPublicCode) return byPublicCode;
      }
    }

    if (checkProduct) {
      const product = await prisma.product.findUnique({
        where: { id: entityId },
        include: { qrCode: true },
      });
      if (product?.qrCode) return product.qrCode;
    }
  }

  const normalizedKey = normalizeEntityKey(input.entityKey);
  if (normalizedKey) {
    const byKey = await prisma.qrCode.findFirst({
      where: {
        ...(input.entityType ? { entityType: input.entityType } : {}),
        primaryKey: { equals: normalizedKey, mode: "insensitive" },
      },
      orderBy: { createdAt: "asc" },
    });
    if (byKey) return byKey;
  }

  const normalizedName = normalizeEntityName(input.entityName);
  if (normalizedName) {
    return findMatchingQrByName(
      prisma,
      input.entityType,
      normalizedName,
      normalizedKey,
      false
    );
  }

  return null;
}

export async function saveQrImage(input: SaveQrImageInput): Promise<SaveQrImageResult> {
  if (!input.qrDataUrl || typeof input.qrDataUrl !== "string") {
    throw new AppError("Data gambar QR wajib diisi", 400);
  }

  let existing: QrCode | null = null;
  if (input.qrCodeId?.trim()) {
    existing = await prisma.qrCode.findUnique({ where: { id: input.qrCodeId.trim() } });
  } else {
    existing = await findQrByCodeOrEntity({
      code: input.code,
      entityType: input.entityType,
      entityId: input.entityId,
    });
  }

  if (!existing) {
    throw new AppError("QR Code tidak ditemukan", 404);
  }

  const nextTargetUrl = input.targetUrl?.trim() || null;
  const isTargetUnchanged = !nextTargetUrl || existing.targetUrl === nextTargetUrl;

  if (existing.qrDataUrl && isTargetUnchanged && !input.force) {
    return { qrCode: existing, updated: false };
  }

  const updated = await prisma.qrCode.update({
    where: { id: existing.id },
    data: {
      qrDataUrl: input.qrDataUrl,
      ...(nextTargetUrl ? { targetUrl: nextTargetUrl } : {}),
    },
  });

  return { qrCode: updated, updated: true };
}

export async function getQrCodeDetailsByCode(code: string) {
  const trimmed = (code || "").trim();
  if (!trimmed) {
    throw new AppError("Kode QR tidak valid", 400);
  }

  const qrCode = await prisma.qrCode.findFirst({
    where: { code: { equals: trimmed, mode: "insensitive" } },
  });

  if (!qrCode) {
    throw new AppError("QR Code tidak ditemukan", 404);
  }

  let batch = null;
  let product = null;

  if (qrCode.entityType === "ECO_ENZYME_BATCH") {
    batch = await findActiveOrLatestArchivedBatch(
      prisma,
      {
        OR: [
          { qrCodeId: qrCode.id },
          { publicCode: { equals: qrCode.code, mode: "insensitive" } },
        ],
      },
      {
        _count: { select: { inspectionLogs: true } },
        allocatedProduct: {
          select: { id: true, productCode: true, name: true },
        },
        previousBatch: {
          select: { id: true, publicCode: true, batchCode: true, containerName: true },
        },
        nextBatches: {
          where: { archivedAt: null },
          select: { id: true, publicCode: true, batchCode: true, containerName: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      }
    );
  } else if (qrCode.entityType === "PRODUCT") {
    product = await prisma.product.findFirst({
      where: { qrCodeId: qrCode.id },
      orderBy: { createdAt: "desc" },
    });

    if (!product && qrCode.primaryKey) {
      product = await prisma.product.findFirst({
        where: { productCode: { equals: qrCode.primaryKey, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  return {
    ...qrCode,
    batch,
    product,
  };
}
