import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export interface TokenPayload {
  userId: string;
}

const globalForAuth = globalThis as typeof globalThis & {
  __tpDevJwtSecret?: string;
  __tpWarnedJwtFallback?: boolean;
};

/**
 * Lazily resolves the JWT signing secret at runtime so Next.js build-time module
 * evaluation stays safe while production fails closed when JWT_SECRET is missing.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is required");
  }

  if (!globalForAuth.__tpDevJwtSecret) {
    globalForAuth.__tpDevJwtSecret = crypto.randomBytes(32).toString("hex");
  }
  if (!globalForAuth.__tpWarnedJwtFallback) {
    globalForAuth.__tpWarnedJwtFallback = true;
    console.warn(
      "[auth] WARNING: JWT_SECRET environment variable is not set. Using an ephemeral development-only fallback secret."
    );
  }

  return globalForAuth.__tpDevJwtSecret;
}

export function signToken(payload: TokenPayload, expiresIn: jwt.SignOptions["expiresIn"] = "7d"): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function verifyToken(token: string): TokenPayload | null {
  const secret = getJwtSecret();
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return null;
  }
  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.role !== "ADMIN") return null;
  const { password: _p, ...safeUser } = user;
  void _p;
  return safeUser;
}
