import { prisma } from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

// Valid 60-char bcrypt hash so timing-attack mitigation always executes full bcrypt comparison
const DUMMY_BCRYPT_HASH =
  "$2b$12$I.clkwmTfJVudApmpH.X2eAKJgy08lSZTz/8HU1esAj4aden3L.n2";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return apiError("Payload JSON tidak valid", 400);
    }

    const { email, password } = body as Record<string, unknown>;

    if (typeof email !== "string" || typeof password !== "string") {
      return apiError("Email dan password harus berupa teks", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !password) {
      return apiError("Email dan password wajib diisi", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const passwordToCheck = user?.password ?? DUMMY_BCRYPT_HASH;
    const isValid = await comparePassword(password, passwordToCheck);

    if (!user || !isValid) {
      return apiError("Email atau password salah", 401);
    }

    const token = signToken({ userId: user.id });
    const { password: _p, ...safeUser } = user;
    void _p;

    return apiSuccess({ token, user: safeUser }, "Login berhasil");
  } catch (error) {
    return handleApiError(error);
  }
}

