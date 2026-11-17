import { PrismaClient, EcoEnzymeBatch, EcoEnzymeLog, EnzymeBatchStatus, EnzymeResidueUsage, EnzymeFailureReason, Product, QrCode } from "../../../generated/prisma";
import { normalizeBatchCode } from "../../utils/code";

export interface FindAllBatchesOptions {
  skip: number;
  take: number;
  status?: string;
  search?: string;
  includeArchived?: boolean;
}

export class EcoEnzymeRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll({ skip, take, status, search, includeArchived }: FindAllBatchesOptions): Promise<{
    data: (EcoEnzymeBatch & {
      _count: { inspectionLogs: number };
      allocatedProduct?: Product | null;
      qrCode?: QrCode | null;
      previousBatch?: { id: string; publicCode: string; containerName: string } | null;
      nextBatches?: { id: string; publicCode: string; containerName: string }[];
    })[];
    total: number;
  }> {
    const where: any = {};

    // Penanganan Soft Delete (Archived)
    if (status === "ARCHIVED") {
      where.archivedAt = { not: null };
    } else if (includeArchived) {
      // Tampilkan semua (baik aktif maupun arsip)
    } else {
      // Default: Sembunyikan batch yang diarsipkan
      where.archivedAt = null;
    }

    if (status && status !== "ALL" && status !== "ARCHIVED") {
      if (status === "HARVESTED" || status === "FAILED" || status === "IN_PROGRESS") {
        where.status = status;
      }
    }

    if (search) {
      where.OR = [
        { publicCode: { contains: search, mode: "insensitive" } },
        { batchCode: { contains: search, mode: "insensitive" } },
        { containerName: { contains: search, mode: "insensitive" } },
        { organicWasteTypes: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

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
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ecoEnzymeBatch.update({
        where: { id },
        data: {
          status: "HARVESTED",
          actualHarvestDate: data.actualHarvestDate,
          harvestLiter: data.harvestLiter,
          efficiencyRatePercent: data.efficiencyRatePercent,
          residueUsage: data.residueUsage,
          residueNotes: data.residueNotes,
          allocatedProductId: data.allocatedProductId,
          allocatedUnitsAdded: data.allocatedUnitsAdded ?? 0,
          notes: data.notes,
        },
        include: {
          qrCode: true,
        },
      });

      if (data.allocatedProductId && (data.allocatedUnitsAdded ?? 0) > 0) {
        await tx.product.update({
          where: { id: data.allocatedProductId },
          data: {
            stock: {
              increment: data.allocatedUnitsAdded,
            },
            stockLabel: "IN_STOCK",
          },
        });
      }

      return updated;
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
}
