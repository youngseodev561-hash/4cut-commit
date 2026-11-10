'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { PROJECTS } from '@/lib/projects';
import { audio, ding, whoosh } from '@/lib/sfx';
import { pad2 } from './types';

const MAX_TEXT = 80;
const MAX_NICK = 12;
const IDX = Object.fromEntries(PROJECTS.map((p, i) => [p.id, i + 1]));
const nameOf = (id: string) => PROJECTS.find((p) => p.id === id)?.name ?? id;

type Phase = 'pick' | 'write' | 'launch' | 'done';

function authorId() {
  try {
    let id = localStorage.getItem('gb-author');
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).replace(/-/g, '');
      localStorage.setItem('gb-author', id);
    }
    return id;
  } catch {
    return '';
  }
}

function readSent(): string[] {
  try {
    return JSON.parse(localStorage.getItem('gb-sent') ?? '[]') as string[];
  } catch {
    return [];
  }
}

export default function WriteApp() {
  const [phase, setPhase] = useState<Phase>('pick');
  const [project, setProject] = useState('');
  const [q, setQ] = useState('');
  const [text, setText] = useState('');
  const [nick, setNick] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState<string[]>([]);
  const [newLinks, setNewLinks] = useState<string[]>([]);
  const [lastText, setLastText] = useState('');
  const [busy, setBusy] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSent(readSent());
    try {
      setNick(localStorage.getItem('gb-nick') ?? '');
    } catch {
      /* 무시 */
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (phase === 'write') setTimeout(() => textRef.current?.focus({ preventScroll: true }), 350);
  }, [phase]);

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return PROJECTS;
    return PROJECTS.filter((p) => `${p.name} ${p.team} ${p.desc} ${pad2(IDX[p.id])}`.toLowerCase().includes(k));
  }, [q]);

  const p = PROJECTS.find((x) => x.id === project);
  const len = [...text].length;
  const canSend = len >= 2 && !busy;

  function pick(id: string) {
    setProject(id);
    setError('');
    setPhase('write');
  }

  async function send() {
    if (!canSend || !p) return;
    audio(); // 사용자 탭 안에서 오디오 잠금 해제
    setBusy(true);
    setError('');
    const body = { project, text: text.trim(), nick: nick.trim(), author: authorId() };
    try {
      localStorage.setItem('gb-nick', nick.trim());
    } catch {
      /* 무시 */
    }
    // 먼저 서버 응답을 확인 (욕설/연타는 보내기 연출 전에 막기)
    let res: Response;
    try {
      res = await fetch('/api/guestbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } catch {
      setBusy(false);
      setError('인터넷 연결을 확인하고 다시 눌러주세요');
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string; newLinks?: string[] };
    if (!res.ok) {
      setBusy(false);
      if (res.status === 429) setError(data.error ?? '잠깐! 조금 뒤에 다시 보낼 수 있어요');
      else if (res.status === 400) setError(data.error ?? '내용을 다시 확인해주세요');
      else setError('전송에 실패했어요. 잠시 뒤 다시 시도해주세요');
      return;
    }
    whoosh(1.1, 0.7);
    setLastText(text.trim());
    setNewLinks(data.newLinks ?? []);
    const nextSent = sent.includes(project) ? sent : [...sent, project];
    setSent(nextSent);
    try {
      localStorage.setItem('gb-sent', JSON.stringify(nextSent));
    } catch {
      /* 무시 */
    }
    setPhase('launch');
    setTimeout(() => {
      setPhase('done');
      setBusy(false);
      setText('');
      if ((data.newLinks ?? []).length) setTimeout(() => ding(0.35), 500);
    }, 1900);
  }

  function again() {
    setProject('');
    setNewLinks([]);
    setPhase('pick');
  }

  return (
    <main className={`gw is-${phase}`} ref={topRef}>
      <header className="gw-top">
        {phase === 'write' ? (
          <button type="button" className="gw-back" onClick={() => setPhase('pick')} aria-label="프로젝트 다시 고르기">
            <span aria-hidden>←</span> 목록
          </button>
        ) : (
          <span className="gw-small">방명록</span>
        )}
        <p className="gw-mark" aria-label="Guestbook">GUESTBOOK</p>
        <span className="gw-small is-right">{sent.length ? `${sent.length}곳 보냄` : '졸업작품전'}</span>
      </header>

      {/* ---------- 1. 프로젝트 고르기 ---------- */}
      {phase === 'pick' && (
        <section className="gw-pick">
          <div className="gw-intro">
            <p className="gw-small is-mute">Step 01 / 02</p>
            <h1>어느 작품에<br />메시지를 쏠까요?</h1>
            <p className="gw-lead">여러 작품에 보내면 큰 화면에서 그 작품들이 <b>선으로 연결</b>돼요.</p>
          </div>
          <label className="gw-search">
            <span className="gw-small">Search</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="작품 이름, 팀, 키워드" enterKeyHint="search" />
          </label>
          <ul className="gw-grid">
            {list.map((x, i) => {
              const done = sent.includes(x.id);
              return (
                <li key={x.id} style={{ '--i': i } as CSSProperties}>
                  <button type="button" className={`gw-print${done ? ' is-sent' : ''}`} onClick={() => pick(x.id)}>
                    <span className="gw-print-top">
                      <span>№{pad2(IDX[x.id])}</span>
                      <span>{done ? '보냄 ✓' : x.team}</span>
                    </span>
                    <span className="gw-print-name">{x.name}</span>
                    <span className="gw-print-desc">{x.desc}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {!list.length && <p className="gw-empty">“{q}”에 맞는 작품이 없어요.</p>}
        </section>
      )}

      {/* ---------- 2. 쓰기 ---------- */}
      {(phase === 'write' || phase === 'launch') && p && (
        <section className="gw-write">
          <div className="gw-intro is-tight">
            <p className="gw-small is-mute">Step 02 / 02 · To</p>
            <h1 className="gw-to">{p.name}</h1>
            <p className="gw-lead">{p.team} · {p.desc}</p>
          </div>

          {/* 작품 소개 */}
          <details className="gw-about" open>
            <summary>
              <span className="gw-small">About this work</span>
              <span className="gw-small is-mute" aria-hidden>접기 / 펼치기</span>
            </summary>
            <p className="gw-about-txt">{p.intro}</p>
            <div className="gw-about-meta">
              <span>{p.members.join(' · ')}</span>
              <span className="gw-tags">{p.tags.map((t) => <em key={t}>{t}</em>)}</span>
            </div>
          </details>

          {/* 큰 화면에 날아갈 카드 미리보기 */}
          <div className="gw-preview-wrap">
            <div className={`gw-preview${phase === 'launch' ? ' is-launch' : ''}`} aria-hidden>
              <span className="gw-print-top">
                <span>№{pad2(IDX[p.id])} · {p.name}</span>
                <span>미리보기</span>
              </span>
              <span className={`gw-preview-txt${text ? '' : ' is-ph'}`}>{text || '여기에 쓴 메시지가 큰 화면으로 날아가요'}</span>
              <span className="gw-preview-by">— {nick.trim() || '익명의 방문자'}</span>
            </div>
          </div>

          <form
            className="gw-compose"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <label className="gw-field">
              <span className="gw-small">닉네임 <em>(선택)</em></span>
              <input value={nick} maxLength={MAX_NICK} onChange={(e) => setNick(e.target.value.slice(0, MAX_NICK))} placeholder="익명의 방문자" autoComplete="nickname" enterKeyHint="next" />
            </label>
            <label className="gw-field">
              <span className="gw-small">
                메시지 <em className={len > MAX_TEXT - 10 ? 'is-warn' : ''}>{len}/{MAX_TEXT}</em>
              </span>
              <textarea
                ref={textRef}
                value={text}
                rows={3}
                onChange={(e) => {
                  setText([...e.target.value].slice(0, MAX_TEXT).join(''));
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="짧게 한마디! 예) 데모 보고 바로 쓰고 싶어졌어요"
                enterKeyHint="send"
              />
            </label>
            <div className="gw-err" role="alert" aria-live="assertive">{error}</div>
            <button type="submit" className="gw-fire" disabled={!canSend}>
              <span>{busy ? '보내는 중…' : '보내기'}</span>
              <i aria-hidden>↑</i>
            </button>
            {len > 0 && len < 2 && <p className="gw-hint">두 글자 이상 써주세요</p>}
          </form>
        </section>
      )}

      {/* ---------- 보내기 연출 ---------- */}
      {phase === 'launch' && (
        <div className="gw-launch" aria-live="polite">
          <div className="gw-launch-lines" aria-hidden>
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} style={{ '--x': `${(i * 37) % 100}%`, '--d': `${(i % 5) * 70}ms` } as CSSProperties} />
            ))}
          </div>
          <div className="gw-launch-card" aria-hidden>
            <span className="gw-print-top"><span>№{pad2(IDX[project])} · {nameOf(project)}</span><span>Sending</span></span>
            <span className="gw-preview-txt">{lastText}</span>
          </div>
          <p className="gw-launch-big" aria-hidden>보내는 중</p>
          <p className="gw-launch-label">→ {nameOf(project)}에게 가는 중</p>
        </div>
      )}

      {/* ---------- 3. 완료 ---------- */}
      {phase === 'done' && (
        <section className="gw-done">
          <p className="gw-small is-mute">Sent → №{pad2(IDX[project])} {nameOf(project)}</p>
          <h1>닿았어요.</h1>
          <p className="gw-lead">전시장 큰 화면을 보세요. 방금 쓴 메시지가 {nameOf(project)} 곁에 내려앉고 있어요.</p>
          <blockquote className="gw-sent-card">
            <span>“{lastText}”</span>
            <em>— {nick.trim() || '익명의 방문자'}</em>
          </blockquote>
          {newLinks.length > 0 && (
            <div className="gw-links" role="status">
              <p className="gw-small">New link</p>
              {newLinks.map((o) => (
                <p key={o} className="gw-link">
                  <b>{nameOf(project)}</b>
                  <i aria-hidden />
                  <b>{nameOf(o)}</b>
                  <span>연결!</span>
                </p>
              ))}
            </div>
          )}
          {!newLinks.length && sent.length < 2 && <p className="gw-tip">다른 작품에도 보내면 두 작품이 선으로 이어져요.</p>}
          <div className="gw-actions">
            <button type="button" className="gw-fire" onClick={again}>
              <span>다른 작품에도 보내기</span>
              <i aria-hidden>→</i>
            </button>
            <button type="button" className="gw-ghost" onClick={() => setPhase('write')}>
              {nameOf(project)}에 한 번 더
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
