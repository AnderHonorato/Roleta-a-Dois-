/**
 * Sorteio com memoria curta: evita repetir os ultimos N itens,
 * o que na pratica muda muito a sensacao do jogo.
 */
export function pickWeighted<T>(items: T[], recent: string[], keyOf: (item: T) => string): T | null {
  if (items.length === 0) return null;
  const recentSet = new Set(recent);
  const fresh = items.filter((item) => !recentSet.has(keyOf(item)));
  const pool = fresh.length > 0 ? fresh : items;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

/** Inteiro entre min e max, ambos inclusos. */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Escolhe um item evitando repetir o anterior, quando possivel. */
export function pickDifferent<T>(items: readonly T[], previous: T | null): T | null {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  let candidate = items[Math.floor(Math.random() * items.length)];
  let guard = 0;
  while (candidate === previous && guard < 8) {
    candidate = items[Math.floor(Math.random() * items.length)];
    guard += 1;
  }
  return candidate;
}
