import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_FERMENTATION_DAYS,
  formatDateInputWib,
  getDefaultSweetenerForEnzyme,
  getEnzymeTypeMeta,
  getSweetenerMeta,
  isSweetenerAllowedForEnzyme,
} from "@/lib/eco-enzyme";
import { AppError } from "./error";
import { parsePagination, buildPaginationMeta } from "./pagination";
import { normalizeBatchCode } from "./code";
import { resolveOrCreateQrCode } from "./qr-code-service";
import {
  EnzymeBatchStatus,
  EnzymeFailureReason,
  EnzymeResidueUsage,
  EnzymeSweetenerType,
  EnzymeType,
  Prisma,
  StockLabel,
} from "@prisma/client";

const MS_PER_DAY = 86_400_000;
const VALID_BATCH_STATUSES = new Set<string>(Object.values(EnzymeBatchStatus));
const VALID_FAILURE_REASONS = new Set<string>(Object.values(EnzymeFailureReason));
const VALID_ENZYME_TYPES = new Set<string>(Object.values(EnzymeType));
const VALID_SWEETENER_TYPES = new Set<string>(Object.values(EnzymeSweetenerType));

function parseStrictEnzymeType(value: unknown): EnzymeType {
  if (typeof value !== "string") {
    throw new AppError("Jenis enzim tidak valid", 400);
  }
  const normalized = value.trim().toUpperCase();
  if (!VALID_ENZYME_TYPES.has(normalized)) {
    throw new AppError(
      "Jenis enzim tidak valid. Pilih ECO_ENZYME atau CLASSIC_ENZYME",
      400
    );
  }
  return normalized as EnzymeType;
}

function parseStrictSweetenerType(value: unknown): EnzymeSweetenerType {
  if (typeof value !== "string") {
    throw new AppError("Jenis pemanis tidak valid", 400);
  }
  const normalized = value.trim().toUpperCase();
  if (!VALID_SWEETENER_TYPES.has(normalized)) {
    throw new AppError(
      "Jenis pemanis tidak valid. Pilih MOLASE, GULA, atau MADU",
      400
    );
  }
  return normalized as EnzymeSweetenerType;
}

function assertSweetenerAllowed(
  enzymeType: EnzymeType,
  sweetenerType: EnzymeSweetenerType
): void {
  if (!isSweetenerAllowedForEnzyme(enzymeType, sweetenerType)) {
    throw new AppError(
      enzymeType === EnzymeType.CLASSIC_ENZYME
        ? "Classic Enzyme hanya mendukung pemanis Madu atau Gula"
        : "Eco Enzyme hanya mendukung pemanis Molase atau Gula",
      400
    );
  }
}

const ACTIVE_NEXT_BATCHES_INCLUDE = {
  where: { archivedAt: null },
  select: { id: true, publicCode: true, containerName: true },
  take: 1,
  orderBy: { createdAt: "desc" as const },
};

function getReadyCutoffDate(now: Date): Date {
  return new Date(now.getTime() - DEFAULT_FERMENTATION_DAYS * MS_PER_DAY);
}

function parseRequiredDate(raw: unknown, errorMessage: string): Date {
  if (typeof raw !== "string" && !(raw instanceof Date)) {
    throw new AppError(errorMessage, 400);
  }
  if (typeof raw === "string" && !raw.trim()) {
    throw new AppError(errorMessage, 400);
  }
  const parsed = raw instanceof Date ? new Date(raw.getTime()) : new Date(raw);
  if (isNaN(parsed.getTime())) {
    throw new AppError(errorMessage, 400);
  }
  return parsed;
}

function parsePositiveNumber(value: unknown, label: string): number {
  if (typeof value === "boolean" || value === null || value === undefined || value === "") {
    throw new AppError(`${label} harus berupa angka lebih dari 0`, 400);
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new AppError(`${label} harus berupa angka lebih dari 0`, 400);
  }
  return num;
}

async function assertBatchExists(id: string): Promise<void> {
  const existing = await prisma.ecoEnzymeBatch.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
  }
}

