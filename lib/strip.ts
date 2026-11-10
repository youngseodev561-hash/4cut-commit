// 네컷 스트립 렌더러 — 미리보기와 최종 출력(인쇄/업로드)이 같은 코드로 그려진다.
// 출력 해상도: 2x6 inch @300dpi = 600 x 1800 px

export const STRIP_W = 600;
export const STRIP_H = 1800;

export type ConceptId = 'cs' | 'gyaru' | 'cute' | 'xmas' | 'last' | 'basic';
export type FrameId =
  | 'terminal' | 'ide' | 'git' | 'binary'
  | 'galPink' | 'galBlack'
  | 'xmasRed' | 'xmasSnow'
  | 'bye2026' | 'receipt'
  | 'mallang' | 'bugBuddy' | 'byteBuddies' | 'pixelParty'
  | 'classicWhite' | 'classicBlack';
export type FilterId = 'original' | 'mono' | 'contrast' | 'soft' | 'invert';

export interface Sticker {
  id: string;
  text: string;
  x: number; // 스트립 좌표계 중심 x (0~600)
  y: number; // 중심 y (0~1800)
  rot: number; // degree
  dark: boolean;
  tone?: string; // 배경색 (있으면 dark 무시, 글자는 흰색)
  scale?: number; // 도장은 크게
  bare?: boolean; // 배경 없이 글자만 (도장)
}

export interface Stroke {
  color: string;
  width: number;
  points: number[]; // [x0, y0, x1, y1, ...] 스트립 좌표
}

export interface StripOptions {
  frame: FrameId;
  photos: (CanvasImageSource | null)[];
  filter: FilterId;
  stickers: Sticker[];
  doodles?: Stroke[];
  message: string;
  showDate: boolean;
  showHash: boolean;
  hash: string;
  date: string;
}

export const CONCEPTS: { id: ConceptId; name: string; sub: string; frames: FrameId[]; defaultFilter: FilterId; defaultMessage: string }[] = [
  { id: 'cs', name: '컴소과', sub: 'DEV MODE', frames: ['terminal', 'ide', 'git', 'binary'], defaultFilter: 'mono', defaultMessage: '우리의 마지막 학기' },
  { id: 'gyaru', name: '일본 갸루', sub: 'ギャル', frames: ['galPink', 'galBlack'], defaultFilter: 'original', defaultMessage: '最強4人組' },
  { id: 'cute', name: '말랑 귀염', sub: 'TINY & CUTE', frames: ['byteBuddies', 'pixelParty', 'mallang', 'bugBuddy'], defaultFilter: 'soft', defaultMessage: '오늘도 말랑하게' },
  { id: 'xmas', name: '크리스마스', sub: 'XMAS', frames: ['xmasRed', 'xmasSnow'], defaultFilter: 'original', defaultMessage: '우리의 크리스마스' },
  { id: 'last', name: '2026 LAST', sub: 'BYE 2026', frames: ['bye2026', 'receipt'], defaultFilter: 'mono', defaultMessage: '안녕 2026, 고마웠어' },
  { id: 'basic', name: '기본', sub: 'CLASSIC', frames: ['classicWhite', 'classicBlack'], defaultFilter: 'original', defaultMessage: '우리의 마지막 학기' },
];

export const FRAMES: { id: FrameId; concept: ConceptId; name: string; desc: string }[] = [
  { id: 'terminal', concept: 'cs', name: 'TERMINAL', desc: '검은 화면 위 흰 프롬프트' },
  { id: 'ide', concept: 'cs', name: 'IDE', desc: '에디터 창처럼 깔끔하게' },
  { id: 'git', concept: 'cs', name: 'GIT LOG', desc: '컷마다 하나의 커밋' },
  { id: 'binary', concept: 'cs', name: 'BINARY', desc: '0과 1로 쓴 졸업 축하' },
  { id: 'galPink', concept: 'gyaru', name: 'GAL PINK', desc: '핫핑크 프리쿠라' },
  { id: 'galBlack', concept: 'gyaru', name: 'GAL BLACK', desc: '블랙 + 핑크 반짝이' },
  { id: 'byteBuddies', concept: 'cute', name: 'BYTE BUDDIES', desc: '컴퓨터 친구들이 다 같이 축하' },
  { id: 'pixelParty', concept: 'cute', name: 'PIXEL PARTY', desc: '8비트 게임 · LEVEL UP 졸업' },
  { id: 'mallang', concept: 'cute', name: 'MALLANG', desc: '파스텔 구름 · 별 낙서' },
  { id: 'bugBuddy', concept: 'cute', name: 'BUG BUDDY', desc: '꼬마 버그 "버그찌"가 빼꼼' },
  { id: 'xmasRed', concept: 'xmas', name: 'XMAS RED', desc: '눈 내리는 레드' },
  { id: 'xmasSnow', concept: 'xmas', name: 'XMAS SNOW', desc: '하얀 눈송이' },
  { id: 'bye2026', concept: 'last', name: 'BYE 2026', desc: '2027로 넘어가기 전 마지막' },
  { id: 'receipt', concept: 'last', name: 'RECEIPT', desc: '우리의 2026 영수증' },
  { id: 'classicWhite', concept: 'basic', name: 'CLASSIC WHITE', desc: '심플 화이트' },
  { id: 'classicBlack', concept: 'basic', name: 'CLASSIC BLACK', desc: '심플 블랙' },
];

export const conceptOf = (f: FrameId) => FRAMES.find((x) => x.id === f)?.concept ?? 'cs';

export const FILTERS: { id: FilterId; name: string; css: string }[] = [
  { id: 'original', name: 'ORIGINAL', css: 'none' },
  { id: 'mono', name: 'MONO', css: 'grayscale(1)' },
  { id: 'contrast', name: 'HIGH-CON', css: 'grayscale(1) contrast(1.7)' },
  { id: 'soft', name: 'SOFT', css: 'brightness(1.12) contrast(0.88) saturate(1.1)' },
  { id: 'invert', name: 'INVERT', css: 'grayscale(1) invert(1)' },
];

