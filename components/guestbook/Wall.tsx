'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import QRCode from 'qrcode';
import { PROJECTS } from '@/lib/projects';
import { audio, boom, ding, whoosh } from '@/lib/sfx';
import GlobeView from './GlobeView';
import { ago, linkKey, pad2, type GlobeApi, type LiveLink, type PublicEntry, type SharedData, type Snapshot } from './types';

/*
 * 방명록 큰 화면.
 * - TABLE: 끝없이 이어지는 종이 테이블 위에 메시지 카드("프린트")가 놓여 있고,
 *   카드마다 가장자리의 프로젝트 라벨까지 가는 머리카락 선이 매 프레임 다시 그려진다.
 *   같은 사람이 여러 프로젝트에 남기면 라벨끼리 점선으로 연결된다.
 * - GLOBE: 같은 데이터를 3D 지구본 네트워크로.
 * 새 메시지는 아래에서 크게 날아와(슈욱) 테이블에 꽂히고(쾅) 라벨이 반응한다.
 * 1920×1080 무대를 기준으로 디자인하고 화면 크기에 맞춰 통째로 축소/확대한다.
 */

const W = 1920;
const H = 1080;
const POLL_MS = 2000;
const SLOT_N = 24;
const TILE_K = 1.45;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const wrap = (v: number, size: number) => ((v % size) + size) % size;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const IDX = Object.fromEntries(PROJECTS.map((p, i) => [p.id, i + 1]));
const projOf = (id: string) => PROJECTS.find((p) => p.id === id);
const nameOf = (id: string) => projOf(id)?.name ?? id;

// 테이블 위 자리: 6×4 격자에 살짝 흔들어 배치. size = 화면 폭 대비 카드 폭 (클수록 가깝고 빠름)
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
const SIZES = [0.13, 0.085, 0.105, 0.075, 0.12, 0.09, 0.08, 0.115, 0.095, 0.07, 0.11, 0.1];
const RATIOS = [1.15, 0.8, 1, 1.25, 0.85, 1.05];
const SLOTS = Array.from({ length: SLOT_N }, (_, i) => {
  const col = i % 6;
  const row = Math.floor(i / 6);
  return {
    u: (col + 0.18 + rand(i + 1) * 0.64) / 6,
    v: (row + 0.18 + rand(i + 51) * 0.64) / 4,
    size: SIZES[(i * 5) % SIZES.length],
    ratio: RATIOS[(i * 7) % RATIOS.length],
    rot: (rand(i + 99) - 0.5) * 5,
    dark: i % 7 === 3,
  };
});
// 지금 막 도착한 카드는 이만큼 크게 보여준다
const HERO_W = 420;
const HERO_H = 460;
const heroW = (slot: number, w: number) => Math.max(w, Math.min(HERO_W, HERO_H / SLOTS[slot].ratio));

// 프로젝트 라벨: 접촉 인화지의 인덱스처럼 프레임 가장자리를 한 바퀴. (x, y) = 선이 시작되는 점
const LABEL_POS: [number, number][] = [
  [330, 132], [860, 132], [1390, 132], // 위
  [1668, 300], [1668, 470], [1668, 640], // 오른쪽
  [1300, 918], [860, 918], [420, 918], // 아래
  [44, 720], [44, 520], [44, 320], // 왼쪽
];
const LABELS = PROJECTS.map((p, i) => ({ ...p, n: i + 1, x: LABEL_POS[i % LABEL_POS.length][0], y: LABEL_POS[i % LABEL_POS.length][1] }));
const anchorOf = (id: string) => LABELS.find((l) => l.id === id) ?? { x: W / 2, y: H / 2 };

const FAKE_TEXTS = ['발표 너무 좋았어요!', 'UI 진짜 예뻐요. 색 조합 어떻게 정했어요?', '바로 쓰고 싶은 서비스', '데모 감동이었어요 ㅠㅠ', '팀워크 최고', '이거 창업하세요 진심으로', '아이디어 천재', '완성도 미쳤다', '설명 들으니까 바로 이해됐어요. 앱 출시되면 꼭 깔게요!', '고생 많으셨습니다'];
const FAKE_NICKS = ['22학번', '익명의 방문자', '옆과 졸업생', '지나가던 개발자', '신입생', '학부모'];

interface Card { e: PublicEntry; slot: number }
type Mode = 'table' | 'globe';

function fontClass(t: string) {
  const n = [...t].length;
  return n <= 14 ? 'is-xl' : n <= 32 ? 'is-l' : n <= 55 ? 'is-m' : 'is-s';
}

