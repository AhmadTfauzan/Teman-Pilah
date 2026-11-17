import { prisma } from "@/lib/prisma";
import { AppError } from "./error";
import { parsePagination, buildPaginationMeta } from "./pagination";
import { normalizeBatchCode } from "./code";
import { resolveOrCreateQrCode } from "./qr-code-service";
import { EnzymeResidueUsage } from "@prisma/client";

export function enrichBatchDynamicStatus(batch: any): any {
  const now = new Date();
  const startDate = new Date(batch.startDate);
  const harvestEstimate = new Date(batch.harvestEstimate);

  const diffTime = Math.max(0, now.getTime() - startDate.getTime());
  const dayPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const progressPercent = Math.min(100, Math.round((dayPassed / 90) * 100));

  let displayStatus: "FERMENTING" | "READY_TO_HARVEST" | "HARVESTED" | "FAILED" | "ARCHIVED" = "FERMENTING";

  if (batch.archivedAt) {
    displayStatus = "ARCHIVED";
  } else if (batch.status === "HARVESTED") {
    displayStatus = "HARVESTED";
  } else if (batch.status === "FAILED") {
    displayStatus = "FAILED";
  } else if (now >= harvestEstimate || dayPassed >= 90) {
    displayStatus = "READY_TO_HARVEST";
  } else {
    displayStatus = "FERMENTING";
  }

  return {
    ...batch,
    displayStatus,
    dayPassed,
    progressPercent: displayStatus === "HARVESTED" ? 100 : progressPercent,
  };
}

