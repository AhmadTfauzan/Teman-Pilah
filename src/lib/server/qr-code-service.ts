import { Prisma, QrCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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

export function getCanonicalSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteUrl =
    envUrl &&
    !envUrl.includes("trycloudflare.com") &&
    !envUrl.includes("localhost")
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
  return `${getCanonicalSiteUrl()}${prefix}/${code}`;
}

async function generateUniqueBatchQrCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generatePublicBatchCode();
    const [existingQr, existingBatchCount] = await Promise.all([
      prisma.qrCode.findUnique({ where: { code: candidate } }),
      prisma.ecoEnzymeBatch.count({ where: { publicCode: candidate } }),
    ]);
    if (!existingQr && existingBatchCount === 0) {
      return candidate;
    }
  }
  throw new AppError("Gagal menghasilkan kode QR batch unik setelah 5 percobaan", 500);
}

async function generateUniqueProductQrCode(normalizedKey: string | null): Promise<string> {
  if (normalizedKey) {
    const sanitizedKey = normalizedKey.replace(/\s+/g, "-");
    const preferredCode = `PRD-${sanitizedKey}`;
    const existingQr = await prisma.qrCode.findUnique({ where: { code: preferredCode } });
    if (!existingQr) {
      return preferredCode;
    }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = generatePublicBatchCode().replace(/^EE-/, "");
    const candidate = `PRD-${suffix}`;
    const existingQr = await prisma.qrCode.findUnique({ where: { code: candidate } });
    if (!existingQr) {
      return candidate;
    }
  }

  throw new AppError("Gagal menghasilkan kode QR produk unik setelah 5 percobaan", 500);
}

async function linkQrCodeIfUnset(
  entityType: QrEntityType,
  entityId: string | null | undefined,
  qrCodeId: string,
  alreadyLinkedId?: string | null
): Promise<void> {
  if (!entityId || alreadyLinkedId) return;

  if (entityType === "ECO_ENZYME_BATCH") {
    await prisma.ecoEnzymeBatch.updateMany({
      where: { id: entityId, qrCodeId: null },
      data: { qrCodeId },
    });
  } else {
    await prisma.product.updateMany({
      where: { id: entityId, qrCodeId: null },
      data: { qrCodeId },
    });
  }
}

async function resolveFromLegacyBatch(
  batch: { id: string; publicCode: string; batchCode: string; containerName: string; qrCodeId: string | null },
  prefix: "/b" | "/p",
  fallbackKey: string | null,
  fallbackName: string,
  targetEntityId?: string | null
): Promise<QrCode> {
  const legacyCode = normalizeBatchCode(batch.publicCode);
  const existingQr = await prisma.qrCode.findFirst({
    where: { code: { equals: legacyCode, mode: "insensitive" } },
  });
  if (existingQr) {
    await linkQrCodeIfUnset("ECO_ENZYME_BATCH", batch.id, existingQr.id, batch.qrCodeId);
    await linkQrCodeIfUnset("ECO_ENZYME_BATCH", targetEntityId, existingQr.id);
    return existingQr;
  }

  const created = await prisma.qrCode.create({
    data: {
      code: legacyCode,
      entityType: "ECO_ENZYME_BATCH",
      primaryKey: fallbackKey ?? normalizeEntityKey(batch.batchCode),
      primaryName: fallbackName || normalizeEntityName(batch.containerName) || legacyCode.toLowerCase(),
      targetUrl: buildTargetUrl(prefix, legacyCode),
    },
  });
  await linkQrCodeIfUnset("ECO_ENZYME_BATCH", batch.id, created.id, batch.qrCodeId);
  await linkQrCodeIfUnset("ECO_ENZYME_BATCH", targetEntityId, created.id);
  return created;
}

