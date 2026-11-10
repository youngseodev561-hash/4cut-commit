import { NextResponse } from 'next/server';
import { listGallery } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 전시장 갤러리 월용: 노출에 동의한 사진 목록 (최신순)
export async function GET() {
  const items = await listGallery();
  return NextResponse.json(items.map((m) => ({ id: m.id, createdAt: m.createdAt, src: m.url })));
}
