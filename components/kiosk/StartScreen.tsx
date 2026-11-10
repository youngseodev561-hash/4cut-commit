'use client';

import { useMemo } from 'react';
import { StripCanvas, TopBar, ArrowRight } from './ui';
import type { StripOptions } from '@/lib/strip';

const demo = (frame: StripOptions['frame']): StripOptions => ({
  frame,
  photos: [null, null, null, null],
  filter: 'mono',
  stickers: [],
  message: frame === 'terminal' ? '오늘을 커밋하세요' : 'ずっ友だよ♡',
  showDate: false,
  showHash: false,
  hash: '',
  date: '',
});

export default function StartScreen({ onStart }: { onStart: () => void }) {
  const a = useMemo(() => demo('terminal'), []);
  const b = useMemo(() => demo('galPink'), []);
  return (
    <div className="kiosk" onClick={onStart}>
      <TopBar
        right={
          <div style={{ display: 'flex', gap: 32 }} className="muted">
            <span>컴퓨터소프트웨어과 졸업작품전</span>
            <span>v1.0.0</span>
          </div>
        }
      />
      <main className="start-main">
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div className="mono muted" style={{ fontSize: 22 }}>
            $ git commit -m{' '}
            <span className="cursor" style={{ display: 'inline-block', width: 12, height: 24, background: 'var(--ink)', verticalAlign: -4 }} />
          </div>
          <h1 className="start-title">
            오늘을
            <br />
            커밋하세요.
          </h1>
          <p style={{ margin: 0, fontSize: 22, lineHeight: 1.5, color: '#444' }}>네 컷의 사진으로 남기는, 우리의 졸업 버전 기록.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 12 }}>
            <button className="btn btn-primary" style={{ minHeight: 80, fontSize: 24 }} onClick={onStart}>
              시작하기 <ArrowRight />
            </button>
            <span className="mono muted" style={{ fontSize: 15 }}>[ 화면을 터치하세요 ]</span>
          </div>
        </section>
        <section aria-hidden="true" style={{ width: 440, height: '82%', position: 'relative', flex: 'none' }}>
          <StripCanvas options={a} style={{ position: 'absolute', left: 20, top: '6%', height: '88%', transform: 'rotate(-6deg)' }} />
          <StripCanvas options={b} style={{ position: 'absolute', left: 220, top: 0, height: '88%', transform: 'rotate(5deg)' }} />
        </section>
      </main>
      <footer className="start-foot">
        <div>01 프레임 선택</div>
        <div>02 촬영</div>
        <div>03 고르기 · 꾸미기</div>
        <div>04 출력 · 저장</div>
      </footer>
    </div>
  );
}
