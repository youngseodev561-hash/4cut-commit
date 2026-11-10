// 사진 저장소
// - 배포(Vercel): 이미지 = Vercel Blob (BLOB_READ_WRITE_TOKEN), 정보 = kv(Redis)
// - 로컬: 이미지 = data/photos 폴더, 정보 = data/kv.json
import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { put } from '@vercel/blob';
import { getJSON, setJSON, listPush, listRange, listRemove, del } from './kv';

const DATA_DIR = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.DATA_DIR ?? 'data');
const PHOTO_DIR = path.join(DATA_DIR, 'photos');
export const retentionDays = Number(process.env.RETENTION_DAYS ?? 7);
const usingBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const ID_RE = /^[A-Za-z0-9]{10}$/;

export interface PhotoMeta {
  id: string;
  createdAt: string;
  gallery: boolean;
  frame: string;
  url: string; // 이미지 주소
  downloadUrl: string; // 저장용 주소
}

function newId() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(10), (b) => abc[b % abc.length]).join('');
}

export const isValidId = (id: string) => ID_RE.test(id);

export async function savePhoto(img: Buffer, contentType: 'image/png' | 'image/jpeg', meta: { gallery: boolean; frame: string }): Promise<PhotoMeta> {
  const id = newId();
  const ext = contentType === 'image/png' ? 'png' : 'jpg';
  let url: string;
  let downloadUrl: string;
  if (usingBlob) {
    const r = await put(`photos/${id}.${ext}`, img, { access: 'public', contentType, addRandomSuffix: false });
    url = r.url;
    downloadUrl = r.downloadUrl;
  } else {
    await fs.mkdir(PHOTO_DIR, { recursive: true });
    await fs.writeFile(path.join(PHOTO_DIR, `${id}.${ext}`), img);
    url = `/files/${id}`;
    downloadUrl = `/files/${id}?download`;
  }
  const full: PhotoMeta = { id, createdAt: new Date().toISOString(), ...meta, url, downloadUrl };
  await setJSON(`photo:${id}`, full, retentionDays * 86400);
  await listPush('photos', id, 2000);
  if (!usingBlob) cleanupLocal().catch(() => undefined);
  return full;
}

export async function getMeta(id: string): Promise<PhotoMeta | null> {
  if (!isValidId(id)) return null;
  return getJSON<PhotoMeta>(`photo:${id}`);
}

export async function setGallery(id: string, gallery: boolean) {
  const meta = await getMeta(id);
  if (!meta) return null;
  const next = { ...meta, gallery };
  const left = Math.max(60, Math.round((Date.parse(meta.createdAt) + retentionDays * 86400_000 - Date.now()) / 1000));
  await setJSON(`photo:${id}`, next, left);
  return next;
}

export async function listGallery(limit = 60): Promise<PhotoMeta[]> {
  const ids = await listRange<string>('photos', 0, 299);
  const metas = await Promise.all(ids.map((id) => getMeta(id)));
  return metas.filter((m): m is PhotoMeta => !!m && m.gallery).slice(0, limit);
}

/** 로컬 모드 전용: 파일 읽기 */
export async function readLocalPhoto(id: string): Promise<{ data: Buffer; type: string } | null> {
  if (!isValidId(id)) return null;
  for (const [ext, type] of [['jpg', 'image/jpeg'], ['png', 'image/png']] as const) {
    try {
      return { data: await fs.readFile(path.join(PHOTO_DIR, `${id}.${ext}`)), type };
    } catch {
      /* next */
    }
  }
  return null;
}

async function cleanupLocal() {
  const cutoff = Date.now() - retentionDays * 86400_000;
  const ids = await listRange<string>('photos', 0, -1);
  for (const id of ids) {
    const m = await getMeta(id);
    if (!m || Date.parse(m.createdAt) < cutoff) {
      await fs.rm(path.join(PHOTO_DIR, `${id}.jpg`), { force: true });
      await fs.rm(path.join(PHOTO_DIR, `${id}.png`), { force: true });
      await del(`photo:${id}`);
      await listRemove('photos', id);
    }
  }
}
