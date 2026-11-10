/* 과 로고(뱀 · 모니터 속 톱니바퀴 · 둥근 "computer software" 글씨)에서 가져온 디자인 조각들 */

/** 톱니바퀴 경로 (로고 속 기어 모양) */
function gearPath(cx: number, cy: number, R: number, r: number, teeth: number) {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const seq: [number, number][] = [
      [a - step * 0.5, r],
      [a - step * 0.22, r],
      [a - step * 0.16, R],
      [a + step * 0.16, R],
      [a + step * 0.22, r],
    ];
    seq.forEach(([t, rad]) => pts.push(`${(cx + Math.cos(t) * rad).toFixed(2)},${(cy + Math.sin(t) * rad).toFixed(2)}`));
  }
  return `M${pts.join('L')}Z`;
}

export function Gear({ size = 24, teeth = 8, spin, fill, className, style }: { size?: number; teeth?: number; spin?: 'slow' | 'fast' | 'rev'; fill?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`gear${spin ? ` spin-${spin}` : ''}${className ? ` ${className}` : ''}`} style={style} aria-hidden="true">
      <path d={gearPath(50, 50, 46, 36, teeth)} fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={fill ? 0 : 6} strokeLinejoin="round" />
      <circle cx="50" cy="50" r="15" fill={fill ? 'var(--gear-hole, #fff)' : 'none'} stroke="currentColor" strokeWidth="6" />
    </svg>
  );
}

/** 로고 속 세 개의 톱니처럼 맞물려 도는 로딩 표시 */
export function GearLoader({ label, size = 64, className }: { label?: string; size?: number; className?: string }) {
  return (
    <div className={`gear-loader${className ? ` ${className}` : ''}`} role="status">
      <div className="gl-gears" style={{ width: size * 1.7, height: size * 1.25 }}>
        <Gear size={size * 0.62} spin="fast" style={{ left: 0, top: 0 }} />
        <Gear size={size * 0.62} spin="rev" style={{ left: size * 0.44, top: size * 0.5 }} />
        <Gear size={size * 0.7} spin="fast" style={{ left: size * 0.98, top: size * 0.14 }} />
      </div>
      {label && <span>{label}</span>}
    </div>
  );
}

/** 로고 + 둘레를 천천히 도는 글씨 (로고의 휘어진 "computer software" 느낌) */
export function LogoRing({ size = 150, text = 'COMPUTER SOFTWARE · GRADUATION EXHIBITION 2026 · ', white }: { size?: number; text?: string; white?: boolean }) {
  return (
    <div className="logo-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="ring-text" aria-hidden="true">
        <defs>
          <path id="ring-path" d="M100,100 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0" />
        </defs>
        <text fontSize="13" fill="currentColor">
          <textPath href="#ring-path" textLength={538} lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={white ? '/brand/logo-white.png' : '/brand/logo-black.png'} alt="컴퓨터소프트웨어과 로고" />
    </div>
  );
}

/** 화면 뒤를 지나가는 뱀 곡선 (로고의 S자 몸통) */
export function SnakeLine({ className }: { className?: string }) {
  return (
    <svg className={`snake-line${className ? ` ${className}` : ''}`} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path
        d="M-80,640 C120,820 380,700 420,520 C470,300 220,240 300,90 C360,-20 560,-10 640,120 C740,290 560,430 700,560 C820,670 1000,610 1060,470 C1110,350 1060,230 1180,150 C1240,110 1300,120 1320,130"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}
