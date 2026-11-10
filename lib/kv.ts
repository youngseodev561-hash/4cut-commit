// 아주 작은 키-값 저장소.
// - 배포(Vercel): Upstash Redis REST API (KV_REST_API_URL / KV_REST_API_TOKEN 또는 UPSTASH_REDIS_REST_*)
// - 로컬: data/kv.json 파일
import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const R_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const R_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
export const usingRedis = !!(R_URL && R_TOKEN);

async function redis<T = unknown>(cmd: (string | number)[]): Promise<T> {
  const res = await fetch(R_URL!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${R_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
    cache: 'no-store',
  });
  const j = (await res.json()) as { result?: T; error?: string };
  if (j.error) throw new Error(`redis: ${j.error}`);
  return j.result as T;
}

// ---------- 로컬 파일 백엔드 ----------
type LocalDB = { kv: Record<string, string>; lists: Record<string, string[]> };
const DATA_DIR = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.DATA_DIR ?? 'data');
const FILE = path.join(DATA_DIR, 'kv.json');
let cache: LocalDB | null = null;
let chain: Promise<unknown> = Promise.resolve();

async function load(): Promise<LocalDB> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(FILE, 'utf8')) as LocalDB;
  } catch {
    cache = { kv: {}, lists: {} };
  }
  return cache;
}
function save() {
  chain = chain.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(cache));
  });
  return chain;
}

// ---------- 공개 API ----------
export async function getJSON<T>(key: string): Promise<T | null> {
  if (usingRedis) {
    const v = await redis<string | null>(['GET', key]);
    return v ? (JSON.parse(v) as T) : null;
  }
  const db = await load();
  return db.kv[key] ? (JSON.parse(db.kv[key]) as T) : null;
}

export async function setJSON(key: string, value: unknown, ttlSec?: number) {
  const v = JSON.stringify(value);
  if (usingRedis) {
    await redis(ttlSec ? ['SET', key, v, 'EX', ttlSec] : ['SET', key, v]);
    return;
  }
  const db = await load();
  db.kv[key] = v;
  await save();
}

export async function del(key: string) {
  if (usingRedis) {
    await redis(['DEL', key]);
    return;
  }
  const db = await load();
  delete db.kv[key];
  await save();
}

/** 리스트 맨 앞에 추가 (최신순) */
export async function listPush(key: string, value: unknown, maxLen = 5000) {
  const v = JSON.stringify(value);
  if (usingRedis) {
    await redis(['LPUSH', key, v]);
    await redis(['LTRIM', key, 0, maxLen - 1]);
    return;
  }
  const db = await load();
  db.lists[key] = [v, ...(db.lists[key] ?? [])].slice(0, maxLen);
  await save();
}

export async function listRange<T>(key: string, start = 0, stop = -1): Promise<T[]> {
  if (usingRedis) {
    const arr = await redis<string[]>(['LRANGE', key, start, stop]);
    return arr.map((s) => JSON.parse(s) as T);
  }
  const db = await load();
  const arr = db.lists[key] ?? [];
  return arr.slice(start, stop === -1 ? undefined : stop + 1).map((s) => JSON.parse(s) as T);
}

export async function listRemove(key: string, value: unknown) {
  const v = JSON.stringify(value);
  if (usingRedis) {
    await redis(['LREM', key, 0, v]);
    return;
  }
  const db = await load();
  db.lists[key] = (db.lists[key] ?? []).filter((x) => x !== v);
  await save();
}
