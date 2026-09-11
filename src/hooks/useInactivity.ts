import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Detector de inatividade.
 *
 * Conta apenas tempo sem interacao com a PAGINA: clique, toque,
 * tecla, scroll. Nunca camera, microfone ou qualquer sensor.
 * Quando a aba perde o foco o contador congela e retoma de onde
 * parou - ficar longe da tela nao e "estar parado".
 */
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

export interface InactivityState {
  /** Ms acumulados sem interacao (congelado quando a aba esta oculta). */
  idleMs: number;
  /** Passou do limite configurado. */
  isIdle: boolean;
  /** Passou do dobro do limite. */
  isDeeplyIdle: boolean;
  /** A aba esta visivel agora. */
  focused: boolean;
  reset: () => void;
}

export function useInactivity(thresholdMs = 90_000, enabled = true): InactivityState {
  const [idleMs, setIdleMs] = useState(0);
  const [focused, setFocused] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  );
  const lastTick = useRef(Date.now());

  const reset = useCallback(() => {
    lastTick.current = Date.now();
    setIdleMs(0);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const handler = () => reset();
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handler, { passive: true }),
    );
    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handler));
    };
  }, [enabled, reset]);

  useEffect(() => {
    const onVisibility = () => {
      const visible = document.visibilityState === 'visible';
      setFocused(visible);
      // Ao voltar, nao contabiliza o tempo em que a aba esteve oculta.
      if (visible) lastTick.current = Date.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        lastTick.current = Date.now();
        return;
      }
      const now = Date.now();
      const delta = now - lastTick.current;
      lastTick.current = now;
      setIdleMs((previous) => previous + delta);
    }, 1000);
    return () => window.clearInterval(id);
  }, [enabled]);

  return {
    idleMs,
    isIdle: idleMs >= thresholdMs,
    isDeeplyIdle: idleMs >= thresholdMs * 2,
    focused,
    reset,
  };
}
