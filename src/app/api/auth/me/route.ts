import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { AppError, handleApiError } from "@/lib/server/error";
import { apiSuccess, apiError } from "@/lib/server/response";

const updateProfileSchema = z.object({
  name: z
    .string({ error: "Nama harus berupa teks" })
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter")
    .optional(),
  email: z
    .string({ error: "Email harus berupa teks" })
    .trim()
    .toLowerCase()
    .email("Format email tidak valid")
    .optional(),
});

export async function GET(req: Request) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return apiError("Unauthorized", 401);
    }
    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new AppError("Payload JSON tidak valid", 400);
    }

    const parsed = updateProfileSchema.parse(body);

    if (parsed.email !== undefined && parsed.email !== user.email) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email: parsed.email,
          id: { not: user.id },
        },
        select: { id: true },
      });

      if (emailTaken) {
        return apiError("Email sudah digunakan", 409);
      }
    }

    const updateData: { name?: string; email?: string } = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.email !== undefined) updateData.email = parsed.email;

    if (Object.keys(updateData).length === 0) {
      return apiSuccess(user, "Profil berhasil diupdate");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess(updated, "Profil berhasil diupdate");
  } catch (error) {
    return handleApiError(error);
  }
}

