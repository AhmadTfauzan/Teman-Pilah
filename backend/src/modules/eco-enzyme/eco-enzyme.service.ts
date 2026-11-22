import crypto from "crypto";
import { EcoEnzymeBatch, EcoEnzymeLog, QrCode } from "../../../generated/prisma";
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
import { generatePublicBatchCode, normalizeBatchCode } from "../../utils/code";
import {
  computeBatchDayPassed,
  DEFAULT_WASTE_TYPES_BY_ENZYME,
  EnzymeSweetenerTypeValue,
  EnzymeTypeValue,
  FERMENTATION_DAYS,
  getDefaultSweetenerForEnzyme,
  getSweetenerValidationErrorMessage,
  isBatchReadyToHarvest,
  isSweetenerAllowedForEnzyme,
  redactPublicEcoEnzymeBatch,
} from "./eco-enzyme.utils";

export interface BatchListResult {
  data: any[];
  meta: PaginationMeta;
}

export class EcoEnzymeService {
  private readonly ecoEnzymeRepository: EcoEnzymeRepository;

  constructor(ecoEnzymeRepository: EcoEnzymeRepository) {
    this.ecoEnzymeRepository = ecoEnzymeRepository;
  }

  private getCanonicalSiteUrl(): string {
    const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const baseUrl =
      raw && !raw.includes("trycloudflare.com") && !raw.includes("localhost")
        ? raw
        : "https://teman-pilahfe-main.vercel.app";
    return baseUrl.replace(/\/+$/, "");
  }

