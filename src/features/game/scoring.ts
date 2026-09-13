import type { Challenge, Level } from '@/types';
import { LEVELS, levelIndex } from '@/data/challenges';

/**
 * Motor de pontuacao. Logica pura, sem React e sem estado global,
 * para poder ser testada isoladamente (ver tests/scoring.test.ts).
 */

export const STREAK_TIERS = [
  { minStreak: 0, multiplier: 1 },
  { minStreak: 3, multiplier: 1.5 },
  { minStreak: 6, multiplier: 2 },
  { minStreak: 10, multiplier: 3 },
] as const;

/** Multiplicador vigente para uma sequencia de confirmacoes. */
export function multiplierFor(streak: number): number {
  let current = 1;
  for (const tier of STREAK_TIERS) {
    if (streak >= tier.minStreak) current = tier.multiplier;
  }
  return current;
}

/** Proximo patamar de multiplicador, para mostrar "faltam N". */
export function nextTier(streak: number): { multiplier: number; missing: number } | null {
  const upcoming = STREAK_TIERS.find((tier) => streak < tier.minStreak);
  if (!upcoming) return null;
  return { multiplier: upcoming.multiplier, missing: upcoming.minStreak - streak };
}

export interface ScoreInput {
  challenge: Challenge;
  /** Sequencia ANTES desta confirmacao. */
  streak: number;
  /** Tempo gasto, em ms. Zero quando nao houve cronometro. */
  elapsedMs: number;
  /** Quantas vezes este desafio ja apareceu antes nesta sessao. */
  repeatCount: number;
}

export interface ScoreBreakdown {
  base: number;
  multiplier: number;
  speedBonus: number;
  repeatPenalty: number;
  total: number;
  labels: string[];
}

/** Custo fixo de trocar de desafio. Pequeno de proposito. */
export const SKIP_PENALTY = 5;

/**
 * Calcula os pontos de uma confirmacao.
 * - base vem do desafio (ou do nivel, se o item nao trouxer);
 * - multiplicador vem da sequencia;
 * - bonus de tempo premia cumprir dentro da duracao sugerida;
 * - repeticao do mesmo item na mesma sessao vale menos.
 */
export function scoreRound(input: ScoreInput): ScoreBreakdown {
  const { challenge, streak, elapsedMs, repeatCount } = input;
  const base = challenge.score || LEVELS[challenge.level].basePoints;
  const multiplier = multiplierFor(streak + 1);
  const labels: string[] = [];

  let speedBonus = 0;
  if (challenge.durationSec > 0 && elapsedMs > 0) {
    const target = challenge.durationSec * 1000;
    if (elapsedMs >= target) {
      speedBonus = Math.round(base * 0.15);
      labels.push('Cumpriram o tempo todo');
    } else if (elapsedMs < target * 0.35) {
      speedBonus = -Math.round(base * 0.1);
      labels.push('Rapido demais');
    }
  }

  const repeatPenalty = repeatCount > 0 ? Math.round(base * Math.min(0.5, repeatCount * 0.25)) : 0;
  if (repeatPenalty > 0) labels.push('Ja tinha aparecido');
  if (multiplier > 1) labels.push(`Sequencia x${multiplier}`);

  const total = Math.max(1, Math.round((base + speedBonus - repeatPenalty) * multiplier));

  return { base, multiplier, speedBonus, repeatPenalty, total, labels };
}

/** Pontos perdidos ao trocar de desafio (nunca deixa o placar negativo). */
export function applySkipPenalty(currentPoints: number): number {
  return Math.max(0, currentPoints - SKIP_PENALTY);
}

/** Nivel mais alto entre dois, util para registrar o topo da sessao. */
export function highestLevel(a: Level | null, b: Level): Level {
  if (!a) return b;
  return levelIndex(b) > levelIndex(a) ? b : a;
}
