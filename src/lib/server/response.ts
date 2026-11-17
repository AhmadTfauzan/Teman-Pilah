import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, message: string = "Berhasil", status: number = 200) {
  return NextResponse.json({ status: "success", message, data }, { status });
}

export function apiPaginated<T>(data: T[], meta: unknown, message: string = "Berhasil", status: number = 200) {
  return NextResponse.json({ status: "success", message, data, meta }, { status });
}

export function apiError(message: string = "Terjadi kesalahan", status: number = 500) {
  return NextResponse.json({ status: "error", message }, { status });
}

