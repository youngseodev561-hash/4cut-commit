import type { Metadata, Viewport } from 'next';
import WriteApp from '@/components/guestbook/WriteApp';
import './write.css';

export const metadata: Metadata = {
  title: '방명록 쓰기 — 컴퓨터소프트웨어과 졸업작품전',
  description: '작품에 메시지를 쏘면 전시장 큰 화면으로 날아가요',
};

export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function Page() {
  return <WriteApp />;
}