export const MONO = '"IBM Plex Mono", "IBM Plex Sans KR", "Mochiy Pop One", monospace';
export const SANS = '"IBM Plex Sans KR", "Mochiy Pop One", sans-serif';
export const POP = '"Mochiy Pop One", "IBM Plex Sans KR", sans-serif';
export const SERIF = '"Playfair Display", "IBM Plex Sans KR", serif';

const PINK = '#ff5fa2';
const PINK_DEEP = '#c2185b';
const XRED = '#a8101c';

interface Theme {
  bg: string;
  fg: string;
  sub: string;
  ph: string; // 빈 칸 색
  hatch: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  gap: number;
  radius?: number;
  border?: { color: string; width: number };
}

const T = (t: Partial<Theme> & Pick<Theme, 'bg' | 'fg'>): Theme => ({
  sub: '#5a5a5a', ph: '#e6e6e6', hatch: 'rgba(0,0,0,0.08)', left: 36, right: 36, top: 100, bottom: 210, gap: 22, ...t,
});
const DARK = { sub: '#9a9a9a', ph: '#222222', hatch: 'rgba(255,255,255,0.08)' };

const THEMES: Record<FrameId, Theme> = {
  terminal: T({ bg: '#0a0a0a', fg: '#ffffff', ...DARK }),
  ide: T({ bg: '#ffffff', fg: '#0a0a0a' }),
  git: T({ bg: '#ffffff', fg: '#0a0a0a', left: 100 }),
  binary: T({ bg: '#0a0a0a', fg: '#ffffff', ...DARK }),
  galPink: T({ bg: PINK, fg: '#ffffff', ph: '#f6dbe7', top: 140, bottom: 190, gap: 24, radius: 28, border: { color: '#ffffff', width: 12 } }),
  galBlack: T({ bg: '#0a0a0a', fg: '#ffffff', ...DARK, top: 140, bottom: 190, gap: 24, radius: 28, border: { color: PINK, width: 9 } }),
  byteBuddies: T({ bg: '#f6b6c1', fg: '#4a2530', sub: '#8c5563', ph: '#fff3f5', top: 300, bottom: 200, gap: 24, left: 40, right: 40, radius: 26, border: { color: '#ffffff', width: 12 } }),
  pixelParty: T({ bg: '#2a2550', fg: '#ffffff', sub: '#b9b3e6', ph: '#3a3470', hatch: 'rgba(255,255,255,0.08)', top: 240, bottom: 236, gap: 26, left: 44, right: 44, border: { color: '#ffffff', width: 8 } }),
  mallang: T({ bg: '#fff1c9', fg: '#4a3b2a', sub: '#8a7560', ph: '#fde7ef', top: 150, bottom: 196, gap: 26, left: 40, right: 40, radius: 40, border: { color: '#ffffff', width: 12 } }),
  bugBuddy: T({ bg: '#dff2e8', fg: '#1f3a2e', sub: '#5b7a6c', ph: '#f4fbf7', top: 150, bottom: 196, gap: 26, left: 40, right: 40, radius: 22, border: { color: '#1f3a2e', width: 6 } }),
  xmasRed: T({ bg: XRED, fg: '#ffffff', ph: '#ececec', top: 144, bottom: 186, gap: 24, border: { color: '#ffffff', width: 9 } }),
  xmasSnow: T({ bg: '#ffffff', fg: '#0a0a0a', top: 144, bottom: 186, gap: 24 }),
  bye2026: T({ bg: '#0a0a0a', fg: '#ffffff', ...DARK, top: 210, bottom: 234, gap: 21 }),
  receipt: T({ bg: '#fbfbf7', fg: '#0a0a0a', ph: '#e6e6e3', left: 42, right: 42, top: 150, bottom: 318, gap: 18 }),
  classicWhite: T({ bg: '#ffffff', fg: '#0a0a0a', left: 30, right: 30, top: 30, bottom: 168, gap: 18 }),
  classicBlack: T({ bg: '#0a0a0a', fg: '#ffffff', ...DARK, left: 30, right: 30, top: 30, bottom: 168, gap: 18 }),
};

export interface Rect { x: number; y: number; w: number; h: number }

export function slotRects(frame: FrameId): Rect[] {
  const t = THEMES[frame];
  const w = STRIP_W - t.left - t.right;
  const h = (STRIP_H - t.top - t.bottom - t.gap * 3) / 4;
  return [0, 1, 2, 3].map((i) => ({ x: t.left, y: t.top + i * (h + t.gap), w, h }));
}

/** 촬영 화면 가이드용 기본 비율 */
export const SLOT_ASPECT = (() => {
  const r = slotRects('terminal')[0];
  return r.w / r.h;
})();

// ---------- helpers ----------
function sourceSize(src: CanvasImageSource): { w: number; h: number } {
  if (typeof HTMLVideoElement !== 'undefined' && src instanceof HTMLVideoElement) return { w: src.videoWidth, h: src.videoHeight };
  if (typeof HTMLImageElement !== 'undefined' && src instanceof HTMLImageElement) return { w: src.naturalWidth, h: src.naturalHeight };
  const s = src as { width: number; height: number };
  return { w: Number(s.width), h: Number(s.height) };
}

function drawCover(ctx: CanvasRenderingContext2D, src: CanvasImageSource, r: Rect) {
  const { w: sw, h: sh } = sourceSize(src);
  if (!sw || !sh) return;
  const target = r.w / r.h;
  let cw = sw;
  let ch = sw / target;
  if (ch > sh) {
    ch = sh;
    cw = sh * target;
  }
  ctx.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, r.x, r.y, r.w, r.h);
}

