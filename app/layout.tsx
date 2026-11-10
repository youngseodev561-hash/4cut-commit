import type { Metadata, Viewport } from 'next';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/ibm-plex-sans-kr/400.css';
import '@fontsource/ibm-plex-sans-kr/500.css';
import '@fontsource/ibm-plex-sans-kr/700.css';
import '@fontsource/mochiy-pop-one/400.css';
import '@fontsource/playfair-display/600-italic.css';
import '@fontsource/gowun-batang/400.css';
import '@fontsource/gowun-batang/700.css';
import './globals.css';

export const metadata: Metadata = {
  title: '4CUT.COMMIT',
  description: '컴퓨터소프트웨어과 졸업작품전 네컷 사진',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
