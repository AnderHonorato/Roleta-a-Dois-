import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BannerImage } from '@/types';
import { Icon } from '@/design-system/icons/Icons';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface CarouselProps {
  images: BannerImage[];
  /** Troca automatica. Padrao de 30s definido nas preferencias. */
  intervalMs?: number;
  autoplay?: boolean;
  /** Conteudo sobreposto (nome do casal, selos). */
  overlay?: React.ReactNode;
}

/**
 * Banner do casal.
 *
 * Sem biblioteca: transicao por opacidade, swipe nativo por
 * pointer events, lazy loading nas imagens fora da vista e
 * autoplay que pausa com hover, foco, aba oculta ou
 * prefers-reduced-motion.
 */
export function Carousel({ images, intervalMs = 30_000, autoplay = true, overlay }: CarouselProps) {
  const active = useMemo(
    () => images.filter((image) => image.enabled).sort((a, b) => a.order - b.order),
    [images],
  );
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const dragStart = useRef<number | null>(null);
  const region = useRef<HTMLDivElement>(null);

  const count = active.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (!autoplay || paused || reducedMotion || count < 2) return;
    const id = window.setInterval(() => setIndex((current) => (current + 1) % count), intervalMs);
    return () => window.clearInterval(id);
  }, [autoplay, paused, reducedMotion, count, intervalMs]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.visibilityState !== 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const onPointerDown = (event: React.PointerEvent) => {
    dragStart.current = event.clientX;
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const delta = event.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(delta) < 40) return;
    go(index + (delta < 0 ? 1 : -1));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(index - 1);
    }
  };

  if (count === 0) {
    return (
      <div className="banner banner--empty">
        <div className="banner__placeholder" aria-hidden="true">
          <Icon name="image" size={26} />
        </div>
        <div className="banner__overlay">{overlay}</div>
      </div>
    );
  }

  return (
    <div
      className="banner"
      ref={region}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Banner do casal"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        dragStart.current = null;
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {active.map((image, position) => (
        <img
          key={image.id}
          src={image.src}
          alt={image.alt || `Imagem ${position + 1} de ${count}`}
          className={`banner__img${position === index ? ' is-active' : ''}`}
          loading={position === 0 ? 'eager' : 'lazy'}
          decoding="async"
          aria-hidden={position !== index}
        />
      ))}

      <div className="banner__veil" aria-hidden="true" />
      <div className="banner__overlay">{overlay}</div>

      {count > 1 ? (
        <>
          <button
            type="button"
            className="banner__arrow banner__arrow--prev"
            onClick={() => go(index - 1)}
            aria-label="Imagem anterior"
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <button
            type="button"
            className="banner__arrow banner__arrow--next"
            onClick={() => go(index + 1)}
            aria-label="Proxima imagem"
          >
            <Icon name="chevron-right" size={18} />
          </button>
          <div className="banner__dots">
            {active.map((image, position) => (
              <button
                key={image.id}
                type="button"
                className={`banner__dot${position === index ? ' is-active' : ''}`}
                onClick={() => go(position)}
                aria-label={`Ir para a imagem ${position + 1}`}
                aria-current={position === index}
              />
            ))}
          </div>
        </>
      ) : null}

      <span className="sr-only" aria-live="polite">
        Imagem {index + 1} de {count}
      </span>
    </div>
  );
}
