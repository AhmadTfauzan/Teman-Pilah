import { Prisma, PrismaClient, EcoEnzymeBatch, EcoEnzymeLog, EnzymeBatchStatus, EnzymeResidueUsage, EnzymeFailureReason, EnzymeType, EnzymeSweetenerType, Product, QrCode } from "../../../generated/prisma";
import { AppError } from "@/middlewares/error.middleware";
import { normalizeBatchCode } from "../../utils/code";
import {
  getReadyToHarvestCutoffDate,
  isBatchReadyToHarvest,
} from "./eco-enzyme.utils";

export interface FindAllBatchesOptions {
  skip: number;
  take: number;
  status?: string;
  enzymeType?: string;
  search?: string;
  includeArchived?: boolean;
  includeNotesSearch?: boolean;
  now?: Date;
}

export class EcoEnzymeRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll({
    skip,
    take,
    status,
    enzymeType,
    search,
    includeArchived,
    includeNotesSearch = true,
    now,
  }: FindAllBatchesOptions): Promise<{
    data: (EcoEnzymeBatch & {
      _count: { inspectionLogs: number };
      allocatedProduct?: Product | null;
      qrCode?: QrCode | null;
      previousBatch?: { id: string; publicCode: string; containerName: string } | null;
      nextBatches?: { id: string; publicCode: string; containerName: string }[];
    })[];
    total: number;
  }> {
    const currentTime = now ?? new Date();
    const readyCutoffDate = getReadyToHarvestCutoffDate(currentTime);
    const andConditions: Prisma.EcoEnzymeBatchWhereInput[] = [];

    if (enzymeType === "ECO_ENZYME" || enzymeType === "CLASSIC_ENZYME") {
      andConditions.push({ enzymeType });
    }

    // Penanganan Soft Delete (Archived) & status dinamis di database sebelum skip/take & count
    if (status === "ARCHIVED") {
      andConditions.push({ archivedAt: { not: null } });
    } else if (status === "FERMENTING") {
      andConditions.push({ archivedAt: null });
      andConditions.push({ status: "IN_PROGRESS" });
      andConditions.push({ harvestEstimate: { gt: currentTime } });
      andConditions.push({ startDate: { gt: readyCutoffDate } });
    } else if (status === "READY_TO_HARVEST") {
      andConditions.push({ archivedAt: null });
      andConditions.push({ status: "IN_PROGRESS" });
      andConditions.push({
        OR: [
          { harvestEstimate: { lte: currentTime } },
          { startDate: { lte: readyCutoffDate } },
        ],
      });
    } else {
      if (!includeArchived) {
        andConditions.push({ archivedAt: null });
      }
      if (
        status === "HARVESTED" ||
        status === "FAILED" ||
        status === "IN_PROGRESS"
      ) {
        andConditions.push({ status });
      }
    }

    if (search && search.trim()) {
      const term = search.trim();
      const searchOr: Prisma.EcoEnzymeBatchWhereInput[] = [
        { publicCode: { contains: term, mode: "insensitive" } },
        { batchCode: { contains: term, mode: "insensitive" } },
        { containerName: { contains: term, mode: "insensitive" } },
        { organicWasteTypes: { contains: term, mode: "insensitive" } },
      ];
      if (includeNotesSearch) {
        searchOr.push({ notes: { contains: term, mode: "insensitive" } });
      }
      andConditions.push({ OR: searchOr });
    }

    const where: Prisma.EcoEnzymeBatchWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [data, total] = await Promise.all([
      this.prisma.ecoEnzymeBatch.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { inspectionLogs: true },
          },
          allocatedProduct: true,
          qrCode: true,
          previousBatch: {
            select: {
              id: true,
              publicCode: true,
              containerName: true,
            },
          },
          nextBatches: {
            select: {
              id: true,
              publicCode: true,
              containerName: true,
            },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      this.prisma.ecoEnzymeBatch.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<(EcoEnzymeBatch & {
    inspectionLogs: EcoEnzymeLog[];
    allocatedProduct?: Product | null;
    qrCode?: QrCode | null;
    previousBatch?: { id: string; publicCode: string; containerName: string } | null;
    nextBatches?: { id: string; publicCode: string; containerName: string }[];
  }) | null> {
    return this.prisma.ecoEnzymeBatch.findUnique({
      where: { id },
      include: {
        inspectionLogs: {
          orderBy: { logDate: "desc" },
        },
        allocatedProduct: true,
        qrCode: true,
        previousBatch: {
          select: {
            id: true,
            publicCode: true,
            containerName: true,
          },
        },
        nextBatches: {
          select: {
            id: true,
            publicCode: true,
            containerName: true,
          },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async countByBatchCode(batchCode: string): Promise<number> {
    return this.prisma.ecoEnzymeBatch.count({
      where: {
        batchCode: { equals: batchCode.trim(), mode: "insensitive" },
      },
    });
  }

  async findByBatchCode(batchCode: string): Promise<(EcoEnzymeBatch & { qrCode?: QrCode | null }) | null> {
    return this.prisma.ecoEnzymeBatch.findFirst({
      where: { batchCode: { equals: batchCode.trim(), mode: "insensitive" } },
      include: { qrCode: true },
      orderBy: [
        { archivedAt: { sort: "asc", nulls: "first" } },
        { createdAt: "desc" },
      ],
    });
  }

  async findByBatchCodeOrContainerName(
    batchCode: string | null,
    containerName: string
  ): Promise<(EcoEnzymeBatch & { qrCode?: QrCode | null }) | null> {
    const trimmedName = containerName.trim();
    const orConditions: any[] = [];
    if (batchCode?.trim()) {
      orConditions.push({ batchCode: { equals: batchCode.trim(), mode: "insensitive" } });
    }
    if (trimmedName) {
      orConditions.push({ containerName: { equals: trimmedName, mode: "insensitive" } });
    }
    if (orConditions.length === 0) return null;

    return this.prisma.ecoEnzymeBatch.findFirst({
      where: { OR: orConditions },
      include: { qrCode: true },
      orderBy: [
        { archivedAt: { sort: "asc", nulls: "first" } },
        { createdAt: "desc" },
      ],
    });
  }

  async findByPublicCode(publicCode: string): Promise<any> {
    const rawTrimmed = (publicCode || "").trim();
    const normalized = normalizeBatchCode(rawTrimmed);

    return this.prisma.ecoEnzymeBatch.findFirst({
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
      select: {
        id: true,
        publicCode: true,
        batchCode: true,
        enzymeType: true,
        sweetenerType: true,
        containerName: true,
        startDate: true,
        harvestEstimate: true,
        actualHarvestDate: true,
        status: true,
        molassesKg: true,
        organicWasteKg: true,
        waterLiter: true,
        organicWasteTypes: true,
        harvestLiter: true,
        residueUsage: true,
        archivedAt: true,
        qrPrintedAt: true,
        qrCodeId: true,
        qrCode: true,
        updatedAt: true,
        previousBatch: {
          select: {
            id: true,
            publicCode: true,
            containerName: true,
          },
        },
        nextBatches: {
          select: {
            id: true,
            publicCode: true,
            containerName: true,
          },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        inspectionLogs: {
          select: {
            dayNumber: true,
            logDate: true,
            phLevel: true,
            aromaStatus: true,
            fungusColor: true,
          },
          orderBy: { dayNumber: "asc" },
        },
      },
    });
  }

  async existsByPublicCode(publicCode: string): Promise<boolean> {
    const normalized = normalizeBatchCode(publicCode);
    const [batchCount, qrCount] = await Promise.all([
      this.prisma.ecoEnzymeBatch.count({
        where: { publicCode: normalized },
      }),
      this.prisma.qrCode.count({
        where: { code: normalized },
      }),
    ]);
    return batchCount > 0 || qrCount > 0;
  }

  async findQrCodeByCode(code: string): Promise<QrCode | null> {
    const normalized = normalizeBatchCode(code);
    if (!normalized) return null;
    return this.prisma.qrCode.findFirst({
      where: { code: { equals: normalized, mode: "insensitive" } },
    });
  }

  async findQrCodeByKeyOrName(
    entityType: string,
    primaryKey: string | null,
    primaryName: string
  ): Promise<QrCode | null> {
    if (primaryKey) {
      const byKey = await this.prisma.qrCode.findFirst({
        where: {
          entityType,
          primaryKey: { equals: primaryKey, mode: "insensitive" },
        },
        orderBy: { createdAt: "asc" },
      });
      if (byKey) return byKey;
    }

    if (primaryName) {
      const byName = await this.prisma.qrCode.findFirst({
        where: {
          entityType,
          primaryName: { equals: primaryName, mode: "insensitive" },
        },
        orderBy: { createdAt: "asc" },
      });
      if (byName) return byName;
    }

    return null;
  }

  async createQrCode(data: {
    code: string;
    entityType: string;
    primaryKey: string | null;
    primaryName: string;
    targetUrl: string;
  }): Promise<QrCode> {
    return this.prisma.qrCode.create({ data });
  }

  async linkQrCodeToBatch(batchId: string, qrCodeId: string): Promise<void> {
    await this.prisma.ecoEnzymeBatch.updateMany({
      where: { id: batchId, qrCodeId: null },
      data: { qrCodeId },
    });
  }

  async create(data: {
    publicCode: string;
    batchCode: string;
    enzymeType: EnzymeType;
    sweetenerType: EnzymeSweetenerType;
    containerName: string;
    containerCapacityLiter: number;
    molassesKg: number;
    organicWasteKg: number;
    waterLiter: number;
    organicWasteTypes: string;
    startDate: Date;
    harvestEstimate: Date;
    photoUrl?: string | null;
    notes?: string | null;
    previousBatchId?: string | null;
    qrCodeId?: string | null;
  }): Promise<EcoEnzymeBatch & { qrCode?: QrCode | null }> {
    return this.prisma.ecoEnzymeBatch.create({
      data: {
        publicCode: data.publicCode,
        batchCode: data.batchCode,
        enzymeType: data.enzymeType,
        sweetenerType: data.sweetenerType,
        containerName: data.containerName,
        containerCapacityLiter: data.containerCapacityLiter,
        molassesKg: data.molassesKg,
        organicWasteKg: data.organicWasteKg,
        waterLiter: data.waterLiter,
        organicWasteTypes: data.organicWasteTypes,
        startDate: data.startDate,
        harvestEstimate: data.harvestEstimate,
        photoUrl: data.photoUrl,
        notes: data.notes,
        previousBatchId: data.previousBatchId || null,
        qrCodeId: data.qrCodeId ?? null,
        status: "IN_PROGRESS",
      },
      include: {
        qrCode: true,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      enzymeType: EnzymeType;
      sweetenerType: EnzymeSweetenerType;
      containerName: string;
      containerCapacityLiter: number;
      molassesKg: number;
      organicWasteKg: number;
      waterLiter: number;
      organicWasteTypes: string;
      startDate: Date;
      harvestEstimate: Date;
      actualHarvestDate: Date | null;
      harvestLiter: number | null;
      efficiencyRatePercent: number | null;
      residueUsage: EnzymeResidueUsage | null;
      residueNotes: string | null;
      allocatedProductId: string | null;
      allocatedUnitsAdded: number | null;
      status: EnzymeBatchStatus;
      failureReason: EnzymeFailureReason | null;
      failureNotes: string | null;
      photoUrl: string | null;
      notes: string | null;
      qrPrintedAt: Date | null;
    }>
  ): Promise<EcoEnzymeBatch> {
    // KEAMANAN KETAT: publicCode & qrCodeId dibuang jika terkirim ke update
    const sanitizedData = { ...data };
    delete (sanitizedData as any).publicCode;
    delete (sanitizedData as any).qrCodeId;
    delete (sanitizedData as any).id;

    return this.prisma.ecoEnzymeBatch.update({
      where: { id },
      data: sanitizedData,
      include: { qrCode: true },
    });
  }

  async archive(id: string): Promise<EcoEnzymeBatch> {
    return this.prisma.ecoEnzymeBatch.update({
      where: { id },
      data: {
        archivedAt: new Date(),
      },
      include: { qrCode: true },
    });
  }

  async restore(id: string): Promise<EcoEnzymeBatch> {
    return this.prisma.ecoEnzymeBatch.update({
      where: { id },
      data: {
        archivedAt: null,
      },
      include: { qrCode: true },
    });
  }

  async markQrPrinted(id: string): Promise<EcoEnzymeBatch> {
    return this.prisma.ecoEnzymeBatch.update({
      where: { id },
      data: {
        qrPrintedAt: new Date(),
      },
      include: { qrCode: true },
    });
  }

  async harvest(
    id: string,
    data: {
      actualHarvestDate: Date;
      harvestLiter: number;
      efficiencyRatePercent: number;
      residueUsage?: EnzymeResidueUsage;
      residueNotes?: string | null;
      allocatedProductId?: string | null;
      allocatedUnitsAdded?: number;
      notes?: string | null;
    }
  ): Promise<EcoEnzymeBatch> {
    const unitsToAdd = data.allocatedUnitsAdded ?? 0;
    if (!Number.isInteger(unitsToAdd) || unitsToAdd < 0) {
      throw new AppError("Jumlah unit alokasi tidak boleh negatif", 400);
    }

    const allocatedProductId = data.allocatedProductId?.trim() || null;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const lockResult = await tx.ecoEnzymeBatch.updateMany({
        where: {
          id,
          status: "IN_PROGRESS",
          archivedAt: null,
        },
        data: {
          status: "HARVESTED",
          actualHarvestDate: data.actualHarvestDate,
          harvestLiter: data.harvestLiter,
          efficiencyRatePercent: data.efficiencyRatePercent,
          ...(data.residueUsage !== undefined && { residueUsage: data.residueUsage }),
          ...(data.residueNotes !== undefined && { residueNotes: data.residueNotes }),
          allocatedProductId,
          allocatedUnitsAdded: unitsToAdd,
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      });

      if (lockResult.count === 0) {
        const current = await tx.ecoEnzymeBatch.findUnique({
          where: { id },
          select: { status: true, archivedAt: true },
        });

        if (!current) {
          throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
        }
        if (current.archivedAt !== null) {
          throw new AppError("Batch yang sudah diarsipkan tidak dapat dipanen", 400);
        }
        if (current.status === "FAILED") {
          throw new AppError("Batch yang sudah berstatus GAGAL tidak dapat dipanen", 400);
        }
        if (current.status === "HARVESTED") {
          throw new AppError("Batch ini sudah dipanen sebelumnya", 400);
        }
        throw new AppError("Batch tidak dapat dipanen pada status saat ini", 400);
      }

      if (allocatedProductId) {
        const product = await tx.product.findUnique({
          where: { id: allocatedProductId },
          select: { id: true, stockLabel: true },
        });

        if (!product) {
          throw new AppError("Produk alokasi tidak ditemukan", 404);
        }

        if (unitsToAdd > 0) {
          await tx.product.update({
            where: { id: allocatedProductId },
            data: {
              stock: {
                increment: unitsToAdd,
              },
              ...(product.stockLabel === "OUT_OF_STOCK"
                ? { stockLabel: "IN_STOCK" }
                : {}),
            },
          });
        }
      }

      return tx.ecoEnzymeBatch.findUniqueOrThrow({
        where: { id },
        include: {
          qrCode: true,
        },
      });
    });
  }

  async delete(id: string): Promise<EcoEnzymeBatch> {
    return this.prisma.ecoEnzymeBatch.delete({
      where: { id },
    });
  }

  async createLog(batchId: string, data: {
    dayNumber?: number;
    logDate?: Date;
    phLevel?: number | null;
    aromaStatus?: string | null;
    fungusColor?: string | null;
    actionTaken?: string | null;
    imageUrl?: string | null;
    notes?: string | null;
  }): Promise<EcoEnzymeLog> {
    return this.prisma.ecoEnzymeLog.create({
      data: {
        batchId,
        dayNumber: data.dayNumber ?? 7,
        logDate: data.logDate ?? new Date(),
        phLevel: data.phLevel ?? null,
        aromaStatus: data.aromaStatus ?? null,
        fungusColor: data.fungusColor ?? null,
        actionTaken: data.actionTaken ?? null,
        imageUrl: data.imageUrl ?? null,
        notes: data.notes ?? null,
      },
    });
  }

  async findLogById(logId: string): Promise<EcoEnzymeLog | null> {
    return this.prisma.ecoEnzymeLog.findUnique({
      where: { id: logId },
    });
  }

  async deleteLog(logId: string): Promise<EcoEnzymeLog> {
    return this.prisma.ecoEnzymeLog.delete({
      where: { id: logId },
    });
  }

  async getProductsForAllocation(): Promise<Product[]> {
    return this.prisma.product.findMany({
      orderBy: { name: "asc" },
    });
  }

  async getStats(): Promise<{
    totalBatches: number;
    activeFermenting: number;
    readyToHarvest: number;
    harvestedBatches: number;
    failedBatches: number;
    totalOrganicWasteKg: number;
    totalHarvestLiter: number;
    averageEfficiencyRate: number;
  }> {
    // PENTING: Hanya hitung batch yang tidak diarsipkan (archivedAt: null)
    // agar live tracker dan metrik dampak konsisten dan tidak double count.
    const batches = await this.prisma.ecoEnzymeBatch.findMany({
      where: {
        archivedAt: null,
      },
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
        if (b.efficiencyRatePercent != null) {
          sumEfficiency += Number(b.efficiencyRatePercent);
          efficiencyCount++;
        }
      } else if (b.status === "FAILED") {
        failedBatches++;
      } else if (b.status === "IN_PROGRESS") {
        totalOrganicWasteKg += Number(b.organicWasteKg);
        if (isBatchReadyToHarvest(b.startDate, b.harvestEstimate, now)) {
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
}