export async function resolveOrCreateQrCode(
  input: ResolveOrCreateQrInput
): Promise<ResolveOrCreateQrResult> {
  const prefix = getDefaultPathPrefix(input.entityType, input.pathPrefix);
  let normalizedKey = normalizeEntityKey(input.entityKey);
  let normalizedName = normalizeEntityName(input.entityName);

  // 1) Check existing entity by entityId
  if (input.entityId) {
    if (input.entityType === "ECO_ENZYME_BATCH") {
      const existingBatch = await prisma.ecoEnzymeBatch.findUnique({
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
            existingBatch,
            prefix,
            normalizedKey,
            normalizedName
          );
          return { qrCode, reused: true };
        }
      }
    } else {
      const existingProduct = await prisma.product.findUnique({
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
    const previousBatch = await prisma.ecoEnzymeBatch.findUnique({
      where: { id: input.previousEntityId },
      include: { qrCode: true },
    });

    if (previousBatch?.qrCode) {
      await linkQrCodeIfUnset("ECO_ENZYME_BATCH", input.entityId, previousBatch.qrCode.id);
      return { qrCode: previousBatch.qrCode, reused: true };
    }

    if (previousBatch?.publicCode) {
      const qrCode = await resolveFromLegacyBatch(
        previousBatch,
        prefix,
        normalizeEntityKey(previousBatch.batchCode) ?? normalizedKey,
        normalizeEntityName(previousBatch.containerName) || normalizedName,
        input.entityId
      );
      return { qrCode, reused: true };
    }
  }

  // 3) & 4) Check QrCode registry by primaryKey, then primaryName
  if (normalizedKey) {
    const existingByKey = await prisma.qrCode.findFirst({
      where: {
        entityType: input.entityType,
        primaryKey: { equals: normalizedKey, mode: "insensitive" },
      },
      orderBy: { createdAt: "asc" },
    });
    if (existingByKey) {
      await linkQrCodeIfUnset(input.entityType, input.entityId, existingByKey.id);
      return { qrCode: existingByKey, reused: true };
    }
  }

  if (normalizedName) {
    const existingByName = await prisma.qrCode.findFirst({
      where: {
        entityType: input.entityType,
        primaryName: { equals: normalizedName, mode: "insensitive" },
      },
      orderBy: { createdAt: "asc" },
    });
    if (existingByName) {
      await linkQrCodeIfUnset(input.entityType, input.entityId, existingByName.id);
      return { qrCode: existingByName, reused: true };
    }
  }

  // Fallback for legacy EcoEnzymeBatch rows matching batchCode/containerName without QrCode registry entry yet
  if (input.entityType === "ECO_ENZYME_BATCH" && (normalizedKey || normalizedName)) {
    const legacyBatch = await prisma.ecoEnzymeBatch.findFirst({
      where: {
        OR: [
          ...(normalizedKey ? [{ batchCode: { equals: normalizedKey, mode: "insensitive" as const } }] : []),
          ...(normalizedName ? [{ containerName: { equals: normalizedName, mode: "insensitive" as const } }] : []),
        ],
      },
      include: { qrCode: true },
      orderBy: [
        { archivedAt: { sort: "asc", nulls: "first" } },
        { createdAt: "desc" },
      ],
    });

    if (legacyBatch?.qrCode) {
      await linkQrCodeIfUnset("ECO_ENZYME_BATCH", input.entityId, legacyBatch.qrCode.id);
      return { qrCode: legacyBatch.qrCode, reused: true };
    }

    if (legacyBatch?.publicCode) {
      const qrCode = await resolveFromLegacyBatch(
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
      ? await generateUniqueBatchQrCode()
      : await generateUniqueProductQrCode(normalizedKey);

  const targetUrl = buildTargetUrl(prefix, code);

  try {
    const created = await prisma.qrCode.create({
      data: {
        code,
        entityType: input.entityType,
        primaryKey: normalizedKey,
        primaryName: normalizedName || code.toLowerCase(),
        targetUrl,
      },
    });

    await linkQrCodeIfUnset(input.entityType, input.entityId, created.id);
    return { qrCode: created, reused: false };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const raced = await prisma.qrCode.findUnique({ where: { code } });
      if (raced) {
        await linkQrCodeIfUnset(input.entityType, input.entityId, raced.id);
        return { qrCode: raced, reused: true };
      }
    }
    throw err;
  }
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
    const byName = await prisma.qrCode.findFirst({
      where: {
        ...(input.entityType ? { entityType: input.entityType } : {}),
        primaryName: { equals: normalizedName, mode: "insensitive" },
      },
      orderBy: { createdAt: "asc" },
    });
    if (byName) return byName;
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
    batch = await prisma.ecoEnzymeBatch.findFirst({
      where: {
        OR: [
          { qrCodeId: qrCode.id },
          { publicCode: { equals: qrCode.code, mode: "insensitive" } },
        ],
      },
      orderBy: [
        { archivedAt: { sort: "asc", nulls: "first" } },
        { createdAt: "desc" },
      ],
      include: {
        _count: { select: { inspectionLogs: true } },
        allocatedProduct: {
          select: { id: true, productCode: true, name: true },
        },
        previousBatch: {
          select: { id: true, publicCode: true, batchCode: true, containerName: true },
        },
        nextBatches: {
          select: { id: true, publicCode: true, batchCode: true, containerName: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } else if (qrCode.entityType === "PRODUCT") {
    product = await prisma.product.findFirst({
      where: {
        OR: [
          { qrCodeId: qrCode.id },
          ...(qrCode.primaryKey
            ? [{ productCode: { equals: qrCode.primaryKey, mode: "insensitive" as const } }]
            : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return {
    ...qrCode,
    batch,
    product,
  };
}
