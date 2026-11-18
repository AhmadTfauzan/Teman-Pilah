import { Gallery } from "../../../generated/prisma";
import {
  buildPaginationMeta,
  parsePagination,
  PaginationMeta,
} from "../../utils/pagination";
import {
  cleanupFailedUpload,
  deleteStoredUploadFile,
} from "../../utils/file";
import { GalleryRepository } from "./gallery.repository";
import {
  CreateGalleryInput,
  GalleryQueryInput,
  UpdateGalleryInput,
} from "./gallery.validation";
import { AppError } from "@/middlewares/error.middleware";

interface GalleryListResult {
  data: Gallery[];
  meta: PaginationMeta;
}

export class GalleryService {
  private readonly galleryRepository: GalleryRepository;

  constructor(galleryRepository: GalleryRepository) {
    this.galleryRepository = galleryRepository;
  }

  private deleteImageFile(imagePath: string): void {
    deleteStoredUploadFile(imagePath);
  }

  async getAllGallery(query: GalleryQueryInput): Promise<GalleryListResult> {
    const { skip, take, page, limit } = parsePagination(query);

    const { data, total } = await this.galleryRepository.findAll({
      skip,
      take,
      search: query.search,
    });

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getGalleryById(id: string): Promise<Gallery> {
    const gallery: Gallery | null = await this.galleryRepository.findById(id);

    if (!gallery) {
      throw new AppError("Gallery tidak ditemukan", 404);
    }

    return gallery;
  }

  async createGallery(
    data: CreateGalleryInput,
    file?: Express.Multer.File,
  ): Promise<Gallery> {
    if (!file) {
      throw new AppError("Gambar wajib diupload", 400);
    }

    const image: string = `uploads/gallery/${file.filename}`;

    try {
      return await this.galleryRepository.create({
        title: data.title,
        category: data.category,
        image,
        description: data.description,
      });
    } catch (error) {
      cleanupFailedUpload(file, "gallery");
      throw error;
    }
  }

  async updateGallery(
    id: string,
    data: UpdateGalleryInput,
    file?: Express.Multer.File,
  ): Promise<Gallery> {
    try {
      const existing: Gallery = await this.getGalleryById(id);

      const image: string | undefined = file
        ? `uploads/gallery/${file.filename}`
        : undefined;

      const updated = await this.galleryRepository.update(id, {
        title: data.title,
        category: data.category,
        image,
        description: data.description,
      });

      if (file && existing.image && existing.image !== image) {
        this.deleteImageFile(existing.image);
      }

      return updated;
    } catch (error) {
      cleanupFailedUpload(file, "gallery");
      throw error;
    }
  }

  async deleteGallery(id: string): Promise<void> {
    const existing: Gallery = await this.getGalleryById(id);

    await this.galleryRepository.delete(id);

    if (existing.image) {
      this.deleteImageFile(existing.image);
    }
  }
}
