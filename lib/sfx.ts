// 효과음 — 전부 Web Audio로 합성 (음원 파일 없음, 저작권 걱정 없음)
let ctx: AudioContext | null = null;

export function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
  return ctx;
}

function noise(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

/** 발사: 슈우욱 (노이즈 + 올라가는 필터 + 피치 업 톤) */
export function whoosh(duration = 0.9, volume = 0.6) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const n = noise(c, duration);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.exponentialRampToValueAtTime(4200, t + duration * 0.85);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + duration * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  n.connect(bp).connect(g).connect(c.destination);
  n.start(t);
  n.stop(t + duration);

  const o = c.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(900, t + duration);
  const og = c.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(volume * 0.12, t + duration * 0.4);
  og.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1800;
  o.connect(lp).connect(og).connect(c.destination);
  o.start(t);
  o.stop(t + duration);
}

/** 도착: 쾅 (저음 킥 + 노이즈 버스트) + 반짝 차임 */
export function boom(volume = 0.9) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(38, t + 0.55);
  const g = c.createGain();
  g.gain.setValueAtTime(volume, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.75);

  const n = noise(c, 0.5);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(2500, t);
  lp.frequency.exponentialRampToValueAtTime(200, t + 0.45);
  const ng = c.createGain();
  ng.gain.setValueAtTime(volume * 0.5, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  n.connect(lp).connect(ng).connect(c.destination);
  n.start(t);
  n.stop(t + 0.5);

  [1568, 2349, 3136].forEach((f, i) => {
    const s = c.createOscillator();
    s.type = 'triangle';
    s.frequency.value = f;
    const sg = c.createGain();
    const st = t + 0.05 + i * 0.06;
    sg.gain.setValueAtTime(0.0001, st);
    sg.gain.exponentialRampToValueAtTime(volume * 0.12, st + 0.01);
    sg.gain.exponentialRampToValueAtTime(0.0001, st + 0.5);
    s.connect(sg).connect(c.destination);
    s.start(st);
    s.stop(st + 0.55);
  });
}

/** 새 연결선: 띵띵 */
export function ding(volume = 0.4) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  [880, 1318.5].forEach((f, i) => {
    const s = c.createOscillator();
    s.type = 'sine';
    s.frequency.value = f;
    const g = c.createGain();
    const st = t + i * 0.14;
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(volume, st + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, st + 0.6);
    s.connect(g).connect(c.destination);
    s.start(st);
    s.stop(st + 0.65);
  });
}
