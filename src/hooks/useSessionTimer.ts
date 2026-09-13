import { useEffect, useState } from 'react';

/**
 * Cronometro da sessao. Continua contando com a aba oculta
 * (a sessao existe mesmo sem ninguem olhando a tela), mas
 * recalcula a partir do timestamp de inicio para nao derivar
 * quando o navegador congela os timers em segundo plano.
 */
export function useSessionTimer(startedAt: number | null, running = true): number {
  const [elapsed, setElapsed] = useState(() => (startedAt ? Date.now() - startedAt : 0));

  useEffect(() => {
    if (!startedAt || !running) return;
    setElapsed(Date.now() - startedAt);
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    const onVisible = () => setElapsed(Date.now() - startedAt);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [startedAt, running]);

  return startedAt ? elapsed : 0;
}

/** Contagem regressiva para o cronometro do desafio. */
export function useCountdown(endsAt: number | null): number {
  const [remaining, setRemaining] = useState(() => (endsAt ? Math.max(0, endsAt - Date.now()) : 0));

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endsAt]);

  return remaining;
}
