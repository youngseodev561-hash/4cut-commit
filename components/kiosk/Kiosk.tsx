'use client';

import { useCallback, useEffect, useState } from 'react';
import { newSession, type Session, type Step } from './session';
import StartScreen from './StartScreen';
import FrameScreen from './FrameScreen';
import ShootScreen from './ShootScreen';
import SelectScreen from './SelectScreen';
import DecorateScreen from './DecorateScreen';
import ResultScreen from './ResultScreen';

const IDLE_MS = 120_000; // 2분 동안 아무 입력 없으면 처음으로

export default function Kiosk() {
  const [step, setStep] = useState<Step>('start');
  const [session, setSession] = useState<Session | null>(null);

  // crypto/Date는 클라이언트에서만 만들기 (hydration 불일치 방지)
  useEffect(() => setSession(newSession()), []);

  const patch = useCallback((p: Partial<Session>) => setSession((s) => (s ? { ...s, ...p } : s)), []);
  const reset = useCallback(() => {
    setSession(newSession());
    setStep('start');
  }, []);

  useEffect(() => {
    if (step === 'start' || step === 'shoot') return;
    let t = setTimeout(reset, IDLE_MS);
    const bump = () => {
      clearTimeout(t);
      t = setTimeout(reset, IDLE_MS);
    };
    window.addEventListener('pointerdown', bump);
    window.addEventListener('keydown', bump);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', bump);
      window.removeEventListener('keydown', bump);
    };
  }, [step, reset]);

  if (!session) return <div className="kiosk" />;

  switch (step) {
    case 'start':
      return <StartScreen onStart={() => setStep('frame')} />;
    case 'frame':
      return <FrameScreen session={session} patch={patch} onBack={reset} onNext={() => setStep('shoot')} />;
    case 'shoot':
      return (
        <ShootScreen
          session={session}
          patch={patch}
          onCancel={() => setStep('frame')}
          onDone={(shots) => {
            patch({ shots, picked: [0, 1, 2, 3] });
            setStep('select');
          }}
        />
      );
    case 'select':
      return <SelectScreen session={session} patch={patch} onRetake={() => setStep('shoot')} onNext={() => setStep('decorate')} />;
    case 'decorate':
      return <DecorateScreen session={session} patch={patch} onBack={() => setStep('select')} onNext={() => setStep('result')} />;
    case 'result':
      return <ResultScreen session={session} onDone={reset} />;
  }
}
