import { APP_NAME } from '@/services/config';

/**
 * Marca do produto: dois losangos encaixados (duas pessoas, um
 * dado visto de topo) com o nome ao lado. Desenho autoral em SVG,
 * herda a cor do tema ativo.
 */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="wordmark">
      <svg viewBox="0 0 34 34" width="30" height="30" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="wm-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-3)" />
          </linearGradient>
        </defs>
        <path d="M17 2 30 9.5v15L17 32 4 24.5v-15z" fill="url(#wm-a)" opacity="0.92" />
        <path d="M4 9.5 17 17l13-7.5M17 17v15" stroke="var(--bg-deep)" strokeWidth="1.4" fill="none" />
        <circle cx="11" cy="21.5" r="1.9" fill="var(--bg-deep)" />
        <circle cx="23" cy="21.5" r="1.9" fill="var(--bg-deep)" />
      </svg>
      {compact ? null : <span className="wordmark__text display">{APP_NAME}</span>}
    </span>
  );
}

/**
 * Moldura decorativa usada como divisoria editorial entre blocos.
 * A inclinacao vem do token --motif-skew, entao cada tema tem um
 * gesto proprio sem trocar de componente.
 */
export function Flourish({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`flourish ${className}`}
      viewBox="0 0 240 16"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0 8h96" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <path d="M144 8h96" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <path d="M120 1.5 128.5 8 120 14.5 111.5 8z" fill="currentColor" opacity="0.7" />
      <path d="M104 4.5 108 8l-4 3.5M136 4.5 132 8l4 3.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
    </svg>
  );
}
