import type { Metadata } from 'next';
import GalleryWall from '@/components/gallery/GalleryWall';
import './gallery.css';

export const metadata: Metadata = { title: '4CUT.COMMIT — Gallery' };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <GalleryWall demo={sp.demo === '1'} />;
}
