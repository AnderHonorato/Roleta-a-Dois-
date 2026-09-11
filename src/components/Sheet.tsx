import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from '@/design-system/icons/Icons';

export interface SheetProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** Acoes fixas no rodape. */
  footer?: ReactNode;
}

/**
 * Painel deslizante (bottom sheet no mobile, painel centrado no
 * desktop). Faz o basico de dialogo acessivel: foco preso dentro,
 * Esc fecha, foco devolvido a origem, rolagem do fundo travada.
 */
export function Sheet({ open, title, description, onClose, children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => !element.hasAttribute('disabled'));

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-root" role="presentation">
      <div className="sheet-scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby={description ? 'sheet-desc' : undefined}
        ref={panelRef}
      >
        <div className="sheet__grip" aria-hidden="true" />
        <header className="sheet__head">
          <div className="grow">
            <h2 className="sheet__title display">{title}</h2>
            {description ? (
              <p id="sheet-desc" className="faint" style={{ fontSize: 'var(--fs-sm)' }}>
                {description}
              </p>
            ) : null}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <Icon name="close" />
          </button>
        </header>
        <div className="sheet__body">{children}</div>
        {footer ? <footer className="sheet__foot">{footer}</footer> : null}
      </div>
    </div>
  );
}
