import { NextRequest, NextResponse } from 'next/server';
import { normalizeBatchCode } from '@/lib/batch-url';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const normalized = normalizeBatchCode(code);
  const targetUrl = new URL(`/eco-enzyme/batch/${normalized}`, request.url);

  // 308 Permanent Redirect
  return NextResponse.redirect(targetUrl, 308);
}
