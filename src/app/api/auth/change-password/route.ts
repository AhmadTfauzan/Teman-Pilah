import { prisma } from "@/lib/prisma";
import { authenticateRequest, comparePassword, hashPassword } from "@/lib/server/auth";
import { AppError, handleApiError } from "@/lib/server/error";
import { apiError, apiSuccess } from "@/lib/server/response";

async function handleChangePassword(req: Request) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new AppError("Payload JSON tidak valid", 400);
    }

    const { currentPassword, newPassword, confirmPassword } = body as Record<string, unknown>;

    if (typeof currentPassword !== "string" || !currentPassword) {
      throw new AppError("Password saat ini wajib diisi", 400);
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      throw new AppError("Password baru minimal 6 karakter", 400);
    }
    if (typeof confirmPassword !== "string" || !confirmPassword) {
      throw new AppError("Konfirmasi password wajib diisi", 400);
    }
    if (newPassword !== confirmPassword) {
      throw new AppError("Konfirmasi password tidak cocok", 400);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, password: true },
    });
    if (!dbUser) {
      throw new AppError("User tidak ditemukan", 404);
    }

    const isCurrentValid = await comparePassword(currentPassword, dbUser.password);
    if (!isCurrentValid) {
      return apiError("Password saat ini salah", 401);
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return apiSuccess(null, "Password berhasil diubah");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  return handleChangePassword(req);
}

export async function POST(req: Request) {
  return handleChangePassword(req);
}
