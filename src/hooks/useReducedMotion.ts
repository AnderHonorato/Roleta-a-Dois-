import { useEffect, useState } from 'react';

/**
 * Le prefers-reduced-motion e reage a mudanca em tempo real.
 * Usado para desligar a animacao do dado e as transicoes longas.
 */
export function useReducedMotion(override: boolean | null = null): boolean {
  const [system, setSystem] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event: MediaQueryListEvent) => setSystem(event.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return override ?? system;
}
