import { EcoEnzymeBatch, EcoEnzymeLog } from "../../../generated/prisma";
import { AppError } from "@/middlewares/error.middleware";
import {
  buildPaginationMeta,
  parsePagination,
  PaginationMeta,
} from "../../utils/pagination";
import { EcoEnzymeRepository } from "./eco-enzyme.repository";
import {
  BatchQueryInput,
  CreateBatchInput,
  CreateLogInput,
  HarvestBatchInput,
  UpdateBatchInput,
} from "./eco-enzyme.validation";
import { generatePublicBatchCode } from "../../utils/code";

export interface BatchListResult {
  data: any[];
  meta: PaginationMeta;
}

export class EcoEnzymeService {
  private readonly ecoEnzymeRepository: EcoEnzymeRepository;

  constructor(ecoEnzymeRepository: EcoEnzymeRepository) {
    this.ecoEnzymeRepository = ecoEnzymeRepository;
  }

  private generateBatchCode(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const rand = Math.floor(100 + Math.random() * 900);
    return `EE-${year}${month}-${rand}`;
  }

  /**
   * Evaluasi status dinamis batch:
   * - Jika batch memiliki archivedAt => ARCHIVED
   * - Jika HARVESTED => HARVESTED
   * - Jika FAILED => FAILED
   * - Jika status di DB = IN_PROGRESS:
   *   - Jika hari berjalan < 90 => FERMENTING
   *   - Jika hari berjalan >= 90 => READY_TO_HARVEST
   */
  private enrichBatchDynamicStatus(batch: any): any {
    const now = new Date();
    const startDate = new Date(batch.startDate);
    const harvestEstimate = new Date(batch.harvestEstimate);

    // Perhitungan hari berjalan (start date dianggap hari ke-1)
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

  async getAllBatches(query: BatchQueryInput): Promise<BatchListResult> {
    const { skip, take, page, limit } = parsePagination(query);

    const { data, total } = await this.ecoEnzymeRepository.findAll({
      skip,
      take,
      status: query.status,
      search: query.search,
      includeArchived: query.includeArchived,
    });

    const enriched = data.map((b) => this.enrichBatchDynamicStatus(b));

    // Filter status jika yang diminta adalah displayStatus khusus
    let filteredData = enriched;
    if (query.status === "FERMENTING") {
      filteredData = enriched.filter((b) => b.displayStatus === "FERMENTING");
    } else if (query.status === "READY_TO_HARVEST") {
      filteredData = enriched.filter((b) => b.displayStatus === "READY_TO_HARVEST");
    } else if (query.status === "ARCHIVED") {
      filteredData = enriched.filter((b) => b.displayStatus === "ARCHIVED");
    }

    return {
      data: filteredData,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Menghasilkan public code unik tanpa karakter ambigu dengan mekanisme retry maksimal 5 kali.
   */
  private async generateUniquePublicCode(date: Date): Promise<string> {
    const MAX_RETRIES = 5;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const code = generatePublicBatchCode(date);
      const exists = await this.ecoEnzymeRepository.existsByPublicCode(code);
      if (!exists) return code;
    }
    throw new AppError(
      "Gagal menghasilkan kode batch unik setelah 5 kali percobaan. Silakan coba lagi.",
      500
    );
  }

  async getBatchById(id: string): Promise<any> {
    const batch = await this.ecoEnzymeRepository.findById(id);
    if (!batch) {
      throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
    }

    return this.enrichBatchDynamicStatus(batch);
  }

  async getBatchByPublicCode(publicCode: string): Promise<any> {
    const batch = await this.ecoEnzymeRepository.findByPublicCode(publicCode);
    if (!batch) {
      throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
    }

    const enriched = this.enrichBatchDynamicStatus(batch);
    const isHarvested = enriched.status === "HARVESTED";
    const isArchived = Boolean(enriched.archivedAt);

    // Suksesi galon: batch terbaru yang menggunakan wadah/galon ini
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
      updatedAt: enriched.updatedAt,
      nextBatch: nextBatch
        ? {
            id: nextBatch.id,
            publicCode: nextBatch.publicCode,
            containerName: nextBatch.containerName,
          }
        : null,
      inspectionLogs: (enriched.inspectionLogs ?? []).map(
        (log: {
          dayNumber: number;
          logDate: Date;
          phLevel: unknown;
          aromaStatus: string | null;
          fungusColor: string | null;
        }) => ({
          dayNumber: log.dayNumber,
          logDate: log.logDate,
          phLevel: log.phLevel,
          aromaStatus: log.aromaStatus,
          fungusColor: log.fungusColor,
        })
      ),
    };
  }

  async createBatch(input: CreateBatchInput): Promise<EcoEnzymeBatch> {
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
      // Tanggal mulai dianggap Hari ke-1, panen Hari ke-90 = startDate + 89 hari
      harvestEstimate = new Date(startDate);
      harvestEstimate.setDate(harvestEstimate.getDate() + 89);
    }

    const batchCode = input.batchCode?.trim() || this.generateBatchCode();

    const existing = await this.ecoEnzymeRepository.findByBatchCode(batchCode);
    if (existing) {
      throw new AppError(`Kode batch '${batchCode}' sudah digunakan`, 409);
    }

    // Validasi previousBatchId jika diberikan (suksesi wadah/galon)
    if (input.previousBatchId) {
      const prev = await this.ecoEnzymeRepository.findById(input.previousBatchId);
      if (!prev) {
        throw new AppError("Batch sebelumnya yang dipilih tidak valid", 400);
      }
    }

    const publicCode = await this.generateUniquePublicCode(startDate);

    return this.ecoEnzymeRepository.create({
      publicCode,
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
    });
  }

