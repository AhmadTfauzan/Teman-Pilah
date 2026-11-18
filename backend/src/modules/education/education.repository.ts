import { AppError } from "@/middlewares/error.middleware";
import { EducationContent, Prisma, PrismaClient } from "../../../generated/prisma";
import {
  ContentStatus,
  CreateEducationInput,
  UpdateEducationInput,
} from "./education.validation";

interface FindAllOptions {
  skip: number;
  take: number;
  status?: ContentStatus;
  search?: string;
  isAdmin?: boolean;
}

interface FindAllResult {
  data: EducationContent[];
  total: number;
}

export class EducationRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll(options: FindAllOptions): Promise<FindAllResult> {
    const { skip, take, status, search, isAdmin = false } = options;

    const andConditions: Prisma.EducationContentWhereInput[] = [];

    if (!isAdmin) {
      andConditions.push({ status: ContentStatus.PUBLISHED });
    }

    if (status) {
      andConditions.push({ status });
    }

    if (search) {
      andConditions.push({
        title: { contains: search, mode: "insensitive" as const },
      });
    }

    const where: Prisma.EducationContentWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.educationContent.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.educationContent.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<EducationContent | null> {
    return this.prisma.educationContent.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<EducationContent | null> {
    return this.prisma.educationContent.findUnique({ where: { slug } });
  }

  async create(
    data: CreateEducationInput,
    thumbnail?: string,
  ): Promise<EducationContent> {
    const existingSlug = await this.prisma.educationContent.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      throw new AppError("Slug sudah digunakan, gunakan slug lain", 400);
    }

    return this.prisma.educationContent.create({
      data: {
        title: data.title,
        slug: data.slug,
        overview: data.overview,
        description: data.description,
        tags: data.tags ?? [],
        status: data.status ?? ContentStatus.DRAFT,
        publishDate: data.publishDate ?? null,
        thumbnail: thumbnail ?? null,
      },
    });
  }

  async update(
    id: string,
    data: UpdateEducationInput,
    thumbnail?: string,
  ): Promise<EducationContent> {
    if (data.slug !== undefined) {
      const existingSlug = await this.prisma.educationContent.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      });
      if (existingSlug) {
        throw new AppError("Slug sudah digunakan, gunakan slug lain", 409);
      }
    }

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.overview !== undefined) updateData.overview = data.overview;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.publishDate !== undefined) updateData.publishDate = data.publishDate;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

    return this.prisma.educationContent.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<EducationContent> {
    return this.prisma.educationContent.delete({ where: { id } });
  }
}
