import { NextRequest, NextResponse } from 'next/server';
import { ASSET_TYPES, saveAsset } from '@/lib/storage';

export const runtime = 'nodejs';

const MAX_BYTES = 4 * 1024 * 1024; // Vercel 함수 요청 한도(4.5MB) 안쪽

// 사진에 PNG · 움짤(GIF) · 영상(MP4/WebM) 붙이기
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: { data?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const m = /^data:([a-z]+\/[a-z0-9.+-]+)(?:;[^;,]*)*;base64,([A-Za-z0-9+/=]+)$/.exec(body.data ?? '');
  if (!m || !ASSET_TYPES[m[1]]) return NextResponse.json({ error: 'png, gif, mp4, webm only' }, { status: 400 });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_BYTES) return NextResponse.json({ error: 'too large' }, { status: 413 });
  try {
    const meta = await saveAsset(id, buf, m[1]);
    if (!meta) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ ok: true, kind: ASSET_TYPES[m[1]].kind });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'storage failed' }, { status: 500 });
  }
}
