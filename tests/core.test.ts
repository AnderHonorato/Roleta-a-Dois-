import { describe, expect, it } from 'vitest';
import { getMessage, messageCount } from '@/data/messages';
import { pickDifferent, pickWeighted, randomInt } from '@/lib/rng';
import { formatClock, formatDuration, formatPoints, initialsOf } from '@/lib/format';
import { checkPassword, cleanLine, cleanUsername, isValidEmail, safeFileName } from '@/lib/sanitize';
import { evaluateAchievements } from '@/features/game/achievements';
import { ACHIEVEMENTS } from '@/data/achievements';

describe('mensagens dinamicas', () => {
  it('tem uma base grande de textos', () => {
    expect(messageCount()).toBeGreaterThan(40);
  });

  it('devolve algo para todo evento e todo publico', () => {
    for (const audience of ['gay', 'lesbian', 'hetero', 'bi', 'queer', 'neutral'] as const) {
      expect(getMessage('revealed', audience).length).toBeGreaterThan(0);
      expect(getMessage('skipped', audience).length).toBeGreaterThan(0);
      expect(getMessage('idle', audience).length).toBeGreaterThan(0);
    }
  });

  it('evita repetir a mensagem anterior', () => {
    const previous = getMessage('confirmed', 'neutral');
    for (let i = 0; i < 20; i += 1) {
      expect(getMessage('confirmed', 'neutral', previous)).not.toBe(previous);
    }
  });
});

describe('sorteio', () => {
  it('evita itens recentes quando existe alternativa', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    for (let i = 0; i < 40; i += 1) {
      const picked = pickWeighted(items, ['a', 'b'], (item) => item.id);
      expect(picked?.id).toBe('c');
    }
  });

  it('volta a usar tudo quando a memoria cobre o catalogo inteiro', () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    const picked = pickWeighted(items, ['a', 'b'], (item) => item.id);
    expect(picked).not.toBeNull();
  });

  it('devolve null para lista vazia', () => {
    expect(pickWeighted([], [], () => '')).toBeNull();
    expect(pickDifferent([], null)).toBeNull();
  });

  it('randomInt respeita os limites', () => {
    for (let i = 0; i < 200; i += 1) {
      const value = randomInt(1, 6);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe('formatacao', () => {
  it('formata relogio em mm:ss', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(272_000)).toBe('04:32');
    expect(formatClock(-500)).toBe('00:00');
  });

  it('formata duracao longa', () => {
    expect(formatDuration(45_000)).toBe('45s');
    expect(formatDuration(12 * 60_000)).toBe('12min');
    expect(formatDuration(64 * 60_000)).toBe('1h 04min');
  });

  it('formata pontos e iniciais', () => {
    expect(formatPoints(1234)).toBe('1.234');
    expect(initialsOf('Alex Silva')).toBe('AS');
    expect(initialsOf('Sam')).toBe('SA');
    expect(initialsOf('   ')).toBe('?');
  });
});

describe('saneamento e validacao', () => {
  it('normaliza usuario', () => {
    expect(cleanUsername('Alex Silva!')).toBe('alexsilva');
    expect(cleanUsername('ABC_123-x.y')).toBe('abc_123-x.y');
  });

  it('colapsa espacos e corta no limite', () => {
    expect(cleanLine('  muito    espaco  ')).toBe('muito espaco');
    expect(cleanLine('x'.repeat(100), 10).length).toBe(10);
  });

  it('valida e-mail', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('sem-arroba')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });

  it('exige senha com letra, numero e 8 caracteres', () => {
    expect(checkPassword('curta1').ok).toBe(false);
    expect(checkPassword('somenteletras').ok).toBe(false);
    expect(checkPassword('12345678').ok).toBe(false);
    expect(checkPassword('senhaboa1').ok).toBe(true);
  });

  it('gera nome de arquivo seguro', () => {
    expect(safeFileName('../../etc/passwd')).toBe('passwd');
    expect(safeFileName('foto do casal (1).jpg')).toMatch(/^[\w.-]+$/);
  });
});

describe('conquistas', () => {
  const base = {
    streak: 0,
    totalPoints: 0,
    sessionDurationMs: 0,
    skipsInSession: 0,
    roundsInSession: 1,
    categories: new Set<never>(),
    level: 'leve' as const,
    multiplier: 1,
    recoveredAfterSkips: false,
    challengeTags: [],
    hour: 12,
    unlocked: new Set<string>(),
  };

  it('desbloqueia a primeira rodada', () => {
    expect(evaluateAchievements(base)).toContain('primeira-rodada');
  });

  it('nao repete o que ja esta desbloqueado', () => {
    const result = evaluateAchievements({ ...base, unlocked: new Set(['primeira-rodada']) });
    expect(result).not.toContain('primeira-rodada');
  });

  it('reconhece sequencias e nivel intenso', () => {
    const result = evaluateAchievements({ ...base, streak: 10, level: 'hardcore', multiplier: 3 });
    expect(result).toContain('cinco-seguidas');
    expect(result).toContain('dez-seguidas');
    expect(result).toContain('modo-intenso');
    expect(result).toContain('multiplicador-maximo');
  });

  it('toda regra aponta para uma conquista existente', () => {
    const slugs = new Set(ACHIEVEMENTS.map((item) => item.slug));
    const everything = evaluateAchievements({
      ...base,
      streak: 99,
      totalPoints: 99_999,
      sessionDurationMs: 4 * 60 * 60 * 1000,
      roundsInSession: 50,
      categories: new Set(['toque', 'jogo', 'palavras', 'posicao']) as never,
      level: 'hardcore',
      multiplier: 3,
      recoveredAfterSkips: true,
      challengeTags: ['lugar'],
      hour: 3,
    });
    for (const slug of everything) expect(slugs.has(slug)).toBe(true);
    expect(everything.length).toBe(ACHIEVEMENTS.length);
  });
});
