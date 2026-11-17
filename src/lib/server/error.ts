import { ZodError } from "zod";
import { NextResponse } from "next/server";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
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
  const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server";
  return NextResponse.json({ status: "error", message }, { status: 500 });
}