export async function getAllBatches(params: {
  status?: string | null;
  search?: string | null;
  includeArchived?: boolean | null;
  page?: string | null;
  limit?: string | null;
}) {
  const { skip, take, page, limit } = parsePagination(params);
  const where: any = {};

  if (params.status === "ARCHIVED") {
    where.archivedAt = { not: null };
  } else if (params.includeArchived) {
    // include all
  } else {
    where.archivedAt = null;
  }

  if (params.status && params.status !== "ALL" && params.status !== "ARCHIVED") {
    if (params.status === "HARVESTED" || params.status === "FAILED" || params.status === "IN_PROGRESS") {
      where.status = params.status;
    }
  }

  if (params.search) {
    where.OR = [
      { publicCode: { contains: params.search, mode: "insensitive" } },
      { batchCode: { contains: params.search, mode: "insensitive" } },
      { containerName: { contains: params.search, mode: "insensitive" } },
      { organicWasteTypes: { contains: params.search, mode: "insensitive" } },
      { notes: { contains: params.search, mode: "insensitive" } },
    ];
  }

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
        nextBatches: {
          select: { id: true, publicCode: true, containerName: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.ecoEnzymeBatch.count({ where }),
  ]);

  const enriched = data.map((b) => enrichBatchDynamicStatus(b));

  let filtered = enriched;
  if (params.status === "FERMENTING") {
    filtered = enriched.filter((b) => b.displayStatus === "FERMENTING");
  } else if (params.status === "READY_TO_HARVEST") {
    filtered = enriched.filter((b) => b.displayStatus === "READY_TO_HARVEST");
  }

  return {
    data: filtered,
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
      nextBatches: {
        select: { id: true, publicCode: true, containerName: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
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

  const batch = await prisma.ecoEnzymeBatch.findFirst({
    where: {
      OR: [
        { publicCode: { equals: normalized, mode: "insensitive" } },
        { batchCode: { equals: rawTrimmed, mode: "insensitive" } },
        { batchCode: { equals: normalized, mode: "insensitive" } },
        { containerName: { equals: rawTrimmed, mode: "insensitive" } },
        { qrCode: { code: { equals: normalized, mode: "insensitive" } } },
      ],
    },
    orderBy: [
      { archivedAt: { sort: "asc", nulls: "first" } },
      { createdAt: "desc" },
    ],
    include: {
      qrCode: true,
      inspectionLogs: {
        orderBy: { dayNumber: "asc" },
      },
      allocatedProduct: true,
      previousBatch: {
        select: { id: true, publicCode: true, containerName: true },
      },
      nextBatches: {
        select: { id: true, publicCode: true, containerName: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

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
    inspectionLogs: (enriched.inspectionLogs ?? []).map((log: any) => ({
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
  const startDate = new Date(input.startDate);
  if (isNaN(startDate.getTime())) {
    throw new AppError("Format tanggal mulai tidak valid", 400);
  }

  let harvestEstimate: Date;
  if (input.harvestEstimate) {
    harvestEstimate = new Date(input.harvestEstimate);
    if (isNaN(harvestEstimate.getTime())) {
      throw new AppError("Format tanggal panen tidak valid", 400);
    }
  } else {
    harvestEstimate = new Date(startDate);
    harvestEstimate.setDate(harvestEstimate.getDate() + 89);
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
    input.batchCode?.trim() ||
    `EE-${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;

  const { qrCode, reused } = await resolveOrCreateQrCode({
    entityType: "ECO_ENZYME_BATCH",
    previousEntityId: input.previousBatchId,
    entityKey: batchCode,
    entityName: input.containerName,
    pathPrefix: "/b",
  });

  const created = await prisma.ecoEnzymeBatch.create({
    data: {
      publicCode: qrCode.code,
      batchCode,
      containerName: input.containerName,
      containerCapacityLiter: input.containerCapacityLiter ?? 50,
      molassesKg: input.molassesKg,
      organicWasteKg: input.organicWasteKg,
      waterLiter: input.waterLiter,
      organicWasteTypes: input.organicWasteTypes ?? "Kulit Buah Campur",
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
      nextBatches: {
        select: { id: true, publicCode: true, containerName: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return {
    ...enrichBatchDynamicStatus(created),
    reusedQr: reused,
  };
}

export async function updateBatch(id: string, input: any) {
  const existing = await prisma.ecoEnzymeBatch.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
  }

  const updateData: any = {};
  if (input.containerName !== undefined) updateData.containerName = input.containerName;
  if (input.containerCapacityLiter !== undefined) updateData.containerCapacityLiter = input.containerCapacityLiter;
  if (input.molassesKg !== undefined) updateData.molassesKg = input.molassesKg;
  if (input.organicWasteKg !== undefined) updateData.organicWasteKg = input.organicWasteKg;
  if (input.waterLiter !== undefined) updateData.waterLiter = input.waterLiter;
  if (input.organicWasteTypes !== undefined) updateData.organicWasteTypes = input.organicWasteTypes;
  if (input.photoUrl !== undefined) updateData.photoUrl = input.photoUrl;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.notes !== undefined) updateData.notes = input.notes;

  if (input.startDate) {
    const startDate = new Date(input.startDate);
    updateData.startDate = startDate;
    if (!input.harvestEstimate) {
      const harvestEstimate = new Date(startDate);
      harvestEstimate.setDate(harvestEstimate.getDate() + 89);
      updateData.harvestEstimate = harvestEstimate;
    }
  }

  if (input.harvestEstimate) {
    updateData.harvestEstimate = new Date(input.harvestEstimate);
  }

  if (!existing.qrCodeId) {
    const { qrCode } = await resolveOrCreateQrCode({
      entityType: "ECO_ENZYME_BATCH",
      entityId: existing.id,
      entityKey: existing.batchCode,
      entityName: updateData.containerName ?? existing.containerName,
      pathPrefix: "/b",
    });
    updateData.qrCodeId = qrCode.id;
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
  const existing = await prisma.ecoEnzymeBatch.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
  }

  const totalInput = Number(existing.molassesKg) + Number(existing.organicWasteKg) + Number(existing.waterLiter);
  const efficiencyRatePercent = totalInput > 0
    ? Number(((input.harvestLiter / totalInput) * 100).toFixed(2))
    : 0;

  const actualHarvestDate = input.actualHarvestDate ? new Date(input.actualHarvestDate) : new Date();

  return prisma.$transaction(async (tx) => {
    const updated = await tx.ecoEnzymeBatch.update({
      where: { id },
      data: {
        status: "HARVESTED",
        actualHarvestDate,
        harvestLiter: input.harvestLiter,
        efficiencyRatePercent,
        residueUsage: input.residueUsage,
        residueNotes: input.residueNotes,
        allocatedProductId: input.allocatedProductId,
        allocatedUnitsAdded: input.allocatedUnitsAdded ?? 0,
        notes: input.notes,
      },
      include: { qrCode: true },
    });

    if (dataAllocated(input)) {
      await tx.product.update({
        where: { id: input.allocatedProductId! },
        data: {
          stock: { increment: input.allocatedUnitsAdded! },
          stockLabel: "IN_STOCK",
        },
      });
    }

    return updated;
  });
}

function dataAllocated(input: any): boolean {
  return Boolean(input.allocatedProductId && (input.allocatedUnitsAdded ?? 0) > 0);
}

export async function archiveBatch(id: string) {
  return prisma.ecoEnzymeBatch.update({
    where: { id },
    data: { archivedAt: new Date() },
    include: { qrCode: true },
  });
}

export async function restoreBatch(id: string) {
  return prisma.ecoEnzymeBatch.update({
    where: { id },
    data: { archivedAt: null },
    include: { qrCode: true },
  });
}

export async function markQrPrinted(id: string) {
  return prisma.ecoEnzymeBatch.update({
    where: { id },
    data: { qrPrintedAt: new Date() },
    include: { qrCode: true },
  });
}

export async function deleteBatch(id: string) {
  return archiveBatch(id);
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
  return prisma.ecoEnzymeLog.create({
    data: {
      batchId,
      dayNumber: input.dayNumber ?? 7,
      logDate: input.logDate ? new Date(input.logDate) : new Date(),
      phLevel: input.phLevel ?? null,
      aromaStatus: input.aromaStatus ?? null,
      fungusColor: input.fungusColor ?? null,
      actionTaken: input.actionTaken ?? null,
      imageUrl: input.imageUrl ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function deleteLog(logId: string) {
  return prisma.ecoEnzymeLog.delete({ where: { id: logId } });
}

export async function getStats() {
  const batches = await prisma.ecoEnzymeBatch.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      status: true,
      harvestEstimate: true,
      organicWasteKg: true,
      harvestLiter: true,
      efficiencyRatePercent: true,
    },
  });

  const now = new Date();
  let totalBatches = batches.length;
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
      if (b.efficiencyRatePercent) {
        sumEfficiency += Number(b.efficiencyRatePercent);
        efficiencyCount++;
      }
    } else if (b.status === "FAILED") {
      failedBatches++;
    } else if (b.status === "IN_PROGRESS") {
      const est = new Date(b.harvestEstimate);
      if (now >= est) {
        readyToHarvest++;
      } else {
        activeFermenting++;
      }
    }
  }

  const averageEfficiencyRate = efficiencyCount > 0 ? Number((sumEfficiency / efficiencyCount).toFixed(2)) : 0;

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

