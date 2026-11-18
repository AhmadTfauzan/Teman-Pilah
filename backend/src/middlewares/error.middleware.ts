import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | Error | ZodError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    const errorMessages =
      (err.issues ?? []).map((e) => e.message).join(", ") || "Validation error";
    res.status(400).json({
      status: "error",
      message: errorMessages,
    });
    return;
  }

  if (err?.name === "MulterError") {
    res.status(400).json({
      status: "error",
      message: `Upload error: ${err.message}`,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  const prismaErrorCode = (err as { code?: unknown })?.code;
  if (prismaErrorCode === "P2002") {
    res.status(409).json({
      status: "error",
      message: "Data duplikat: nilai tersebut sudah digunakan",
    });
    return;
  }

  if (prismaErrorCode === "P2003") {
    res.status(400).json({
      status: "error",
      message: "Referensi data terkait tidak valid atau tidak ditemukan",
    });
    return;
  }

  if (
    prismaErrorCode === "P2025" ||
    err?.message?.includes("Record to update not found") ||
    err?.message?.includes("Record to delete does not exist")
  ) {
    res.status(404).json({
      status: "error",
      message: "Data tidak ditemukan",
    });
    return;
  }

  console.error("Unexpected error:", err);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
