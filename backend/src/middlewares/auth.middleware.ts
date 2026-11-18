import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/utils/jwt";

export interface AuthRequest extends Request {
  userId?: string;
}

const verifyAdminToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      userId?: unknown;
      role?: unknown;
    };

    if (
      !decoded ||
      typeof decoded.userId !== "string" ||
      decoded.userId.length === 0
    ) {
      return null;
    }

    if (decoded.role !== undefined && decoded.role !== "ADMIN") {
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
};

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const userId = verifyAdminToken(authHeader);
  if (!userId) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  req.userId = userId;
  next();
};

/**
 * Middleware autentikasi opsional untuk endpoint publik yang mengembalikan
 * data tambahan atau konten non-publik ketika pemanggil memiliki JWT admin valid.
 */
export const optionalAuthenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const userId = verifyAdminToken(req.headers.authorization);
  if (userId) {
    req.userId = userId;
  }
  next();
};

/**
 * Memeriksa apakah request berasal dari admin terautentikasi (baik melalui
 * middleware `authenticate`/`optionalAuthenticate` maupun header `Authorization` langsung).
 */
export const isAuthenticatedAdminRequest = (req: AuthRequest): boolean => {
  if (typeof req.userId === "string" && req.userId.length > 0) {
    return true;
  }
  return verifyAdminToken(req.headers.authorization) !== null;
};
