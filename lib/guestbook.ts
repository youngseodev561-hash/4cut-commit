import 'server-only';
import crypto from 'node:crypto';
import { getJSON, listPush, listRange, setJSON } from './kv';
import { PROJECTS } from './projects';

export interface Entry {
  id: string;
  project: string;
  text: string;
  nick: string;
  author: string; // 브라우저마다 만든 익명 id (연결선 계산용, 화면에 안 나옴)
  createdAt: number;
}

export type PublicEntry = Omit<Entry, 'author'>;

const KEY = 'gb:entries';
const HIDDEN = 'gb:hidden';
const MAX_TEXT = 80;
const MAX_NICK = 12;
const RATE_MS = 5000;

// 전시장 큰 화면에 뜨므로 최소한의 욕설 필터
const BANNED = ['시발', '씨발', '씨바', 'ㅅㅂ', 'ㅆㅂ', '병신', 'ㅂㅅ', '개새', '좆', '존나', '닥쳐', '꺼져', 'fuck', 'shit', 'bitch'];
const normalize = (s: string) => s.toLowerCase().replace(/[\s.\-_*~!?,]/g, '');
export const hasBanned = (s: string) => BANNED.some((w) => normalize(s).includes(w));

export class GuestbookError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

async function hiddenSet() {
  return new Set((await getJSON<string[]>(HIDDEN)) ?? []);
}

export async function allEntries(includeHidden = false): Promise<(Entry & { hidden?: boolean })[]> {
  const [list, hidden] = await Promise.all([listRange<Entry>(KEY, 0, 4999), hiddenSet()]);
  return list.map((e) => ({ ...e, hidden: hidden.has(e.id) })).filter((e) => includeHidden || !e.hidden);
}

export function graph(entries: Entry[]) {
  const counts: Record<string, number> = Object.fromEntries(PROJECTS.map((p) => [p.id, 0]));
  const byAuthor = new Map<string, Set<string>>();
  for (const e of entries) {
    if (!(e.project in counts)) continue;
    counts[e.project]++;
    if (!byAuthor.has(e.author)) byAuthor.set(e.author, new Set());
    byAuthor.get(e.author)!.add(e.project);
  }
  const w = new Map<string, number>();
  for (const set of byAuthor.values()) {
    const arr = [...set].sort();
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
      const k = `${arr[i]}|${arr[j]}`;
      w.set(k, (w.get(k) ?? 0) + 1);
    }
  }
  const links = [...w.entries()].map(([k, n]) => {
    const [a, b] = k.split('|');
    return { a, b, w: n };
  });
  return { counts, links };
}

const strip = (e: Entry): PublicEntry => ({ id: e.id, project: e.project, text: e.text, nick: e.nick, createdAt: e.createdAt });

export async function snapshot() {
  const entries = await allEntries();
  const { counts, links } = graph(entries);
  return { counts, links, total: entries.length, recent: entries.slice(0, 40).map(strip) };
}

export async function addEntry(input: { project?: string; text?: string; nick?: string; author?: string }) {
  const project = String(input.project ?? '');
  const text = String(input.text ?? '').trim().slice(0, MAX_TEXT);
  const nick = String(input.nick ?? '').trim().slice(0, MAX_NICK) || '익명의 방문자';
  const author = String(input.author ?? '').slice(0, 40) || crypto.randomUUID();
  if (!PROJECTS.some((p) => p.id === project)) throw new GuestbookError('프로젝트를 골라주세요');
  if (text.length < 2) throw new GuestbookError('두 글자 이상 써주세요');
  if (hasBanned(text) || hasBanned(nick)) throw new GuestbookError('바르고 고운 말로 써주세요 🙏');

  // 같은 폰에서 연타 방지 (5초)
  // (로컬 파일 KV는 TTL을 지원하지 않으므로 시각을 저장해서 직접 비교)
  const rlKey = `gb:rl:${author}`;
  const last = await getJSON<number>(rlKey);
  if (last && Date.now() - last < RATE_MS) {
    const sec = Math.ceil((RATE_MS - (Date.now() - last)) / 1000);
    throw new GuestbookError(`잠깐! ${sec}초 뒤에 다시 보낼 수 있어요`, 429);
  }
  await setJSON(rlKey, Date.now(), 10);

  const before = await allEntries(true);
  const mine = new Set(before.filter((e) => e.author === author).map((e) => e.project));
  const newLinks = mine.has(project) ? [] : [...mine];

  const entry: Entry = { id: crypto.randomBytes(6).toString('hex'), project, text, nick, author, createdAt: Date.now() };
  await listPush(KEY, entry, 5000);
  return { entry: strip(entry), newLinks };
}

export async function setHidden(id: string, hidden: boolean) {
  const set = await hiddenSet();
  if (hidden) set.add(id);
  else set.delete(id);
  await setJSON(HIDDEN, [...set]);
}

export function adminAllowed(key: string | null) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return process.env.NODE_ENV !== 'production'; // 로컬 개발에선 열어둠
  return key === expected;
}
