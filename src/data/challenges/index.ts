import type { Audience, Category, Challenge, Level } from '@/types';
import { leve } from './leve';
import { quente } from './quente';
import { intenso } from './intenso';
import { hardcore } from './hardcore';

/**
 * Catalogo completo. Cada nivel vive em seu proprio arquivo para
 * que adicionar conteudo seja um append, nunca uma edicao de
 * componente. Um painel administrativo futuro consome exatamente
 * esta mesma forma (ver docs/ARCHITECTURE.md).
 */
export const allChallenges: Challenge[] = [...leve, ...quente, ...intenso, ...hardcore];

export const LEVEL_ORDER: Level[] = ['leve', 'quente', 'intenso', 'hardcore'];

export interface LevelMeta {
  id: Level;
  label: string;
  tagline: string;
  basePoints: number;
  /** Exige confirmacao explicita de maioridade + consentimento. */
  gated: boolean;
}

export const LEVELS: Record<Level, LevelMeta> = {
  leve: {
    id: 'leve',
    label: 'Leve',
    tagline: 'Clima, olhar e as maos ainda comportadas.',
    basePoints: 10,
    gated: false,
  },
  quente: {
    id: 'quente',
    label: 'Quente',
    tagline: 'Menos roupa, mais comando, zero pressa.',
    basePoints: 20,
    gated: false,
  },
  intenso: {
    id: 'intenso',
    label: 'Intenso',
    tagline: 'Entrega longa, limites testados com cuidado.',
    basePoints: 35,
    gated: false,
  },
  hardcore: {
    id: 'hardcore',
    label: 'Hardcore',
    tagline: 'So com os dois sim, e com palavra de parada combinada.',
    basePoints: 50,
    gated: true,
  },
};

export const CATEGORIES: Record<Category, string> = {
  aquecimento: 'Aquecimento',
  toque: 'Toque',
  palavras: 'Palavras',
  posicao: 'Posicao',
  jogo: 'Jogo',
  controle: 'Controle',
  surpresa: 'Surpresa',
};

export function levelIndex(level: Level): number {
  return LEVEL_ORDER.indexOf(level);
}

/** Um item serve ao casal se foi escrito para o publico dele ou for neutro. */
export function matchesAudience(challenge: Challenge, audience: Audience): boolean {
  return challenge.audience.includes('neutral') || challenge.audience.includes(audience);
}

export interface ChallengeFilter {
  audience: Audience;
  maxLevel: Level;
  excludedCategories?: Category[];
  /** Quando definido, restringe a um unico nivel. */
  onlyLevel?: Level;
}

export function filterChallenges(
  filter: ChallengeFilter,
  source: Challenge[] = allChallenges,
): Challenge[] {
  const ceiling = levelIndex(filter.maxLevel);
  const excluded = new Set(filter.excludedCategories ?? []);
  return source.filter((challenge) => {
    if (!challenge.active) return false;
    if (!matchesAudience(challenge, filter.audience)) return false;
    if (excluded.has(challenge.category)) return false;
    if (filter.onlyLevel) return challenge.level === filter.onlyLevel;
    return levelIndex(challenge.level) <= ceiling;
  });
}

export function findChallenge(id: string, source: Challenge[] = allChallenges): Challenge | null {
  return source.find((challenge) => challenge.id === id) ?? null;
}

export { leve, quente, intenso, hardcore };
