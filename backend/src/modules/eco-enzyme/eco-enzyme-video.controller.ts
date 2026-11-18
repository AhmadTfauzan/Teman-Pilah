import { NextFunction, Response } from "express";
import { paginatedResponse, successResponse } from "../../utils/response";
import { EcoEnzymeVideoService } from "./eco-enzyme-video.service";
import {
  createEcoEnzymeVideoSchema,
  ecoEnzymeVideoQuerySchema,
  updateEcoEnzymeVideoSchema,
} from "./eco-enzyme-video.validation";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { deleteUploadedFile } from "../../utils/file";

export class EcoEnzymeVideoController {
  private readonly service: EcoEnzymeVideoService;

  constructor(service: EcoEnzymeVideoService) {
    this.service = service;
  }

  getAll = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = ecoEnzymeVideoQuerySchema.parse(req.query);
      const { data, meta } = await this.service.getAllVideos(query);

      paginatedResponse({
        res,
        message: "Berhasil mengambil data video edukasi Eco Enzyme",
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
      const video = await this.service.getVideoById(id);

      successResponse({
        res,
        message: "Berhasil mengambil detail video edukasi Eco Enzyme",
        data: video,
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
      const data = createEcoEnzymeVideoSchema.parse(req.body);
      const video = await this.service.createVideo(data, req.file);

      successResponse({
        res,
        statusCode: 201,
        message: "Video edukasi Eco Enzyme berhasil ditambahkan",
        data: video,
      });
    } catch (error) {
      deleteUploadedFile(req.file);
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
      const data = updateEcoEnzymeVideoSchema.parse(req.body);
      const video = await this.service.updateVideo(id, data, req.file);

      successResponse({
        res,
        message: "Video edukasi Eco Enzyme berhasil diperbarui",
        data: video,
      });
    } catch (error) {
      deleteUploadedFile(req.file);
      next(error);
    }
  };

  delete = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      await this.service.deleteVideo(id);

      successResponse({
        res,
        message: "Video edukasi Eco Enzyme berhasil dihapus",
      });
    } catch (error) {
      next(error);
    }
  };
}