  async updateBatch(id: string, input: UpdateBatchInput): Promise<EcoEnzymeBatch> {
    const existing = await this.ecoEnzymeRepository.findById(id);
    if (!existing) {
      throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
    }

    // PENGAMANAN KETAT: publicCode permanen dan TIDAK BOLEH disentuh oleh update batch apapun
    if ((input as any).publicCode !== undefined) {
      throw new AppError("Kode batch publik (publicCode) bersifat permanen dan tidak dapat diubah", 400);
    }

    // Aturan bisnis: batch yang sudah HARVESTED terkunci dari perubahan formula dan tanggal mulai
    if (existing.status === "HARVESTED") {
      if (input.startDate || input.molassesKg || input.organicWasteKg || input.waterLiter) {
        throw new AppError("Batch yang sudah dipanen terkunci dari perubahan formula dan tanggal mulai", 400);
      }
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
    if (input.failureReason !== undefined) updateData.failureReason = input.failureReason;
    if (input.failureNotes !== undefined) updateData.failureNotes = input.failureNotes;
    if (input.notes !== undefined) updateData.notes = input.notes;

    if (input.startDate) {
      const startDate = new Date(input.startDate);
      if (isNaN(startDate.getTime())) {
        throw new AppError("Format tanggal mulai tidak valid", 400);
      }
      updateData.startDate = startDate;
      if (!input.harvestEstimate) {
        const harvestEstimate = new Date(startDate);
        harvestEstimate.setDate(harvestEstimate.getDate() + 89);
        updateData.harvestEstimate = harvestEstimate;
      }
    }

    if (input.harvestEstimate) {
      const harvestEstimate = new Date(input.harvestEstimate);
      if (isNaN(harvestEstimate.getTime())) {
        throw new AppError("Format tanggal panen tidak valid", 400);
      }
      updateData.harvestEstimate = harvestEstimate;
    }

    return this.ecoEnzymeRepository.update(id, updateData);
  }

  async harvestBatch(id: string, input: HarvestBatchInput): Promise<EcoEnzymeBatch> {
    const existing = await this.ecoEnzymeRepository.findById(id);
    if (!existing) {
      throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
    }

    if (existing.status === "FAILED") {
      throw new AppError("Batch yang sudah berstatus GAGAL tidak dapat dipanen", 400);
    }

    // Hitung Rendemen (%): (harvestLiter / total input bahan) * 100%
    const totalInput = Number(existing.molassesKg) + Number(existing.organicWasteKg) + Number(existing.waterLiter);
    const efficiencyRatePercent = totalInput > 0
      ? Number(((input.harvestLiter / totalInput) * 100).toFixed(2))
      : 0;

    const actualHarvestDate = input.actualHarvestDate ? new Date(input.actualHarvestDate) : new Date();

    return this.ecoEnzymeRepository.harvest(id, {
      actualHarvestDate,
      harvestLiter: input.harvestLiter,
      efficiencyRatePercent,
      residueUsage: input.residueUsage,
      residueNotes: input.residueNotes,
      allocatedProductId: input.allocatedProductId,
      allocatedUnitsAdded: input.allocatedUnitsAdded,
      notes: input.notes,
    });
  }

  /**
   * Mengarsipkan batch (Soft Delete).
   * URL dan QR Code fisik pada galon tetap VALID permanen.
   */
  async archiveBatch(id: string): Promise<EcoEnzymeBatch> {
    const existing = await this.ecoEnzymeRepository.findById(id);
    if (!existing) {
      throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
    }
    return this.ecoEnzymeRepository.archive(id);
  }

  /**
   * Memulihkan batch yang diarsipkan ke status aktif kembali.
   */
  async restoreBatch(id: string): Promise<EcoEnzymeBatch> {
    const existing = await this.ecoEnzymeRepository.findById(id);
    if (!existing) {
      throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
    }
    return this.ecoEnzymeRepository.restore(id);
  }

  /**
   * Tandai bahwa label QR Code untuk batch ini sudah dicetak / diunduh.
   */
  async markQrPrinted(id: string): Promise<EcoEnzymeBatch> {
    const existing = await this.ecoEnzymeRepository.findById(id);
    if (!existing) {
      throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
    }
    return this.ecoEnzymeRepository.markQrPrinted(id);
  }

  /**
   * Operasi delete publik dialihkan ke soft delete archive agar QR galon tidak pernah mati.
   */
  async deleteBatch(id: string): Promise<EcoEnzymeBatch> {
    return this.archiveBatch(id);
  }

  async addLog(batchId: string, input: CreateLogInput): Promise<EcoEnzymeLog> {
    const batch = await this.ecoEnzymeRepository.findById(batchId);
    if (!batch) {
      throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
    }

    return this.ecoEnzymeRepository.createLog(batchId, {
      dayNumber: input.dayNumber,
      logDate: input.logDate ? new Date(input.logDate) : new Date(),
      phLevel: input.phLevel,
      aromaStatus: input.aromaStatus,
      fungusColor: input.fungusColor,
      actionTaken: input.actionTaken,
      imageUrl: input.imageUrl,
      notes: input.notes,
    });
  }

  async deleteLog(logId: string): Promise<void> {
    await this.ecoEnzymeRepository.deleteLog(logId);
  }

  async getProducts() {
    return this.ecoEnzymeRepository.getProductsForAllocation();
  }

  async getStats() {
    return this.ecoEnzymeRepository.getStats();
  }
}
