export interface PublicEntry {
  id: string;
  project: string;
  text: string;
  nick: string;
  createdAt: number;
}

export interface Snapshot {
  counts: Record<string, number>;
  links: { a: string; b: string; w: number }[];
  total: number;
  recent: PublicEntry[];
}

/** 화면에 그려지는 연결선 (born = 그려지기 시작한 시각, performance.now 기준) */
export interface LiveLink {
  a: string;
  b: string;
  w: number;
  born: number;
}

export interface SharedData {
  counts: Record<string, number>;
  links: LiveLink[];
}

export interface GlobeApi {
  /** 지구본 모드에서 한 개의 후기를 쏜다. onImpact는 도착 순간 호출, Promise는 연출이 끝나면 resolve */
  shoot(entry: PublicEntry, onImpact: () => void): Promise<void>;
}

export const linkKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
export const pad2 = (n: number) => String(n).padStart(2, '0');

export function ago(ts: number, now: number) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return '방금';
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}분 전`;
  if (s < 86400) return `${Math.round(s / 3600)}시간 전`;
  return `${Math.round(s / 86400)}일 전`;
}
