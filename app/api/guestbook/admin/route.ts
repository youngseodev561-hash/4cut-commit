import { NextRequest, NextResponse } from 'next/server';
import { adminAllowed, allEntries, setHidden } from '@/lib/guestbook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!adminAllowed(req.headers.get('x-admin-key'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const entries = await allEntries(true);
  return NextResponse.json(entries.map(({ author: _a, ...e }) => e));
}

export async function POST(req: NextRequest) {
  if (!adminAllowed(req.headers.get('x-admin-key'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id, hidden } = (await req.json()) as { id?: string; hidden?: boolean };
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await setHidden(id, !!hidden);
  return NextResponse.json({ ok: true });
}
