import { HeroSlide, PrismaClient } from "../../../generated/prisma";

interface FindAllOptions {
  skip?: number;
  take?: number;
  onlyActive?: boolean;
}

interface FindAllResult {
  data: HeroSlide[];
  total: number;
}

export class HeroRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll(options: FindAllOptions = {}): Promise<FindAllResult> {
    const { skip, take, onlyActive } = options;

    const where: Record<string, unknown> = {};
    if (onlyActive) {
      where.isActive = true;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.heroSlide.findMany({
        where,
        skip,
        take,
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "desc" },
        ],
      }),
      this.prisma.heroSlide.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<HeroSlide | null> {
    return this.prisma.heroSlide.findUnique({ where: { id } });
  }

  async create(data: {
    imageUrl: string;
    altText?: string | null;
    caption?: string | null;
    linkUrl?: string | null;
    linkLabel?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<HeroSlide> {
    return this.prisma.heroSlide.create({
      data: {
        imageUrl: data.imageUrl,
        altText: data.altText ?? null,
        caption: data.caption ?? null,
        linkUrl: data.linkUrl || null,
        linkLabel: data.linkLabel ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      imageUrl: string;
      altText?: string | null;
      caption?: string | null;
      linkUrl?: string | null;
      linkLabel?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    }>,
  ): Promise<HeroSlide> {
    const updateData = {
      ...data,
      ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl || null }),
    };
    return this.prisma.heroSlide.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<HeroSlide> {
    return this.prisma.heroSlide.delete({ where: { id } });
  }
}

