'use client';

import { useEffect, useRef } from 'react';
import { ensureFonts, renderStrip, type StripOptions } from '@/lib/strip';

export function TopBar({ step, right }: { step?: number; right?: React.ReactNode }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-logo" aria-hidden="true" />
        4CUT.COMMIT
      </div>
      {right ??
        (step ? (
          <div className="steps" aria-label={`${step}단계 / 4단계`}>
            {[1, 2, 3, 4].map((n) => (
              <i key={n} className={n <= step ? 'on' : ''} />
            ))}
            <span>STEP 0{step} / 04</span>
          </div>
        ) : null)}
    </header>
  );
}

export const ArrowRight = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const ArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const Retry = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" />
  </svg>
);

/** 스트립 미리보기 캔버스 (최종 출력과 같은 렌더러 사용) */
export function StripCanvas({ options, className, style, label }: { options: StripOptions; className?: string; style?: React.CSSProperties; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    const draw = () => ref.current && renderStrip(ref.current, options);
    draw();
    ensureFonts(options.message).then(() => alive && draw());
    return () => {
      alive = false;
    };
  }, [options]);
  return <canvas ref={ref} className={className} style={style} role="img" aria-label={label ?? '네컷 미리보기'} />;
}
