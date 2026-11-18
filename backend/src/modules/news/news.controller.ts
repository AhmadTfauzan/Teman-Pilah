import { NextFunction, Response } from "express";
import { paginatedResponse, successResponse } from "../../utils/response";
import { NewsService } from "./news.service";
import {
  createNewsSchema,
  newsQuerySchema,
  updateNewsSchema,
} from "./news.validation";
import {
  AuthRequest,
  isAuthenticatedAdminRequest,
} from "@/middlewares/auth.middleware";
import { deleteUploadedFile } from "../../utils/file";

export class NewsController {
  private readonly newsService: NewsService;

  constructor(newsService: NewsService) {
    this.newsService = newsService;
  }

  getAll = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const isAdmin = isAuthenticatedAdminRequest(req);
      const query = newsQuerySchema.parse(req.query);
      const { data, meta } = await this.newsService.getAllNews(query, isAdmin);

      paginatedResponse({
        res,
        message: "Berhasil mengambil data berita",
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
      const isAdmin = isAuthenticatedAdminRequest(req);
      const id = req.params["id"] as string;
      const news = await this.newsService.getNewsById(id, isAdmin);

      successResponse({
        res,
        message: "Berhasil mengambil detail berita",
        data: news,
      });
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const isAdmin = isAuthenticatedAdminRequest(req);
      const slug = req.params["slug"] as string;
      const news = await this.newsService.getNewsBySlug(slug, isAdmin);

      successResponse({
        res,
        message: "Berhasil mengambil detail berita",
        data: news,
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
      const data = createNewsSchema.parse(req.body);
      const news = await this.newsService.createNews(data, req.file);

      successResponse({
        res,
        statusCode: 201,
        message: "Berita berhasil ditambahkan",
        data: news,
      });
    } catch (error) {
      deleteUploadedFile(req.file);
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
      const data = updateNewsSchema.parse(req.body);
      const news = await this.newsService.updateNews(id, data, req.file);

      successResponse({
        res,
        message: "Berita berhasil diupdate",
        data: news,
      });
    } catch (error) {
      deleteUploadedFile(req.file);
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
      await this.newsService.deleteNews(id);

      successResponse({
        res,
        message: "Berita berhasil dihapus",
      });
    } catch (error) {
      next(error);
    }
  };
}
