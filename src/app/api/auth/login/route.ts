import { prisma } from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError("Email dan password wajib diisi", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Timing attack prevention
    const dummyHash = "$2b$12$dummyhashfortimingattackprevention123456789012";
    const passwordToCheck = user?.password ?? dummyHash;
    const isValid = await comparePassword(password, passwordToCheck);

    if (!user || !isValid) {
      return apiError("Email atau password salah", 401);
    }

    const token = signToken({ userId: user.id });
    const { password: _p, ...safeUser } = user;

    return apiSuccess({ token, user: safeUser }, "Login berhasil");
  } catch (error) {
    return handleApiError(error);
  }
}

