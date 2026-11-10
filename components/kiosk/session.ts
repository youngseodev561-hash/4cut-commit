import type { FilterId, FrameId, Sticker, Stroke, StripOptions } from '@/lib/strip';
import { randomHash, todayLabel } from '@/lib/strip';

export type Step = 'start' | 'frame' | 'shoot' | 'select' | 'decorate' | 'result';

export const TOTAL_SHOTS = 6;
export const PICK_COUNT = 4;

export interface Shot {
  canvas: HTMLCanvasElement;
  thumb: string; // 작은 JPEG data URL (목록 표시용)
}

export interface Session {
  frame: FrameId;
  timer: number;
  shots: Shot[];
  picked: number[];
  filter: FilterId;
  stickers: Sticker[];
  doodles: Stroke[];
  message: string;
  showDate: boolean;
  showHash: boolean;
  hash: string;
  date: string;
}

export function newSession(): Session {
  return {
    frame: 'terminal',
    timer: 3,
    shots: [],
    picked: [],
    filter: 'mono',
    stickers: [],
    doodles: [],
    message: '우리의 마지막 학기',
    showDate: true,
    showHash: true,
    hash: randomHash(),
    date: todayLabel(),
  };
}

export function stripOptions(s: Session): StripOptions {
  return {
    frame: s.frame,
    photos: [0, 1, 2, 3].map((i) => (s.picked[i] !== undefined ? s.shots[s.picked[i]]?.canvas ?? null : null)),
    filter: s.filter,
    stickers: s.stickers,
    doodles: s.doodles,
    message: s.message,
    showDate: s.showDate,
    showHash: s.showHash,
    hash: s.hash,
    date: s.date,
  };
}

export type Patch = (p: Partial<Session>) => void;
