import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { parseEducationUpdatePayload } from "@/lib/server/form-payload";
import { apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError, AppError } from "@/lib/server/error";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.educationContent.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!item) throw new AppError("Konten edukasi tidak ditemukan", 404);
    if (item.status !== "PUBLISHED") {
      const user = await authenticateRequest(req);
      if (!user) {
        throw new AppError("Konten edukasi tidak ditemukan", 404);
      }
    }
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return apiError("Unauthorized", 401);

    const { id } = await params;
    const existing = await prisma.educationContent.findUnique({ where: { id } });
    if (!existing) throw new AppError("Konten edukasi tidak ditemukan", 404);

    const data = await parseEducationUpdatePayload(req);
    const updated = await prisma.educationContent.update({
      where: { id },
      data,
    });
    return apiSuccess(updated, "Konten edukasi berhasil diupdate");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new AppError("Slug konten edukasi sudah digunakan", 409));
    }
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return apiError("Unauthorized", 401);

    const { id } = await params;
    const existing = await prisma.educationContent.findUnique({ where: { id } });
    if (!existing) throw new AppError("Konten edukasi tidak ditemukan", 404);

    await prisma.educationContent.delete({ where: { id } });
    return apiSuccess(null, "Konten edukasi berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

