import { HeroSlide } from "../../../generated/prisma";
import fs from "fs";
import path from "path";
import {
  buildPaginationMeta,
  parsePagination,
  PaginationMeta,
} from "../../utils/pagination";
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
    if (!imagePath || imagePath.startsWith("http")) return;
    const fullPath: string = path.join(process.cwd(), imagePath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error("Failed to delete image file:", err);
      }
    }
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

    return this.heroRepository.create({
      imageUrl,
      altText: data.altText,
      caption: data.caption,
      linkUrl: data.linkUrl,
      linkLabel: data.linkLabel,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    });
  }

  async updateSlide(
    id: string,
    data: UpdateHeroInput,
    file?: Express.Multer.File,
  ): Promise<HeroSlide> {
    const existing: HeroSlide = await this.getSlideById(id);

    let imageUrl: string | undefined;

    if (file) {
      if (existing.imageUrl) {
        this.deleteImageFile(existing.imageUrl);
      }
      imageUrl = `uploads/hero/${file.filename}`;
    }

    return this.heroRepository.update(id, {
      ...(imageUrl && { imageUrl }),
      ...(data.altText !== undefined && { altText: data.altText }),
      ...(data.caption !== undefined && { caption: data.caption }),
      ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl }),
      ...(data.linkLabel !== undefined && { linkLabel: data.linkLabel }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    });
  }

  async toggleActive(id: string): Promise<HeroSlide> {
    const existing: HeroSlide = await this.getSlideById(id);
    return this.heroRepository.update(id, {
      isActive: !existing.isActive,
    });
  }

  async deleteSlide(id: string): Promise<void> {
    const existing: HeroSlide = await this.getSlideById(id);

    if (existing.imageUrl) {
      this.deleteImageFile(existing.imageUrl);
    }

    await this.heroRepository.delete(id);
  }
}

