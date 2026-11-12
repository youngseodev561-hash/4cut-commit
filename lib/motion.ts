// 움직이는 네컷: 촬영 직전 1.2초 영상 조각으로 네 칸이 움직이는 GIF / 영상 만들기
'use client';

import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import { renderStrip, STRIP_W, STRIP_H, type StripOptions } from './strip';

/** 네 칸 각각의 움직이는 조각(프레임 배열)로 띠 프레임들을 만든다. 앞→뒤→앞으로 왕복해서 자연스럽게 반복 */
export function motionFrames(base: StripOptions, clips: (CanvasImageSource[] | null)[], width = STRIP_W): HTMLCanvasElement[] {
  const n = Math.min(...clips.map((c) => (c?.length ? c.length : Infinity)));
  const len = Number.isFinite(n) ? n : 1;
  const seq = len > 1 ? [...Array(len).keys(), ...Array.from({ length: len - 2 }, (_, i) => len - 2 - i)] : [0];
  const full = document.createElement('canvas');
  return seq.map((k) => {
    renderStrip(full, { ...base, photos: base.photos.map((p, i) => clips[i]?.[k] ?? p) });
    if (width === STRIP_W) {
      const c = document.createElement('canvas');
      c.width = STRIP_W;
      c.height = STRIP_H;
      c.getContext('2d')!.drawImage(full, 0, 0);
      return c;
    }
    const c = document.createElement('canvas');
    c.width = width;
    c.height = Math.round((STRIP_H * width) / STRIP_W);
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(full, 0, 0, c.width, c.height);
    return c;
  });
}

/** GIF 만들기 (프레임 사이 쉬어가며 화면이 멈추지 않게) */
export async function encodeGif(frames: HTMLCanvasElement[], delay = 90): Promise<Blob> {
  const gif = GIFEncoder();
  for (const f of frames) {
    const { data } = f.getContext('2d')!.getImageData(0, 0, f.width, f.height);
    const palette = quantize(data, 256);
    gif.writeFrame(applyPalette(data, palette), f.width, f.height, { palette, delay });
    await new Promise((r) => setTimeout(r, 0));
  }
  gif.finish();
  return new Blob([gif.bytes() as BlobPart], { type: 'image/gif' });
}

/** 영상 만들기: 프레임을 순서대로 캔버스에 그리면서 녹화 (MP4가 되면 MP4, 아니면 WebM) */
export async function recordVideo(frames: HTMLCanvasElement[], fps = 11, loops = 3): Promise<{ blob: Blob; ext: 'mp4' | 'webm' } | null> {
  if (typeof MediaRecorder === 'undefined' || !frames.length) return null;
  const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const mime = types.find((t) => MediaRecorder.isTypeSupported(t));
  if (!mime) return null;
  const c = document.createElement('canvas');
  c.width = frames[0].width;
  c.height = frames[0].height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(frames[0], 0, 0);
  const stream = c.captureStream(fps);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_200_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<void>((r) => (rec.onstop = () => r()));
  rec.start();
  for (let l = 0; l < loops; l++)
    for (const f of frames) {
      ctx.drawImage(f, 0, 0);
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }
  rec.stop();
  await done;
  stream.getTracks().forEach((t) => t.stop());
  const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
  return { blob: new Blob(chunks, { type: mime.split(';')[0] }), ext };
}

export const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(b);
  });
