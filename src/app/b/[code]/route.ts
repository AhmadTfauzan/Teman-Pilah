import { NextRequest, NextResponse } from 'next/server';
import { normalizeBatchCode } from '@/lib/batch-url';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  let decoded = code;
  try {
    decoded = decodeURIComponent(code);
  } catch {
    decoded = code;
  }

  const normalized = normalizeBatchCode(decoded);
  const targetUrl = new URL(`/eco-enzyme/batch/${encodeURIComponent(normalized)}`, request.url);

  // 308 Permanent Redirect
  return NextResponse.redirect(targetUrl, 308);
}
