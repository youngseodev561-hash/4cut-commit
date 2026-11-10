import type { Metadata, Viewport } from 'next';
import Wall from '@/components/guestbook/Wall';
import './wall.css';

export const metadata: Metadata = {
  title: 'GUESTBOOK — 컴퓨터소프트웨어과 졸업작품전',
  description: '졸업작품전 방명록 큰 화면',
};

export const viewport: Viewport = { themeColor: '#e7dfcb' };

// /guestbook          실제 데이터
// /guestbook?demo=1   가짜 메시지가 계속 날아오는 데모
// ?mode=globe         지구본 모드로 시작,  ?cycle=0  자동 전환 끄기
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const demo = one(q.demo) !== undefined && one(q.demo) !== '0';
  const mode = one(q.mode) === 'globe' ? 'globe' : 'table';
  const cycle = one(q.cycle) !== '0';
  return <Wall demo={demo} initialMode={mode} cycle={cycle} />;
}
