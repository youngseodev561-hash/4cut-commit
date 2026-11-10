import { NextRequest, NextResponse } from 'next/server';
import { savePhoto } from '@/lib/storage';

export const runtime = 'nodejs';

const MAX_BYTES = 4 * 1024 * 1024; // Vercel 함수 요청 한도(4.5MB) 안쪽

export async function POST(req: NextRequest) {
  let body: { image?: string; gallery?: boolean; frame?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const m = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(body.image ?? '');
  if (!m) return NextResponse.json({ error: 'image must be a PNG/JPEG data URL' }, { status: 400 });
  const img = Buffer.from(m[2], 'base64');
  if (img.length > MAX_BYTES) return NextResponse.json({ error: 'too large' }, { status: 413 });

  try {
    const meta = await savePhoto(img, m[1] as 'image/png' | 'image/jpeg', { gallery: !!body.gallery, frame: String(body.frame ?? '').slice(0, 20) });
    // 휴대폰이 접속할 주소. 노트북에서 localhost로 열었다면 PUBLIC_URL을 설정할 것.
    const base = (process.env.PUBLIC_URL ?? req.nextUrl.origin).replace(/\/$/, '');
    return NextResponse.json({ id: meta.id, url: `${base}/p/${meta.id}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'storage failed' }, { status: 500 });
  }
}
