import { NextRequest } from 'next/server';
import { readLocalAsset, readLocalPhoto } from '@/lib/storage';

export const runtime = 'nodejs';

// 로컬 모드에서만 쓰임 (배포에선 Vercel Blob 주소를 바로 씀)
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const asset = req.nextUrl.searchParams.get('asset');
  const f = asset ? await readLocalAsset(id, asset) : await readLocalPhoto(id).then((p) => (p ? { ...p, ext: p.type === 'image/png' ? 'png' : 'jpg' } : null));
  if (!f) return new Response('not found', { status: 404 });
  return new Response(new Uint8Array(f.data), {
    headers: {
      'Content-Type': f.type,
      'Cache-Control': 'private, max-age=3600',
      ...(req.nextUrl.searchParams.has('download') ? { 'Content-Disposition': `attachment; filename="4cut-${id}${asset && asset !== 'png' ? `-${asset}` : ''}.${f.ext}"` } : {}),
    },
  });
}