export default function Wall({ demo = false, initialMode = 'table', cycle = true }: { demo?: boolean; initialMode?: Mode; cycle?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<SVGPolylineElement>(null);
  const ringRefs = useRef<(SVGCircleElement | null)[]>([]);
  const items = useRef(new Map<string, HTMLButtonElement>());
  const lines = useRef(new Map<string, SVGLineElement>());
  const figRef = useRef<HTMLDivElement>(null);
  const globeApi = useRef<GlobeApi | null>(null);
  const shared = useRef<SharedData>({ counts: {}, links: [] });

  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [cards, setCards] = useState<Card[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [links, setLinks] = useState<LiveLink[]>([]);
  const [total, setTotal] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [qr, setQr] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [now, setNow] = useState(0); // 0 = 아직 마운트 전 (SSR과 시계 불일치 방지)
  const [hover, setHover] = useState('');
  const [hoverLabel, setHoverLabel] = useState('');
  const [lockLabel, setLockLabel] = useState('');
  const [hit, setHit] = useState<{ id: string; n: number } | null>(null);
  const [toast, setToast] = useState<{ text: string; n: number } | null>(null);
  const [flyEntry, setFlyEntry] = useState<PublicEntry | null>(null);
  const [heroId, setHeroId] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const [reduced, setReduced] = useState(false);

  const hoverCard = cards.find((c) => c.e.id === hover);
  const activeLabel = hoverLabel || lockLabel || (hoverCard ? hoverCard.e.project : '');

  const S = useRef({
    x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0, tilt: 0, press: 0, scale: 1,
    drag: null as null | { id: number; sx: number; sy: number; lx: number; ly: number; lt: number; moved: boolean },
    dragEnd: 0,
    lastInput: 0,
    modeAt: 0,
    hover: '',
    activeLabel: '',
    paused: false,
    reduced: false,
    mode: initialMode as Mode,
    cards: [] as Card[],
    born: new Map<string, number>(),
    flying: new Set<string>(),
    lineT0: new Map<string, number>(),
    hero: { id: '', t0: 0 },
    ripple: { x: 0, y: 0, t0: -1e9 },
    shake: 0,
    trail: [] as [number, number][],
    queue: [] as PublicEntry[],
    seen: new Set<string>(),
    first: true,
    pendingLinks: [] as { a: string; b: string }[],
    shot: null as null | {
      kind: Mode;
      entry: PublicEntry;
      slot: number;
      phase: 'aim' | 'fly' | 'impact';
      t0: number;
      x0: number; y0: number; tx: number; ty: number;
      fast: number;
    },
    sound: false,
    hitN: 0,
  });
  const s0 = S.current;
  s0.hover = hover;
  s0.activeLabel = activeLabel;
  s0.paused = open !== null;
  s0.mode = mode;
  s0.reduced = reduced;

  // ---------- 무대 크기, 시계, QR, 모션 설정 ----------
  useLayoutEffect(() => {
    const fit = () => {
      const k = Math.min(innerWidth / W, innerHeight / H);
      S.current.scale = k;
      setScale(k);
    };
    fit();
    addEventListener('resize', fit);
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      removeEventListener('resize', fit);
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_PUBLIC_URL || location.origin).replace(/\/$/, '');
    const url = `${base}/g`;
    setJoinUrl(url.replace(/^https?:\/\//, ''));
    QRCode.toDataURL(url, { margin: 1, width: 400, color: { dark: '#0a0a0a', light: '#f5f5f5' } }).then(setQr);
  }, []);

  // ---------- 카드 관리 ----------
  function commitCards(next: Card[]) {
    S.current.cards = next;
    setCards(next);
  }
  /** 새 메시지 자리를 정한다: 빈 자리 → 없으면 가장 오래된 카드 자리 */
  function placeNew(e: PublicEntry) {
    const s = S.current;
    if (s.cards.some((c) => c.e.id === e.id)) return s.cards.find((c) => c.e.id === e.id)!.slot;
    const used = new Set(s.cards.map((c) => c.slot));
    let slot = -1;
    // 화면 밖에 있는 빈 자리를 우선 (도착할 때 테이블이 그쪽으로 굴러가도록)
    for (let i = 0; i < SLOT_N; i++) if (!used.has(i)) { slot = i; break; }
    let next = s.cards;
    if (slot < 0) {
      const oldest = [...s.cards].sort((a, b) => a.e.createdAt - b.e.createdAt)[0];
      slot = oldest.slot;
      next = s.cards.filter((c) => c !== oldest);
    }
    commitCards([{ e, slot }, ...next]);
    return slot;
  }

  // ---------- 도착 (두 모드 공통) ----------
  function impact(entry: PublicEntry) {
    const s = S.current;
    const sh = shared.current;
    sh.counts[entry.project] = (sh.counts[entry.project] ?? 0) + 1;
    setCounts({ ...sh.counts });
    s.flying.delete(entry.id);
    if (s.sound) boom();
    s.hitN++;
    setHit({ id: entry.project, n: s.hitN });
    const link = s.pendingLinks.find((l) => l.a === entry.project || l.b === entry.project);
    if (link) {
      s.pendingLinks = s.pendingLinks.filter((l) => l !== link);
      sh.links = [...sh.links, { a: link.a, b: link.b, w: 1, born: performance.now() + 450 }];
      setLinks(sh.links);
      setToast({ text: `${nameOf(link.a)} ↔ ${nameOf(link.b)}`, n: s.hitN });
      if (s.sound) setTimeout(() => ding(), 450);
    }
  }

  // ---------- 데이터 ----------
  useEffect(() => {
    const s = S.current;
    const sh = shared.current;
    function apply(snap: Snapshot) {
      const fresh = snap.recent.filter((e) => !s.seen.has(e.id)).reverse();
      fresh.forEach((e) => s.seen.add(e.id));
      if (s.first) {
        s.first = false;
        sh.counts = { ...snap.counts };
        sh.links = snap.links.map((l) => ({ ...l, born: -1e9 }));
        const t = performance.now();
        const initial = snap.recent.slice(0, SLOT_N).map((e, i) => ({ e, slot: i }));
        initial.forEach((c, i) => s.born.set(c.e.id, t + 200 + i * 55));
        commitCards(initial);
      } else {
        s.queue.push(...fresh);
        const pending: Record<string, number> = {};
        [...s.queue, ...(s.shot && s.shot.phase !== 'impact' ? [s.shot.entry] : [])].forEach((e) => (pending[e.project] = (pending[e.project] ?? 0) + 1));
        for (const id of Object.keys(snap.counts)) sh.counts[id] = Math.max(0, snap.counts[id] - (pending[id] ?? 0));
        const shown = new Set(sh.links.map((l) => linkKey(l.a, l.b)));
        const waiting = new Set(s.pendingLinks.map((l) => linkKey(l.a, l.b)));
        for (const l of snap.links) {
          const k = linkKey(l.a, l.b);
          if (!shown.has(k) && !waiting.has(k)) s.pendingLinks.push({ a: l.a, b: l.b });
        }
        const live = new Map(snap.links.map((l) => [linkKey(l.a, l.b), l.w]));
        sh.links = sh.links.filter((l) => live.has(linkKey(l.a, l.b))).map((l) => ({ ...l, w: live.get(linkKey(l.a, l.b)) ?? l.w }));
        setLinks(sh.links);
        // 관리자가 숨긴 메시지는 테이블에서 치움
        const visible = new Set(snap.recent.map((e) => e.id));
        const oldest = snap.recent.length ? snap.recent[snap.recent.length - 1].createdAt : 0;
        const kept = s.cards.filter((c) => visible.has(c.e.id) || c.e.createdAt < oldest || s.flying.has(c.e.id) || s.queue.some((q) => q.id === c.e.id));
        if (kept.length !== s.cards.length) commitCards(kept);
      }
      setCounts({ ...sh.counts });
      setTotal(snap.total);
    }

    if (demo) {
      apply({
        counts: Object.fromEntries(PROJECTS.map((p, i) => [p.id, ((i * 7) % 9) + 1])),
        links: [{ a: 'campusmap', b: 'medinote', w: 2 }, { a: 'aitutor', b: 'studymate', w: 1 }, { a: 'ecoroute', b: 'fitlog', w: 1 }],
        total: 18,
        recent: Array.from({ length: 18 }, (_, i) => ({
          id: `seed${i}`,
          project: PROJECTS[(i * 5) % PROJECTS.length].id,
          text: FAKE_TEXTS[i % FAKE_TEXTS.length],
          nick: FAKE_NICKS[i % FAKE_NICKS.length],
          createdAt: Date.now() - (i + 1) * 170000,
        })),
      });
      let n = 0;
      const tick = () => {
        const p = PROJECTS[(n * 7 + 2) % PROJECTS.length];
        const e: PublicEntry = { id: `demo${n}`, project: p.id, text: FAKE_TEXTS[(n + 3) % FAKE_TEXTS.length], nick: FAKE_NICKS[n % FAKE_NICKS.length], createdAt: Date.now() };
        n++;
        s.queue.push(e);
        const other = PROJECTS[(n * 3 + 1) % PROJECTS.length].id;
        const isNew = n % 2 === 0 && other !== p.id && !sh.links.some((l) => linkKey(l.a, l.b) === linkKey(p.id, other)) && !s.pendingLinks.some((l) => linkKey(l.a, l.b) === linkKey(p.id, other));
        if (isNew) s.pendingLinks.push({ a: p.id, b: other });
        setTotal((t) => t + 1);
      };
      const first = setTimeout(tick, 1800);
      const t = setInterval(tick, 6500);
      return () => {
        clearTimeout(first);
        clearInterval(t);
      };
    }

    let alive = true;
    async function poll() {
      try {
        const r = await fetch('/api/guestbook', { cache: 'no-store' });
        if (r.ok && alive) apply(await r.json());
      } catch {
        /* 다음 폴링에서 재시도 */
      }
      if (alive) setTimeout(poll, POLL_MS);
    }
    poll();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo]);

  // ---------- 아무도 안 만지면 TABLE ↔ GLOBE 자동 전환 ----------
  useEffect(() => {
    if (!cycle) return;
    const t = setInterval(() => {
      const s = S.current;
      const n = performance.now();
      if (s.shot || s.queue.length || s.paused) return;
      if (n - s.lastInput < 45000) return;
      if (n - s.modeAt < (s.mode === 'table' ? 90000 : 45000)) return;
      s.modeAt = n;
      setMode((m) => (m === 'table' ? 'globe' : 'table'));
    }, 1000);
    return () => clearInterval(t);
  }, [cycle]);

  useEffect(() => {
    S.current.modeAt = performance.now();
  }, [mode]);

  // 토스트/라벨 반응 자동 정리
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!hit) return;
    const t = setTimeout(() => setHit(null), 1600);
    return () => clearTimeout(t);
  }, [hit]);

  // ---------- 한 개의 rAF 루프가 모든 움직임을 담당 ----------
  useEffect(() => {
    const s = S.current;
    let raf = 0;
    let prev = performance.now();

    const place = (slot: number) => {
      const sl = SLOTS[slot];
      const depth = 0.72 + (sl.size - 0.06) * 5.5;
      const TW = W * TILE_K;
      const TH = H * TILE_K;
      const w = sl.size * W;
      const x = wrap(sl.u * TW + s.x * depth - W / 2 + TW / 2, TW) - TW / 2 + W / 2 + s.px * (depth - 1) * 40;
      const y = wrap(sl.v * TH + s.y * depth - H / 2 + TH / 2, TH) - TH / 2 + H / 2 + s.py * (depth - 1) * 30;
      return { x, y, w, h: w * sl.ratio, depth };
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (s.paused) return;
      const rm = s.reduced;

      // ---- 시퀀서
      if (!s.shot && s.queue.length) {
        const entry = s.queue.shift()!;
        const fast = s.queue.length > 2 ? 0.6 : 1;
        const slot = placeNew(entry);
        s.flying.add(entry.id);
        if (s.mode === 'globe' && globeApi.current) {
          s.shot = { kind: 'globe', entry, slot, phase: 'fly', t0: now, x0: 0, y0: 0, tx: 0, ty: 0, fast };
          if (s.sound) setTimeout(() => whoosh(1.3), 950);
          globeApi.current
            .shoot(entry, () => {
              impact(entry);
              setHeroId('');
            })
            .then(() => {
              s.shot = null;
            });
        } else {
          const p = place(slot);
          s.vx = 0;
          s.vy = 0;
          s.shot = {
            kind: 'table', entry, slot, phase: 'aim', t0: now, fast,
            x0: s.x, y0: s.y,
            tx: s.x + (W / 2 - p.x) / p.depth,
            ty: s.y + (H * 0.5 - p.y) / p.depth,
          };
          setFlyEntry(entry);
        }
      }
      const shot = s.shot && s.shot.kind === 'table' ? s.shot : null;
      if (shot) {
        const el = now - shot.t0;
        if (shot.phase === 'aim') {
          const k = rm ? 1 : clamp(el / (900 * shot.fast), 0, 1);
          s.x = lerp(shot.x0, shot.tx, ease(k));
          s.y = lerp(shot.y0, shot.ty, ease(k));
          if (k >= 1) {
            shot.phase = 'fly';
            shot.t0 = now;
            s.trail = [];
            if (s.sound) whoosh(1.25 * shot.fast);
          }
        } else if (shot.phase === 'fly' && el >= (rm ? 0 : 1200 * shot.fast)) {
          shot.phase = 'impact';
          shot.t0 = now;
          const p = place(shot.slot);
          s.ripple = { x: p.x, y: p.y, t0: now };
          s.shake = rm ? 0 : 20;
          s.hero = { id: shot.entry.id, t0: now };
          s.lineT0.set(shot.entry.id, now);
          setHeroId(shot.entry.id);
          setFlyEntry(null);
          impact(shot.entry);
        } else if (shot.phase === 'impact' && el >= 3300 * shot.fast) {
          s.shot = null;
          setHeroId('');
        }
      }

      // ---- 테이블 움직임: 관성 + 아무도 없을 때 천천히 흘러감
      const busy = !!shot && shot.phase !== 'impact';
      const heroHold = s.hero.id && now - s.hero.t0 < 2800;
      if (!s.drag && !busy) {
        const f = Math.exp(-dt * 2.6);
        s.vx *= f;
        s.vy *= f;
        if (!rm && !s.hover && !heroHold) {
          s.vx += (-16 - s.vx) * Math.min(1, dt * 0.6);
          s.vy += (-9 - s.vy) * Math.min(1, dt * 0.6);
        }
        if (heroHold) {
          s.vx *= 0.9;
          s.vy *= 0.9;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      }
      const speed = s.drag ? s.vx : s.vx * 0.6;
      s.tilt += (clamp(speed / 900, -1, 1) - s.tilt) * Math.min(1, dt * 6);
      s.press += ((s.drag?.moved ? 1 : 0) - s.press) * Math.min(1, dt * 7);
      s.shake *= 0.88;
      const world = worldRef.current;
      if (world) {
        world.style.setProperty('--tilt', s.tilt.toFixed(3));
        world.style.setProperty('--press', s.press.toFixed(3));
        world.style.transform = s.shake > 0.4 ? `translate3d(${((Math.random() - 0.5) * s.shake).toFixed(1)}px, ${((Math.random() - 0.5) * s.shake).toFixed(1)}px, 0)` : '';
      }

      // ---- 카드 + 머리카락 선
      for (const c of s.cards) {
        const node = items.current.get(c.e.id);
        if (!node) continue;
        const p = place(c.slot);
        let w = p.w;
        let z = Math.round(p.depth * 10);
        // 방금 도착한 카드: 크게 꽂혔다가(살짝 튕김) 제자리 크기로
        if (s.hero.id === c.e.id) {
          const t = now - s.hero.t0;
          const big = heroW(c.slot, p.w);
          if (t < 380) w = big * (1 + 0.1 * (1 - easeOut(t / 380)));
          else if (t < 2800) w = big;
          else if (t < 3500) w = lerp(big, p.w, ease((t - 2800) / 700));
          else s.hero.id = '';
          z = 80;
        }
        if (c.e.id === s.hover) z = 70;
        const h = w * SLOTS[c.slot].ratio;
        const born = s.born.get(c.e.id) ?? 0;
        const e = rm ? 1 : ease(clamp((now - born) / 900, 0, 1));
        const flying = s.flying.has(c.e.id);
        node.style.width = `${w.toFixed(1)}px`;
        node.style.height = `${h.toFixed(1)}px`;
        node.style.transform = `translate3d(${(p.x - w / 2).toFixed(1)}px, ${(p.y - h / 2).toFixed(1)}px, 0) scale(${(0.6 + 0.4 * e).toFixed(3)})`;
        node.style.opacity = flying ? '0' : e.toFixed(3);
        node.style.zIndex = String(z);

        const ln = lines.current.get(c.e.id);
        if (ln) {
          const a = anchorOf(c.e.project);
          const t0 = s.lineT0.get(c.e.id);
          const draw = t0 === undefined || rm ? 1 : ease(clamp((now - t0 - 150) / 700, 0, 1));
          const inView = p.x > -60 && p.x < W + 60 && p.y > -60 && p.y < H + 60;
          ln.setAttribute('x1', a.x.toFixed(1));
          ln.setAttribute('y1', a.y.toFixed(1));
          ln.setAttribute('x2', lerp(a.x, p.x, draw).toFixed(1));
          ln.setAttribute('y2', lerp(a.y, p.y, draw).toFixed(1));
          const on = s.activeLabel === c.e.project || s.hero.id === c.e.id;
          ln.style.opacity = flying || !inView ? '0' : on ? '0.9' : s.activeLabel ? '0.06' : '0.3';
          ln.style.strokeWidth = s.hero.id === c.e.id ? '1.4px' : '';
        }
      }

      // ---- 날아오는 카드 + 궤적
      const fl = flyerRef.current;
      const trail = trailRef.current;
      if (fl && trail) {
        if (shot && shot.phase === 'fly') {
          const p = place(shot.slot);
          const k = clamp((now - shot.t0) / (1200 * shot.fast), 0, 1);
          const t = ease(k);
          const sx = W * 0.62, sy = H + 420;
          const cx = W * 0.92, cy = H * 0.62;
          const x = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * p.x;
          const y = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * p.y;
          const end = heroW(shot.slot, p.w);
          const w = lerp(end * 1.9, end, easeOut(k));
          const h = w * SLOTS[shot.slot].ratio;
          const rot = lerp(-16, 0, easeOut(k));
          fl.style.width = `${w.toFixed(1)}px`;
          fl.style.height = `${h.toFixed(1)}px`;
          fl.style.transform = `translate3d(${(x - w / 2).toFixed(1)}px, ${(y - h / 2).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
          fl.style.opacity = '1';
          s.trail.push([x, y]);
          if (s.trail.length > 26) s.trail.shift();
          trail.setAttribute('points', s.trail.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' '));
          trail.style.opacity = '1';
        } else {
          fl.style.opacity = '0';
          trail.style.opacity = '0';
        }
      }

      // ---- 도착 파문
      const rt = (now - s.ripple.t0) / 1500;
      ringRefs.current.forEach((r, i) => {
        if (!r) return;
        const t = rt - i * 0.12;
        if (t <= 0 || t >= 1 || rm) {
          r.style.opacity = '0';
          return;
        }
        r.setAttribute('cx', s.ripple.x.toFixed(1));
        r.setAttribute('cy', s.ripple.y.toFixed(1));
        r.setAttribute('r', (HERO_W * 0.45 + easeOut(t) * 520).toFixed(1));
        r.style.opacity = ((1 - t) * 0.7).toFixed(3);
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- 입력: 어디든 끌어서 던지기 ----------
  useEffect(() => {
    const onMove = (e: globalThis.PointerEvent) => {
      const r = rootRef.current?.getBoundingClientRect();
      if (!r || S.current.reduced) return;
      S.current.px = (e.clientX - r.left) / r.width - 0.5;
      S.current.py = (e.clientY - r.top) / r.height - 0.5;
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => removeEventListener('pointermove', onMove);
  }, []);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    S.current.lastInput = performance.now();
    S.current.drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), moved: false };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = S.current;
    const d = s.drag;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return;
      d.moved = true;
      setGrabbing(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* 합성 포인터 등 */
      }
    }
    const k = s.scale || 1;
    const dx = (e.clientX - d.lx) / k;
    const dy = (e.clientY - d.ly) / k;
    const now = performance.now();
    const dtm = Math.max(0.008, (now - d.lt) / 1000);
    s.x += dx;
    s.y += dy;
    s.vx = s.vx * 0.5 + (dx / dtm) * 0.5;
    s.vy = s.vy * 0.5 + (dy / dtm) * 0.5;
    d.lx = e.clientX;
    d.ly = e.clientY;
    d.lt = now;
    s.lastInput = now;
  };
  const onUp = () => {
    const s = S.current;
    if (s.drag?.moved) s.dragEnd = performance.now();
    s.drag = null;
    setGrabbing(false);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const m = ({ ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] } as Record<string, [number, number]>)[e.key];
    if (!m) return;
    e.preventDefault();
    S.current.vx = m[0] * 700;
    S.current.vy = m[1] * 700;
    S.current.lastInput = performance.now();
  };

  function enableSound() {
    audio();
    S.current.sound = true;
    setSoundOn(true);
    ding(0.25);
  }

  // ---------- 라이트박스 (FLIP) ----------
  const ordered = [...cards].sort((a, b) => b.e.createdAt - a.e.createdAt);
  const flight = (from: DOMRect, to: DOMRect) => {
    const k = S.current.scale || 1;
    return `translate(${(from.left - to.left) / k}px, ${(from.top - to.top) / k}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  };
  const openCard = (id: string) => {
    if (performance.now() - S.current.dragEnd < 120) return;
    S.current.lastInput = performance.now();
    setOpen(id);
  };
  useLayoutEffect(() => {
    if (open === null || closing || !figRef.current) return;
    const from = items.current.get(open)?.getBoundingClientRect();
    if (from && !S.current.reduced) {
      const to = figRef.current.getBoundingClientRect();
      figRef.current.animate([{ transform: flight(from, to) }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(0.7, 0, 0.2, 1)' });
    }
    rootRef.current?.querySelector<HTMLElement>('.gb-lb-close')?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const closeCard = () => {
    if (open === null || closing) return;
    const id = open;
    const from = items.current.get(id)?.getBoundingClientRect();
    if (!from || !figRef.current || S.current.reduced) {
      setOpen(null);
      return;
    }
    setClosing(true);
    const to = figRef.current.getBoundingClientRect();
    figRef.current
      .animate([{ transform: 'none' }, { transform: flight(from, to) }], { duration: 520, easing: 'cubic-bezier(0.7, 0, 0.2, 1)' })
      .finished.then(
        () => {
          setOpen(null);
          setClosing(false);
          items.current.get(id)?.focus({ preventScroll: true });
        },
        () => {
          setOpen(null);
          setClosing(false);
        },
      );
  };
  const step = (dir: number) => {
    if (open === null) return;
    const i = ordered.findIndex((c) => c.e.id === open);
    setOpen(ordered[(i + dir + ordered.length) % ordered.length].e.id);
  };
  useEffect(() => {
    if (open === null) return;
    const onKeyDoc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') closeCard();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKeyDoc);
    return () => document.removeEventListener('keydown', onKeyDoc);
  });
  // 라이트박스가 열린 채 방치되면 20초 뒤 자동으로 닫힘 (전시장 화면)
  useEffect(() => {
    if (open === null) return;
    const t = setTimeout(closeCard, 20000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openEntry = open ? cards.find((c) => c.e.id === open) : undefined;
  const clock = !now ? '--:--:--' : new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
  const letters = [...'GUESTBOOK'];
  const nowPerf = typeof performance !== 'undefined' ? performance.now() : 0;

  return (
    <div
      ref={rootRef}
      className="gb-root"
      onPointerDownCapture={() => {
        if (!soundOn) enableSound();
      }}
    >
      <div
        className={`gb is-${mode}${activeLabel ? ' has-cat' : ''}${open ? ' is-open' : ''}${heroId ? ' has-hero' : ''}`}
        style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {/* ---------- 헤더 ---------- */}
        <header className="gb-top">
          <nav className="gb-nav">
            <span aria-current="page">방명록 <i className="gb-live" aria-hidden /> Live</span>
            <a href="/g" target="_blank" rel="noreferrer">Write</a>
          </nav>
          <div className="gb-mark-wrap">
            <h1 className="gb-mark" aria-label="Guestbook — 컴퓨터소프트웨어과 졸업작품전">
              {letters.map((ch, i) => (
                <span key={i} aria-hidden style={{ '--i': i } as CSSProperties}>{ch}</span>
              ))}
            </h1>
            <p className="gb-sub">컴퓨터소프트웨어과 졸업작품전 2026</p>
          </div>
          <nav className="gb-nav is-right">
            <button type="button" className={soundOn ? 'is-on' : ''} onClick={(e) => { e.stopPropagation(); if (!soundOn) enableSound(); }} aria-pressed={soundOn}>
              {soundOn ? 'Sound on' : 'Sound off'}
            </button>
          </nav>
        </header>

        {/* ---------- 테이블 ---------- */}
        <div
          className={`gb-stage${grabbing ? ' is-grabbing' : ''}`}
          tabIndex={0}
          aria-label="끝없는 테이블 위의 방명록 메시지들. 끌거나 화살표 키로 둘러보세요."
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onDragStart={(e) => e.preventDefault()}
          onKeyDown={onKey}
        >
          <div ref={worldRef} className="gb-world">
            <svg className="gb-lines" width={W} height={H} aria-hidden>
              {cards.map((c) => (
                <line key={c.e.id} ref={(el) => { if (el) lines.current.set(c.e.id, el); else lines.current.delete(c.e.id); }} />
              ))}
              {[0, 1, 2].map((i) => (
                <circle key={i} ref={(el) => { ringRefs.current[i] = el; }} className="gb-ring" r={0} />
              ))}
            </svg>
            {cards.map((c) => {
              const sl = SLOTS[c.slot];
              const p = projOf(c.e.project);
              return (
                <button
                  key={c.e.id}
                  ref={(el) => { if (el) items.current.set(c.e.id, el); else items.current.delete(c.e.id); }}
                  type="button"
                  className={`gb-card${sl.dark ? ' is-dark' : ''}${hover === c.e.id ? ' is-hover' : ''}${activeLabel === c.e.project ? ' is-cat' : ''}${heroId === c.e.id ? ' is-hero' : ''}${open === c.e.id ? ' is-flying' : ''}`}
                  style={{ '--rot': `${sl.rot.toFixed(2)}deg` } as CSSProperties}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(c.e.id)}
                  onPointerLeave={() => setHover('')}
                  onFocus={() => setHover(c.e.id)}
                  onBlur={() => setHover('')}
                  onClick={() => openCard(c.e.id)}
                  aria-label={`${p?.name}에게: ${c.e.text} — ${c.e.nick}`}
                >
                  <span className="gb-card-in">
                    <span className="gb-card-top">№{pad2(IDX[c.e.project] ?? 0)} · {p?.name}</span>
                    <span className={`gb-card-txt ${fontClass(c.e.text)}`}>{c.e.text}</span>
                    <span className="gb-card-by">— {c.e.nick}<em>{ago(c.e.createdAt, now)}</em></span>
                  </span>
                </button>
              );
            })}
          </div>
          {!cards.length && (
            <p className="gb-empty">
              아직 테이블이 비어 있어요.
              <br />
              QR을 찍고 첫 번째 메시지를 쏘아주세요.
            </p>
          )}
        </div>

        {/* ---------- 라벨끼리의 연결 (같은 사람이 남긴 프로젝트들) ---------- */}
        <svg className="gb-links" width={W} height={H} aria-hidden>
          {links.map((l) => {
            const a = anchorOf(l.a);
            const b = anchorOf(l.b);
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            const cx = lerp(mx, W / 2, 0.45), cy = lerp(my, H / 2, 0.45);
            const isNew = nowPerf - l.born < 2400;
            const on = activeLabel && (activeLabel === l.a || activeLabel === l.b);
            return (
              <path
                key={linkKey(l.a, l.b) + (isNew ? ':new' : '')}
                d={`M${a.x},${a.y} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x},${b.y}`}
                pathLength={1}
                className={`gb-link${isNew ? ' is-new' : ''}${on ? ' is-on' : ''}`}
                style={{ strokeWidth: 0.75 + Math.min(2, (l.w - 1) * 0.5), animationDelay: isNew ? `${Math.max(0, l.born - nowPerf)}ms` : undefined }}
              />
            );
          })}
        </svg>

        {/* ---------- 프로젝트 라벨 ---------- */}
        <div className="gb-labels">
        {LABELS.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`gb-cat${hit?.id === l.id ? ' is-hit' : ''}${activeLabel === l.id ? ' is-on' : ''}`}
            style={{ left: l.x - 4, top: l.y }}
            aria-pressed={lockLabel === l.id}
            onPointerEnter={() => setHoverLabel(l.id)}
            onPointerLeave={() => setHoverLabel('')}
            onFocus={() => setHoverLabel(l.id)}
            onBlur={() => setHoverLabel('')}
            onClick={() => setLockLabel((x) => (x === l.id ? '' : l.id))}
          >
            <i className="gb-dot" aria-hidden />
            <span className="gb-cat-no">{pad2(l.n)}</span>
            <span className="gb-cat-nm">{l.name}</span>
            <sup key={counts[l.id] ?? 0}>{counts[l.id] ?? 0}</sup>
          </button>
        ))}
        </div>

        {/* ---------- 지구본 ---------- */}
        <GlobeView width={W} height={H} scale={scale} active={mode === 'globe'} reduced={reduced} data={shared} apiRef={globeApi} />

        {/* ---------- QR ---------- */}
        <aside className="gb-qr">
          <div className="gb-qr-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr && <img src={qr} alt="방명록 쓰기 QR 코드" />}
          </div>
          <p className="gb-small">Scan to write</p>
          <p className="gb-qr-title">폰으로 찍고<br />메시지 쏘기</p>
          <p className="gb-small is-mute">{joinUrl}</p>
        </aside>

        {/* ---------- 날아오는 카드 (헤더/푸터보다 위) ---------- */}
        <div className="gb-fly-layer" aria-hidden>
          <svg width={W} height={H}>
            <polyline ref={trailRef} className="gb-trail" points="" />
          </svg>
          <div ref={flyerRef} className={`gb-card gb-flyer${flyEntry && SLOTS[cards.find((c) => c.e.id === flyEntry.id)?.slot ?? 0]?.dark ? ' is-dark' : ''}`} aria-hidden>
            {flyEntry && (
              <span className="gb-card-in">
                <span className="gb-card-top">№{pad2(IDX[flyEntry.project] ?? 0)} · {nameOf(flyEntry.project)}</span>
                <span className={`gb-card-txt ${fontClass(flyEntry.text)}`}>{flyEntry.text}</span>
                <span className="gb-card-by">— {flyEntry.nick}<em>방금</em></span>
              </span>
            )}
          </div>
        </div>

        {/* ---------- 새 연결 토스트 ---------- */}
        <div className="gb-toast-wrap" aria-live="polite">
          {toast && (
            <div key={toast.n} className="gb-toast">
              <span>New link</span>
              <b>{toast.text}</b>
            </div>
          )}
        </div>

        {/* ---------- 사운드 안내 ---------- */}
        {!soundOn && (
          <button type="button" className="gb-sound" onClick={enableSound}>
            <i aria-hidden>♪</i> 화면을 한 번 눌러 사운드 켜기
          </button>
        )}

        {/* ---------- 푸터 ---------- */}
        <footer className="gb-bottom">
          <p className="gb-meta">Seoul {clock}</p>
          <div className="gb-switch">
            <span aria-hidden className={mode === 'table' ? 'is-on' : ''}>Table</span>
            <button
              type="button"
              role="switch"
              aria-checked={mode === 'globe'}
              aria-label="지구본 보기"
              onClick={() => {
                S.current.lastInput = performance.now();
                setMode((m) => (m === 'table' ? 'globe' : 'table'));
              }}
            >
              <i />
            </button>
            <span aria-hidden className={mode === 'globe' ? 'is-on' : ''}>Globe</span>
          </div>
          <p className="gb-meta is-right">
            {total} messages · {links.length} links · {mode === 'table' ? 'drag to explore' : 'live network'}
          </p>
        </footer>

        {/* ---------- 라이트박스 ---------- */}
        {openEntry && (
          <div className={`gb-lb${closing ? ' is-closing' : ''}`} role="dialog" aria-modal="true" aria-label={`${nameOf(openEntry.e.project)}에게 남긴 메시지`}>
            <button className="gb-lb-close" type="button" onClick={closeCard} aria-label="닫기">Close <span aria-hidden>×</span></button>
            <div ref={figRef} className={`gb-lb-fig${SLOTS[openEntry.slot].dark ? ' is-dark' : ''}`}>
              <span className="gb-card-top">№{pad2(IDX[openEntry.e.project] ?? 0)} · {nameOf(openEntry.e.project)} · {projOf(openEntry.e.project)?.team}</span>
              <span className="gb-lb-txt">{openEntry.e.text}</span>
              <span className="gb-card-by">— {openEntry.e.nick}<em>{ago(openEntry.e.createdAt, now)}</em></span>
            </div>
            <button className="gb-lb-arrow is-prev" type="button" onClick={() => step(-1)} aria-label="이전 메시지"><span /></button>
            <button className="gb-lb-arrow is-next" type="button" onClick={() => step(1)} aria-label="다음 메시지"><span /></button>
            <div className="gb-lb-cap" key={openEntry.e.id}>
              <p className="gb-small is-mute">{pad2(ordered.findIndex((c) => c.e.id === openEntry.e.id) + 1)} / {pad2(ordered.length)}</p>
              <p className="gb-lb-title">{nameOf(openEntry.e.project)}</p>
              <p className="gb-small is-mute">{projOf(openEntry.e.project)?.team} · {projOf(openEntry.e.project)?.desc}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
