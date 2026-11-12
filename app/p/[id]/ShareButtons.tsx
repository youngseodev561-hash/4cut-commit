'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Asset = { url: string; downloadUrl: string; ext: string };
type Assets = Partial<Record<'png' | 'gif' | 'video', Asset>>;

const Down = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </svg>
);

/** 사진 + 움짤 보기 전환, 그리고 JPG · PNG · GIF · 영상 저장 */
export default function ShareButtons({ id, url, downloadUrl, assets = {} }: { id: string; url: string; downloadUrl: string; assets?: Assets }) {
  const router = useRouter();
  const [canShare, setCanShare] = useState(false);
  const [msg, setMsg] = useState('');
  const [view, setView] = useState<'photo' | 'gif' | 'video'>('photo');

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  // 움짤·영상은 키오스크에서 조금 늦게 올라옴 → 잠깐 동안 새로 불러보기
  useEffect(() => {
    if (assets.gif && assets.video) return;
    let n = 0;
    const t = setInterval(() => {
      if (++n > 20) return clearInterval(t);
      router.refresh();
    }, 4000);
    return () => clearInterval(t);
  }, [assets.gif, assets.video, router]);

  async function share() {
    try {
      const src = view === 'gif' && assets.gif ? assets.gif : view === 'video' && assets.video ? assets.video : null;
      const target = src?.url ?? url;
      const blob = await (await fetch(target)).blob();
      const ext = src?.ext ?? 'jpg';
      const file = new File([blob], `4cut-${id}.${ext}`, { type: blob.type || 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '4CUT.COMMIT' });
      } else {
        await navigator.share({ url: location.href, title: '4CUT.COMMIT' });
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setMsg('공유하지 못했어요. 사진을 길게 눌러 저장해 주세요.');
    }
  }

  return (
    <>
      <div className="m-photo">
        {view === 'video' && assets.video ? (
          <video src={assets.video.url} autoPlay loop muted playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={view === 'gif' && assets.gif ? assets.gif.url : url} alt={view === 'gif' ? '움직이는 네컷' : '네컷 사진'} />
        )}
      </div>
      {(assets.gif || assets.video) && (
        <div className="m-tabs" role="group" aria-label="보기">
          <button className={view === 'photo' ? 'on' : ''} aria-pressed={view === 'photo'} onClick={() => setView('photo')}>사진</button>
          {assets.gif && (
            <button className={view === 'gif' ? 'on' : ''} aria-pressed={view === 'gif'} onClick={() => setView('gif')}>움짤</button>
          )}
          {assets.video && (
            <button className={view === 'video' ? 'on' : ''} aria-pressed={view === 'video'} onClick={() => setView('video')}>영상</button>
          )}
        </div>
      )}

      <div className="m-actions">
        <a className="btn btn-primary" href={downloadUrl} download={`4cut-${id}.jpg`}>
          <Down />
          사진 저장 (JPG)
        </a>
        <div className="m-grid">
          <a className={`btn${assets.png ? '' : ' is-wait'}`} href={assets.png?.downloadUrl} download={`4cut-${id}.png`} aria-disabled={!assets.png}>
            <Down />
            PNG
          </a>
          <a className={`btn${assets.gif ? '' : ' is-wait'}`} href={assets.gif?.downloadUrl} download={`4cut-${id}.gif`} aria-disabled={!assets.gif}>
            <Down />
            움짤 GIF
          </a>
          <a className={`btn${assets.video ? '' : ' is-wait'}`} href={assets.video?.downloadUrl} download={`4cut-${id}.${assets.video?.ext ?? 'mp4'}`} aria-disabled={!assets.video}>
            <Down />
            영상
          </a>
        </div>
        {!(assets.gif && assets.video) && <p className="muted" style={{ margin: 0, fontSize: 13 }}>움짤·영상을 만드는 중이에요. 잠시 후 자동으로 나타나요.</p>}
        {canShare && (
          <button className="btn" onClick={share}>
            공유하기 (인스타 스토리 등)
          </button>
        )}
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          저장이 안 되면 사진을 길게 눌러 &lsquo;사진 앱에 저장&rsquo;을 선택하세요.
        </p>
        {msg && <p style={{ margin: 0, fontSize: 13 }}>{msg}</p>}
      </div>
    </>
  );
}
