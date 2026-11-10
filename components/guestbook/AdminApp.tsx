'use client';

import { useCallback, useEffect, useState } from 'react';
import { PROJECTS } from '@/lib/projects';
import type { PublicEntry } from './types';

type Row = PublicEntry & { hidden?: boolean };
const nameOf = (id: string) => PROJECTS.find((p) => p.id === id)?.name ?? id;

export default function AdminApp() {
  const [key, setKey] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState<'all' | 'shown' | 'hidden'>('all');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async (k: string) => {
    setErr('');
    try {
      const r = await fetch('/api/guestbook/admin', { headers: { 'x-admin-key': k }, cache: 'no-store' });
      if (r.status === 401) {
        setRows(null);
        setErr('관리자 키가 맞지 않아요');
        return;
      }
      if (!r.ok) throw new Error();
      setRows(await r.json());
      sessionStorage.setItem('gb-admin', k);
    } catch {
      setErr('불러오지 못했어요. 잠시 뒤 다시 시도해주세요');
    }
  }, []);

  useEffect(() => {
    const k = sessionStorage.getItem('gb-admin') ?? '';
    setKey(k);
    load(k);
  }, [load]);

  // 10초마다 새로고침
  useEffect(() => {
    if (!rows) return;
    const t = setInterval(() => load(key), 10000);
    return () => clearInterval(t);
  }, [rows, key, load]);

  async function toggle(row: Row) {
    setBusyId(row.id);
    try {
      const r = await fetch('/api/guestbook/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ id: row.id, hidden: !row.hidden }),
      });
      if (!r.ok) throw new Error();
      setRows((rs) => rs?.map((x) => (x.id === row.id ? { ...x, hidden: !row.hidden } : x)) ?? null);
    } catch {
      setErr('변경하지 못했어요');
    } finally {
      setBusyId('');
    }
  }

  const list = (rows ?? []).filter((r) => (filter === 'all' ? true : filter === 'hidden' ? r.hidden : !r.hidden));
  const hiddenN = (rows ?? []).filter((r) => r.hidden).length;

  return (
    <main className="gw ga">
      <header className="gw-top">
        <span className="gw-small">Admin</span>
        <p className="gw-mark">GUESTBOOK</p>
        <span className="gw-small is-right">{rows ? `${rows.length}개` : ''}</span>
      </header>
      <div className="gw-intro is-tight">
        <h1>방명록 관리</h1>
        <p className="gw-lead">숨긴 메시지는 큰 화면과 연결선 계산에서 빠져요 (2초 안에 반영).</p>
      </div>

      <form
        className="ga-login"
        onSubmit={(e) => {
          e.preventDefault();
          load(key);
        }}
      >
        <label className="gw-field">
          <span className="gw-small">관리자 키</span>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="current-password" placeholder="ADMIN_KEY" />
        </label>
        <button type="submit" className="ga-btn">{rows ? '새로고침' : '들어가기'}</button>
      </form>
      <div className="gw-err" role="alert">{err}</div>

      {rows && (
        <>
          <div className="ga-bar">
            <div style={{ display: 'flex', gap: 6 }} role="group" aria-label="필터">
              {(['all', 'shown', 'hidden'] as const).map((f) => (
                <button key={f} type="button" className={`ga-btn${filter === f ? '' : ' is-ghost'}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === 'all' ? `전체 ${rows.length}` : f === 'shown' ? `보임 ${rows.length - hiddenN}` : `숨김 ${hiddenN}`}
                </button>
              ))}
            </div>
          </div>
          <ul className="ga-list">
            {list.map((r) => (
              <li key={r.id} className={`ga-row${r.hidden ? ' is-hidden' : ''}`}>
                <div>
                  <div className="ga-txt">{r.text}</div>
                  <div className="ga-meta">
                    → {nameOf(r.project)} · {r.nick} · {new Date(r.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button type="button" className="ga-toggle" disabled={busyId === r.id} aria-pressed={!!r.hidden} onClick={() => toggle(r)}>
                  {r.hidden ? '다시 보이기' : '숨기기'}
                </button>
              </li>
            ))}
            {!list.length && <li className="ga-row"><span className="gw-lead">메시지가 없어요</span></li>}
          </ul>
        </>
      )}
    </main>
  );
}
