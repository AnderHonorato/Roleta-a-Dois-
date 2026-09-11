import type { Category, Level } from '@/types';
import { levelIndex } from '@/data/challenges';

/**
 * Regras de conquista. Funcao pura: recebe o retrato do momento
 * e devolve os slugs que acabaram de ser desbloqueados.
 */
export interface AchievementContext {
  streak: number;
  totalPoints: number;
  sessionDurationMs: number;
  skipsInSession: number;
  roundsInSession: number;
  categories: Set<Category>;
  level: Level;
  multiplier: number;
  recoveredAfterSkips: boolean;
  challengeTags: string[];
  hour: number;
  unlocked: Set<string>;
}

interface Rule {
  slug: string;
  test: (context: AchievementContext) => boolean;
}

const RULES: Rule[] = [
  { slug: 'primeira-rodada', test: (c) => c.roundsInSession >= 1 },
  { slug: 'cinco-seguidas', test: (c) => c.streak >= 5 },
  { slug: 'dez-seguidas', test: (c) => c.streak >= 10 },
  { slug: 'sem-desistir', test: (c) => c.roundsInSession >= 6 && c.skipsInSession === 0 },
  { slug: 'exploradores', test: (c) => c.categories.size >= 4 },
  { slug: 'madrugada', test: (c) => c.hour >= 2 && c.hour < 5 },
  { slug: 'sessao-longa', test: (c) => c.sessionDurationMs >= 60 * 60 * 1000 },
  { slug: 'modo-intenso', test: (c) => levelIndex(c.level) >= levelIndex('intenso') },
  { slug: 'pontuacao-alta', test: (c) => c.totalPoints >= 1000 },
  { slug: 'multiplicador-maximo', test: (c) => c.multiplier >= 3 },
  { slug: 'volta-por-cima', test: (c) => c.recoveredAfterSkips && c.streak >= 3 },
  { slug: 'casa-inteira', test: (c) => c.challengeTags.includes('lugar') },
];

export function evaluateAchievements(context: AchievementContext): string[] {
  return RULES.filter((rule) => !context.unlocked.has(rule.slug) && rule.test(context)).map(
    (rule) => rule.slug,
  );
}