async function generateUniqueRandomBatchCode(startDate: Date): Promise<string> {
  const wibDate = formatDateInputWib(startDate);
  const yyyymm = wibDate
    ? wibDate.slice(0, 7).replace("-", "")
    : `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, "0")}`;

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `EE-${yyyymm}-${crypto.randomInt(100, 1000)}`;
    const existingCount = await prisma.ecoEnzymeBatch.count({
      where: { batchCode: { equals: candidate, mode: "insensitive" } },
    });
    if (existingCount === 0) {
      return candidate;
    }
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `EE-${yyyymm}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const existingCount = await prisma.ecoEnzymeBatch.count({
      where: { batchCode: { equals: candidate, mode: "insensitive" } },
    });
    if (existingCount === 0) {
      return candidate;
    }
  }

  throw new AppError("Gagal menghasilkan kode batch unik", 500);
}

export interface BatchDynamicStatusTarget {
  startDate: Date | string;
  harvestEstimate: Date | string;
  status: EnzymeBatchStatus | string;
  archivedAt?: Date | string | null;
}

export type EcoEnzymeDisplayStatus =
  | "FERMENTING"
  | "READY_TO_HARVEST"
  | "HARVESTED"
  | "FAILED"
  | "ARCHIVED";

export function enrichBatchDynamicStatus<T extends BatchDynamicStatusTarget>(
  batch: T,
  now: Date = new Date()
): T & {
  displayStatus: EcoEnzymeDisplayStatus;
  dayPassed: number;
  progressPercent: number;
} {
  const startDate = new Date(batch.startDate);
  const harvestEstimate = new Date(batch.harvestEstimate);

  const diffTime = Math.max(0, now.getTime() - startDate.getTime());
  const dayPassed = Math.floor(diffTime / MS_PER_DAY) + 1;

  let displayStatus: EcoEnzymeDisplayStatus = "FERMENTING";

  if (batch.archivedAt) {
    displayStatus = "ARCHIVED";
  } else if (batch.status === "HARVESTED") {
    displayStatus = "HARVESTED";
  } else if (batch.status === "FAILED") {
    displayStatus = "FAILED";
  } else if (now >= harvestEstimate || dayPassed > DEFAULT_FERMENTATION_DAYS) {
    displayStatus = "READY_TO_HARVEST";
  } else {
    displayStatus = "FERMENTING";
  }

  let progressPercent: number;
  if (batch.status === "HARVESTED" || displayStatus === "READY_TO_HARVEST") {
    progressPercent = 100;
  } else if (batch.status === "FAILED") {
    progressPercent = 0;
  } else {
    const totalDuration = harvestEstimate.getTime() - startDate.getTime();
    const targetDuration =
      totalDuration > 0 ? totalDuration : DEFAULT_FERMENTATION_DAYS * MS_PER_DAY;
    progressPercent =
      now.getTime() >= startDate.getTime() + targetDuration
        ? 100
        : Math.min(99, Math.max(0, Math.round((diffTime / targetDuration) * 100)));
  }

  return {
    ...batch,
    displayStatus,
    dayPassed,
    progressPercent,
  };
}

export async function getAllBatches(params: {
  status?: string | null;
  enzymeType?: string | null;
  search?: string | null;
  includeArchived?: boolean | null;
  page?: string | null;
  limit?: string | null;
}) {
  const { skip, take, page, limit } = parsePagination(params);
  const now = new Date();
  const cutoffDate = getReadyCutoffDate(now);
  const andConditions: Prisma.EcoEnzymeBatchWhereInput[] = [];

  const normalizedEnzymeType =
    typeof params.enzymeType === "string"
      ? params.enzymeType.trim().toUpperCase()
      : "";
  if (
    normalizedEnzymeType === EnzymeType.ECO_ENZYME ||
    normalizedEnzymeType === EnzymeType.CLASSIC_ENZYME
  ) {
    andConditions.push({ enzymeType: normalizedEnzymeType as EnzymeType });
  }

  if (params.status === "ARCHIVED") {
    andConditions.push({ archivedAt: { not: null } });
  } else if (params.status === "READY_TO_HARVEST") {
    andConditions.push({
      archivedAt: null,
      status: "IN_PROGRESS",
      OR: [
        { harvestEstimate: { lte: now } },
        { startDate: { lte: cutoffDate } },
      ],
    });
  } else if (params.status === "FERMENTING") {
    andConditions.push({
      archivedAt: null,
      status: "IN_PROGRESS",
      harvestEstimate: { gt: now },
      startDate: { gt: cutoffDate },
    });
  } else {
    if (!params.includeArchived) {
      andConditions.push({ archivedAt: null });
    }
    if (
      params.status === "HARVESTED" ||
      params.status === "FAILED" ||
      params.status === "IN_PROGRESS"
    ) {
      andConditions.push({ status: params.status });
    }
  }

  const trimmedSearch = params.search?.trim();
  if (trimmedSearch) {
    andConditions.push({
      OR: [
        { publicCode: { contains: trimmedSearch, mode: "insensitive" } },
        { batchCode: { contains: trimmedSearch, mode: "insensitive" } },
        { containerName: { contains: trimmedSearch, mode: "insensitive" } },
        { organicWasteTypes: { contains: trimmedSearch, mode: "insensitive" } },
        { notes: { contains: trimmedSearch, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.EcoEnzymeBatchWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [data, total] = await Promise.all([
    prisma.ecoEnzymeBatch.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { inspectionLogs: true } },
        allocatedProduct: true,
        qrCode: true,
        previousBatch: {
          select: { id: true, publicCode: true, containerName: true },
        },
        nextBatches: ACTIVE_NEXT_BATCHES_INCLUDE,
      },
    }),
    prisma.ecoEnzymeBatch.count({ where }),
  ]);

  return {
    data: data.map((b) => enrichBatchDynamicStatus(b, now)),
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function getBatchById(id: string) {
  const batch = await prisma.ecoEnzymeBatch.findUnique({
    where: { id },
    include: {
      inspectionLogs: { orderBy: { logDate: "desc" } },
      allocatedProduct: true,
      qrCode: true,
      previousBatch: {
        select: { id: true, publicCode: true, containerName: true },
      },
      nextBatches: ACTIVE_NEXT_BATCHES_INCLUDE,
    },
  });

  if (!batch) {
    throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
  }

  return enrichBatchDynamicStatus(batch);
}

export async function getBatchByPublicCode(publicCode: string) {
  const rawTrimmed = (publicCode || "").trim();
  const normalized = normalizeBatchCode(rawTrimmed);
  if (!rawTrimmed || !normalized) {
    throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
  }

  const lookupWhere: Prisma.EcoEnzymeBatchWhereInput = {
    OR: [
      { publicCode: { equals: normalized, mode: "insensitive" } },
      { batchCode: { equals: rawTrimmed, mode: "insensitive" } },
      { batchCode: { equals: normalized, mode: "insensitive" } },
      { containerName: { equals: rawTrimmed, mode: "insensitive" } },
      { qrCode: { code: { equals: normalized, mode: "insensitive" } } },
    ],
  };

  const batchInclude = {
    qrCode: true,
    inspectionLogs: {
      orderBy: { dayNumber: "asc" as const },
    },
    allocatedProduct: true,
    previousBatch: {
      select: { id: true, publicCode: true, containerName: true },
    },
    nextBatches: ACTIVE_NEXT_BATCHES_INCLUDE,
  } satisfies Prisma.EcoEnzymeBatchInclude;

  const batch =
    (await prisma.ecoEnzymeBatch.findFirst({
      where: { AND: [lookupWhere, { archivedAt: null }] },
      orderBy: { createdAt: "desc" },
      include: batchInclude,
    })) ??
    (await prisma.ecoEnzymeBatch.findFirst({
      where: { AND: [lookupWhere, { archivedAt: { not: null } }] },
      orderBy: [{ archivedAt: "desc" }, { createdAt: "desc" }],
      include: batchInclude,
    }));

  if (!batch) {
    throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
  }

  const enriched = enrichBatchDynamicStatus(batch);
  const isHarvested = enriched.status === "HARVESTED";
  const isArchived = Boolean(enriched.archivedAt);

  const nextBatch = (enriched.nextBatches && enriched.nextBatches.length > 0)
    ? enriched.nextBatches[0]
    : null;

  return {
    id: enriched.id,
    publicCode: enriched.publicCode,
    batchCode: enriched.batchCode,
    enzymeType: enriched.enzymeType,
    sweetenerType: enriched.sweetenerType,
    containerName: enriched.containerName,
    startDate: enriched.startDate,
    harvestEstimate: enriched.harvestEstimate,
    actualHarvestDate: enriched.actualHarvestDate,
    status: isArchived ? "ARCHIVED" : enriched.status,
    displayStatus: enriched.displayStatus,
    dayPassed: enriched.dayPassed,
    progressPercent: enriched.progressPercent,
    molassesKg: enriched.molassesKg,
    organicWasteKg: enriched.organicWasteKg,
    waterLiter: enriched.waterLiter,
    organicWasteTypes: enriched.organicWasteTypes,
    harvestLiter: isHarvested ? enriched.harvestLiter : null,
    residueUsage: isHarvested ? enriched.residueUsage : null,
    archivedAt: enriched.archivedAt ?? null,
    qrPrintedAt: enriched.qrPrintedAt ?? null,
    qrCodeId: enriched.qrCodeId ?? enriched.qrCode?.id ?? null,
    qrCode: enriched.qrCode ?? null,
    updatedAt: enriched.updatedAt,
    nextBatch: nextBatch ? {
      id: nextBatch.id,
      publicCode: nextBatch.publicCode,
      containerName: nextBatch.containerName,
    } : null,
    inspectionLogs: (enriched.inspectionLogs ?? []).map((log) => ({
      dayNumber: log.dayNumber,
      logDate: log.logDate,
      phLevel: log.phLevel,
      aromaStatus: log.aromaStatus,
      fungusColor: log.fungusColor,
    })),
  };
}

export async function createBatch(input: {
  batchCode?: string;
  enzymeType?: string;
  sweetenerType?: string;
  containerName: string;
  containerCapacityLiter?: number;
  molassesKg: number;
  organicWasteKg: number;
  waterLiter: number;
  organicWasteTypes?: string;
  startDate: string;
  harvestEstimate?: string;
  photoUrl?: string | null;
  notes?: string | null;
  previousBatchId?: string | null;
}) {
  const containerName =
    typeof input?.containerName === "string" ? input.containerName.trim() : "";
  if (!containerName) {
    throw new AppError("Nama wadah wajib diisi", 400);
  }

  const enzymeType =
    input.enzymeType !== undefined && input.enzymeType !== null
      ? parseStrictEnzymeType(input.enzymeType)
      : EnzymeType.ECO_ENZYME;

  const sweetenerType =
    input.sweetenerType !== undefined && input.sweetenerType !== null
      ? parseStrictSweetenerType(input.sweetenerType)
      : getDefaultSweetenerForEnzyme(enzymeType);

  assertSweetenerAllowed(enzymeType, sweetenerType);

  const enzymeMeta = getEnzymeTypeMeta(enzymeType);
  const sweetenerMeta = getSweetenerMeta(sweetenerType, enzymeType);

  const molassesKg = parsePositiveNumber(
    input.molassesKg,
    `Takaran pemanis ${sweetenerMeta.label} (molassesKg)`
  );
  const organicWasteKg = parsePositiveNumber(
    input.organicWasteKg,
    `Takaran ${enzymeMeta.materialShortLabel} (organicWasteKg)`
  );
  const waterLiter = parsePositiveNumber(input.waterLiter, "Takaran air (waterLiter)");
  const containerCapacityLiter =
    input.containerCapacityLiter !== undefined && input.containerCapacityLiter !== null
      ? parsePositiveNumber(input.containerCapacityLiter, "Kapasitas wadah")
      : 50;

  if (
    input.organicWasteTypes !== undefined &&
    input.organicWasteTypes !== null &&
    typeof input.organicWasteTypes !== "string"
  ) {
    throw new AppError("Komposisi bahan organik harus berupa teks", 400);
  }
  const trimmedOrganicWasteTypes =
    typeof input.organicWasteTypes === "string"
      ? input.organicWasteTypes.trim()
      : "";
  const organicWasteTypes = trimmedOrganicWasteTypes || enzymeMeta.defaultIngredients;

  const startDate = parseRequiredDate(input.startDate, "Format tanggal mulai tidak valid");

  let harvestEstimate: Date;
  if (
    input.harvestEstimate !== undefined &&
    input.harvestEstimate !== null &&
    input.harvestEstimate !== ""
  ) {
    harvestEstimate = parseRequiredDate(
      input.harvestEstimate,
      "Format tanggal panen tidak valid"
    );
  } else {
    harvestEstimate = new Date(
      startDate.getTime() + DEFAULT_FERMENTATION_DAYS * MS_PER_DAY
    );
  }

  if (input.previousBatchId) {
    const prev = await prisma.ecoEnzymeBatch.findUnique({
      where: { id: input.previousBatchId },
      select: { id: true },
    });
    if (!prev) {
      throw new AppError("Batch sebelumnya yang dipilih tidak valid", 400);
    }
  }

  const batchCode =
    input.batchCode?.trim() || (await generateUniqueRandomBatchCode(startDate));

  const { qrCode, reused } = await resolveOrCreateQrCode({
    entityType: "ECO_ENZYME_BATCH",
    previousEntityId: input.previousBatchId,
    entityKey: batchCode,
    entityName: containerName,
    pathPrefix: "/b",
  });

  const created = await prisma.ecoEnzymeBatch.create({
    data: {
      publicCode: qrCode.code,
      batchCode,
      enzymeType,
      sweetenerType,
      containerName,
      containerCapacityLiter,
      molassesKg,
      organicWasteKg,
      waterLiter,
      organicWasteTypes,
      startDate,
      harvestEstimate,
      photoUrl: input.photoUrl,
      notes: input.notes,
      previousBatchId: input.previousBatchId || null,
      qrCodeId: qrCode.id,
      status: "IN_PROGRESS",
    },
    include: {
      qrCode: true,
      allocatedProduct: true,
      previousBatch: {
        select: { id: true, publicCode: true, containerName: true },
      },
      nextBatches: ACTIVE_NEXT_BATCHES_INCLUDE,
    },
  });

  return {
    ...enrichBatchDynamicStatus(created),
    reusedQr: reused,
  };
}

function parseNullableText(value: unknown, label: string): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new AppError(`${label} harus berupa teks`, 400);
  }
  return value;
}

export async function updateBatch(id: string, input: Record<string, unknown>) {
  const existing = await prisma.ecoEnzymeBatch.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
  }

  if (!input || typeof input !== "object") {
    throw new AppError("Payload pembaruan batch tidak valid", 400);
  }

  const updateData: Prisma.EcoEnzymeBatchUncheckedUpdateInput = {};

  if (input.containerName !== undefined) {
    if (typeof input.containerName !== "string" || !input.containerName.trim()) {
      throw new AppError("Nama wadah wajib diisi", 400);
    }
    updateData.containerName = input.containerName.trim();
  }

  if (input.containerCapacityLiter !== undefined) {
    updateData.containerCapacityLiter = parsePositiveNumber(
      input.containerCapacityLiter,
      "Kapasitas wadah"
    );
  }

  const parsedEnzymeType =
    input.enzymeType !== undefined
      ? parseStrictEnzymeType(input.enzymeType)
      : undefined;
  const nextEnzymeType: EnzymeType = parsedEnzymeType ?? existing.enzymeType;

  const parsedSweetenerType =
    input.sweetenerType !== undefined
      ? parseStrictSweetenerType(input.sweetenerType)
      : undefined;

  let nextSweetenerType: EnzymeSweetenerType = existing.sweetenerType;
  if (parsedSweetenerType !== undefined) {
    assertSweetenerAllowed(nextEnzymeType, parsedSweetenerType);
    nextSweetenerType = parsedSweetenerType;
  } else if (
    parsedEnzymeType !== undefined &&
    !isSweetenerAllowedForEnzyme(nextEnzymeType, existing.sweetenerType)
  ) {
    nextSweetenerType = getDefaultSweetenerForEnzyme(nextEnzymeType);
  }

  const nextEnzymeMeta = getEnzymeTypeMeta(nextEnzymeType);
  const nextSweetenerMeta = getSweetenerMeta(nextSweetenerType, nextEnzymeType);

  const parsedMolassesKg =
    input.molassesKg !== undefined
      ? parsePositiveNumber(
          input.molassesKg,
          `Takaran pemanis ${nextSweetenerMeta.label} (molassesKg)`
        )
      : undefined;
  const parsedOrganicWasteKg =
    input.organicWasteKg !== undefined
      ? parsePositiveNumber(
          input.organicWasteKg,
          `Takaran ${nextEnzymeMeta.materialShortLabel} (organicWasteKg)`
        )
      : undefined;
  const parsedWaterLiter =
    input.waterLiter !== undefined
      ? parsePositiveNumber(input.waterLiter, "Takaran air (waterLiter)")
      : undefined;

  const parsedStartDate =
    input.startDate !== undefined
      ? parseRequiredDate(input.startDate, "Format tanggal mulai tidak valid")
      : undefined;

  const parsedHarvestEstimate =
    input.harvestEstimate !== undefined
      ? parseRequiredDate(input.harvestEstimate, "Format tanggal panen tidak valid")
      : undefined;

  const enzymeTypeChanged = nextEnzymeType !== existing.enzymeType;
  const sweetenerTypeChanged = nextSweetenerType !== existing.sweetenerType;

  if (existing.status === "HARVESTED") {
    const molassesChanged =
      parsedMolassesKg !== undefined && parsedMolassesKg !== Number(existing.molassesKg);
    const wasteChanged =
      parsedOrganicWasteKg !== undefined &&
      parsedOrganicWasteKg !== Number(existing.organicWasteKg);
    const waterChanged =
      parsedWaterLiter !== undefined && parsedWaterLiter !== Number(existing.waterLiter);
    const startDateChanged =
      parsedStartDate !== undefined &&
      parsedStartDate.getTime() !== existing.startDate.getTime();

    if (
      molassesChanged ||
      wasteChanged ||
      waterChanged ||
      startDateChanged ||
      enzymeTypeChanged ||
      sweetenerTypeChanged
    ) {
      throw new AppError(
        "Formula, jenis enzim/pemanis, dan tanggal mulai batch yang sudah dipanen tidak dapat diubah",
        400
      );
    }
  }

  if (parsedEnzymeType !== undefined) updateData.enzymeType = nextEnzymeType;
  if (parsedSweetenerType !== undefined || sweetenerTypeChanged) {
    updateData.sweetenerType = nextSweetenerType;
  }
  if (parsedMolassesKg !== undefined) updateData.molassesKg = parsedMolassesKg;
  if (parsedOrganicWasteKg !== undefined) updateData.organicWasteKg = parsedOrganicWasteKg;
  if (parsedWaterLiter !== undefined) updateData.waterLiter = parsedWaterLiter;
  if (input.organicWasteTypes !== undefined) {
    if (typeof input.organicWasteTypes !== "string") {
      throw new AppError("Komposisi bahan organik harus berupa teks", 400);
    }
    updateData.organicWasteTypes = input.organicWasteTypes;
  }
  if (input.photoUrl !== undefined) {
    updateData.photoUrl = parseNullableText(input.photoUrl, "URL foto");
  }

  if (input.status !== undefined) {
    if (input.status === "ARCHIVED") {
      throw new AppError("Gunakan endpoint arsip untuk mengarsipkan batch", 400);
    }
    if (typeof input.status !== "string" || !VALID_BATCH_STATUSES.has(input.status)) {
      throw new AppError("Status batch tidak valid", 400);
    }
    updateData.status = input.status as EnzymeBatchStatus;
  }

  if (input.failureReason !== undefined) {
    if (input.failureReason === null || input.failureReason === "") {
      updateData.failureReason = null;
    } else if (
      typeof input.failureReason !== "string" ||
      !VALID_FAILURE_REASONS.has(input.failureReason)
    ) {
      throw new AppError("Alasan kegagalan tidak valid", 400);
    } else {
      updateData.failureReason = input.failureReason as EnzymeFailureReason;
    }
  }

  if (input.failureNotes !== undefined) {
    updateData.failureNotes = parseNullableText(input.failureNotes, "Catatan kegagalan");
  }
  if (input.status === "IN_PROGRESS" && input.failureReason === undefined) {
    updateData.failureReason = null;
    updateData.failureNotes = null;
  }
  if (input.notes !== undefined) {
    updateData.notes = parseNullableText(input.notes, "Catatan");
  }

  if (parsedStartDate !== undefined) {
    updateData.startDate = parsedStartDate;
    if (
      parsedHarvestEstimate === undefined &&
      parsedStartDate.getTime() !== existing.startDate.getTime()
    ) {
      updateData.harvestEstimate = new Date(
        parsedStartDate.getTime() + DEFAULT_FERMENTATION_DAYS * MS_PER_DAY
      );
    }
  }

  if (parsedHarvestEstimate !== undefined) {
    updateData.harvestEstimate = parsedHarvestEstimate;
  }

  // Abaikan publicCode dari input agar hanya disinkronkan dari registry QR
  if (!existing.qrCodeId) {
    const { qrCode } = await resolveOrCreateQrCode({
      entityType: "ECO_ENZYME_BATCH",
      entityId: existing.id,
      entityKey: existing.batchCode,
      entityName:
        typeof updateData.containerName === "string"
          ? updateData.containerName
          : existing.containerName,
      pathPrefix: "/b",
    });
    updateData.qrCodeId = qrCode.id;
    updateData.publicCode = qrCode.code;
  }

  return prisma.ecoEnzymeBatch.update({
    where: { id },
    data: updateData,
    include: { qrCode: true },
  });
}

export async function harvestBatch(id: string, input: {
  harvestLiter: number;
  actualHarvestDate?: string;
  residueUsage?: EnzymeResidueUsage;
  residueNotes?: string | null;
  allocatedProductId?: string | null;
  allocatedUnitsAdded?: number;
  notes?: string | null;
}) {
  const harvestLiter = parsePositiveNumber(
    input.harvestLiter,
    "Volume panen (harvestLiter)"
  );

  const allocatedUnitsAdded =
    input.allocatedUnitsAdded === undefined || input.allocatedUnitsAdded === null
      ? 0
      : Number(input.allocatedUnitsAdded);
  if (!Number.isInteger(allocatedUnitsAdded) || allocatedUnitsAdded < 0) {
    throw new AppError("Jumlah unit alokasi produk harus berupa bilangan bulat >= 0", 400);
  }

  const allocatedProductId = input.allocatedProductId?.trim() || null;
  const actualHarvestDate = input.actualHarvestDate
    ? parseRequiredDate(input.actualHarvestDate, "Format tanggal panen aktual tidak valid")
    : new Date();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.ecoEnzymeBatch.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
    }
    if (existing.archivedAt !== null) {
      throw new AppError("Batch yang sudah diarsipkan tidak dapat dipanen", 400);
    }
    if (existing.status === "FAILED") {
      throw new AppError("Batch berstatus gagal tidak dapat dipanen", 400);
    }
    if (existing.status === "HARVESTED") {
      throw new AppError("Batch ini sudah dipanen sebelumnya", 409);
    }

    let allocatedProduct: { id: string; stockLabel: StockLabel } | null = null;
    if (allocatedProductId) {
      allocatedProduct = await tx.product.findUnique({
        where: { id: allocatedProductId },
        select: { id: true, stockLabel: true },
      });
      if (!allocatedProduct) {
        throw new AppError("Produk alokasi tidak ditemukan", 404);
      }
    }

    const totalInput =
      Number(existing.molassesKg) +
      Number(existing.organicWasteKg) +
      Number(existing.waterLiter);
    const efficiencyRatePercent =
      totalInput > 0
        ? Number(((harvestLiter / totalInput) * 100).toFixed(2))
        : 0;

    const updateResult = await tx.ecoEnzymeBatch.updateMany({
      where: {
        id,
        status: "IN_PROGRESS",
        archivedAt: null,
      },
      data: {
        status: "HARVESTED",
        actualHarvestDate,
        harvestLiter,
        efficiencyRatePercent,
        ...(input.residueUsage !== undefined ? { residueUsage: input.residueUsage } : {}),
        ...(input.residueNotes !== undefined ? { residueNotes: input.residueNotes } : {}),
        allocatedProductId,
        allocatedUnitsAdded,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    if (updateResult.count === 0) {
      throw new AppError("Batch ini sudah dipanen sebelumnya", 409);
    }

    const updated = await tx.ecoEnzymeBatch.findUnique({
      where: { id },
      include: { qrCode: true },
    });

    if (allocatedProduct && allocatedUnitsAdded > 0) {
      await tx.product.update({
        where: { id: allocatedProduct.id },
        data: {
          stock: { increment: allocatedUnitsAdded },
          ...(allocatedProduct.stockLabel === "OUT_OF_STOCK"
            ? { stockLabel: "IN_STOCK" }
            : {}),
        },
      });
    }

    return updated;
  });
}

export async function archiveBatch(id: string) {
  await assertBatchExists(id);
  return prisma.ecoEnzymeBatch.update({
    where: { id },
    data: { archivedAt: new Date() },
    include: { qrCode: true },
  });
}

export async function restoreBatch(id: string) {
  await assertBatchExists(id);
  return prisma.ecoEnzymeBatch.update({
    where: { id },
    data: { archivedAt: null },
    include: { qrCode: true },
  });
}

export async function markQrPrinted(id: string) {
  await assertBatchExists(id);
  return prisma.ecoEnzymeBatch.update({
    where: { id },
    data: { qrPrintedAt: new Date() },
    include: { qrCode: true },
  });
}

export async function deleteBatch(id: string) {
  await assertBatchExists(id);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.ecoEnzymeBatch.findUnique({
      where: { id },
      select: { id: true, qrCodeId: true },
    });
    if (!existing) {
      throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
    }

    // 1. Lepas referensi suksesi batch jika ada batch lanjutan yang mereferensikan batch ini
    await tx.ecoEnzymeBatch.updateMany({
      where: { previousBatchId: id },
      data: { previousBatchId: null },
    });

    // 2. Hapus seluruh riwayat log inspeksi batch
    await tx.ecoEnzymeLog.deleteMany({
      where: { batchId: id },
    });

    // 3. Hapus permanen batch eco enzyme dari database
    const deleted = await tx.ecoEnzymeBatch.delete({
      where: { id },
    });

    // 4. Bersihkan QR Code orphan jika tidak lagi digunakan oleh batch atau produk lain
    if (existing.qrCodeId) {
      const remainingBatches = await tx.ecoEnzymeBatch.count({
        where: { qrCodeId: existing.qrCodeId },
      });
      const remainingProducts = await tx.product.count({
        where: { qrCodeId: existing.qrCodeId },
      });
      if (remainingBatches === 0 && remainingProducts === 0) {
        await tx.qrCode
          .delete({
            where: { id: existing.qrCodeId },
          })
          .catch(() => null);
      }
    }

    return deleted;
  });
}

export async function addLog(batchId: string, input: {
  dayNumber?: number;
  logDate?: string;
  phLevel?: number | null;
  aromaStatus?: string | null;
  fungusColor?: string | null;
  actionTaken?: string | null;
  imageUrl?: string | null;
  notes?: string | null;
}) {
  await assertBatchExists(batchId);

  const logDate =
    input.logDate !== undefined && input.logDate !== null
      ? parseRequiredDate(input.logDate, "Format tanggal log tidak valid")
      : new Date();

  let dayNumber = 7;
  if (input.dayNumber !== undefined && input.dayNumber !== null) {
    const parsedDay = Number(input.dayNumber);
    if (!Number.isInteger(parsedDay) || parsedDay < 0) {
      throw new AppError("dayNumber harus berupa bilangan bulat >= 0", 400);
    }
    dayNumber = parsedDay;
  }

  let phLevel: number | null = null;
  if (input.phLevel !== undefined && input.phLevel !== null) {
    const parsedPh = Number(input.phLevel);
    if (!Number.isFinite(parsedPh) || parsedPh < 0 || parsedPh > 14) {
      throw new AppError("Nilai pH harus berupa angka antara 0 dan 14", 400);
    }
    phLevel = parsedPh;
  }

  return prisma.ecoEnzymeLog.create({
    data: {
      batchId,
      dayNumber,
      logDate,
      phLevel,
      aromaStatus: input.aromaStatus ?? null,
      fungusColor: input.fungusColor ?? null,
      actionTaken: input.actionTaken ?? null,
      imageUrl: input.imageUrl ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function deleteLog(logId: string) {
  const existing = await prisma.ecoEnzymeLog.findUnique({
    where: { id: logId },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError("Log inspeksi tidak ditemukan", 404);
  }
  return prisma.ecoEnzymeLog.delete({ where: { id: logId } });
}

export async function getStats() {
  const batches = await prisma.ecoEnzymeBatch.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      status: true,
      startDate: true,
      harvestEstimate: true,
      organicWasteKg: true,
      harvestLiter: true,
      efficiencyRatePercent: true,
    },
  });

  const now = new Date();
  const cutoffDate = getReadyCutoffDate(now);
  const totalBatches = batches.length;
  let activeFermenting = 0;
  let readyToHarvest = 0;
  let harvestedBatches = 0;
  let failedBatches = 0;
  let totalOrganicWasteKg = 0;
  let totalHarvestLiter = 0;
  let sumEfficiency = 0;
  let efficiencyCount = 0;

  for (const b of batches) {
    if (b.status === "HARVESTED") {
      harvestedBatches++;
      totalOrganicWasteKg += Number(b.organicWasteKg);
      totalHarvestLiter += Number(b.harvestLiter ?? 0);
      if (b.efficiencyRatePercent !== null && b.efficiencyRatePercent !== undefined) {
        sumEfficiency += Number(b.efficiencyRatePercent);
        efficiencyCount++;
      }
    } else if (b.status === "FAILED") {
      failedBatches++;
    } else if (b.status === "IN_PROGRESS") {
      totalOrganicWasteKg += Number(b.organicWasteKg);
      const est = new Date(b.harvestEstimate);
      const start = new Date(b.startDate);
      if (now >= est || start <= cutoffDate) {
        readyToHarvest++;
      } else {
        activeFermenting++;
      }
    }
  }

  const averageEfficiencyRate =
    efficiencyCount > 0 ? Number((sumEfficiency / efficiencyCount).toFixed(2)) : 0;

  return {
    totalBatches,
    activeFermenting,
    readyToHarvest,
    harvestedBatches,
    failedBatches,
    totalOrganicWasteKg: Number(totalOrganicWasteKg.toFixed(2)),
    totalHarvestLiter: Number(totalHarvestLiter.toFixed(2)),
    averageEfficiencyRate,
  };
}

export async function getProductsForAllocation() {
  return prisma.product.findMany({
    include: { qrCode: true },
    orderBy: { name: "asc" },
  });
}

