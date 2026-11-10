'use client';

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { PROJECTS, projectPositions } from '@/lib/projects';
import type { GlobeApi, PublicEntry, SharedData } from './types';
import { pad2 } from './types';

// 지구본 모드: 크림색 종이 위에 잉크로 찍은 ASCII 구. 노드 = 프로젝트, 호 = 같은 사람이 남긴 연결.
type V3 = [number, number, number];

const TILT = 0.32;
const DOTS = 1500;
const RAMP = ' .·:-=+*x#%@';
const SPARKS = '+*x#/\\=·';
const INK = '33,29,23';
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const IDX = Object.fromEntries(PROJECTS.map((p, i) => [p.id, i + 1]));
const nameOf = (id: string) => PROJECTS.find((p) => p.id === id)?.name ?? id;

interface Props {
  width: number;
  height: number;
  scale: number;
  active: boolean;
  reduced: boolean;
  data: MutableRefObject<SharedData>;
  apiRef: MutableRefObject<GlobeApi | null>;
}

export default function GlobeView({ width, height, scale, active, reduced, data, apiRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [card, setCard] = useState<PublicEntry | null>(null);
  const [cardOn, setCardOn] = useState(false);
  const S = useRef({
    a: 0.3,
    zoom: 1,
    scale,
    active,
    reduced,
    shot: null as null | { entry: PublicEntry; phase: 'turn' | 'fly' | 'impact'; t0: number; fromA: number; toA: number; onImpact: () => void; done: () => void },
    hits: [] as { id: string; t0: number }[],
    sparks: [] as { x: number; y: number; vx: number; vy: number; life: number; g: string }[],
    shake: 0,
  });
  S.current.scale = scale;
  S.current.active = active;
  S.current.reduced = reduced;

  const nodes = useRef(
    projectPositions().map((p) => {
      const la = (p.lat * Math.PI) / 180;
      const lo = (p.lon * Math.PI) / 180;
      return { id: p.id, name: p.name, lon: lo, v: [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)] as V3 };
    }),
  );
  const dots = useRef<V3[]>([]);
  if (!dots.current.length) {
    const g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < DOTS; i++) {
      const y = 1 - (i / (DOTS - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      dots.current.push([Math.cos(g * i) * r, y, Math.sin(g * i) * r]);
    }
  }

  useEffect(() => {
    apiRef.current = {
      shoot(entry, onImpact) {
        return new Promise<void>((done) => {
          const s = S.current;
          const node = nodes.current.find((n) => n.id === entry.project);
          if (!node) {
            onImpact();
            done();
            return;
          }
          let toA = node.lon - Math.PI / 2;
          while (toA - s.a > Math.PI) toA -= Math.PI * 2;
          while (toA - s.a < -Math.PI) toA += Math.PI * 2;
          toA -= 0.3; // 노드를 살짝 왼쪽에 두고 오른쪽에 메시지 카드
          s.shot = { entry, phase: 'turn', t0: performance.now(), fromA: s.a, toA, onImpact, done };
        });
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef]);

  useEffect(() => {
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext('2d')!;
    const s = S.current;
    let raf = 0;
    let last = performance.now();
    let px = 1;
    let built = -1;
    const atlas = document.createElement('canvas');
    const actx = atlas.getContext('2d')!;
    const GLYPH = 13;
    let cell = 16;

    function build() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      px = s.scale * dpr;
      cvs.width = Math.round(width * px);
      cvs.height = Math.round(height * px);
      const fs = Math.max(6, Math.round(GLYPH * px));
      cell = Math.ceil(fs * 1.1);
      atlas.width = cell * RAMP.length;
      atlas.height = cell;
      actx.clearRect(0, 0, atlas.width, atlas.height);
      actx.fillStyle = `rgb(${INK})`;
      actx.font = `500 ${fs}px "IBM Plex Mono", monospace`;
      actx.textAlign = 'center';
      actx.textBaseline = 'middle';
      for (let i = 0; i < RAMP.length; i++) actx.fillText(RAMP[i], i * cell + cell / 2, cell / 2 + 1);
      built = s.scale;
    }
    build();
    document.fonts?.ready.then(build).catch(() => undefined);

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(50, now - last);
      last = now;
      const shot = s.shot;
      if (!s.active && !shot) return;
      if (built !== s.scale) build();
      ctx.setTransform(px, 0, 0, px, 0, 0);
      const W = width;
      const H = height;

      // ---- 시퀀스: 회전 → 비행 → 도착
      if (shot) {
        const el = now - shot.t0;
        if (shot.phase === 'turn') {
          const k = s.reduced ? 1 : Math.min(1, el / 1000);
          s.a = lerp(shot.fromA, shot.toA, easeInOut(k));
          if (k >= 1) {
            shot.phase = 'fly';
            shot.t0 = now;
          }
        } else if (shot.phase === 'fly' && el >= (s.reduced ? 0 : 1250)) {
          shot.phase = 'impact';
          shot.t0 = now;
          s.hits.push({ id: shot.entry.project, t0: now });
          s.shake = s.reduced ? 0 : 14;
          shot.onImpact();
          setCard(shot.entry);
          setCardOn(true);
        } else if (shot.phase === 'impact' && el >= 3200) {
          s.shot = null;
          setCardOn(false);
          shot.done();
        }
      } else if (!s.reduced) {
        s.a += dt * 0.00007;
      }
      s.zoom = lerp(s.zoom, shot && shot.phase !== 'turn' ? 1.12 : 1, 0.04);
      s.shake *= 0.9;

      const R = Math.min(W, H) * 0.34 * s.zoom;
      const cx = W * 0.5;
      const cy = H * 0.5;
      const ca = Math.cos(s.a), sa = Math.sin(s.a), ct = Math.cos(TILT), st = Math.sin(TILT);
      const proj = (v: V3, lift = 1) => {
        const x = v[0] * lift, y = v[1] * lift, z = v[2] * lift;
        const x1 = x * ca + z * sa;
        const z1 = -x * sa + z * ca;
        const yv = y * ct - z1 * st;
        const zv = y * st + z1 * ct;
        return { X: cx + R * x1, Y: cy - R * yv, z: zv, nx: x1, ny: yv };
      };

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      if (s.shake > 0.3) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);

      // 외곽 눈금 링
      ctx.strokeStyle = `rgba(${INK},0.2)`;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.07, 0, Math.PI * 2);
      ctx.stroke();
      for (let k = 0; k < 96; k++) {
        const ang = (k / 96) * Math.PI * 2 + s.a * 0.5;
        const r1 = R * 1.07, r2 = R * (k % 8 === 0 ? 1.115 : 1.09);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
        ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
        ctx.stroke();
      }

      const vec = Object.fromEntries(nodes.current.map((n) => [n.id, n.v]));
      s.hits = s.hits.filter((h) => now - h.t0 < 1800);
      const waves = s.hits.map((h) => ({ v: vec[h.id], t: (now - h.t0) / 1800 })).filter((w) => w.v);

      // ---- ASCII 점 구름: 빛 방향에 따라 글자가 바뀜
      const Ln = Math.hypot(-0.45, 0.55, 0.7);
      const lx = -0.45 / Ln, ly = 0.55 / Ln, lz = 0.7 / Ln;
      const cs = cell / px;
      for (const d of dots.current) {
        let lift = 1;
        let boost = 0;
        for (const w of waves) {
          const ang = Math.acos(Math.max(-1, Math.min(1, d[0] * w.v[0] + d[1] * w.v[1] + d[2] * w.v[2])));
          const dd = Math.abs(ang - easeOut(w.t) * 1.9);
          if (dd < 0.12) {
            const k = (1 - dd / 0.12) * (1 - w.t);
            boost = Math.max(boost, k);
            lift = Math.max(lift, 1 + 0.06 * k);
          }
        }
        const q = proj(d, lift);
        if (q.z <= 0) {
          if (q.z < -0.5) continue;
          ctx.globalAlpha = 0.14;
          ctx.drawImage(atlas, 2 * cell, 0, cell, cell, q.X - cs / 2, q.Y - cs / 2, cs, cs);
          continue;
        }
        const lum = Math.max(0, q.nx * lx + q.ny * ly + q.z * lz);
        const b = Math.min(1, 0.1 + lum * 0.9 + boost);
        const gi = Math.max(1, Math.min(RAMP.length - 1, Math.round(b * (RAMP.length - 1))));
        ctx.globalAlpha = Math.min(1, 0.25 + 0.65 * q.z + boost);
        ctx.drawImage(atlas, gi * cell, 0, cell, cell, q.X - cs / 2, q.Y - cs / 2, cs, cs);
      }
      ctx.globalAlpha = 1;

      // ---- 연결선 (솟은 호 + 흐르는 패킷)
      const SEG = 40;
      for (const l of data.current.links) {
        const u = vec[l.a];
        const w = vec[l.b];
        if (!u || !w) continue;
        const age = now - l.born;
        if (age < 0) continue;
        const draw = s.reduced ? 1 : Math.min(1, age / 900);
        const fl = Math.max(0, 1 - age / 2600);
        const pts: ReturnType<typeof proj>[] = [];
        for (let k = 0; k <= SEG; k++) {
          const t = k / SEG;
          const m: V3 = [lerp(u[0], w[0], t), lerp(u[1], w[1], t), lerp(u[2], w[2], t)];
          const len = Math.hypot(...m) || 1;
          pts.push(proj([m[0] / len, m[1] / len, m[2] / len], 1 + 0.22 * Math.sin(Math.PI * t)));
        }
        const upto = Math.floor(draw * SEG);
        for (let k = 1; k <= upto; k++) {
          const z = (pts[k].z + pts[k - 1].z) / 2;
          ctx.strokeStyle = `rgba(${INK},${Math.min(1, (z > 0 ? 0.45 + 0.45 * z : 0.14) + fl)})`;
          ctx.lineWidth = (z > 0 ? 1 : 0.75) + Math.min(2.5, (l.w - 1) * 0.6) + fl * 2.5;
          if (z <= 0) ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.moveTo(pts[k - 1].X, pts[k - 1].Y);
          ctx.lineTo(pts[k].X, pts[k].Y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (draw < 1) {
          const h = pts[upto];
          ctx.fillStyle = `rgb(${INK})`;
          ctx.fillRect(h.X - 4, h.Y - 4, 8, 8);
        } else if (!s.reduced) {
          const seed = (l.a.charCodeAt(0) * 31 + l.b.charCodeAt(1) * 17) % 100;
          for (let j = 0; j < 2; j++) {
            let t = (now / 2600 + seed / 100 + j * 0.5) % 1;
            if (j === 1) t = 1 - t;
            const p = pts[Math.round(t * SEG)];
            if (p.z <= 0) continue;
            ctx.fillStyle = `rgba(${INK},${0.5 + 0.5 * p.z})`;
            ctx.fillRect(p.X - 2.5, p.Y - 2.5, 5, 5);
          }
        }
      }

      // ---- 노드 + 라벨
      const placed = nodes.current.map((n) => ({ ...n, q: proj(n.v) }));
      const counts = data.current.counts;
      for (const n of [...placed].sort((a, b) => a.q.z - b.q.z)) {
        const c = counts[n.id] ?? 0;
        const r = 4 + Math.sqrt(c) * 2.4;
        const isTarget = shot?.entry.project === n.id;
        if (n.q.z > 0) {
          ctx.strokeStyle = `rgba(${INK},${0.25 + 0.5 * n.q.z})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.arc(n.q.X, n.q.Y, r + 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = `rgb(${INK})`;
          ctx.fillRect(n.q.X - r / 2 - 2, n.q.Y - r / 2 - 2, r + 4, r + 4);
        } else {
          ctx.strokeStyle = `rgba(${INK},0.3)`;
          ctx.lineWidth = 0.75;
          ctx.strokeRect(n.q.X - 4, n.q.Y - 4, 8, 8);
        }
        if (n.q.z > 0.05) {
          ctx.globalAlpha = Math.min(1, 0.15 + n.q.z * 1.3);
          const label = `${pad2(IDX[n.id])}  ${n.name.toUpperCase()}`;
          ctx.font = '500 13px "IBM Plex Mono", monospace';
          const tw = ctx.measureText(label).width;
          const x0 = n.q.X + r + 14;
          const y0 = n.q.Y - 12;
          ctx.fillStyle = isTarget ? `rgb(${INK})` : 'rgba(243,237,221,0.92)';
          ctx.fillRect(x0, y0, tw + 18, 24);
          ctx.strokeStyle = `rgb(${INK})`;
          ctx.strokeRect(x0 + 0.5, y0 + 0.5, tw + 17, 23);
          ctx.fillStyle = isTarget ? '#f3eddd' : `rgb(${INK})`;
          ctx.textBaseline = 'middle';
          ctx.fillText(label, x0 + 9, y0 + 12.5);
          ctx.font = '500 11px "IBM Plex Mono", monospace';
          ctx.fillStyle = `rgba(${INK},0.6)`;
          ctx.fillText(`${c}`, x0 + tw + 24, y0 + 4);
          ctx.textBaseline = 'alphabetic';
          ctx.globalAlpha = 1;
        }
      }

      // ---- 충격파
      for (const h of s.hits) {
        const n = placed.find((p) => p.id === h.id);
        if (!n) continue;
        for (let k = 0; k < 3; k++) {
          const t = (now - h.t0 - k * 160) / 1300;
          if (t <= 0 || t >= 1) continue;
          ctx.strokeStyle = `rgba(${INK},${(1 - t) * 0.8})`;
          ctx.lineWidth = 2.5 - k * 0.6;
          ctx.beginPath();
          ctx.arc(n.q.X, n.q.Y, 10 + easeOut(t) * 300, 0, Math.PI * 2);
          ctx.stroke();
        }
        const ct2 = (now - h.t0) / 700;
        if (ct2 < 1) {
          const len = 40 + 160 * easeOut(ct2);
          ctx.strokeStyle = `rgba(${INK},${1 - ct2})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(n.q.X - len, n.q.Y);
          ctx.lineTo(n.q.X + len, n.q.Y);
          ctx.moveTo(n.q.X, n.q.Y - len);
          ctx.lineTo(n.q.X, n.q.Y + len);
          ctx.stroke();
        }
        if (now - h.t0 < 40 && s.sparks.length < 200 && !s.reduced) {
          for (let k = 0; k < 48; k++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = 2 + Math.random() * 8;
            s.sparks.push({ x: n.q.X, y: n.q.Y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, g: SPARKS[(Math.random() * SPARKS.length) | 0] });
          }
        }
      }
      s.sparks = s.sparks.filter((p) => p.life > 0);
      ctx.font = '500 16px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const p of s.sparks) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life -= 0.018;
        ctx.fillStyle = `rgba(${INK},${p.life})`;
        ctx.fillText(p.g, p.x, p.y);
      }

      // ---- 혜성: 메시지 글자가 꼬리가 되어 날아감
      if (shot && shot.phase === 'fly') {
        const n = placed.find((p) => p.id === shot.entry.project)!;
        const sx = cx + R * 0.2, sy = H + 80;
        const ex = n.q.X, ey = n.q.Y;
        const qx = (sx + ex) / 2 + R * 0.8, qy = Math.min(sy, ey) + R * 0.1;
        const bez = (t: number) => ({ x: (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * qx + t * t * ex, y: (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * qy + t * t * ey });
        const p = easeInOut(Math.min(1, (now - shot.t0) / 1250));
        ctx.strokeStyle = `rgba(${INK},0.35)`;
        ctx.setLineDash([2, 6]);
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        for (let k = 0; k <= 30; k++) {
          const b = bez((k / 30) * p);
          if (k) ctx.lineTo(b.x, b.y);
          else ctx.moveTo(b.x, b.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        for (let k = 28; k >= 0; k--) {
          const t = p - k * 0.01;
          if (t < 0) continue;
          const b = bez(t);
          const a = 1 - k / 28;
          ctx.fillStyle = `rgba(${INK},${a * 0.85})`;
          ctx.beginPath();
          ctx.arc(b.x, b.y, (2 + a * 10) / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        const chars = [...shot.entry.text.replace(/\s+/g, ' ')].slice(0, 40);
        ctx.font = '500 22px "IBM Plex Sans KR", sans-serif';
        chars.forEach((ch, i) => {
          const t = p - 0.03 - i * 0.022;
          if (t < 0) return;
          const b = bez(t);
          const a = Math.max(0, 1 - i / chars.length) * Math.min(1, t * 8);
          ctx.fillStyle = `rgba(${INK},${a})`;
          ctx.fillText(ch, b.x + Math.sin(i * 1.7 + now / 90) * 6, b.y + Math.cos(i * 1.3 + now / 110) * 6);
        });
        const h = bez(p);
        ctx.fillStyle = `rgb(${INK})`;
        ctx.beginPath();
        ctx.arc(h.x, h.y, 11, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.restore();

      if (shot && cardRef.current) {
        const n = placed.find((p) => p.id === shot.entry.project);
        if (n) {
          const x = Math.max(40, Math.min(W - 520, n.q.X + 70));
          const y = Math.max(140, Math.min(H - 380, n.q.Y + 40));
          cardRef.current.style.transform = `translate(${x}px, ${y}px)`;
        }
      }
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [width, height, data]);

  return (
    <div className={`gb-globe${active ? ' is-on' : ''}`} aria-hidden={!active}>
      <canvas ref={canvasRef} style={{ width, height }} role="img" aria-label="프로젝트가 노드로, 후기로 생긴 연결이 선으로 그려진 회전하는 지구본" />
      <div ref={cardRef} className={`gb-globe-card${cardOn ? ' on' : ''}`} aria-live="polite">
        {card && (
          <>
            <span className="gb-small">№{pad2(IDX[card.project] ?? 0)} · {nameOf(card.project)}</span>
            <b>{card.text}</b>
            <span className="gb-small">— {card.nick} · 방금</span>
          </>
        )}
      </div>
    </div>
  );
}