  /**
   * Menghasilkan kode batch unik dengan 5 digit acak dan pengecekan keunikan ke DB,
   * disertai fallback alfanumerik jika slot numerik padat.
   */
  private async generateBatchCode(date: Date = new Date()): Promise<string> {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(date);
    const year =
      parts.find((p) => p.type === "year")?.value ?? String(date.getFullYear());
    const month =
      parts.find((p) => p.type === "month")?.value ??
      String(date.getMonth() + 1).padStart(2, "0");
    const yyyymm = `${year}${month}`;

    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = `EE-${yyyymm}-${crypto.randomInt(10000, 100000)}`;
      const existingCount = await this.ecoEnzymeRepository.countByBatchCode(candidate);
      if (existingCount === 0) {
        return candidate;
      }
    }

    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = `EE-${yyyymm}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const existingCount = await this.ecoEnzymeRepository.countByBatchCode(candidate);
      if (existingCount === 0) {
        return candidate;
      }
    }

    throw new AppError(
      "Gagal menghasilkan kode batch unik. Silakan coba lagi.",
      500,
    );
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
  private enrichBatchDynamicStatus(batch: any, now: Date = new Date()): any {
    const dayPassed = computeBatchDayPassed(batch.startDate, now);
    const progressPercent = Math.min(
      100,
      Math.round((dayPassed / FERMENTATION_DAYS) * 100),
    );

    let displayStatus: "FERMENTING" | "READY_TO_HARVEST" | "HARVESTED" | "FAILED" | "ARCHIVED" = "FERMENTING";

    if (batch.archivedAt) {
      displayStatus = "ARCHIVED";
    } else if (batch.status === "HARVESTED") {
      displayStatus = "HARVESTED";
    } else if (batch.status === "FAILED") {
      displayStatus = "FAILED";
    } else if (
      isBatchReadyToHarvest(batch.startDate, batch.harvestEstimate, now)
    ) {
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

  async getAllBatches(
    query: BatchQueryInput,
    isAdmin: boolean = false,
  ): Promise<BatchListResult> {
    const { skip, take, page, limit } = parsePagination(query);

    if (!isAdmin && query.status === "ARCHIVED") {
      return {
        data: [],
        meta: buildPaginationMeta(0, page, limit),
      };
    }

    const now = new Date();
    const { data, total } = await this.ecoEnzymeRepository.findAll({
      skip,
      take,
      status: query.status,
      enzymeType: query.enzymeType,
      search: query.search,
      includeArchived: isAdmin ? query.includeArchived : false,
      includeNotesSearch: isAdmin,
      now,
    });

    const enriched = data.map((b) => this.enrichBatchDynamicStatus(b, now));
    const finalData = isAdmin
      ? enriched
      : enriched.map((b) => redactPublicEcoEnzymeBatch(b));

    return {
      data: finalData,
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

  async getBatchById(id: string, isAdmin: boolean = false): Promise<any> {
    const batch = await this.ecoEnzymeRepository.findById(id);
    if (!batch) {
      throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
    }

    if (!isAdmin && batch.archivedAt) {
      throw new AppError("Batch Eco Enzyme tidak ditemukan", 404);
    }

    const enriched = this.enrichBatchDynamicStatus(batch);
    return isAdmin ? enriched : redactPublicEcoEnzymeBatch(enriched);
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

  private async resolveOrCreateBatchQrCode(input: {
    previousBatchId?: string | null;
    batchCode: string;
    containerName: string;
    startDate: Date;
  }): Promise<{ qrCode: QrCode; reused: boolean }> {
    const normalizedKey = input.batchCode.trim().toUpperCase() || null;
    const normalizedName = input.containerName.trim().toLowerCase();

    if (input.previousBatchId) {
      const prev = await this.ecoEnzymeRepository.findById(input.previousBatchId);
      if (!prev) {
        throw new AppError("Batch sebelumnya yang dipilih tidak valid", 400);
      }

      if (prev.qrCode) {
        return { qrCode: prev.qrCode, reused: true };
      }

      if (prev.publicCode) {
        const existingQr = await this.ecoEnzymeRepository.findQrCodeByCode(prev.publicCode);
        if (existingQr) {
          await this.ecoEnzymeRepository.linkQrCodeToBatch(prev.id, existingQr.id);
          return { qrCode: existingQr, reused: true };
        }

        const code = normalizeBatchCode(prev.publicCode);
        const createdFromPrev = await this.ecoEnzymeRepository.createQrCode({
          code,
          entityType: "ECO_ENZYME_BATCH",
          primaryKey: prev.batchCode.trim().toUpperCase() || normalizedKey,
          primaryName: prev.containerName.trim().toLowerCase() || normalizedName || code.toLowerCase(),
          targetUrl: `${this.getCanonicalSiteUrl()}/b/${code}`,
        });
        await this.ecoEnzymeRepository.linkQrCodeToBatch(prev.id, createdFromPrev.id);
        return { qrCode: createdFromPrev, reused: true };
      }
    }

    const existingByRegistry = await this.ecoEnzymeRepository.findQrCodeByKeyOrName(
      "ECO_ENZYME_BATCH",
      normalizedKey,
      normalizedName
    );
    if (existingByRegistry) {
      return { qrCode: existingByRegistry, reused: true };
    }

    const legacyBatch = await this.ecoEnzymeRepository.findByBatchCodeOrContainerName(
      normalizedKey,
      input.containerName
    );
    if (legacyBatch?.qrCode) {
      return { qrCode: legacyBatch.qrCode, reused: true };
    }
    if (legacyBatch?.publicCode) {
      const code = normalizeBatchCode(legacyBatch.publicCode);
      const existingQr = await this.ecoEnzymeRepository.findQrCodeByCode(code);
      if (existingQr) {
        await this.ecoEnzymeRepository.linkQrCodeToBatch(legacyBatch.id, existingQr.id);
        return { qrCode: existingQr, reused: true };
      }

      const createdFromLegacy = await this.ecoEnzymeRepository.createQrCode({
        code,
        entityType: "ECO_ENZYME_BATCH",
        primaryKey: normalizedKey ?? (legacyBatch.batchCode.trim().toUpperCase() || null),
        primaryName: normalizedName || legacyBatch.containerName.trim().toLowerCase(),
        targetUrl: `${this.getCanonicalSiteUrl()}/b/${code}`,
      });
      await this.ecoEnzymeRepository.linkQrCodeToBatch(legacyBatch.id, createdFromLegacy.id);
      return { qrCode: createdFromLegacy, reused: true };
    }

    const code = await this.generateUniquePublicCode(input.startDate);
    const created = await this.ecoEnzymeRepository.createQrCode({
      code,
      entityType: "ECO_ENZYME_BATCH",
      primaryKey: normalizedKey,
      primaryName: normalizedName || code.toLowerCase(),
      targetUrl: `${this.getCanonicalSiteUrl()}/b/${code}`,
    });
    return { qrCode: created, reused: false };
  }

  async createBatch(input: CreateBatchInput): Promise<EcoEnzymeBatch & { reusedQr?: boolean }> {
    const enzymeType: EnzymeTypeValue = input.enzymeType ?? "ECO_ENZYME";
    const sweetenerType: EnzymeSweetenerTypeValue =
      input.sweetenerType ?? getDefaultSweetenerForEnzyme(enzymeType);

    if (!isSweetenerAllowedForEnzyme(enzymeType, sweetenerType)) {
      throw new AppError(
        getSweetenerValidationErrorMessage(enzymeType, sweetenerType),
        400,
      );
    }

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

    const batchCode =
      input.batchCode?.trim() || (await this.generateBatchCode(startDate));

    const { qrCode, reused } = await this.resolveOrCreateBatchQrCode({
      previousBatchId: input.previousBatchId,
      batchCode,
      containerName: input.containerName,
      startDate,
    });

    const organicWasteTypes =
      input.organicWasteTypes?.trim() ||
      DEFAULT_WASTE_TYPES_BY_ENZYME[enzymeType];

    const created = await this.ecoEnzymeRepository.create({
      publicCode: qrCode.code,
      batchCode,
      enzymeType,
      sweetenerType,
      containerName: input.containerName,
      containerCapacityLiter: input.containerCapacityLiter ?? 50,
      molassesKg: input.molassesKg,
      organicWasteKg: input.organicWasteKg,
      waterLiter: input.waterLiter,
      organicWasteTypes,
      startDate,
      harvestEstimate,
      photoUrl: input.photoUrl,
      notes: input.notes,
      previousBatchId: input.previousBatchId || null,
      qrCodeId: qrCode.id,
    });

    return {
      ...created,
      reusedQr: reused,
    };
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

    const ALLOWED_BATCH_STATUSES = ["IN_PROGRESS", "HARVESTED", "FAILED"] as const;
    if (
      input.status !== undefined &&
      !ALLOWED_BATCH_STATUSES.includes(input.status)
    ) {
      throw new AppError(
        "Status batch tidak valid. Gunakan endpoint arsip untuk mengarsipkan batch",
        400,
      );
    }

    // Validasi kombinasi enzymeType dan sweetenerType terhadap nilai baru maupun nilai existing
    const nextEnzymeType: EnzymeTypeValue =
      input.enzymeType ?? existing.enzymeType;
    const nextSweetenerType: EnzymeSweetenerTypeValue =
      input.sweetenerType ?? existing.sweetenerType;

    if (
      (input.enzymeType !== undefined || input.sweetenerType !== undefined) &&
      !isSweetenerAllowedForEnzyme(nextEnzymeType, nextSweetenerType)
    ) {
      throw new AppError(
        getSweetenerValidationErrorMessage(nextEnzymeType, nextSweetenerType),
        400,
      );
    }

    // Aturan bisnis: batch yang sudah HARVESTED terkunci dari perubahan formula dan tanggal mulai
    if (existing.status === "HARVESTED") {
      if (
        input.startDate !== undefined ||
        input.molassesKg !== undefined ||
        input.organicWasteKg !== undefined ||
        input.waterLiter !== undefined
      ) {
        throw new AppError("Batch yang sudah dipanen terkunci dari perubahan formula dan tanggal mulai", 400);
      }
    }

    const updateData: any = {};

    if (input.enzymeType !== undefined) updateData.enzymeType = input.enzymeType;
    if (input.sweetenerType !== undefined) updateData.sweetenerType = input.sweetenerType;
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

    if (input.startDate !== undefined) {
      if (!input.startDate || input.startDate.trim() === "") {
        throw new AppError("Format tanggal mulai tidak valid", 400);
      }
      const startDate = new Date(input.startDate);
      if (isNaN(startDate.getTime())) {
        throw new AppError("Format tanggal mulai tidak valid", 400);
      }
      updateData.startDate = startDate;
      if (input.harvestEstimate === undefined || input.harvestEstimate === "") {
        const harvestEstimate = new Date(startDate);
        harvestEstimate.setDate(harvestEstimate.getDate() + 89);
        updateData.harvestEstimate = harvestEstimate;
      }
    }

    if (input.harvestEstimate !== undefined && input.harvestEstimate !== "") {
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

    if (existing.archivedAt !== null) {
      throw new AppError("Batch yang sudah diarsipkan tidak dapat dipanen", 400);
    }

    if (existing.status === "FAILED") {
      throw new AppError("Batch yang sudah berstatus GAGAL tidak dapat dipanen", 400);
    }

    if (existing.status === "HARVESTED") {
      throw new AppError("Batch ini sudah dipanen sebelumnya", 400);
    }

    const allocatedUnitsAdded = input.allocatedUnitsAdded ?? 0;
    if (!Number.isInteger(allocatedUnitsAdded) || allocatedUnitsAdded < 0) {
      throw new AppError("Jumlah unit alokasi tidak boleh negatif", 400);
    }

    const actualHarvestDate = input.actualHarvestDate
      ? new Date(input.actualHarvestDate)
      : new Date();
    if (isNaN(actualHarvestDate.getTime())) {
      throw new AppError("Format tanggal panen tidak valid", 400);
    }

    const allocatedProductId = input.allocatedProductId?.trim() || null;

    // Hitung Rendemen (%): (harvestLiter / total input bahan) * 100%
    const totalInput =
      Number(existing.molassesKg) +
      Number(existing.organicWasteKg) +
      Number(existing.waterLiter);
    const efficiencyRatePercent =
      totalInput > 0
        ? Number(((input.harvestLiter / totalInput) * 100).toFixed(2))
        : 0;

    return this.ecoEnzymeRepository.harvest(id, {
      actualHarvestDate,
      harvestLiter: input.harvestLiter,
      efficiencyRatePercent,
      residueUsage: input.residueUsage,
      residueNotes: input.residueNotes,
      allocatedProductId,
      allocatedUnitsAdded,
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

    const logDate =
      input.logDate !== undefined && input.logDate.trim() !== ""
        ? new Date(input.logDate)
        : new Date();
    if (isNaN(logDate.getTime())) {
      throw new AppError("Format tanggal log tidak valid", 400);
    }

    return this.ecoEnzymeRepository.createLog(batchId, {
      dayNumber: input.dayNumber,
      logDate,
      phLevel: input.phLevel,
      aromaStatus: input.aromaStatus,
      fungusColor: input.fungusColor,
      actionTaken: input.actionTaken,
      imageUrl: input.imageUrl,
      notes: input.notes,
    });
  }

  async deleteLog(logId: string): Promise<void> {
    const existingLog = await this.ecoEnzymeRepository.findLogById(logId);
    if (!existingLog) {
      throw new AppError("Catatan log tidak ditemukan", 404);
    }
    await this.ecoEnzymeRepository.deleteLog(logId);
  }

  async getProducts() {
    return this.ecoEnzymeRepository.getProductsForAllocation();
  }

  async getStats() {
    return this.ecoEnzymeRepository.getStats();
  }
}
