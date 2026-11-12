'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CONCEPTS, FILTERS, STRIP_H, STRIP_W, conceptOf, isLogoStamp, LOGO_STAMP, LOGO_STAMP_WHITE, slotRects, stickerSize, type ConceptId, type Sticker, type Stroke } from '@/lib/strip';
import { stripOptions, type Patch, type Session } from './session';
import { ArrowLeft, ArrowRight, StripCanvas, TopBar } from './ui';

type Tab = 'filter' | 'pen' | 'stamp' | 'sticker' | 'text';

const PINK = '#ff5fa2';
const XRED = '#a8101c';

const STICKER_SETS: Record<ConceptId, { list: string[]; tone?: string }> = {
  cs: { list: [LOGO_STAMP, LOGO_STAMP_WHITE, '</>', '{ }', ';', 'Hello, World!', 'sudo graduate', 'git push', '// TODO: 취업', 'while(alive)', '404', 'NULL', 'exit(0)', '#include <us>'] },
  gyaru: { list: ['ギャル最強', 'ずっ友だよ', '♡ = true', '盛れすぎ', 'sudo kawaii', '4人組', 'ぴえん', 'ありがと♡', 'NO.1 ギャル', 'LOVE♡'], tone: PINK },
  xmas: { list: ['Merry X-mas', 'Ho Ho Ho', '★ Noel ★', '산타 왔다감', '선물 = 우리', 'Let it snow', 'XOXO', '12.25'], tone: XRED },
  last: { list: ['BYE 2026', 'HELLO 2027', 'D-DAY', '12/31', '새해 복 많이', '올해도 고마워', 'git tag v2027', '마지막 학기'] },
  cute: { list: ['말랑', '꼬물꼬물', '귀여워', '♡', '오늘도 행복', '냠냠', 'zzZ', '헤헤', 'bug-free', 'LEVEL UP!', 'GAME CLEAR', '1UP'], tone: '#f78fb3' },
  basic: { list: ['BEST', 'FRIENDS', 'smile', '우정', '오늘의 우리', '찰칵', 'LOVE', '졸업 축하해'] },
};
const STAMPS = [LOGO_STAMP, LOGO_STAMP_WHITE, '♡', '☆', '✦', '★', '♪', '✿', 'ずっ友', '最強', '盛れた', 'LOVE', '</>', 'bug 0'];
const PEN_COLORS = ['#ffffff', PINK, '#c2185b', '#0a0a0a', '#bdbdbd', '#f2c94c', XRED, '#1f6b3a'];
const PEN_SIZES = [6, 12, 22];
const MAX_STICKERS = 14;
const MAX_MSG = 24;

let measureCtx: CanvasRenderingContext2D | null = null;
function measure(s: Sticker) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  return measureCtx ? stickerSize(measureCtx, s) : { w: 120, h: 58 };
}
const uid = () => Math.random().toString(36).slice(2, 9);
/** 버튼 안에 들어가는 라벨: 로고 도장은 이미지로 */
function Label({ t }: { t: string }) {
  if (!isLogoStamp(t)) return <>{t}</>;
  const white = t === LOGO_STAMP_WHITE;
  return (
    <span className={`logo-chip${white ? ' w' : ''}`}>
      <img src={white ? '/brand/logo-white.png' : '/brand/logo-black.png'} alt={white ? '과 로고 (흰색)' : '과 로고'} />
    </span>
  );
}

