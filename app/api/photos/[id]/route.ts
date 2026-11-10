import { NextRequest, NextResponse } from 'next/server';
import { setGallery } from '@/lib/storage';

export const runtime = 'nodejs';

// 갤러리 월 노출 동의 여부 변경
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { gallery?: boolean };
  const meta = await setGallery(id, !!body.gallery);
  if (!meta) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(meta);
}
