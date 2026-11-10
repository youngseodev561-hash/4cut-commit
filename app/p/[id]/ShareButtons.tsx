'use client';

import { useEffect, useState } from 'react';

export default function ShareButtons({ id, url, downloadUrl }: { id: string; url: string; downloadUrl: string }) {
  const [canShare, setCanShare] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  async function share() {
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `4cut-${id}.jpg`, { type: blob.type || 'image/jpeg' });
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
    <div className="m-actions">
      <a className="btn btn-primary" href={downloadUrl} download={`4cut-${id}.jpg`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
        사진 저장
      </a>
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
  );
}