function pathRect(ctx: CanvasRenderingContext2D, r: Rect, radius = 0) {
  ctx.beginPath();
  if (radius > 0) ctx.roundRect(r.x, r.y, r.w, r.h, radius);
  else ctx.rect(r.x, r.y, r.w, r.h);
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, r: Rect, t: Theme) {
  ctx.fillStyle = t.ph;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = t.hatch;
  ctx.lineWidth = 2;
  for (let d = -r.h; d < r.w; d += 18) {
    ctx.beginPath();
    ctx.moveTo(r.x + d, r.y + r.h);
    ctx.lineTo(r.x + d + r.h, r.y);
    ctx.stroke();
  }
}

function drawSlot(ctx: CanvasRenderingContext2D, r: Rect, src: CanvasImageSource | null, t: Theme, filterCss: string) {
  ctx.save();
  if (t.border) {
    pathRect(ctx, r, t.radius);
    ctx.fillStyle = t.border.color;
    ctx.fill();
    const bw = t.border.width;
    r = { x: r.x + bw, y: r.y + bw, w: r.w - bw * 2, h: r.h - bw * 2 };
  }
  pathRect(ctx, r, t.radius ? Math.max(0, t.radius - (t.border?.width ?? 0)) : 0);
  ctx.clip();
  if (src) {
    ctx.filter = filterCss;
    drawCover(ctx, src, r);
    ctx.filter = 'none';
  } else {
    drawPlaceholder(ctx, r, t);
  }
  ctx.restore();
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number | string, size: number, family: string, maxW: number) {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (s > 12 && ctx.measureText(text).width > maxW) {
    s -= 1;
    ctx.font = `${weight} ${s}px ${family}`;
  }
}

function toBinary(s: string) {
  return Array.from(s).map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

function rng(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function star4(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, fill: boolean) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x, y, x - s * 0.5, y - s * 0.05, x - s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x - s * 0.1, y + s * 0.75, x, y + s);
  ctx.bezierCurveTo(x + s * 0.1, y + s * 0.75, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.05, x, y, x, y + s * 0.35);
  if (fill) ctx.fill();
  else ctx.stroke();
}

function snowflake(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const ex = x + Math.cos(a) * r;
    const ey = y + Math.sin(a) * r;
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    const bx = x + Math.cos(a) * r * 0.6;
    const by = y + Math.sin(a) * r * 0.6;
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(a + 0.6) * r * 0.3, by + Math.sin(a + 0.6) * r * 0.3);
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(a - 0.6) * r * 0.3, by + Math.sin(a - 0.6) * r * 0.3);
  }
  ctx.stroke();
}

function outlinedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string, stroke: string, lw: number) {
  ctx.lineJoin = 'round';
  ctx.lineWidth = lw;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function daysTo2027() {
  return Math.max(0, Math.ceil((new Date(2027, 0, 1).getTime() - Date.now()) / 86400000));
}


// ---------- 말랑 귀염: 오리지널 낙서 & 마스코트 ----------
function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x - r * 0.9, y, r * 0.65, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(x - r * 0.25, y - r * 0.45, r * 0.75, Math.PI, Math.PI * 1.85);
  ctx.arc(x + r * 0.6, y - r * 0.1, r * 0.6, Math.PI * 1.3, Math.PI * 0.5);
  ctx.closePath();
}
function star5(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}
/** 버그찌: 동글동글 꼬마 무당벌레 (이 프로젝트 오리지널 마스코트) */
function bugBuddy(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // 더듬이
  ctx.strokeStyle = '#1f3a2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, -26);
  ctx.quadraticCurveTo(-16, -40, -22, -38);
  ctx.moveTo(8, -26);
  ctx.quadraticCurveTo(16, -40, 22, -38);
  ctx.stroke();
  ctx.fillStyle = '#1f3a2e';
  ctx.beginPath();
  ctx.arc(-22, -38, 3.5, 0, Math.PI * 2);
  ctx.arc(22, -38, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // 머리
  ctx.beginPath();
  ctx.ellipse(0, -18, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // 몸통 (민트 등껍질 + 가운데 줄 + 점)
  ctx.fillStyle = '#7fd1ae';
  ctx.beginPath();
  ctx.ellipse(0, 6, 26, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1f3a2e';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 30);
  ctx.stroke();
  ctx.fillStyle = '#1f3a2e';
  [[-12, 0], [12, 0], [-10, 16], [10, 16]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(dx, dy, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  // 눈 + 볼
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-6, -19, 3.2, 0, Math.PI * 2);
  ctx.arc(6, -19, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}


// ---------- BYTE BUDDIES: 오리지널 컴퓨터 친구들 ----------
const LINE = '#3a2a2a';
function face(ctx: CanvasRenderingContext2D, x: number, y: number, k = 1, eye = LINE) {
  ctx.fillStyle = eye;
  ctx.beginPath();
  ctx.arc(x - 9 * k, y, 3.6 * k, 0, Math.PI * 2);
  ctx.arc(x + 9 * k, y, 3.6 * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = eye;
  ctx.lineWidth = 2.6 * k;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 4 * k, y + 8 * k);
  ctx.quadraticCurveTo(x, y + 12 * k, x + 4 * k, y + 8 * k);
  ctx.stroke();
}
/** 픽셀이: 네모 블록 + 픽셀 눈 */
function pixelBuddy(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffd36b';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-34, -38, 68, 68, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe9ad';
  ctx.fillRect(-26, -30, 14, 14);
  ctx.fillStyle = LINE;
  ctx.fillRect(-14, -10, 7, 9);
  ctx.fillRect(7, -10, 7, 9);
  ctx.fillRect(-6, 6, 12, 4);
  // 픽셀 다리
  ctx.fillRect(-20, 30, 10, 10);
  ctx.fillRect(10, 30, 10, 10);
  ctx.restore();
}
/** 쿠키: 브라우저 쿠키 (초코칩 + 한 입 베어 문 자국) */
function cookieBuddy(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#d9a066';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 38, 0.15 * Math.PI, 1.95 * Math.PI);
  ctx.arc(36, -12, 10, 1.4 * Math.PI, 0.55 * Math.PI, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6b3f22';
  [[-22, -18], [16, 20], [-24, 18], [2, -28]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });
  face(ctx, -2, 0, 1);
  ctx.restore();
}
/** 클라우디: 구름 서버 (배에 작은 서버 랙) */
function cloudBuddy(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#e7f2ff';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-44, 26);
  ctx.arc(-26, 6, 20, Math.PI * 0.6, Math.PI * 1.45);
  ctx.arc(0, -10, 28, Math.PI * 1.1, Math.PI * 1.9);
  ctx.arc(28, 6, 20, Math.PI * 1.55, Math.PI * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  face(ctx, 0, -2, 1);
  ctx.fillStyle = '#9fc9f5';
  ctx.fillRect(-12, 14, 24, 5);
  ctx.fillRect(-12, 21, 24, 5);
  ctx.restore();
}
/** 플로피: 플로피 디스크 */
function floppyBuddy(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#8f7cf0';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-34, -38);
  ctx.lineTo(24, -38);
  ctx.lineTo(34, -28);
  ctx.lineTo(34, 34);
  ctx.lineTo(-34, 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d9d2ff';
  ctx.fillRect(-18, -38, 34, 20);
  ctx.fillStyle = '#8f7cf0';
  ctx.fillRect(4, -34, 8, 13);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-24, 2, 48, 30, 4);
  ctx.fill();
  face(ctx, 0, 12, 0.85);
  ctx.restore();
}
/** 축하 리본 배너 */
function ribbon(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number, text: string) {
  ctx.save();
  ctx.fillStyle = '#e05a75';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3.5;
  // 꼬리
  [[-1, cx - w / 2], [1, cx + w / 2]].forEach(([d, ex]) => {
    ctx.beginPath();
    ctx.moveTo(ex - d * 14, y + 4);
    ctx.lineTo(ex + d * 30, y + 8);
    ctx.lineTo(ex + d * 18, y + 26);
    ctx.lineTo(ex + d * 32, y + 44);
    ctx.lineTo(ex - d * 14, y + 40);
    ctx.closePath();
    ctx.fillStyle = '#c94761';
    ctx.fill();
    ctx.stroke();
  });
  ctx.fillStyle = '#e05a75';
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, y);
  ctx.quadraticCurveTo(cx, y - 18, cx + w / 2, y);
  ctx.lineTo(cx + w / 2, y + 40);
  ctx.quadraticCurveTo(cx, y + 22, cx - w / 2, y + 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = `400 26px ${POP}`;
  ctx.fillText(text, cx, y + 26);
  ctx.restore();
}


// ---------- PIXEL PARTY: 도트 스프라이트 (오리지널 친구들의 8비트 버전) ----------
type Sprite = { rows: string[]; pal: Record<string, string> };
const SP: Record<string, Sprite> = {
  bug: { pal: { k: '#14281f', m: '#7fd1ae', w: '#ffffff' }, rows: [
    '..k......k..', '...k....k...', '....kkkk....', '...kwkkwk...', '..kmmmkmmmk.', '.kmmkmmmkmmk',
    '.kmmmmkmmmmk', '.kmkmmkmmkmk', '.kmmmmkmmmmk', '..kmmmkmmmk.', '...kkkkkkk..', '............'] },
  pixel: { pal: { k: '#3a2a10', y: '#ffd36b', l: '#fff1b8' }, rows: [
    '............', '.kkkkkkkkkk.', '.kyyyyyyyyk.', '.kyllyyyyyk.', '.kyllyyyyyk.', '.kyykyykyyk.',
    '.kyykyykyyk.', '.kyyyyyyyyk.', '.kyyykkyyyk.', '.kkkkkkkkkk.', '..kk....kk..', '............'] },
  cookie: { pal: { k: '#3a2214', b: '#d9a066', c: '#6b3f22' }, rows: [
    '....kkkk....', '..kkbbbbkk..', '.kbbcbbbbk..', '.kbbbbbbk...', 'kbbkbbkbbk..', 'kbbbbbbbbbk.',
    'kbcbbbbbcbk.', 'kbbbkkkbbbk.', '.kbbbbbbbk..', '.kbbcbbbbk..', '..kkbbbbkk..', '....kkkk....'] },
  cloud: { pal: { k: '#1d3550', w: '#e7f2ff', s: '#9fc9f5' }, rows: [
    '............', '....kkkk....', '...kwwwwk...', '.kkwwwwwwkk.', 'kwwwwwwwwwwk', 'kwwkwwwwkwwk',
    'kwwwwkkwwwwk', 'kwwwwwwwwwwk', '.kkkkkkkkkk.', '...kssssk...', '...kssssk...', '....kkkk....'] },
  floppy: { pal: { k: '#1f1640', p: '#8f7cf0', l: '#d9d2ff', w: '#ffffff' }, rows: [
    'kkkkkkkkkk..', 'kpplllllpk..', 'kppllplppkk.', 'kpplllllpppk', 'kppppppppppk', 'kpwwwwwwwwpk',
    'kpwkwwwwkwpk', 'kpwwwkkwwwpk', 'kpwwwwwwwwpk', 'kpwwwwwwwwpk', 'kkkkkkkkkkkk', '............'] },
  heart: { pal: { k: '#14102e', r: '#ff5c7a', w: '#ffc2cf' }, rows: [
    '.kk.kk.', 'kwrkrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'] },
  heartEmpty: { pal: { k: '#14102e', r: '#5a5490' }, rows: [
    '.kk.kk.', 'krrkrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'] },
};
function sprite(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, px: number) {
  const sp = SP[name];
  sp.rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = sp.pal[row[i]];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x + i * px), Math.round(y + j * px), px, px);
    }
  });
}

// ---------- frame chrome ----------
function drawChrome(ctx: CanvasRenderingContext2D, o: StripOptions, t: Theme, slots: Rect[]) {
  const x = 36;
  const cx = STRIP_W / 2;
  const maxW = STRIP_W - 72;
  const fy = STRIP_H - t.bottom;
  const msg = o.message.trim();
  const meta = [o.showHash ? o.hash : '', o.showDate ? o.date : ''].filter(Boolean).join(' · ');
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = t.fg;
  ctx.strokeStyle = t.fg;

  const devFooter = (tail: string, tailSize = 21) => {
    if (msg) {
      fitFont(ctx, `// ${msg}`, 600, 30, MONO, maxW);
      ctx.fillStyle = t.fg;
      ctx.fillText(`// ${msg}`, x, fy + 66);
    }
    ctx.fillStyle = t.sub;
    ctx.font = `400 21px ${MONO}`;
    if (meta) ctx.fillText(meta, x, fy + 108);
    ctx.font = `400 ${tailSize}px ${MONO}`;
    ctx.fillText(tail, x, fy + 160);
  };

  switch (o.frame) {
    case 'terminal':
      ctx.font = `500 30px ${MONO}`;
      ctx.fillText('$ ./graduate.sh', x, 66);
      devFooter('exit 0 · done_');
      break;

    case 'ide':
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, STRIP_W - 6, STRIP_H - 6);
      ctx.lineWidth = 3;
      [52, 84].forEach((c) => {
        ctx.beginPath();
        ctx.arc(c, 56, 10, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.arc(116, 56, 11.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `500 26px ${MONO}`;
      ctx.fillText('memory.tsx', 148, 65);
      devFooter('Ln 4, Col 4 · no bugs, just us');
      break;

    case 'git': {
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, STRIP_W - 6, STRIP_H - 6);
      ctx.font = `500 26px ${MONO}`;
      ctx.fillText('git log --graph', x, 66);
      const gx = 60;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(gx, slots[0].y + slots[0].h / 2);
      ctx.lineTo(gx, slots[3].y + slots[3].h / 2 + 120);
      ctx.stroke();
      slots.forEach((s, i) => {
        ctx.beginPath();
        ctx.arc(gx, s.y + s.h / 2, 15, 0, Math.PI * 2);
        if (i % 2 === 0) ctx.fill();
        else {
          ctx.fillStyle = t.bg;
          ctx.fill();
          ctx.fillStyle = t.fg;
          ctx.stroke();
        }
      });
      devFooter('HEAD → main · 4CUT.COMMIT');
      break;
    }

    case 'binary':
      ctx.font = `500 22px ${MONO}`;
      ctx.fillText(toBinary('GRAD'), x, 64);
      devFooter(toBinary('4CUT'), 18);
      break;

    case 'galPink':
    case 'galBlack': {
      const pink = o.frame === 'galPink';
      const r = rng(pink ? 11 : 23);
      ctx.textAlign = 'center';
      ctx.font = `400 ${pink ? 66 : 56}px ${POP}`;
      if (pink) outlinedText(ctx, 'ずっ友♡', cx, 98, '#ffffff', PINK_DEEP, 12);
      else {
        ctx.fillStyle = PINK;
        ctx.fillText('ギャル最強☆', cx, 94);
      }
      // 반짝이 · 하트
      const spots: [number, number, number][] = [[42, 40, 22], [560, 64, 15], [580, 640, 26], [20, 1000, 18], [575, 1240, 16], [40, 1700, 20], [560, 1740, 24], [300, 1790, 10]];
      spots.forEach(([sx, sy, sr], i) => {
        ctx.fillStyle = i % 3 === 1 && !pink ? PINK : '#ffffff';
        star4(ctx, sx, sy, sr);
      });
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = pink ? 'rgba(255,255,255,0.9)' : i % 2 ? PINK : '#ffffff';
        const edge = r() > 0.5;
        star4(ctx, edge ? 6 + r() * 26 : STRIP_W - 6 - r() * 26, 120 + r() * 1480, 4 + r() * 6);
      }
      ctx.lineWidth = 4;
      ctx.strokeStyle = pink ? '#ffffff' : PINK;
      heart(ctx, 548, 18, 32, false);
      heart(ctx, 30, 1260, 26, false);
      // footer
      if (msg) {
        fitFont(ctx, msg, 400, 40, POP, maxW);
        if (pink) outlinedText(ctx, msg, cx, fy + 90, '#ffffff', PINK_DEEP, 8);
        else {
          ctx.fillStyle = '#ffffff';
          ctx.fillText(msg, cx, fy + 90);
        }
      }
      ctx.font = `400 26px ${POP}`;
      ctx.fillStyle = pink ? '#ffffff' : PINK;
      const line = [pink ? '盛れた♡' : 'LOVE♡4EVER', o.showDate ? o.date : ''].filter(Boolean).join(' ');
      ctx.fillText(line, cx, fy + 140);
      break;
    }

    case 'xmasRed': {
      const r = rng(5);
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`;
        ctx.beginPath();
        ctx.arc(r() * STRIP_W, r() * STRIP_H, 2 + r() * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = `italic 600 62px ${SERIF}`;
      ctx.fillText('Merry Christmas', cx, 100);
      ctx.textAlign = 'left';
      if (msg) {
        fitFont(ctx, msg, 700, 34, SANS, 400);
        ctx.fillText(msg, x, fy + 88);
      }
      ctx.font = `400 22px ${MONO}`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText([o.showDate ? o.date : '', 'with love'].filter(Boolean).join(' · '), x, fy + 128);
      // tree
      const tx = 520;
      const ty = fy + 40;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(tx, ty + 10);
      ctx.lineTo(tx - 30, ty + 52);
      ctx.lineTo(tx + 30, ty + 52);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tx, ty + 34);
      ctx.lineTo(tx - 42, ty + 92);
      ctx.lineTo(tx + 42, ty + 92);
      ctx.fill();
      ctx.fillRect(tx - 8, ty + 92, 16, 16);
      ctx.fillStyle = '#f2c94c';
      star4(ctx, tx, ty + 4, 14);
      break;
    }

    case 'xmasSnow': {
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#0a0a0a';
      ctx.strokeRect(3, 3, STRIP_W - 6, STRIP_H - 6);
      ctx.lineCap = 'round';
      const flakes: [number, number, number, string][] = [[44, 44, 24, '#0a0a0a'], [560, 60, 16, '#8a8a8a'], [560, 1740, 28, '#0a0a0a'], [40, 1760, 14, '#8a8a8a'], [576, 900, 12, '#8a8a8a'], [22, 640, 12, '#8a8a8a']];
      flakes.forEach(([fx, fyy, fr, c]) => {
        ctx.strokeStyle = c;
        ctx.lineWidth = 3;
        snowflake(ctx, fx, fyy, fr);
      });
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0a0a0a';
      ctx.font = `italic 600 56px ${SERIF}`;
      ctx.fillText('Happy Holidays', cx, 92);
      ctx.fillStyle = '#1f6b3a';
      ctx.fillRect(cx - 90, 114, 180, 6);
      ctx.fillStyle = XRED;
      ctx.fillRect(36, fy + 36, STRIP_W - 72, 9);
      ctx.fillStyle = '#0a0a0a';
      if (msg) {
        fitFont(ctx, msg, 700, 34, SANS, maxW);
        ctx.fillText(msg, cx, fy + 100);
      }
      ctx.font = `400 22px ${MONO}`;
      ctx.fillStyle = '#5a5a5a';
      ctx.fillText(['WINTER 2026', o.showDate ? o.date : ''].filter(Boolean).join(' · '), cx, fy + 140);
      break;
    }

    case 'bye2026':
      ctx.fillStyle = t.sub;
      ctx.font = `500 24px ${MONO}`;
      ctx.fillText('T H E   L A S T   O N E', x, 62);
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 132px ${SANS}`;
      ctx.fillText('2026', x - 6, 186);
      ctx.font = `700 92px ${SANS}`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText('→ 2027', x - 2, fy + 104);
      if (msg) {
        fitFont(ctx, msg, 700, 32, SANS, maxW);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(msg, x, fy + 156);
      }
      ctx.fillStyle = t.sub;
      ctx.font = `400 22px ${MONO}`;
      ctx.fillText([`D-${daysTo2027()}`, o.showDate ? o.date : ''].filter(Boolean).join(' · '), x, fy + 200);
      break;

    case 'receipt': {
      ctx.textAlign = 'center';
      ctx.font = `600 40px ${MONO}`;
      ctx.fillText('2026 RECEIPT', cx, 76);
      ctx.font = `400 21px ${MONO}`;
      ctx.fillStyle = '#5a5a5a';
      ctx.fillText(`No. ${o.hash} · 컴소과 졸업전`, cx, 112);
      ctx.strokeStyle = '#0a0a0a';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      [134, fy + 6].forEach((ly) => {
        ctx.beginPath();
        ctx.moveTo(42, ly);
        ctx.lineTo(STRIP_W - 42, ly);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.fillStyle = '#0a0a0a';
      const row = (l: string, rr: string, y: number, bold = false) => {
        ctx.font = `${bold ? 600 : 400} ${bold ? 27 : 24}px ${MONO}`;
        ctx.textAlign = 'left';
        ctx.fillText(l, 48, y);
        ctx.textAlign = 'right';
        fitFont(ctx, rr, bold ? 600 : 400, bold ? 27 : 24, MONO, 320);
        ctx.fillText(rr, STRIP_W - 48, y);
      };
      row('웃음', '∞', fy + 46);
      row('밤샘 코딩', '365', fy + 82);
      row('TOTAL', msg || '졸업 1건', fy + 122, true);
      const r = rng(3);
      let bx = 120;
      while (bx < STRIP_W - 120) {
        const w = r() > 0.6 ? 6 : 3;
        ctx.fillRect(bx, fy + 148, w, 66);
        bx += w + 4;
      }
      ctx.textAlign = 'center';
      ctx.font = `400 20px ${MONO}`;
      ctx.fillStyle = '#5a5a5a';
      ctx.fillText('THANK YOU · SEE YOU 2027', cx, fy + 256);
      break;
    }

    case 'byteBuddies': {
      const r = rng(77);
      // 색종이
      for (let i = 0; i < 90; i++) {
        const qx = r() * STRIP_W;
        const qy = r() * STRIP_H;
        if (slots.some((sl) => qx > sl.x - 4 && qx < sl.x + sl.w + 4 && qy > sl.y - 4 && qy < sl.y + sl.h + 4)) continue; // 사진 위는 피하기
        ctx.save();
        ctx.translate(qx, qy);
        ctx.rotate(r() * Math.PI);
        ctx.fillStyle = ['#ffffff', '#ffd36b', '#9fc9f5', '#8f7cf0', '#7fd1ae'][i % 5];
        ctx.globalAlpha = 0.85;
        if (i % 3) ctx.fillRect(-5, -2.5, 10, 5);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      // 풍선 두 개
      [[46, 120, '#9fc9f5'], [556, 104, '#ffd36b']].forEach(([bx, by, c]) => {
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx as number, (by as number) + 34);
        ctx.quadraticCurveTo((bx as number) + 10, (by as number) + 70, bx as number, (by as number) + 110);
        ctx.stroke();
        ctx.fillStyle = c as string;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(bx as number, by as number, 26, 32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      // 친구들 (뒷줄 → 앞줄)
      cloudBuddy(ctx, 210, 92);
      floppyBuddy(ctx, 392, 88);
      pixelBuddy(ctx, 120, 176);
      bugBuddy(ctx, 300, 176, 1.25, 0);
      cookieBuddy(ctx, 482, 176);
      ribbon(ctx, cx, 238, 400, 'CONGRATS · 졸업 축하해');
      // 아래: 메시지 + 날짜, 구석에 버그찌
      ctx.textAlign = 'center';
      if (msg) {
        fitFont(ctx, msg, 400, 36, POP, maxW);
        outlinedText(ctx, msg, cx, fy + 84, '#4a2530', '#ffffff', 10);
      }
      ctx.font = `400 22px ${POP}`;
      ctx.fillStyle = '#8c5563';
      ctx.fillText(['byte buddies ♡', o.showDate ? o.date : ''].filter(Boolean).join(' · '), cx, fy + 130);
      bugBuddy(ctx, 60, fy + 166, 0.7, -0.4);
      pixelBuddy(ctx, STRIP_W - 64, fy + 146);
      break;
    }

    case 'pixelParty': {
      const r = rng(8);
      // 도트 별
      for (let i = 0; i < 80; i++) {
        const qx = Math.round((r() * STRIP_W) / 4) * 4;
        const qy = Math.round((r() * STRIP_H) / 4) * 4;
        if (qy < 250 || qy > fy) continue;
        if (slots.some((sl) => qx > sl.x - 10 && qx < sl.x + sl.w + 10 && qy > sl.y - 10 && qy < sl.y + sl.h + 10)) continue;
        ctx.fillStyle = i % 4 ? 'rgba(255,255,255,0.55)' : '#ffd36b';
        const sz = i % 7 ? 4 : 8;
        ctx.fillRect(qx, qy, sz, sz);
      }
      // HP 게이지 · 점수
      ctx.textAlign = 'left';
      ctx.font = `600 20px ${MONO}`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('HP', 44, 46);
      for (let i = 0; i < 5; i++) sprite(ctx, i < 4 ? 'heart' : 'heartEmpty', 84 + i * 34, 28, 4);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('SCORE 2026', STRIP_W - 44, 46);
      // 타이틀 (그림자 한 칸 아래로)
      ctx.textAlign = 'center';
      ctx.font = `600 58px ${MONO}`;
      ctx.fillStyle = '#14102e';
      ctx.fillText('LEVEL UP!', cx + 4, 112);
      ctx.fillStyle = '#ffd36b';
      ctx.fillText('LEVEL UP!', cx, 108);
      // 파티 멤버
      const names = ['cloud', 'pixel', 'bug', 'cookie', 'floppy'];
      names.forEach((n, i) => sprite(ctx, n, 54 + i * 102, 134, 6));
      ctx.font = `400 16px ${MONO}`;
      ctx.fillStyle = '#b9b3e6';
      ctx.fillText('— PARTY OF 5 · 졸업 달성 —', cx, 226);
      // 대화창
      const bx = 44, by = fy + 22, bw = STRIP_W - 88, bh = 120;
      ctx.fillStyle = '#14102e';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.strokeRect(bx + 3, by + 3, bw - 6, bh - 6);
      ctx.textAlign = 'left';
      ctx.font = `600 18px ${MONO}`;
      ctx.fillStyle = '#ffd36b';
      ctx.fillText('PLAYER 1', bx + 22, by + 36);
      if (msg) {
        fitFont(ctx, msg, 600, 30, MONO, bw - 44);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(msg, bx + 22, by + 80);
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx + bw - 34, by + bh - 30, 12, 8); // ▼ 대화 넘기기 표시
      ctx.fillRect(bx + bw - 31, by + bh - 22, 6, 4);
      ctx.textAlign = 'center';
      ctx.font = `400 20px ${MONO}`;
      ctx.fillStyle = '#b9b3e6';
      ctx.fillText(['▶ PRESS START', o.showDate ? o.date : ''].filter(Boolean).join(' · '), cx, fy + 196);
      break;
    }

    case 'mallang': {
      const r = rng(31);
      // 배경 낙서: 구름 · 별 · 하트
      ctx.lineWidth = 4;
      [[90, 60, 34], [556, 1770, 26], [540, 640, 26], [40, 1180, 24]].forEach(([cx0, cy0, rr]) => {
        cloud(ctx, cx0, cy0, rr);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#e9c98f';
        ctx.stroke();
      });
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = ['#ff9ec7', '#9fd3ff', '#ffd36b'][i % 3];
        const edge = r() > 0.5;
        star5(ctx, edge ? 14 + r() * 18 : STRIP_W - 14 - r() * 18, 160 + r() * 1440, 6 + r() * 6);
        ctx.fill();
      }
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ff9ec7';
      heart(ctx, 540, 30, 34, false);
      ctx.textAlign = 'center';
      ctx.font = `400 54px ${POP}`;
      outlinedText(ctx, '오늘도 말랑', cx, 112, '#4a3b2a', '#ffffff', 12);
      if (msg) {
        fitFont(ctx, msg, 400, 36, POP, maxW);
        outlinedText(ctx, msg, cx, fy + 88, '#4a3b2a', '#ffffff', 10);
      }
      ctx.font = `400 22px ${POP}`;
      ctx.fillStyle = '#8a7560';
      ctx.fillText(['♡ tiny & cute', o.showDate ? o.date : ''].filter(Boolean).join(' · '), cx, fy + 136);
      break;
    }

    case 'bugBuddy': {
      ctx.textAlign = 'center';
      ctx.font = `400 46px ${POP}`;
      ctx.fillStyle = '#1f3a2e';
      ctx.fillText('bug-free day', cx, 104);
      // 점선 테두리
      ctx.setLineDash([2, 14]);
      ctx.lineCap = 'round';
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#7fd1ae';
      ctx.strokeRect(14, 14, STRIP_W - 28, STRIP_H - 28);
      ctx.setLineDash([]);
      // 버그찌가 사진 모서리마다 빼꼼
      bugBuddy(ctx, 70, 128, 1.1, -0.3);
      bugBuddy(ctx, slots[1].x + slots[1].w - 6, slots[1].y + 10, 0.9, 0.5);
      bugBuddy(ctx, slots[2].x + 10, slots[2].y + slots[2].h - 4, 0.85, -0.6);
      bugBuddy(ctx, STRIP_W - 80, fy + 120, 1.2, 0.2);
      if (msg) {
        fitFont(ctx, msg, 400, 34, POP, maxW - 120);
        ctx.fillStyle = '#1f3a2e';
        ctx.textAlign = 'left';
        ctx.fillText(msg, 40, fy + 86);
      }
      ctx.textAlign = 'left';
      ctx.font = `400 21px ${MONO}`;
      ctx.fillStyle = '#5b7a6c';
      ctx.fillText(['0 bugs found', o.showDate ? o.date : ''].filter(Boolean).join(' · '), 40, fy + 128);
      break;
    }

    case 'classicWhite':
    case 'classicBlack':
      if (o.frame === 'classicWhite') {
        ctx.strokeStyle = '#d0d0d0';
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, STRIP_W - 3, STRIP_H - 3);
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = t.fg;
      if (msg) {
        fitFont(ctx, msg, 700, 36, SANS, maxW);
        ctx.fillText(msg, cx, fy + 80);
      }
      ctx.font = `400 24px ${MONO}`;
      ctx.fillStyle = t.sub;
      if (o.showDate) ctx.fillText(o.date, cx, fy + 122);
      break;
  }
  ctx.textAlign = 'left';
}

// ---------- doodles & stickers ----------
function drawDoodles(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes) {
    if (s.points.length < 2) continue;
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(s.points[0], s.points[1]);
      if (s.points.length === 2) ctx.lineTo(s.points[0] + 0.1, s.points[1]);
      for (let i = 2; i < s.points.length; i += 2) ctx.lineTo(s.points[i], s.points[i + 1]);
    };
    // 프리쿠라 펜 느낌: 바깥 테두리 + 안쪽 색
    trace();
    ctx.strokeStyle = s.color === '#0a0a0a' ? '#ffffff' : 'rgba(10,10,10,0.35)';
    ctx.lineWidth = s.width + 6;
    ctx.stroke();
    trace();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.stroke();
  }
  ctx.restore();
}

function stickerFont(s: Sticker) {
  const size = Math.round(32 * (s.scale ?? 1));
  return `${s.bare ? 400 : 600} ${size}px ${s.bare || s.tone ? POP : MONO}`;
}

export function stickerSize(ctx: CanvasRenderingContext2D, s: Sticker | string) {
  const st: Sticker = typeof s === 'string' ? { id: '', text: s, x: 0, y: 0, rot: 0, dark: true } : s;
  ctx.font = stickerFont(st);
  const k = st.scale ?? 1;
  return { w: Math.ceil(ctx.measureText(st.text).width) + (st.bare ? 12 : 32) * k, h: Math.round((st.bare ? 48 : 58) * k) };
}

function drawSticker(ctx: CanvasRenderingContext2D, s: Sticker) {
  const { w, h } = stickerSize(ctx, s);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate((s.rot * Math.PI) / 180);
  ctx.font = stickerFont(s);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (s.bare) {
    // 도장: 흰 글자 + 진한 테두리
    outlinedText(ctx, s.text, 0, 2, s.tone ?? '#ffffff', s.tone ? '#ffffff' : '#0a0a0a', 8 * (s.scale ?? 1));
    ctx.restore();
    return;
  }
  const bg = s.tone ?? (s.dark ? '#0a0a0a' : '#ffffff');
  ctx.fillStyle = bg;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  if (!s.dark || s.tone) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = s.tone ? '#ffffff' : '#0a0a0a';
    ctx.strokeRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
  }
  ctx.fillStyle = s.tone || s.dark ? '#ffffff' : '#0a0a0a';
  ctx.fillText(s.text, 0, 2);
  ctx.restore();
}

export function renderStrip(canvas: HTMLCanvasElement, o: StripOptions) {
  canvas.width = STRIP_W;
  canvas.height = STRIP_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const t = THEMES[o.frame];
  const slots = slotRects(o.frame);
  const filterCss = FILTERS.find((f) => f.id === o.filter)?.css ?? 'none';

  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, STRIP_W, STRIP_H);
  slots.forEach((r, i) => drawSlot(ctx, r, o.photos[i] ?? null, t, filterCss));
  drawChrome(ctx, o, t, slots);
  if (o.doodles?.length) drawDoodles(ctx, o.doodles);
  o.stickers.forEach((s) => drawSticker(ctx, s));
}

/** 캔버스에 쓰는 폰트(한글·일본어 포함)가 로드될 때까지 기다린다 */
export async function ensureFonts(sample = '') {
  if (typeof document === 'undefined' || !document.fonts) return;
  const text = `$./graduate.sh 0123456789 ${sample}`;
  const jp = `ずっ友♡ギャル最強☆盛れたLOVE4EVER ${sample}`;
  await Promise.all([
    document.fonts.load(`400 21px "IBM Plex Mono"`, text),
    document.fonts.load(`500 30px "IBM Plex Mono"`, text),
    document.fonts.load(`600 32px "IBM Plex Mono"`, text),
    document.fonts.load(`700 34px "IBM Plex Sans KR"`, sample || '가나다'),
    document.fonts.load(`400 40px "Mochiy Pop One"`, jp),
    document.fonts.load(`italic 600 60px "Playfair Display"`, 'Merry Christmas Happy Holidays'),
  ]).catch(() => undefined);
}

export function randomHash() {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 7);
}

export function todayLabel() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
