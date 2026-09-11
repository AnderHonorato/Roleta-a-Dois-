import { useCallback, useEffect, useRef } from 'react';

/**
 * Sons sinteticos via Web Audio.
 *
 * Nenhum arquivo de audio no bundle: os efeitos sao gerados por
 * osciladores, o que mantem o peso em zero e evita download extra.
 * O AudioContext so e criado no PRIMEIRO gesto do usuario, entao
 * nada toca sozinho ao abrir a pagina.
 */
export type SoundName = 'tap' | 'roll' | 'reveal' | 'score' | 'achievement' | 'skip';

interface Voice {
  freq: number;
  type: OscillatorType;
  duration: number;
  gain: number;
  sweepTo?: number;
  delay?: number;
}

const RECIPES: Record<SoundName, Voice[]> = {
  tap: [{ freq: 520, type: 'sine', duration: 0.06, gain: 0.18 }],
  roll: [
    { freq: 180, type: 'triangle', duration: 0.5, gain: 0.14, sweepTo: 90 },
    { freq: 340, type: 'square', duration: 0.12, gain: 0.05, delay: 0.06 },
    { freq: 300, type: 'square', duration: 0.1, gain: 0.045, delay: 0.22 },
    { freq: 260, type: 'square', duration: 0.09, gain: 0.04, delay: 0.36 },
  ],
  reveal: [
    { freq: 440, type: 'sine', duration: 0.22, gain: 0.16, sweepTo: 660 },
    { freq: 660, type: 'sine', duration: 0.3, gain: 0.12, delay: 0.1, sweepTo: 880 },
  ],
  score: [
    { freq: 660, type: 'sine', duration: 0.1, gain: 0.14 },
    { freq: 880, type: 'sine', duration: 0.14, gain: 0.13, delay: 0.08 },
    { freq: 1100, type: 'sine', duration: 0.18, gain: 0.1, delay: 0.16 },
  ],
  achievement: [
    { freq: 523, type: 'triangle', duration: 0.14, gain: 0.13 },
    { freq: 659, type: 'triangle', duration: 0.14, gain: 0.13, delay: 0.12 },
    { freq: 784, type: 'triangle', duration: 0.26, gain: 0.13, delay: 0.24 },
  ],
  skip: [{ freq: 300, type: 'sawtooth', duration: 0.18, gain: 0.1, sweepTo: 160 }],
};

export interface SoundApi {
  play: (name: SoundName) => void;
  /** Prepara o contexto no primeiro gesto (politica de autoplay). */
  unlock: () => void;
}

export function useSound(enabled: boolean, volume: number): SoundApi {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  const ensureContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctxRef.current) {
      try {
        const ctx = new Ctor();
        const master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);
        ctxRef.current = ctx;
        masterRef.current = master;
      } catch {
        return null;
      }
    }
    return ctxRef.current;
  }, []);

  // Volume nunca "estoura": o master e limitado e sobe suave.
  useEffect(() => {
    const master = masterRef.current;
    const ctx = ctxRef.current;
    if (!master || !ctx) return;
    const target = enabled ? Math.min(0.8, Math.max(0, volume)) : 0;
    master.gain.setTargetAtTime(target, ctx.currentTime, 0.05);
  }, [enabled, volume]);

  const unlock = useCallback(() => {
    const ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const master = masterRef.current;
    if (master) {
      master.gain.setTargetAtTime(
        enabled ? Math.min(0.8, Math.max(0, volume)) : 0,
        ctx.currentTime,
        0.05,
      );
    }
  }, [ensureContext, enabled, volume]);

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled || volume <= 0) return;
      const ctx = ensureContext();
      const master = masterRef.current;
      if (!ctx || !master) return;
      if (ctx.state === 'suspended') void ctx.resume();

      const now = ctx.currentTime;
      for (const voice of RECIPES[name]) {
        const start = now + (voice.delay ?? 0);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = voice.type;
        osc.frequency.setValueAtTime(voice.freq, start);
        if (voice.sweepTo) {
          osc.frequency.exponentialRampToValueAtTime(
            Math.max(20, voice.sweepTo),
            start + voice.duration,
          );
        }
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(voice.gain, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + voice.duration);
        osc.connect(gain);
        gain.connect(master);
        osc.start(start);
        osc.stop(start + voice.duration + 0.03);
      }
    },
    [enabled, volume, ensureContext],
  );

  useEffect(
    () => () => {
      void ctxRef.current?.close();
      ctxRef.current = null;
      masterRef.current = null;
    },
    [],
  );

  return { play, unlock };
}
