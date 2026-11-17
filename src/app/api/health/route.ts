import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Teman Pilah Fullstack API is running on Next.js & Neon Cloud",
    timestamp: new Date().toISOString(),
  });
}
