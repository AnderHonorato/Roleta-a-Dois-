import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/design-system/icons/Icons';

/**
 * Estados de interface obrigatorios: carregando, vazio, erro e
 * offline. O usuario nunca fica sem resposta na tela.
 */

export function LoadingState({ label = 'Carregando' }: { label?: string }) {
  return (
    <div className="state-view" role="status" aria-live="polite">
      <span className="state-view__spinner" aria-hidden="true" />
      <p className="faint">{label}...</p>
    </div>
  );
}

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'roulette', title, description, action }: EmptyStateProps) {
  return (
    <div className="state-view">
      <span className="state-view__glyph" aria-hidden="true">
        <Icon name={icon} size={28} />
      </span>
      <h3 className="display" style={{ fontSize: 'var(--fs-lg)' }}>
        {title}
      </h3>
      {description ? <p className="faint lede center">{description}</p> : null}
      {action}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Algo quebrou', message, onRetry }: ErrorStateProps) {
  return (
    <div className="state-view" role="alert">
      <span className="state-view__glyph state-view__glyph--danger" aria-hidden="true">
        <Icon name="shield" size={28} />
      </span>
      <h3 className="display" style={{ fontSize: 'var(--fs-lg)' }}>
        {title}
      </h3>
      <p className="faint center">{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn--ghost" onClick={onRetry}>
          Tentar de novo
        </button>
      ) : null}
    </div>
  );
}

export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div className="status-strip status-strip--warn" role="status">
      Sem conexao. O jogo continua: tudo fica salvo neste dispositivo.
    </div>
  );
}

export function SaveIndicator({
  status,
  error,
  onRetry,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;
  onRetry: () => void;
}) {
  if (status === 'idle') return null;
  if (status === 'error') {
    return (
      <div className="status-strip status-strip--error" role="alert">
        <span className="grow">{error ?? 'Nao consegui salvar.'}</span>
        <button type="button" className="btn btn--quiet" onClick={onRetry}>
          Tentar de novo
        </button>
      </div>
    );
  }
  return (
    <div className="status-strip" role="status" aria-live="polite">
      {status === 'saving' ? 'Salvando...' : 'Salvo'}
    </div>
  );
}