export default function DecorateScreen({ session, patch, onBack, onNext }: { session: Session; patch: Patch; onBack: () => void; onNext: () => void }) {
  const concept = conceptOf(session.frame);
  const conceptInfo = CONCEPTS.find((c) => c.id === concept)!;
  const [tab, setTab] = useState<Tab>(concept === 'gyaru' ? 'pen' : 'filter');
  const [sel, setSel] = useState<string | null>(null);
  const [scale, setScale] = useState(0.3);
  const [penColor, setPenColor] = useState(concept === 'gyaru' ? '#ffffff' : '#0a0a0a');
  const [penSize, setPenSize] = useState(12);
  const [stamp, setStamp] = useState<string | null>(null);
  const [stickerSet, setStickerSet] = useState<ConceptId>(concept);
  const [live, setLive] = useState<Stroke | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const [big, setBig] = useState(true); // 넓어진 꾸미기 영역을 꽉 채우도록 처음부터 크게
  const [cut, setCut] = useState(0);
  const drag = useRef<{ id: string; px: number; py: number; x: number; y: number } | null>(null);
  const drawing = useRef<Stroke | null>(null);

  const options = useMemo(() => {
    const o = stripOptions(session);
    return live ? { ...o, doodles: [...o.doodles!, live] } : o;
  }, [session, live]);
  const sampleThumb = session.shots[session.picked[0]]?.thumb;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / STRIP_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toStrip = (e: React.PointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(STRIP_W, (e.clientX - r.left) / scale)), y: Math.max(0, Math.min(STRIP_H, (e.clientY - r.top) / scale)) };
  };

  function addSticker(s: Omit<Sticker, 'id'>) {
    if (session.stickers.length >= MAX_STICKERS) return;
    const full = { ...s, id: uid() };
    patch({ stickers: [...session.stickers, full] });
    return full.id;
  }

  // ----- 펜 / 도장 레이어 -----
  function onLayerDown(e: React.PointerEvent) {
    const p = toStrip(e);
    if (tab === 'stamp') {
      if (stamp) addSticker({ text: stamp, x: p.x, y: p.y, rot: Math.round((Math.random() - 0.5) * 20), dark: false, bare: true, scale: isLogoStamp(stamp) ? 1 : stamp.length <= 2 ? 1.9 : 1.3, tone: concept === 'gyaru' ? undefined : undefined });
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drawing.current = { color: penColor, width: penSize, points: [Math.round(p.x), Math.round(p.y)] };
    setLive({ ...drawing.current });
  }
  function onLayerMove(e: React.PointerEvent) {
    const d = drawing.current;
    if (!d) return;
    const p = toStrip(e);
    const lx = d.points[d.points.length - 2];
    const ly = d.points[d.points.length - 1];
    if (Math.hypot(p.x - lx, p.y - ly) < 3) return;
    d.points.push(Math.round(p.x), Math.round(p.y));
    setLive({ ...d, points: [...d.points] });
  }
  function onLayerUp() {
    const d = drawing.current;
    drawing.current = null;
    setLive(null);
    if (d) patch({ doodles: [...session.doodles, d] });
  }

  const penMode = tab === 'pen' || tab === 'stamp';

  // 크게 보기: 한 컷씩 화면 가득 보여주고, 컷 번호로 이동
  function goCut(i: number) {
    setCut(i);
    const v = viewRef.current;
    const r = slotRects(session.frame)[i];
    if (!v || !r) return;
    const top = (r.y + r.h / 2) * scale - v.clientHeight / 2 + 24;
    v.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }
  function toggleBig() {
    const next = !big;
    setBig(next);
    if (next) requestAnimationFrame(() => requestAnimationFrame(() => goCut(cut)));
    else viewRef.current?.scrollTo({ top: 0 });
  }
  const set = STICKER_SETS[stickerSet];

  return (
    <div className="kiosk">
      <TopBar step={4} />
      <main className="body">
        <section className="deco-left">
          <div className={`deco-view${big ? ' big' : ''}`} ref={viewRef} onPointerDown={(e) => e.target === e.currentTarget && setSel(null)}>
          <div className={`stage${big ? ' big' : ''}`} ref={stageRef}>
            <StripCanvas options={options} />
            {penMode && <div className="pen-layer" onPointerDown={onLayerDown} onPointerMove={onLayerMove} onPointerUp={onLayerUp} onPointerCancel={onLayerUp} aria-label="사진 위에 그리기" />}
            {session.stickers.map((s) => {
              const { w, h } = measure(s);
              return (
                <div
                  key={s.id}
                  className={`handle${sel === s.id ? ' sel' : ''}`}
                  style={{ left: s.x * scale, top: s.y * scale, width: w * scale, height: h * scale, rotate: `${s.rot}deg`, pointerEvents: penMode ? 'none' : undefined }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSel(s.id);
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    drag.current = { id: s.id, px: e.clientX, py: e.clientY, x: s.x, y: s.y };
                  }}
                  onPointerMove={(e) => {
                    const d = drag.current;
                    if (!d || d.id !== s.id) return;
                    const nx = Math.max(0, Math.min(STRIP_W, d.x + (e.clientX - d.px) / scale));
                    const ny = Math.max(0, Math.min(STRIP_H, d.y + (e.clientY - d.py) / scale));
                    patch({ stickers: session.stickers.map((x) => (x.id === s.id ? { ...x, x: nx, y: ny } : x)) });
                  }}
                  onPointerUp={() => (drag.current = null)}
                  onPointerCancel={() => (drag.current = null)}
                >
                  {sel === s.id && !penMode && (
                    <button
                      className="del"
                      aria-label={`${s.text} 삭제`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => {
                        patch({ stickers: session.stickers.filter((x) => x.id !== s.id) });
                        setSel(null);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          </div>
          <div className="deco-zoom">
            <button className={`zbtn${big ? ' on' : ''}`} aria-pressed={big} onClick={toggleBig}>
              {big ? '전체 보기' : '크게 보기'}
            </button>
            {big &&
              slotRects(session.frame).map((_, i) => (
                <button key={i} className={`zbtn num${cut === i ? ' on' : ''}`} aria-label={`${i + 1}번 컷 크게 보기`} onClick={() => goCut(i)}>
                  {i + 1}
                </button>
              ))}
          </div>
        </section>

        <section className="pad deco-right" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="prompt">&gt; {concept === 'gyaru' ? './brush.exe --mode=gal' : 'npm run decorate'}</div>
            <h1 className="h1">{concept === 'gyaru' ? '마음껏 낙서하세요 ♡' : '마지막으로 꾸며볼까요?'}</h1>
          </div>

          <div className="tabs" role="tablist">
            {(
              [
                ['filter', '필터'],
                ['pen', '펜'],
                ['stamp', '도장'],
                ['sticker', '스티커'],
                ['text', '문구'],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'filter' && (
            <div className="filter-grid">
              {FILTERS.map((f) => (
                <button key={f.id} className={session.filter === f.id ? 'on' : ''} aria-pressed={session.filter === f.id} onClick={() => patch({ filter: f.id })}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {sampleThumb && <img src={sampleThumb} alt="" style={{ filter: f.css }} />}
                  <span>{f.name}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'pen' && (
            <>
              <span className="sublabel">COLOR</span>
              <div className="swatches">
                {PEN_COLORS.map((c) => (
                  <button key={c} aria-label={`펜 색 ${c}`} aria-pressed={penColor === c} className={penColor === c ? 'on' : ''} style={{ background: c }} onClick={() => setPenColor(c)} />
                ))}
              </div>
              <span className="sublabel">SIZE</span>
              <div className="sizes">
                {PEN_SIZES.map((s) => (
                  <button key={s} className={`size${penSize === s ? ' on' : ''}`} aria-label={`굵기 ${s}`} aria-pressed={penSize === s} onClick={() => setPenSize(s)}>
                    <i style={{ width: s * 1.3, height: s * 1.3 }} />
                  </button>
                ))}
                <button className="btn" style={{ minHeight: 64 }} disabled={!session.doodles.length} onClick={() => patch({ doodles: session.doodles.slice(0, -1) })}>
                  되돌리기
                </button>
                <button className="btn" style={{ minHeight: 64 }} disabled={!session.doodles.length} onClick={() => patch({ doodles: [] })}>
                  전체 지우기
                </button>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 15 }}>왼쪽 사진 위에 손가락으로 직접 그려요.</p>
            </>
          )}

          {tab === 'stamp' && (
            <>
              <div className="stamp-grid">
                {STAMPS.map((s) => (
                  <button key={s} className={stamp === s ? 'on' : ''} aria-pressed={stamp === s} onClick={() => setStamp(s)}>
                    <Label t={s} />
                  </button>
                ))}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 15 }}>도장을 고르고 사진 위를 톡 누르면 찍혀요. 옮기거나 지우려면 스티커 탭에서 눌러요.</p>
            </>
          )}

          {tab === 'sticker' && (
            <>
              <div className="chips">
                {CONCEPTS.map((c) => (
                  <button key={c.id} className={`chip${stickerSet === c.id ? ' on' : ''}`} style={{ minHeight: 40, fontSize: 13 }} onClick={() => setStickerSet(c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>
              <div className="chips">
                {set.list.map((t, i) => (
                  <button
                    key={t}
                    className={`chip${set.tone ? ' tone' : ''}${isLogoStamp(t) ? ' logo' : ''}`}
                    style={set.tone && !isLogoStamp(t) ? { background: set.tone } : undefined}
                    disabled={session.stickers.length >= MAX_STICKERS}
                    onClick={() => {
                      const id = addSticker({ text: t, x: STRIP_W / 2 + (Math.random() - 0.5) * 160, y: STRIP_H * (0.2 + Math.random() * 0.6), rot: Math.round((Math.random() - 0.5) * 16), dark: i % 2 === 0, tone: set.tone });
                      if (id) setSel(id);
                    }}
                  >
                    <Label t={t} />
                  </button>
                ))}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 15 }}>
                스티커를 누르면 붙어요. 왼쪽에서 끌어서 옮기고, 선택 후 × 로 지워요. ({session.stickers.length}/{MAX_STICKERS})
              </p>
            </>
          )}

          {tab === 'text' && (
            <>
              <div className="field">
                <label htmlFor="commit-msg">하단 문구</label>
                <input id="commit-msg" value={session.message} maxLength={MAX_MSG} onChange={(e) => patch({ message: e.target.value })} />
                <span className="muted" style={{ fontSize: 14 }}>{session.message.length}/{MAX_MSG}자</span>
              </div>
              <div className="chips">
                {[conceptInfo.defaultMessage, '졸업 축하해', 'Hello, World!', '버그 없는 인생', 'ずっ友だよ♡', '안녕 2026'].map((p) => (
                  <button key={p} className={`chip${session.message === p ? ' on' : ''}`} onClick={() => patch({ message: p })}>
                    {p}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                <label className="check">
                  <input type="checkbox" checked={session.showDate} onChange={(e) => patch({ showDate: e.target.checked })} />
                  날짜 표시
                </label>
                <label className="check">
                  <input type="checkbox" checked={session.showHash} onChange={(e) => patch({ showHash: e.target.checked })} />
                  커밋 해시 표시
                </label>
              </div>
            </>
          )}

          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn" onClick={onBack}>
              <ArrowLeft /> 이전
            </button>
            <button className="btn btn-primary" onClick={onNext}>
              완성하기 <ArrowRight />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
