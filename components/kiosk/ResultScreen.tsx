'use client';

import { Gear, GearLoader, SnakeLine } from '@/components/brand';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { ensureFonts, renderStrip } from '@/lib/strip';
import { pickedClips, stripOptions, type Session } from './session';
import { blobToDataUrl, encodeGif, motionFrames, recordVideo } from '@/lib/motion';
import { TopBar } from './ui';

const AUTO_RESET_SEC = 60;

type Upload = { state: 'uploading' } | { state: 'done'; id: string; url: string; qr: string } | { state: 'error' };

export default function ResultScreen({ session, onDone }: { session: Session; onDone: () => void }) {
  const [png, setPng] = useState<string | null>(null);
  const [jpg, setJpg] = useState<string | null>(null);
  const [upload, setUpload] = useState<Upload>({ state: 'uploading' });
  const [copies, setCopies] = useState(1);
  const [gallery, setGallery] = useState(false);
  const [left, setLeft] = useState(AUTO_RESET_SEC);
  const started = useRef(false);
  // 움직이는 네컷 (GIF · 영상)
  const [motion, setMotion] = useState<{ state: 'idle' | 'making' | 'done' | 'none'; gif?: string; video?: string; videoExt?: string }>({ state: 'idle' });
  const [showMotion, setShowMotion] = useState(false);
  const motionStarted = useRef(false);

  // 1) 최종 이미지 합성
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const opts = stripOptions(session);
      await ensureFonts(opts.message);
      const c = document.createElement('canvas');
      renderStrip(c, opts);
      setPng(c.toDataURL('image/png'));
      setJpg(c.toDataURL('image/jpeg', 0.92));
    })();
  }, [session]);

  // 2) 업로드 → QR
  async function doUpload(image: string) {
    setUpload({ state: 'uploading' });
    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, gallery, frame: session.frame }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { id, url } = (await res.json()) as { id: string; url: string };
      const qr = await QRCode.toDataURL(url, { margin: 1, width: 320, color: { dark: '#0a0a0a', light: '#ffffff' } });
      setUpload({ state: 'done', id, url, qr });
    } catch {
      setUpload({ state: 'error' });
    }
  }

  useEffect(() => {
    if (jpg) doUpload(jpg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jpg]);

  // 3) 사진이 올라가면: PNG + 움짤(GIF) + 영상을 만들어 같이 올림 → 휴대폰에서 받을 수 있게
  useEffect(() => {
    if (upload.state !== 'done' || !png || motionStarted.current) return;
    motionStarted.current = true;
    const id = upload.id;
    const push = (data: string) =>
      data.length < 5_400_000
        ? fetch(`/api/photos/${id}/assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) }).catch(() => undefined)
        : Promise.resolve(undefined);
    push(png);
    (async () => {
      const clips = pickedClips(session);
      if (!clips.some((c) => c?.length)) {
        setMotion({ state: 'none' });
        return;
      }
      setMotion({ state: 'making' });
      try {
        const opts = stripOptions(session);
        const small = motionFrames(opts, clips, 300);
        const gifBlob = await encodeGif(small);
        const gif = URL.createObjectURL(gifBlob);
        setMotion((m) => ({ ...m, state: 'making', gif }));
        setShowMotion(true);
        push(await blobToDataUrl(gifBlob));
        const vid = await recordVideo(motionFrames(opts, clips, 600));
        if (vid) {
          setMotion({ state: 'done', gif, video: URL.createObjectURL(vid.blob), videoExt: vid.ext });
          push(await blobToDataUrl(vid.blob));
        } else setMotion({ state: 'done', gif });
      } catch (e) {
        console.error(e);
        setMotion({ state: 'none' });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upload, png]);

  // 갤러리 동의 변경
  async function toggleGallery(v: boolean) {
    setGallery(v);
    if (upload.state === 'done') {
      await fetch(`/api/photos/${upload.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery: v }),
      }).catch(() => undefined);
    }
  }

  // 자동 복귀 카운트다운 (터치하면 다시 60초)
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    const bump = () => setLeft(AUTO_RESET_SEC);
    window.addEventListener('pointerdown', bump);
    return () => {
      clearInterval(t);
      window.removeEventListener('pointerdown', bump);
    };
  }, []);
  useEffect(() => {
    if (left <= 0) onDone();
  }, [left, onDone]);

  return (
    <div className="kiosk">
      <TopBar
        right={
          <div>
            BUILD #{session.hash} · <b>{png ? 'SUCCESS' : 'RUNNING'}</b>
          </div>
        }
      />
      <main className="body">
        <section className="result-left">
          <SnakeLine className="result-snake" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {png ? <img src={showMotion && motion.gif ? motion.gif : png} alt="완성된 네컷 사진" /> : <GearLoader label="building..." className="on-dark" />}
          {motion.gif && (
            <div className="motion-toggle" role="group" aria-label="사진 / 움직이는 네컷">
              <button className={!showMotion ? 'on' : ''} aria-pressed={!showMotion} onClick={() => setShowMotion(false)}>사진</button>
              <button className={showMotion ? 'on' : ''} aria-pressed={showMotion} onClick={() => setShowMotion(true)}>움짤</button>
            </div>
          )}
        </section>

        <section className="pad result-right" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 32, padding: '40px 56px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="prompt">&gt; build complete in 4 shots</div>
            <div className="result-gears" aria-hidden="true">
              <Gear size={46} fill spin="slow" />
              <Gear size={30} spin="rev" />
              <Gear size={38} fill spin="slow" />
            </div>
            <h1 className="h1 result-h1" style={{ fontSize: 60, lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              빌드 성공!
              <br />
              추억이 배포됐어요.
            </h1>
          </div>

          <div className="cards">
            <div className="card">
              <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>PRINT</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 17 }}>출력 매수</span>
                <div className="stepper">
                  <button aria-label="한 장 빼기" onClick={() => setCopies((c) => Math.max(1, c - 1))}>−</button>
                  <span>{copies}</span>
                  <button aria-label="한 장 더하기" onClick={() => setCopies((c) => Math.min(4, c + 1))}>+</button>
                </div>
              </div>
              <button className="btn btn-primary" disabled={!png} onClick={() => window.print()}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z" /></svg>
                {copies}장 인쇄하기
              </button>
            </div>

            <div className="card qr-card" style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
              <div className="qr">
                {upload.state === 'done' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={upload.qr} alt="휴대폰 저장용 QR 코드" />
                )}
                {upload.state === 'uploading' && <GearLoader label="pushing..." size={44} />}
                {upload.state === 'error' && 'QR 생성 실패'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>DOWNLOAD</div>
                {upload.state === 'error' ? (
                  <>
                    <div style={{ fontSize: 16 }}>업로드에 실패했어요. 인쇄는 그대로 가능해요.</div>
                    <button className="btn" style={{ minHeight: 48 }} onClick={() => jpg && doUpload(jpg)}>다시 시도</button>
                  </>
                ) : (
                  <div style={{ fontSize: 17, lineHeight: 1.5 }}>휴대폰 카메라로 찍으면 사진(JPG·PNG)과 움짤·영상을 받을 수 있어요.</div>
                )}
                {motion.state === 'making' && <span className="mono muted" style={{ fontSize: 13 }}>움짤·영상 만드는 중...</span>}
              </div>
            </div>
          </div>

          <div className="save-row" aria-label="이 기기에 저장">
            <span className="mono muted">SAVE HERE</span>
            <a className={`btn${png ? '' : ' is-disabled'}`} href={png ?? undefined} download={`4cut-${session.hash}.png`}>PNG</a>
            <a className={`btn${motion.gif ? '' : ' is-disabled'}`} href={motion.gif} download={`4cut-${session.hash}.gif`}>움짤 GIF</a>
            <a className={`btn${motion.video ? '' : ' is-disabled'}`} href={motion.video} download={`4cut-${session.hash}.${motion.videoExt ?? 'webm'}`}>
              영상 {motion.videoExt ? motion.videoExt.toUpperCase() : ''}
            </a>
          </div>

          <label className="check" style={{ fontSize: 17 }}>
            <input type="checkbox" checked={gallery} onChange={(e) => toggleGallery(e.target.checked)} />
            전시장 갤러리 월에 우리 사진 띄우기 (선택)
          </label>

          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono muted" style={{ fontSize: 14 }}>{left}초 후 처음 화면으로 돌아가요</span>
            <button className="btn" onClick={onDone}>처음으로</button>
          </div>
        </section>
      </main>

      {/* 인쇄 전용: 2x6 inch 페이지를 매수만큼 */}
      <div className="print-area" aria-hidden="true">
        {png &&
          Array.from({ length: copies }, (_, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={png} alt="" />
          ))}
      </div>
    </div>
  );
}
