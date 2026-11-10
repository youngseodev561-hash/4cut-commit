import { NextRequest, NextResponse } from 'next/server';
import { addEntry, GuestbookError, snapshot } from '@/lib/guestbook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 큰 화면이 2초마다 가져감 → CDN에 1초 캐시해서 DB 호출을 줄임
export async function GET() {
  const data = await snapshot();
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=2' } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await addEntry(body);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof GuestbookError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: '전송에 실패했어요. 다시 시도해주세요' }, { status: 500 });
  }
}
