import { describe, expect, it } from 'vitest';
import type { Challenge } from '@/types';
import {
  SKIP_PENALTY,
  applySkipPenalty,
  highestLevel,
  multiplierFor,
  nextTier,
  scoreRound,
} from '@/features/game/scoring';

const challenge: Challenge = {
  id: 'test',
  audience: ['neutral'],
  level: 'quente',
  category: 'toque',
  title: 'Teste',
  description: 'Desafio de teste',
  durationSec: 100,
  score: 20,
  tags: [],
  active: true,
};

describe('multiplicador de sequencia', () => {
  it('comeca em x1', () => {
    expect(multiplierFor(0)).toBe(1);
    expect(multiplierFor(2)).toBe(1);
  });

  it('sobe nos patamares definidos', () => {
    expect(multiplierFor(3)).toBe(1.5);
    expect(multiplierFor(6)).toBe(2);
    expect(multiplierFor(10)).toBe(3);
    expect(multiplierFor(40)).toBe(3);
  });

  it('informa quanto falta para o proximo patamar', () => {
    expect(nextTier(0)).toEqual({ multiplier: 1.5, missing: 3 });
    expect(nextTier(5)).toEqual({ multiplier: 2, missing: 1 });
    expect(nextTier(10)).toBeNull();
  });
});

describe('scoreRound', () => {
  it('usa a pontuacao base do desafio quando nao ha bonus', () => {
    const result = scoreRound({ challenge, streak: 0, elapsedMs: 0, repeatCount: 0 });
    expect(result.base).toBe(20);
    expect(result.total).toBe(20);
  });

  it('aplica o multiplicador da sequencia ja contando esta rodada', () => {
    // streak 2 + esta = 3 -> x1.5
    const result = scoreRound({ challenge, streak: 2, elapsedMs: 0, repeatCount: 0 });
    expect(result.multiplier).toBe(1.5);
    expect(result.total).toBe(30);
  });

  it('premia quem cumpre a duracao sugerida', () => {
    const result = scoreRound({ challenge, streak: 0, elapsedMs: 100_000, repeatCount: 0 });
    expect(result.speedBonus).toBe(3);
    expect(result.total).toBe(23);
    expect(result.labels).toContain('Cumpriram o tempo todo');
  });

  it('penaliza quem encerra rapido demais', () => {
    const result = scoreRound({ challenge, streak: 0, elapsedMs: 10_000, repeatCount: 0 });
    expect(result.speedBonus).toBeLessThan(0);
    expect(result.labels).toContain('Rapido demais');
  });

  it('desconta repeticao do mesmo desafio na sessao', () => {
    const once = scoreRound({ challenge, streak: 0, elapsedMs: 0, repeatCount: 1 });
    const twice = scoreRound({ challenge, streak: 0, elapsedMs: 0, repeatCount: 2 });
    expect(once.total).toBeLessThan(20);
    expect(twice.total).toBeLessThan(once.total);
    expect(once.labels).toContain('Ja tinha aparecido');
  });

  it('nunca devolve pontuacao menor que 1', () => {
    const tiny: Challenge = { ...challenge, score: 1 };
    const result = scoreRound({ challenge: tiny, streak: 0, elapsedMs: 1000, repeatCount: 5 });
    expect(result.total).toBeGreaterThanOrEqual(1);
  });
});

describe('penalidade de troca', () => {
  it('desconta o valor fixo', () => {
    expect(applySkipPenalty(100)).toBe(100 - SKIP_PENALTY);
  });

  it('nao deixa o placar ficar negativo', () => {
    expect(applySkipPenalty(2)).toBe(0);
  });
});

describe('highestLevel', () => {
  it('mantem o nivel mais alto ja atingido', () => {
    expect(highestLevel(null, 'leve')).toBe('leve');
    expect(highestLevel('intenso', 'leve')).toBe('intenso');
    expect(highestLevel('leve', 'hardcore')).toBe('hardcore');
  });
});
