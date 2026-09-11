import { useEffect, useState } from 'react';
import { APP_NAME } from '@/services/config';

/**
 * Abertura curta. Sai assim que o estado carrega — nunca fica
 * esperando de proposito para "parecer" que algo esta acontecendo.
 * Tem um teto de 1,4s para nao travar caso a carga demore.
 */
export function Splash({ done }: { done: boolean }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setHidden(true), 420);
    return () => window.clearTimeout(id);
  }, [done]);

  useEffect(() => {
    const cap = window.setTimeout(() => setHidden(true), 1400);
    return () => window.clearTimeout(cap);
  }, []);

  if (hidden) return null;

  return (
    <div className={`splash${done ? ' is-leaving' : ''}`} role="status" aria-live="polite">
      <svg className="splash__mark" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="sp-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-3)" />
          </linearGradient>
        </defs>
        <path
          className="splash__cube"
          d="M60 12 104 36v48L60 108 16 84V36z"
          fill="url(#sp-a)"
          opacity="0.9"
        />
        <path d="M16 36 60 60l44-24M60 60v48" stroke="var(--bg-deep)" strokeWidth="2" fill="none" />
        <circle className="splash__pip" cx="38" cy="72" r="5" fill="var(--bg-deep)" />
        <circle className="splash__pip splash__pip--b" cx="82" cy="72" r="5" fill="var(--bg-deep)" />
      </svg>
      <p className="splash__name display">{APP_NAME}</p>
      <p className="splash__note eyebrow">Conteudo adulto · 18+</p>
    </div>
  );
}
