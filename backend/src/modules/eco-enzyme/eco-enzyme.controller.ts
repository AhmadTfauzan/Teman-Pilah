import { NextFunction, Request, Response } from "express";
import { paginatedResponse, successResponse } from "../../utils/response";
import { EcoEnzymeService } from "./eco-enzyme.service";
import {
  batchQuerySchema,
  createBatchSchema,
  createLogSchema,
  harvestBatchSchema,
  publicCodeParamSchema,
  updateBatchSchema,
} from "./eco-enzyme.validation";
import { AuthRequest } from "@/middlewares/auth.middleware";

export class EcoEnzymeController {
  private readonly ecoEnzymeService: EcoEnzymeService;

  constructor(ecoEnzymeService: EcoEnzymeService) {
    this.ecoEnzymeService = ecoEnzymeService;
  }

  getAll = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = batchQuerySchema.parse(req.query);
      const { data, meta } = await this.ecoEnzymeService.getAllBatches(query);

      paginatedResponse({
        res,
        message: "Berhasil mengambil data batch Eco Enzyme",
        data,
        meta,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const batch = await this.ecoEnzymeService.getBatchById(id);

      successResponse({
        res,
        message: "Berhasil mengambil detail batch Eco Enzyme",
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  };

  getByPublicCode = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { code } = publicCodeParamSchema.parse(req.params);
      const batch = await this.ecoEnzymeService.getBatchByPublicCode(code);

      successResponse({
        res,
        message: "Berhasil mengambil data publik batch Eco Enzyme",
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input = createBatchSchema.parse(req.body);
      const batch = await this.ecoEnzymeService.createBatch(input);

      successResponse({
        res,
        statusCode: 201,
        message: "Berhasil menambahkan batch Eco Enzyme baru",
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const input = updateBatchSchema.parse(req.body);
      const batch = await this.ecoEnzymeService.updateBatch(id, input);

      successResponse({
        res,
        message: "Berhasil memperbarui data batch Eco Enzyme",
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengarsipkan batch (Soft Delete).
   * Menjaga QR code di galon tetap valid tanpa mematikan URL.
   */
  archive = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const batch = await this.ecoEnzymeService.archiveBatch(id);

      successResponse({
        res,
        message: "Batch Eco Enzyme berhasil diarsipkan",
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Memulihkan batch dari arsip.
   */
  restore = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const batch = await this.ecoEnzymeService.restoreBatch(id);

      successResponse({
        res,
        message: "Batch Eco Enzyme berhasil dipulihkan dari arsip",
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Catat bahwa label QR Code telah dicetak/diunduh.
   */
  markQrPrinted = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const batch = await this.ecoEnzymeService.markQrPrinted(id);

      successResponse({
        res,
        message: "Pencetakan label QR Code berhasil dicatat",
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Aksi delete diarahkan ke soft delete (archive) untuk keamanan permanen QR.
   */
  delete = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      await this.ecoEnzymeService.archiveBatch(id);

      successResponse({
        res,
        message: "Batch Eco Enzyme berhasil diarsipkan",
      });
    } catch (error) {
      next(error);
    }
  };

  addLog = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const input = createLogSchema.parse(req.body);
      const log = await this.ecoEnzymeService.addLog(id, input);

      successResponse({
        res,
        statusCode: 201,
        message: "Berhasil menambahkan catatan inspeksi batch",
        data: log,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteLog = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const logId = req.params["logId"] as string;
      await this.ecoEnzymeService.deleteLog(logId);

      successResponse({
        res,
        message: "Berhasil menghapus catatan inspeksi",
      });
    } catch (error) {
      next(error);
    }
  };

  harvest = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const input = harvestBatchSchema.parse(req.body);
      const batch = await this.ecoEnzymeService.harvestBatch(id, input);

      successResponse({
        res,
        message: "Berhasil mencatat panen Eco Enzyme dan memperbarui stok produk",
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  };

  getProducts = async (
    _req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const products = await this.ecoEnzymeService.getProducts();

      successResponse({
        res,
        message: "Berhasil mengambil daftar produk katalog untuk alokasi",
        data: products,
      });
    } catch (error) {
      next(error);
    }
  };

  getStats = async (
    _req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.ecoEnzymeService.getStats();

      successResponse({
        res,
        message: "Berhasil mengambil statistik Eco Enzyme",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
