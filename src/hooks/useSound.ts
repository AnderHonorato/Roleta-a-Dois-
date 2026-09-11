import { useCallback, useEffect, useRef } from 'react';

/**
 * Audio do jogo, inteiro sintetizado por Web Audio.
 *
 * Nenhum arquivo de som no bundle: os efeitos e a trilha sao gerados
 * por osciladores e ruido filtrado, entao o peso e zero e nao ha
 * requisicao nenhuma. O AudioContext so nasce no PRIMEIRO gesto do
 * usuario - nada toca sozinho ao abrir a pagina.
 *
 * A paleta sonora e deliberada: grave, com corpo e respiracao, em vez
 * de bipe de interface. Batimento cardiaco, ar, pele e metal quente
 * dizem mais para este produto do que um "ding".
 */
export type SoundName =
  | 'tap'
  | 'roll'
  | 'reveal'
  | 'score'
  | 'achievement'
  | 'skip'
  | 'heartbeat'
  | 'breath';

interface Voice {
  freq: number;
  type: OscillatorType;
  duration: number;
  gain: number;
  sweepTo?: number;
  delay?: number;
  /** Ruido filtrado em vez de oscilador: ar, pele, tecido. */
  noise?: { cutoff: number; q?: number; sweepCutoffTo?: number };
}

const RECIPES: Record<SoundName, Voice[]> = {
  // Toque curto e macio, sem bipe.
  tap: [{ freq: 320, type: 'sine', duration: 0.07, gain: 0.16, sweepTo: 240 }],

  // O arremesso: corpo grave rolando + pele batendo na mesa.
  roll: [
    { freq: 150, type: 'triangle', duration: 0.7, gain: 0.2, sweepTo: 62 },
    { freq: 90, type: 'sine', duration: 0.5, gain: 0.16, sweepTo: 45, delay: 0.08 },
    { freq: 0, type: 'sine', duration: 0.1, gain: 0.1, delay: 0.5, noise: { cutoff: 1600, sweepCutoffTo: 400 } },
    { freq: 0, type: 'sine', duration: 0.08, gain: 0.07, delay: 0.66, noise: { cutoff: 1200, sweepCutoffTo: 300 } },
  ],

  // Revelacao: inspirada num arfar - ar subindo e um grave que abre.
  reveal: [
    { freq: 0, type: 'sine', duration: 0.45, gain: 0.1, noise: { cutoff: 500, q: 6, sweepCutoffTo: 2600 } },
    { freq: 110, type: 'sine', duration: 0.6, gain: 0.18, sweepTo: 220 },
    { freq: 330, type: 'triangle', duration: 0.5, gain: 0.09, delay: 0.14, sweepTo: 440 },
  ],

  // Pontuacao: acorde quente subindo, sem soar infantil.
  score: [
    { freq: 220, type: 'sine', duration: 0.5, gain: 0.16 },
    { freq: 330, type: 'sine', duration: 0.45, gain: 0.12, delay: 0.05 },
    { freq: 440, type: 'triangle', duration: 0.5, gain: 0.1, delay: 0.11 },
    { freq: 660, type: 'sine', duration: 0.4, gain: 0.07, delay: 0.18 },
  ],

  achievement: [
    { freq: 196, type: 'sine', duration: 0.5, gain: 0.15 },
    { freq: 294, type: 'triangle', duration: 0.5, gain: 0.12, delay: 0.12 },
    { freq: 392, type: 'sine', duration: 0.6, gain: 0.12, delay: 0.24 },
    { freq: 587, type: 'sine', duration: 0.6, gain: 0.08, delay: 0.34 },
  ],

  // Trocar de desafio: um estalo de tecido, meio provocador.
  skip: [
    { freq: 0, type: 'sine', duration: 0.14, gain: 0.13, noise: { cutoff: 3000, q: 2, sweepCutoffTo: 600 } },
    { freq: 180, type: 'sawtooth', duration: 0.2, gain: 0.09, sweepTo: 70 },
  ],

  // Dois batimentos graves. Usado quando a tensao sobe.
  heartbeat: [
    { freq: 62, type: 'sine', duration: 0.22, gain: 0.26, sweepTo: 42 },
    { freq: 58, type: 'sine', duration: 0.26, gain: 0.2, sweepTo: 38, delay: 0.3 },
  ],

  // Respiracao: ruido filtrado com envelope longo.
  breath: [
    { freq: 0, type: 'sine', duration: 0.8, gain: 0.09, noise: { cutoff: 420, q: 4, sweepCutoffTo: 1800 } },
  ],
};

