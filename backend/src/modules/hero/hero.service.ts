import { HeroSlide } from "../../../generated/prisma";
import {
  buildPaginationMeta,
  parsePagination,
  PaginationMeta,
} from "../../utils/pagination";
import {
  cleanupFailedUpload,
  deleteStoredUploadFile,
} from "../../utils/file";
import { HeroRepository } from "./hero.repository";
import {
  CreateHeroInput,
  HeroQueryInput,
  UpdateHeroInput,
} from "./hero.validation";
import { AppError } from "@/middlewares/error.middleware";

interface HeroListResult {
  data: HeroSlide[];
  meta: PaginationMeta;
}

export class HeroService {
  private readonly heroRepository: HeroRepository;

  constructor(heroRepository: HeroRepository) {
    this.heroRepository = heroRepository;
  }

  private deleteImageFile(imagePath: string): void {
    deleteStoredUploadFile(imagePath);
  }

  async getAllSlides(query: HeroQueryInput): Promise<HeroListResult> {
    const { skip, take, page, limit } = parsePagination(query);
    const onlyActive = query.all !== "true";

    const { data, total } = await this.heroRepository.findAll({
      skip,
      take,
      onlyActive,
    });

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getSlideById(id: string): Promise<HeroSlide> {
    const slide: HeroSlide | null = await this.heroRepository.findById(id);

    if (!slide) {
      throw new AppError("Hero slide tidak ditemukan", 404);
    }

    return slide;
  }

  async createSlide(
    data: CreateHeroInput,
    file?: Express.Multer.File,
  ): Promise<HeroSlide> {
    if (!file) {
      throw new AppError("Gambar slide wajib diupload", 400);
    }

    const imageUrl: string = `uploads/hero/${file.filename}`;

    try {
      return await this.heroRepository.create({
        imageUrl,
        altText: data.altText,
        caption: data.caption,
        linkUrl: data.linkUrl,
        linkLabel: data.linkLabel,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      });
    } catch (error) {
      cleanupFailedUpload(file, "hero");
      throw error;
    }
  }

  async updateSlide(
    id: string,
    data: UpdateHeroInput,
    file?: Express.Multer.File,
  ): Promise<HeroSlide> {
    try {
      const existing: HeroSlide = await this.getSlideById(id);

      const imageUrl: string | undefined = file
        ? `uploads/hero/${file.filename}`
        : undefined;

      const updatedSlide = await this.heroRepository.update(id, {
        ...(imageUrl && { imageUrl }),
        ...(data.altText !== undefined && { altText: data.altText }),
        ...(data.caption !== undefined && { caption: data.caption }),
        ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl }),
        ...(data.linkLabel !== undefined && { linkLabel: data.linkLabel }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      });

      if (file && existing.imageUrl && existing.imageUrl !== imageUrl) {
        this.deleteImageFile(existing.imageUrl);
      }

      return updatedSlide;
    } catch (error) {
      cleanupFailedUpload(file, "hero");
      throw error;
    }
  }

  async toggleActive(id: string): Promise<HeroSlide> {
    const existing: HeroSlide = await this.getSlideById(id);
    return this.heroRepository.update(id, {
      isActive: !existing.isActive,
    });
  }

  async deleteSlide(id: string): Promise<void> {
    const existing: HeroSlide = await this.getSlideById(id);

    await this.heroRepository.delete(id);

    if (existing.imageUrl) {
      this.deleteImageFile(existing.imageUrl);
    }
  }
}

