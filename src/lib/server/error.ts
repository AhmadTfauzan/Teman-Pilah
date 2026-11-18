import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { NextResponse } from "next/server";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2025: { status: 404, message: "Data tidak ditemukan" },
  P2002: { status: 409, message: "Data sudah terdaftar / duplikat" },
  P2003: { status: 400, message: "Referensi data tidak valid atau masih terhubung" },
};

/**
 * Decodes a URI component safely, throwing a 400 AppError on malformed percent-encoding.
 */
export function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new AppError("Format parameter kode/ID tidak valid", 400);
  }
}

export function handleApiError(err: unknown) {
  console.error("API Error:", err);
  if (err instanceof AppError) {
    return NextResponse.json({ status: "error", message: err.message }, { status: err.statusCode });
  }
  if (err instanceof ZodError) {
    const message = err.issues?.map((e) => e.message).join(", ") || "Validation error";
    return NextResponse.json({ status: "error", message }, { status: 400 });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_ERROR_MAP[err.code];
    if (mapped) {
      return NextResponse.json({ status: "error", message: mapped.message }, { status: mapped.status });
    }
  }
  if (err instanceof SyntaxError) {
    return NextResponse.json({ status: "error", message: "Format JSON tidak valid" }, { status: 400 });
  }
  if (err instanceof URIError) {
    return NextResponse.json({ status: "error", message: "Format parameter kode/ID tidak valid" }, { status: 400 });
  }
  const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server";
  return NextResponse.json({ status: "error", message }, { status: 500 });
}

