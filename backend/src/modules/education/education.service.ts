import { EducationContent } from "../../../generated/prisma";
import {
  buildPaginationMeta,
  parsePagination,
  PaginationMeta,
} from "../../utils/pagination";
import {
  cleanupFailedUpload,
  deleteStoredUploadFile,
} from "../../utils/file";
import { EducationRepository } from "./education.repository";
import {
  ContentStatus,
  CreateEducationInput,
  EducationQueryInput,
  UpdateEducationInput,
} from "./education.validation";
import { AppError } from "@/middlewares/error.middleware";

interface EducationListResult {
  data: EducationContent[];
  meta: PaginationMeta;
}

export class EducationService {
  private readonly educationRepository: EducationRepository;

  constructor(educationRepository: EducationRepository) {
    this.educationRepository = educationRepository;
  }

  private deleteThumbnailFile(thumbnailPath: string): void {
    deleteStoredUploadFile(thumbnailPath);
  }

  async getAllEducation(
    query: EducationQueryInput,
    isAdmin: boolean = false,
  ): Promise<EducationListResult> {
    const { skip, take, page, limit } = parsePagination(query);

    const { data, total } = await this.educationRepository.findAll({
      skip,
      take,
      status: query.status,
      search: query.search,
      isAdmin,
    });

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  private ensureEducationAccessible(
    education: EducationContent | null,
    isAdmin: boolean,
  ): EducationContent {
    if (
      !education ||
      (!isAdmin && education.status !== ContentStatus.PUBLISHED)
    ) {
      throw new AppError("Konten edukasi tidak ditemukan", 404);
    }

    return education;
  }

  async getEducationById(
    id: string,
    isAdmin: boolean = false,
  ): Promise<EducationContent> {
    const education: EducationContent | null =
      await this.educationRepository.findById(id);

    return this.ensureEducationAccessible(education, isAdmin);
  }

  async getEducationBySlug(
    slug: string,
    isAdmin: boolean = false,
  ): Promise<EducationContent> {
    const education: EducationContent | null =
      await this.educationRepository.findBySlug(slug);

    return this.ensureEducationAccessible(education, isAdmin);
  }

  async createEducation(
    data: CreateEducationInput,
    file?: Express.Multer.File,
  ): Promise<EducationContent> {
    const thumbnail: string | undefined = file
      ? `uploads/education/${file.filename}`
      : undefined;

    try {
      return await this.educationRepository.create(data, thumbnail);
    } catch (error) {
      cleanupFailedUpload(file, "education");
      throw error;
    }
  }

  async updateEducation(
    id: string,
    data: UpdateEducationInput,
    file?: Express.Multer.File,
  ): Promise<EducationContent> {
    try {
      const existingEducation: EducationContent =
        await this.getEducationById(id, true);

      const thumbnail: string | undefined = file
        ? `uploads/education/${file.filename}`
        : undefined;

      const updatedEducation = await this.educationRepository.update(
        id,
        data,
        thumbnail,
      );

      if (
        file &&
        existingEducation.thumbnail &&
        existingEducation.thumbnail !== thumbnail
      ) {
        this.deleteThumbnailFile(existingEducation.thumbnail);
      }

      return updatedEducation;
    } catch (error) {
      cleanupFailedUpload(file, "education");
      throw error;
    }
  }

  async deleteEducation(id: string): Promise<void> {
    const existingEducation: EducationContent =
      await this.getEducationById(id, true);

    await this.educationRepository.delete(id);

    if (existingEducation.thumbnail) {
      this.deleteThumbnailFile(existingEducation.thumbnail);
    }
  }
}
