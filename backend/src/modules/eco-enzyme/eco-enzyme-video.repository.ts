import { EcoEnzymeVideo, Prisma, PrismaClient } from "../../../generated/prisma";

export interface FindAllEcoEnzymeVideosParams {
  skip: number;
  take: number;
  search?: string;
  platform?: string;
  category?: string;
}

export class EcoEnzymeVideoRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async countAll(): Promise<number> {
    return this.prisma.ecoEnzymeVideo.count();
  }

  async findAll(
    params: FindAllEcoEnzymeVideosParams
  ): Promise<{ data: EcoEnzymeVideo[]; total: number }> {
    const { skip, take, search, platform, category } = params;

    const where: Prisma.EcoEnzymeVideoWhereInput = {
      ...(platform && platform !== "ALL" && { platform }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.ecoEnzymeVideo.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      this.prisma.ecoEnzymeVideo.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<EcoEnzymeVideo | null> {
    return this.prisma.ecoEnzymeVideo.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.EcoEnzymeVideoCreateInput): Promise<EcoEnzymeVideo> {
    return this.prisma.ecoEnzymeVideo.create({
      data,
    });
  }

  async createMany(data: Prisma.EcoEnzymeVideoCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.ecoEnzymeVideo.createMany({
      data,
    });
  }

  async update(id: string, data: Prisma.EcoEnzymeVideoUpdateInput): Promise<EcoEnzymeVideo> {
    return this.prisma.ecoEnzymeVideo.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<EcoEnzymeVideo> {
    return this.prisma.ecoEnzymeVideo.delete({
      where: { id },
    });
  }
}