export interface SoundApi {
  play: (name: SoundName) => void;
  /** Prepara o contexto no primeiro gesto (politica de autoplay). */
  unlock: () => void;
  /** Trilha de fundo enquanto a rodada esta em jogo. */
  startMusic: () => void;
  stopMusic: () => void;
  musicPlaying: () => boolean;
}

/**
 * Trilha: baixo pulsante em 68 BPM, um pad de duas vozes que troca de
 * acorde a cada compasso e um chiado leve no contratempo. Lenta de
 * proposito - a trilha e clima, nao urgencia.
 */
const BPM = 68;
const BEAT = 60 / BPM;
const PROGRESSAO = [
  [55, 82.4, 110], // Lam
  [49, 73.4, 98], // Solm
  [43.7, 65.4, 87.3], // Fá
  [49, 73.4, 98], // Solm
];

export function useSound(enabled: boolean, volume: number): SoundApi {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const musicTimer = useRef<number | null>(null);
  const musicOn = useRef(false);
  const compasso = useRef(0);

  const ensureContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const Ctor =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctxRef.current) {
      try {
        const ctx = new Ctor();
        const master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);

        // A trilha fica num barramento proprio, mais baixo que os
        // efeitos: ela acompanha, nao disputa.
        const music = ctx.createGain();
        music.gain.value = 0;
        music.connect(master);

        ctxRef.current = ctx;
        masterRef.current = master;
        musicGainRef.current = music;
      } catch {
        return null;
      }
    }
    return ctxRef.current;
  }, []);

  const nivelMaster = useCallback(
    () => (enabled ? Math.min(0.8, Math.max(0, volume)) : 0),
    [enabled, volume],
  );

  // Volume nunca "estoura": o master e limitado e sobe suave.
  useEffect(() => {
    const master = masterRef.current;
    const ctx = ctxRef.current;
    if (!master || !ctx) return;
    master.gain.setTargetAtTime(nivelMaster(), ctx.currentTime, 0.05);
  }, [nivelMaster]);

  const unlock = useCallback(() => {
    const ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    masterRef.current?.gain.setTargetAtTime(nivelMaster(), ctx.currentTime, 0.05);
  }, [ensureContext, nivelMaster]);

  /** Ruido branco curto, reaproveitado pelos efeitos com `noise`. */
  const bufferRuido = useCallback((ctx: AudioContext, segundos: number): AudioBuffer => {
    const frames = Math.max(1, Math.floor(ctx.sampleRate * segundos));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const dados = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) dados[i] = Math.random() * 2 - 1;
    return buffer;
  }, []);

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
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(voice.gain, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + voice.duration);
        gain.connect(master);

        if (voice.noise) {
          const src = ctx.createBufferSource();
          src.buffer = bufferRuido(ctx, voice.duration + 0.05);
          const filtro = ctx.createBiquadFilter();
          filtro.type = 'bandpass';
          filtro.frequency.setValueAtTime(voice.noise.cutoff, start);
          filtro.Q.value = voice.noise.q ?? 1;
          if (voice.noise.sweepCutoffTo) {
            filtro.frequency.exponentialRampToValueAtTime(
              Math.max(40, voice.noise.sweepCutoffTo),
              start + voice.duration,
            );
          }
          src.connect(filtro);
          filtro.connect(gain);
          src.start(start);
          src.stop(start + voice.duration + 0.05);
        } else {
          const osc = ctx.createOscillator();
          osc.type = voice.type;
          osc.frequency.setValueAtTime(voice.freq, start);
          if (voice.sweepTo) {
            osc.frequency.exponentialRampToValueAtTime(
              Math.max(20, voice.sweepTo),
              start + voice.duration,
            );
          }
          osc.connect(gain);
          osc.start(start);
          osc.stop(start + voice.duration + 0.03);
        }
      }
    },
    [enabled, volume, ensureContext, bufferRuido],
  );

  /** Agenda um compasso da trilha e se reagenda enquanto estiver ligada. */
  const tocarCompasso = useCallback(() => {
    const ctx = ctxRef.current;
    const bus = musicGainRef.current;
    if (!ctx || !bus || !musicOn.current) return;

    const t0 = ctx.currentTime + 0.05;
    const acorde = PROGRESSAO[compasso.current % PROGRESSAO.length];
    compasso.current += 1;

    // --- baixo: uma pulsacao por tempo, como um batimento ---
    for (let batida = 0; batida < 4; batida += 1) {
      const t = t0 + batida * BEAT;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(acorde[0], t);
      const forte = batida % 2 === 0;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(forte ? 0.3 : 0.16, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + BEAT * 0.85);
      osc.connect(g);
      g.connect(bus);
      osc.start(t);
      osc.stop(t + BEAT);
    }

    // --- pad: duas vozes sustentadas, entrando e saindo devagar ---
    for (const freq of acorde.slice(1)) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const filtro = ctx.createBiquadFilter();
      filtro.type = 'lowpass';
      filtro.frequency.setValueAtTime(900, t0);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      // desafinada de proposito: duas vozes batendo dao corpo
      osc.detune.setValueAtTime(freq === acorde[1] ? -6 : 7, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.075, t0 + BEAT * 0.8);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + BEAT * 4);
      osc.connect(filtro);
      filtro.connect(g);
      g.connect(bus);
      osc.start(t0);
      osc.stop(t0 + BEAT * 4.1);
    }

    // --- ar no contratempo: mantem o pulso vivo sem virar percussao ---
    for (const batida of [1.5, 3.5]) {
      const t = t0 + batida * BEAT;
      const src = ctx.createBufferSource();
      src.buffer = bufferRuido(ctx, 0.14);
      const filtro = ctx.createBiquadFilter();
      filtro.type = 'bandpass';
      filtro.frequency.setValueAtTime(5200, t);
      filtro.Q.value = 1.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.03, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      src.connect(filtro);
      filtro.connect(g);
      g.connect(bus);
      src.start(t);
      src.stop(t + 0.15);
    }

    musicTimer.current = window.setTimeout(tocarCompasso, BEAT * 4 * 1000);
  }, [bufferRuido]);

  const startMusic = useCallback(() => {
    if (!enabled || volume <= 0) return;
    const ctx = ensureContext();
    const bus = musicGainRef.current;
    if (!ctx || !bus) return;
    if (ctx.state === 'suspended') void ctx.resume();
    if (musicOn.current) return;

    musicOn.current = true;
    compasso.current = 0;
    // Entrada por fade: a trilha aparece, nao comeca de supetao.
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.6);
    tocarCompasso();
  }, [enabled, volume, ensureContext, tocarCompasso]);

  const stopMusic = useCallback(() => {
    musicOn.current = false;
    if (musicTimer.current) {
      window.clearTimeout(musicTimer.current);
      musicTimer.current = null;
    }
    const ctx = ctxRef.current;
    const bus = musicGainRef.current;
    if (!ctx || !bus) return;
    // Saida por fade: cortar seco soa como bug.
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
  }, []);

  const musicPlaying = useCallback(() => musicOn.current, []);

  // Desligar o som pelo botao tambem cala a trilha.
  useEffect(() => {
    if (!enabled || volume <= 0) stopMusic();
  }, [enabled, volume, stopMusic]);

  useEffect(
    () => () => {
      musicOn.current = false;
      if (musicTimer.current) window.clearTimeout(musicTimer.current);
      void ctxRef.current?.close();
      ctxRef.current = null;
      masterRef.current = null;
      musicGainRef.current = null;
    },
    [],
  );

  return { play, unlock, startMusic, stopMusic, musicPlaying };
}
