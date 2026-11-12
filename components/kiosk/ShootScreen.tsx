'use client';

import { Gear, GearLoader } from '@/components/brand';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FILTERS, SLOT_ASPECT } from '@/lib/strip';
import { beep, shutter } from '@/lib/sfx';
import { TOTAL_SHOTS, type Patch, type Session, type Shot } from './session';
import { ArrowLeft, TopBar } from './ui';

type Phase = 'init' | 'ready' | 'shooting' | 'error';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function makeThumb(src: HTMLCanvasElement) {
  const t = document.createElement('canvas');
  const w = 360;
  t.width = w;
  t.height = Math.round((w * src.height) / src.width);
  t.getContext('2d')?.drawImage(src, 0, 0, t.width, t.height);
  return t.toDataURL('image/jpeg', 0.8);
}

/** 카메라가 없을 때(개발·리허설용) 쓰는 테스트 이미지 */
function fakeFrame(n: number) {
  const c = document.createElement('canvas');
  c.width = 1480;
  c.height = 1000;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = n % 2 ? '#bdbdbd' : '#8f8f8f';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(740, 430, 170, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(480, 640, 520, 360);
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 72px "IBM Plex Mono", monospace';
  ctx.fillText(`SHOT_0${n}`, 60, 120);
  return c;
}

export default function ShootScreen({ session, patch, onCancel, onDone }: { session: Session; patch: Patch; onCancel: () => void; onDone: (shots: Shot[]) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const aliveRef = useRef(true);
  const [phase, setPhase] = useState<Phase>('init');
  const [fake, setFake] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState<number | null>(null);
  const [flash, setFlash] = useState(0);
  const [shots, setShots] = useState<Shot[]>([]);
  const [log, setLog] = useState<string[]>(['> camera.init()']);

  const addLog = (line: string) => setLog((l) => [...l.slice(-9), line]);
  // 움짤용: 촬영하는 동안 0.1초마다 작은 화면을 계속 담아두고, 셔터 직전 1.2초를 잘라 씀
  const ringRef = useRef<HTMLCanvasElement[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  function grabSmall(src?: CanvasImageSource & { width?: number; height?: number }): HTMLCanvasElement | null {
    const v = videoRef.current;
    const from = src ?? v;
    const w0 = src ? (src.width as number) : v?.videoWidth;
    const h0 = src ? (src.height as number) : v?.videoHeight;
    if (!from || !w0 || !h0) return null;
    const c = document.createElement('canvas');
    c.width = 480;
    c.height = Math.round((480 * h0) / w0);
    const ctx = c.getContext('2d')!;
    if (!src) {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(from, 0, 0, c.width, c.height);
    return c;
  }
  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
  }, []);

  const openCamera = useCallback(async () => {
    setPhase('init');
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
        audio: false,
      });
      if (!aliveRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      addLog('> camera ready ... OK');
      setPhase('ready');
    } catch (e) {
      const name = (e as Error).name;
      setError(name === 'NotAllowedError' ? '카메라 권한이 거부됐어요. 브라우저 주소창의 카메라 권한을 허용해 주세요.' : '카메라를 찾을 수 없어요. 연결 상태를 확인해 주세요.');
      addLog(`> camera.init() ... FAIL (${name})`);
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    openCamera();
    return () => {
      aliveRef.current = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [openCamera]);

  function capture(n: number): HTMLCanvasElement {
    const v = videoRef.current;
    if (fake || !v || !v.videoWidth) return fakeFrame(n);
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d')!;
    // 미리보기처럼 거울 모드로 저장
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0);
    return c;
  }

  async function run() {
    setPhase('shooting');
    const taken: Shot[] = [];
    setShots([]);
    ringRef.current = [];
    if (!fake)
      tickRef.current = setInterval(() => {
        const f = grabSmall();
        if (!f) return;
        ringRef.current.push(f);
        if (ringRef.current.length > 14) ringRef.current.shift();
      }, 100);
    for (let i = 0; i < TOTAL_SHOTS; i++) {
      addLog(`> capture[${i}] ... ${session.timer}s`);
      for (let s = session.timer; s > 0; s--) {
        if (!aliveRef.current) return;
        setCount(s);
        beep(s === 1);
        await sleep(1000);
      }
      if (!aliveRef.current) return;
      setCount(null);
      shutter();
      const canvas = capture(i + 1);
      const last = grabSmall(canvas);
      const clip = ringRef.current.length >= 6 && last ? [...ringRef.current.slice(-11), last] : undefined;
      const shot: Shot = { canvas, thumb: makeThumb(canvas), clip };
      taken.push(shot);
      setShots([...taken]);
      setFlash((f) => f + 1);
      addLog(`> capture[${i}] ... OK`);
      await sleep(900);
    }
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    addLog('> exit 0');
    await sleep(400);
    if (aliveRef.current) onDone(taken);
  }

  const shooting = phase === 'shooting';
  const corner = (pos: React.CSSProperties, sides: React.CSSProperties) => <span className="vf-corner" style={{ ...pos, ...sides }} />;
  const b = '3px';

  return (
    <div className="kiosk dark">
      <TopBar step={2} />
      <main className="body pad shoot-body" style={{ gap: 32 }}>
        <section className="viewfinder">
          <video ref={videoRef} playsInline muted style={{ display: fake ? 'none' : undefined, filter: FILTERS.find((f) => f.id === session.filter)?.css }} />
          <div className="vf-guide" style={{ aspectRatio: String(SLOT_ASPECT) }} aria-hidden="true" />
          {corner({ top: 20, left: 20 }, { borderTopWidth: b, borderLeftWidth: b })}
          {corner({ top: 20, right: 20 }, { borderTopWidth: b, borderRightWidth: b })}
          {corner({ bottom: 20, left: 20 }, { borderBottomWidth: b, borderLeftWidth: b })}
          {corner({ bottom: 20, right: 20 }, { borderBottomWidth: b, borderRightWidth: b })}
          <div className="vf-label vf-l" style={{ top: 34, left: 80 }}>
            <span className={shooting ? 'cursor' : ''} style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />
            {fake ? 'TEST MODE' : 'LIVE · CAM_01'}
          </div>
          <div className="vf-label vf-r" style={{ top: 34, right: 80 }}>
            SHOT {Math.min(shots.length + 1, TOTAL_SHOTS)} / {TOTAL_SHOTS}
          </div>

          {count !== null && (
            <div className="count" aria-live="assertive">
              <div className="count-gear">
                <Gear size={300} teeth={12} spin="slow" />
                <b key={count}>{count}</b>
              </div>
              <span className="mono" style={{ fontSize: 18, color: '#ddd' }}>compiling frame[{shots.length}]...</span>
            </div>
          )}

          {phase === 'ready' && (
            <div className="count">
              <button className="btn btn-primary shoot-go" style={{ minHeight: 96, fontSize: 28, padding: '0 56px' }} onClick={run}>
                촬영 시작 ({TOTAL_SHOTS}컷)
              </button>
              <span style={{ fontSize: 18, color: '#ddd', marginTop: 16 }}>{session.timer}초 간격으로 {TOTAL_SHOTS}장을 찍고, 그중 4장을 골라요</span>
            </div>
          )}

          {phase === 'init' && (
            <div className="count mono" style={{ fontSize: 18 }}>
              <GearLoader label="카메라 연결 중..." className="on-dark" />
            </div>
          )}

          {phase === 'error' && (
            <div className="count" style={{ padding: 40, textAlign: 'center' }}>
              <span style={{ fontSize: 22 }}>{error}</span>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn" onClick={openCamera}>다시 연결</button>
                <button
                  className="btn"
                  onClick={() => {
                    setFake(true);
                    addLog('> fallback: test images');
                    setPhase('ready');
                  }}
                >
                  테스트 이미지로 진행
                </button>
              </div>
            </div>
          )}

          {shooting && count !== null && (
            <div className="vf-tip" style={{ position: 'absolute', bottom: 34, left: 0, right: 0, textAlign: 'center', fontSize: 18, color: '#eee' }}>
              카메라를 보고 포즈! 브이 대신 <span className="mono">&lt;/&gt;</span> 손 모양 어때요?
            </div>
          )}
          {flash > 0 && <div key={flash} className="flash" />}
        </section>

        <aside className="shoot-side">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="mono" style={{ fontSize: 13, color: '#aaa' }}>CAPTURES</div>
            <div className="thumbs">
              {Array.from({ length: TOTAL_SHOTS }, (_, i) => {
                const s = shots[i];
                const now = shooting && i === shots.length;
                return (
                  <div key={i} className={s ? 'done' : now ? 'now' : ''}>
                    {s ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.thumb} alt={`${i + 1}번째 사진`} />
                    ) : (
                      `0${i + 1}`
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="log" aria-live="polite">
            {log.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
            <div style={{ color: '#fff' }}>
              &gt; <span className="cursor">_</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="mono" style={{ fontSize: 13, color: '#aaa' }}>TIMER</div>
            <div className="seg">
              {[3, 5, 10].map((t) => (
                <button key={t} className={session.timer === t ? 'on' : ''} disabled={shooting} onClick={() => patch({ timer: t })}>
                  {t}s
                </button>
              ))}
            </div>
          </div>
          <button className="btn" style={{ borderColor: '#fff' }} disabled={shooting} onClick={onCancel}>
            <ArrowLeft /> 프레임 다시 고르기
          </button>
        </aside>
      </main>
    </div>
  );
}
