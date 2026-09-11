import { describe, expect, it } from 'vitest';
import {
  LEVELS,
  LEVEL_ORDER,
  allChallenges,
  filterChallenges,
  findChallenge,
  levelIndex,
  matchesAudience,
} from '@/data/challenges';

describe('catalogo de desafios', () => {
  it('nao tem ids repetidos', () => {
    const ids = allChallenges.map((challenge) => challenge.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tem conteudo em todos os niveis', () => {
    for (const level of LEVEL_ORDER) {
      expect(allChallenges.filter((item) => item.level === level).length).toBeGreaterThan(0);
    }
  });

  it('todo desafio tem titulo, descricao e pontuacao positiva', () => {
    for (const challenge of allChallenges) {
      expect(challenge.title.length).toBeGreaterThan(0);
      expect(challenge.description.length).toBeGreaterThan(10);
      expect(challenge.score).toBeGreaterThan(0);
      expect(challenge.audience.length).toBeGreaterThan(0);
    }
  });

  it('pontua de forma crescente conforme o nivel', () => {
    expect(LEVELS.leve.basePoints).toBeLessThan(LEVELS.quente.basePoints);
    expect(LEVELS.quente.basePoints).toBeLessThan(LEVELS.intenso.basePoints);
    expect(LEVELS.intenso.basePoints).toBeLessThan(LEVELS.hardcore.basePoints);
  });

  it('so o hardcore exige confirmacao extra', () => {
    expect(LEVELS.hardcore.gated).toBe(true);
    expect(LEVELS.leve.gated).toBe(false);
  });
});

describe('filtro por publico e nivel', () => {
  it('respeita o teto de nivel', () => {
    const result = filterChallenges({ audience: 'neutral', maxLevel: 'quente' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => levelIndex(item.level) <= levelIndex('quente'))).toBe(true);
  });

  it('nunca inclui hardcore quando o teto e intenso', () => {
    const result = filterChallenges({ audience: 'neutral', maxLevel: 'intenso' });
    expect(result.some((item) => item.level === 'hardcore')).toBe(false);
  });

  it('remove categorias excluidas', () => {
    const result = filterChallenges({
      audience: 'neutral',
      maxLevel: 'hardcore',
      excludedCategories: ['controle', 'posicao'],
    });
    expect(result.some((item) => item.category === 'controle')).toBe(false);
    expect(result.some((item) => item.category === 'posicao')).toBe(false);
  });

  it('entrega conteudo para todos os publicos', () => {
    for (const audience of ['gay', 'lesbian', 'hetero', 'bi', 'queer', 'neutral'] as const) {
      const result = filterChallenges({ audience, maxLevel: 'hardcore' });
      expect(result.length).toBeGreaterThan(30);
    }
  });

  it('itens neutros servem a qualquer publico', () => {
    const neutral = allChallenges.find((item) => item.audience.includes('neutral'));
    expect(neutral).toBeDefined();
    expect(matchesAudience(neutral!, 'gay')).toBe(true);
    expect(matchesAudience(neutral!, 'lesbian')).toBe(true);
  });

  it('limita a um unico nivel quando pedido', () => {
    const result = filterChallenges({ audience: 'neutral', maxLevel: 'hardcore', onlyLevel: 'leve' });
    expect(result.every((item) => item.level === 'leve')).toBe(true);
  });
});

describe('findChallenge', () => {
  it('encontra pelo id e devolve null quando nao existe', () => {
    expect(findChallenge(allChallenges[0].id)?.id).toBe(allChallenges[0].id);
    expect(findChallenge('nao-existe')).toBeNull();
  });
});
