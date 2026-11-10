'use client';

import { useMemo, useState } from 'react';
import { CONCEPTS, FRAMES, conceptOf, type ConceptId, type FrameId, type StripOptions } from '@/lib/strip';
import type { Patch, Session } from './session';
import { ArrowLeft, ArrowRight, StripCanvas, TopBar } from './ui';

function preview(frame: FrameId, message: string): StripOptions {
  return { frame, photos: [null, null, null, null], filter: 'mono', stickers: [], message, showDate: true, showHash: true, hash: 'a3f9c21', date: '2026.11.07' };
}

export default function FrameScreen({ session, patch, onBack, onNext }: { session: Session; patch: Patch; onBack: () => void; onNext: () => void }) {
  const [concept, setConcept] = useState<ConceptId>(conceptOf(session.frame));
  const cur = CONCEPTS.find((c) => c.id === concept)!;
  const frames = FRAMES.filter((f) => f.concept === concept);
  const previews = useMemo(
    () => Object.fromEntries(FRAMES.map((f) => [f.id, preview(f.id, CONCEPTS.find((c) => c.id === f.concept)!.defaultMessage)])) as Record<FrameId, StripOptions>,
    [],
  );
  const selected = FRAMES.find((f) => f.id === session.frame);

  function pickConcept(id: ConceptId) {
    const c = CONCEPTS.find((x) => x.id === id)!;
    setConcept(id);
    patch({ frame: c.frames[0], filter: c.defaultFilter, message: c.defaultMessage });
  }

  return (
    <div className="kiosk">
      <TopBar step={1} />
      <div className="frame-head" style={{ padding: '28px 56px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="head-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="prompt">&gt; select --concept</div>
            <h1 className="h1">오늘의 컨셉은?</h1>
          </div>
          <div className="prompt">
            선택: {cur.name} · {selected?.name}
          </div>
        </div>
        <div className="concept-tabs" role="tablist">
          {CONCEPTS.map((c) => (
            <button key={c.id} role="tab" aria-selected={c.id === concept} className={c.id === concept ? 'on' : ''} onClick={() => pickConcept(c.id)}>
              <b>{c.name}</b>
              <span>{c.sub}</span>
            </button>
          ))}
        </div>
      </div>
      <main className="frame-row">
        {frames.map((f) => {
          const on = session.frame === f.id;
          return (
            <button key={f.id} className={`frame-card${on ? ' on' : ''}`} aria-pressed={on} onClick={() => patch({ frame: f.id })}>
              {on && <span className="badge">SELECTED</span>}
              <StripCanvas options={previews[f.id]} label={`${f.name} 프레임`} />
              <div className="meta">
                <span className="name">{f.name}</span>
                <span className="muted" style={{ fontSize: 14 }}>{f.desc}</span>
              </div>
            </button>
          );
        })}
      </main>
      <footer className="footbar">
        <button className="btn" onClick={onBack}>
          <ArrowLeft /> 처음으로
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          이 프레임으로 촬영 <ArrowRight />
        </button>
      </footer>
    </div>
  );
}
