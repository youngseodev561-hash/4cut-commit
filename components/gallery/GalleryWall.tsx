'use client';

import { useEffect, useRef, useState } from 'react';
import { FRAMES, ensureFonts, renderStrip, todayLabel, type FrameId } from '@/lib/strip';
import { ding } from '@/lib/sfx';

interface Item { id: string; createdAt: string; src: string }

const POLL_MS = 5000;
const SPOT_MS = 7000;
const WORD = '4CUT.COMMIT  GALLERY';

/** 리허설용 가짜 네컷 */
function demoStrip(frame: FrameId, n: number): string {
  const c = document.createElement('canvas');
  const photos = [0, 1, 2, 3].map((k) => {
    const p = document.createElement('canvas');
    p.width = 600;
    p.height = 400;
    const x = p.getContext('2d')!;
    const g = x.createLinearGradient(0, 0, 600, 400);
    const v = 150 + ((n * 37 + k * 23) % 80);
    g.addColorStop(0, `rgb(${v},${v},${v})`);
    g.addColorStop(1, `rgb(${v - 60},${v - 60},${v - 60})`);
    x.fillStyle = g;
    x.fillRect(0, 0, 600, 400);
    x.fillStyle = 'rgba(10,10,10,0.75)';
    x.beginPath();
    x.arc(300, 170, 70, 0, Math.PI * 2);
    x.fill();
    x.fillRect(200, 260, 200, 140);
    return p;
  });
  renderStrip(c, { frame, photos, filter: 'original', stickers: [], message: ['우리의 마지막 학기', '最強4人組', '우리의 크리스마스', '안녕 2026, 고마웠어'][n % 4], showDate: true, showHash: true, hash: (0xa3f9c21 + n * 977).toString(16).slice(0, 7), date: todayLabel() });
  return c.toDataURL('image/jpeg', 0.85);
}

export default function GalleryWall({ demo = false }: { demo?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [spot, setSpot] = useState<Item | null>(null);
  const [clock, setClock] = useState('');
  const seen = useRef<Set<string> | null>(null);
  const queue = useRef<Item[]>([]);

  // 시계
  useEffect(() => {
    const f = () => setClock(new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }).format(new Date()));
    f();
    const t = setInterval(f, 15000);
    return () => clearInterval(t);
  }, []);

  // 데이터
  useEffect(() => {
    let alive = true;
    const accept = (list: Item[]) => {
      if (!seen.current) {
        seen.current = new Set(list.map((i) => i.id));
        setItems(list);
        return;
      }
      const fresh = list.filter((i) => !seen.current!.has(i.id));
      fresh.forEach((i) => seen.current!.add(i.id));
      if (fresh.length) {
        queue.current.push(...fresh.reverse());
        setItems(list);
      }
    };

    if (demo) {
      let n = 0;
      ensureFonts('最強4人組 우리의 크리스마스').then(() => {
        if (!alive) return;
        const base = FRAMES.map((f, i) => ({ id: `d${i}`, createdAt: new Date().toISOString(), src: demoStrip(f.id, i) }));
        accept(base);
        n = base.length;
      });
      const t = setInterval(() => {
        const f = FRAMES[n % FRAMES.length];
        const item = { id: `d${n}`, createdAt: new Date().toISOString(), src: demoStrip(f.id, n) };
        n++;
        seen.current?.add(item.id);
        queue.current.push(item);
        setItems((prev) => [item, ...prev].slice(0, 40));
      }, 12000);
      return () => {
        alive = false;
        clearInterval(t);
      };
    }

    async function poll() {
      try {
        const r = await fetch('/api/gallery', { cache: 'no-store' });
        if (r.ok && alive) accept((await r.json()) as Item[]);
      } catch {
        /* 다음 폴링에서 재시도 */
      }
      if (alive) setTimeout(poll, POLL_MS);
    }
    poll();
    return () => {
      alive = false;
    };
  }, [demo]);

  // 새 사진 스포트라이트
  useEffect(() => {
    const t = setInterval(() => {
      if (spot || !queue.current.length) return;
      const next = queue.current.shift()!;
      setSpot(next);
      try {
        ding(0.2);
      } catch {
        /* 사운드는 선택 */
      }
      setTimeout(() => setSpot(null), SPOT_MS);
    }, 500);
    return () => clearInterval(t);
  }, [spot]);

  // 흐르는 줄: 화면을 채울 만큼 반복
  const row = items.length ? Array.from({ length: Math.max(2, Math.ceil(16 / items.length)) * 2 }, () => items).flat() : [];
  const duration = Math.max(40, items.length * 7);

  return (
    <main className={`gl${spot ? ' has-spot' : ''}`}>
      <header className="gl-top">
        <span className="gl-small">Live · {clock}</span>
        <h1 className="gl-mark" aria-label="4CUT.COMMIT 갤러리">
          {[...WORD].map((ch, i) => (
            <span key={i} aria-hidden style={{ '--i': i } as React.CSSProperties}>{ch === ' ' ? ' ' : ch}</span>
          ))}
        </h1>
        <span className="gl-small is-right">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-black.png" alt="" className="gl-logo" />
          컴퓨터소프트웨어과 졸업작품전
        </span>
      </header>

      {items.length ? (
        <div className="gl-track" aria-label="오늘 찍힌 네컷 사진들">
          <div className="gl-row" style={{ animationDuration: `${duration}s` }}>
            {row.map((it, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={`${it.id}-${i}`} src={it.src} alt={i < items.length ? '네컷 사진' : ''} aria-hidden={i >= items.length} className="gl-strip" style={{ '--r': `${((i * 37) % 7) - 3}deg` } as React.CSSProperties} loading="lazy" />
            ))}
          </div>
        </div>
      ) : (
        <p className="gl-empty">
          아직 걸린 사진이 없어요.
          <br />
          부스에서 찍고 <b>갤러리에 띄우기</b>를 눌러주세요.
        </p>
      )}

      <div className={`gl-spot${spot ? ' on' : ''}`} aria-live="polite">
        {spot && (
          <figure key={spot.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spot.src} alt="방금 찍은 네컷" />
            <figcaption>
              <span className="gl-small">New · just committed</span>
              <b>방금 찍은 네컷</b>
            </figcaption>
          </figure>
        )}
      </div>

      <footer className="gl-bottom">
        <span className="gl-small">{todayLabel()}</span>
        <span className="gl-small">오늘 걸린 네컷 {items.length}장</span>
        <span className="gl-small is-right">부스에서 찍고 · 갤러리에 띄우기</span>
      </footer>
    </main>
  );
}
