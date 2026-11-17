import { BankSampahVideo, Prisma, PrismaClient } from "../../../generated/prisma";

export interface FindAllVideosParams {
  skip: number;
  take: number;
  search?: string;
  platform?: string;
  category?: string;
}

export class VideoRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll(params: FindAllVideosParams): Promise<{ data: BankSampahVideo[]; total: number }> {
    const { skip, take, search, platform, category } = params;

    const where: Prisma.BankSampahVideoWhereInput = {
      ...(platform && { platform }),
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
      this.prisma.bankSampahVideo.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      this.prisma.bankSampahVideo.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<BankSampahVideo | null> {
    return this.prisma.bankSampahVideo.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.BankSampahVideoCreateInput): Promise<BankSampahVideo> {
    return this.prisma.bankSampahVideo.create({
      data,
    });
  }

  async update(id: string, data: Prisma.BankSampahVideoUpdateInput): Promise<BankSampahVideo> {
    return this.prisma.bankSampahVideo.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<BankSampahVideo> {
    return this.prisma.bankSampahVideo.delete({
      where: { id },
    });
  }
}

