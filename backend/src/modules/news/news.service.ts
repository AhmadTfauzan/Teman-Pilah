import { News } from "../../../generated/prisma";
import {
  buildPaginationMeta,
  parsePagination,
  PaginationMeta,
} from "../../utils/pagination";
import {
  cleanupFailedUpload,
  deleteStoredUploadFile,
} from "../../utils/file";
import { NewsRepository } from "./news.repository";
import {
  CreateNewsInput,
  NewsQueryInput,
  NewsStatus,
  NewsVisibility,
  UpdateNewsInput,
} from "./news.validation";
import { AppError } from "@/middlewares/error.middleware";

interface NewsListResult {
  data: News[];
  meta: PaginationMeta;
}

export class NewsService {
  private readonly newsRepository: NewsRepository;

  constructor(newsRepository: NewsRepository) {
    this.newsRepository = newsRepository;
  }

  private deleteImageFile(imagePath: string): void {
    deleteStoredUploadFile(imagePath);
  }

  async getAllNews(
    query: NewsQueryInput,
    isAdmin: boolean = false,
  ): Promise<NewsListResult> {
    const { skip, take, page, limit } = parsePagination(query);

    const { data, total } = await this.newsRepository.findAll({
      skip,
      take,
      category: query.category,
      status: query.status,
      visibility: query.visibility,
      search: query.search,
      isAdmin,
    });

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  private ensureNewsAccessible(news: News | null, isAdmin: boolean): News {
    if (
      !news ||
      (!isAdmin &&
        (news.status !== NewsStatus.PUBLISHED ||
          news.visibility === NewsVisibility.PRIVATE))
    ) {
      throw new AppError("Berita tidak ditemukan", 404);
    }

    return news;
  }

  async getNewsById(id: string, isAdmin: boolean = false): Promise<News> {
    const news: News | null = await this.newsRepository.findById(id);
    return this.ensureNewsAccessible(news, isAdmin);
  }

  async getNewsBySlug(slug: string, isAdmin: boolean = false): Promise<News> {
    const news: News | null = await this.newsRepository.findBySlug(slug);
    return this.ensureNewsAccessible(news, isAdmin);
  }

  async createNews(
    data: CreateNewsInput,
    file?: Express.Multer.File,
  ): Promise<News> {
    const imageUrl: string | undefined = file
      ? `uploads/news/${file.filename}`
      : undefined;

    try {
      return await this.newsRepository.create(data, imageUrl);
    } catch (error) {
      cleanupFailedUpload(file, "news");
      throw error;
    }
  }

  async updateNews(
    id: string,
    data: UpdateNewsInput,
    file?: Express.Multer.File,
  ): Promise<News> {
    try {
      const existingNews: News = await this.getNewsById(id, true);

      const imageUrl: string | undefined = file
        ? `uploads/news/${file.filename}`
        : undefined;

      const updatedNews = await this.newsRepository.update(id, data, imageUrl);

      if (file && existingNews.imageUrl && existingNews.imageUrl !== imageUrl) {
        this.deleteImageFile(existingNews.imageUrl);
      }

      return updatedNews;
    } catch (error) {
      cleanupFailedUpload(file, "news");
      throw error;
    }
  }

  async deleteNews(id: string): Promise<void> {
    const existingNews: News = await this.getNewsById(id, true);

    await this.newsRepository.delete(id);

    if (existingNews.imageUrl) {
      this.deleteImageFile(existingNews.imageUrl);
    }
  }
}