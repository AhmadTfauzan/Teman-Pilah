import { NextFunction, Response } from "express";
import { paginatedResponse, successResponse } from "../../utils/response";
import { VideoService } from "./video.service";
import {
  createVideoSchema,
  videoQuerySchema,
  updateVideoSchema,
} from "./video.validation";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { deleteUploadedFile } from "../../utils/file";

export class VideoController {
  private readonly videoService: VideoService;

  constructor(videoService: VideoService) {
    this.videoService = videoService;
  }

  getAll = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = videoQuerySchema.parse(req.query);
      const { data, meta } = await this.videoService.getAllVideos(query);

      paginatedResponse({
        res,
        message: "Berhasil mengambil data video bank sampah",
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
      const video = await this.videoService.getVideoById(id);

      successResponse({
        res,
        message: "Berhasil mengambil detail video bank sampah",
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
      const data = createVideoSchema.parse(req.body);
      const video = await this.videoService.createVideo(data, req.file);

      successResponse({
        res,
        statusCode: 201,
        message: "Video bank sampah berhasil ditambahkan",
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
      const data = updateVideoSchema.parse(req.body);
      const video = await this.videoService.updateVideo(id, data, req.file);

      successResponse({
        res,
        message: "Video bank sampah berhasil diperbarui",
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
      await this.videoService.deleteVideo(id);

      successResponse({
        res,
        message: "Video bank sampah berhasil dihapus",
      });
    } catch (error) {
      next(error);
    }
  };
}

