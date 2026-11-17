import { NextFunction, Response } from "express";
import { paginatedResponse, successResponse } from "../../utils/response";
import { HeroService } from "./hero.service";
import {
  createHeroSchema,
  heroQuerySchema,
  updateHeroSchema,
} from "./hero.validation";
import { AuthRequest } from "@/middlewares/auth.middleware";

export class HeroController {
  private readonly heroService: HeroService;

  constructor(heroService: HeroService) {
    this.heroService = heroService;
  }

  getAll = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = heroQuerySchema.parse(req.query);
      const { data, meta } = await this.heroService.getAllSlides(query);

      paginatedResponse({
        res,
        message: "Berhasil mengambil data hero slides",
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
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const slide = await this.heroService.getSlideById(id);

      successResponse({
        res,
        message: "Berhasil mengambil detail hero slide",
        data: slide,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = createHeroSchema.parse(req.body);
      const slide = await this.heroService.createSlide(data, req.file);

      successResponse({
        res,
        statusCode: 201,
        message: "Hero slide berhasil ditambahkan",
        data: slide,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const data = updateHeroSchema.parse(req.body);
      const slide = await this.heroService.updateSlide(id, data, req.file);

      successResponse({
        res,
        message: "Hero slide berhasil diupdate",
        data: slide,
      });
    } catch (error) {
      next(error);
    }
  };

  toggleActive = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const slide = await this.heroService.toggleActive(id);

      successResponse({
        res,
        message: `Status slide berhasil diubah menjadi ${slide.isActive ? "Aktif" : "Nonaktif"}`,
        data: slide,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      await this.heroService.deleteSlide(id);

      successResponse({
        res,
        message: "Hero slide berhasil dihapus",
      });
    } catch (error) {
      next(error);
    }
  };
}

