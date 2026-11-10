'use client';

import { useMemo } from 'react';
import { FILTERS } from '@/lib/strip';
import { PICK_COUNT, stripOptions, type Patch, type Session } from './session';
import { ArrowRight, Retry, StripCanvas, TopBar } from './ui';

export default function SelectScreen({ session, patch, onRetake, onNext }: { session: Session; patch: Patch; onRetake: () => void; onNext: () => void }) {
  const { shots, picked } = session;
  const options = useMemo(() => stripOptions({ ...session, stickers: [], message: '' }), [session]);

  function toggle(i: number) {
    const at = picked.indexOf(i);
    if (at >= 0) patch({ picked: picked.filter((p) => p !== i) });
    else if (picked.length < PICK_COUNT) patch({ picked: [...picked, i] });
  }

  return (
    <div className="kiosk">
      <TopBar step={3} />
      <main className="body pad select-body" style={{ gap: 48 }}>
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="prompt">&gt; git add --best</div>
              <h1 className="h1">
                {shots.length}장 중 {PICK_COUNT}장을 골라주세요
              </h1>
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600 }}>
              {picked.length} / {PICK_COUNT}
            </div>
          </div>
          <div className="shot-grid">
            {shots.map((s, i) => {
              const at = picked.indexOf(i);
              return (
                <button key={i} className={`shot${at >= 0 ? ' on' : ''}`} aria-pressed={at >= 0} aria-label={`${i + 1}번째 사진${at >= 0 ? `, ${at + 1}번 칸` : ''}`} onClick={() => toggle(i)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.thumb} alt="" style={{ filter: FILTERS.find((f) => f.id === session.filter)?.css }} />
                  <span className="lbl">SHOT_0{i + 1}</span>
                  {at >= 0 && <span className="num">{at + 1}</span>}
                </button>
              );
            })}
          </div>
        </section>
        <aside className="select-aside" style={{ width: 240, flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="prompt" style={{ alignSelf: 'flex-start', fontSize: 13 }}>
            PREVIEW · 누른 순서대로 들어가요
          </div>
          <StripCanvas options={options} style={{ flex: 1, minHeight: 0, height: '100%', maxWidth: '100%', objectFit: 'contain' }} />
        </aside>
      </main>
      <footer className="footbar">
        <button className="btn" onClick={onRetake}>
          <Retry /> 다시 찍기
        </button>
        <button className="btn btn-primary" disabled={picked.length !== PICK_COUNT} onClick={onNext}>
          꾸미러 가기 <ArrowRight />
        </button>
      </footer>
    </div>
  );
}
