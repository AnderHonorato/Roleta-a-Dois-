import { useEffect, useMemo, useRef, useState } from 'react';
import './die.css';

/**
 * Dado de seis faces em 2.5D.
 *
 * A rotacao final e determinada pela face sorteada; o "voo" e uma
 * animacao CSS (sobe, gira, desacelera, cai, quica). Nada de
 * requestAnimationFrame por frame: o navegador compoe tudo na GPU.
 * Com prefers-reduced-motion a face simplesmente troca.
 */

export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;

/** Rotacao que traz cada face para a frente da camera. */
const FACE_ROTATION: Record<DieFace, { rx: number; ry: number }> = {
  1: { rx: 0, ry: 0 },
  2: { rx: 0, ry: -90 },
  3: { rx: -90, ry: 0 },
  4: { rx: 90, ry: 0 },
  5: { rx: 0, ry: 90 },
  6: { rx: 0, ry: 180 },
};

/** Posicao dos pips em coordenadas 0-100. */
const PIP_LAYOUT: Record<DieFace, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[26, 26], [74, 74]],
  3: [[24, 24], [50, 50], [76, 76]],
  4: [[26, 26], [74, 26], [26, 74], [74, 74]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[26, 22], [74, 22], [26, 50], [74, 50], [26, 78], [74, 78]],
};

function Pips({ face }: { face: DieFace }) {
  return (
    <svg className="die-pips" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {PIP_LAYOUT[face].map(([cx, cy], index) => (
        <circle key={`${cx}-${cy}-${index}`} cx={cx} cy={cy} r="8.5" />
      ))}
    </svg>
  );
}

const FACE_CLASS = ['front', 'right', 'top', 'bottom', 'left', 'back'] as const;
const FACE_VALUE: DieFace[] = [1, 2, 3, 4, 5, 6];

export interface DieProps {
  /** Face que deve ficar de frente quando o dado parar. */
  face: DieFace;
  rolling: boolean;
  reducedMotion: boolean;
  rollMs?: number;
  disabled?: boolean;
  /** Convite visual quando o dado esta parado, esperando um toque. */
  inviting?: boolean;
  onRoll: () => void;
  label?: string;
}

export function Die({
  face,
  rolling,
  reducedMotion,
  rollMs = 2800,
  disabled = false,
  inviting = true,
  onRoll,
  label = 'Rolar o dado',
}: DieProps) {
  // Voltas extras acumuladas: cada arremesso gira mais, nunca volta.
  const turns = useRef({ x: 0, y: 0 });
  // Cada arremesso ganha uma trajetoria propria - altura, inclinacao da
  // queda e giro no proprio eixo. Sem isso dois arremessos seguidos sao
  // visivelmente identicos, e o dado deixa de parecer solto na mesa.
  const arremesso = useRef({ altura: 1, deriva: 0, rodopio: 0 });
  const [, force] = useState(0);

  useEffect(() => {
    if (!rolling || reducedMotion) return;
    turns.current = {
      x: turns.current.x + 3 + Math.floor(Math.random() * 4),
      y: turns.current.y + 4 + Math.floor(Math.random() * 5),
    };
    arremesso.current = {
      altura: 0.82 + Math.random() * 0.5,
      deriva: (Math.random() - 0.5) * 54,
      rodopio: (Math.random() - 0.5) * 26,
    };
    force((n) => n + 1);
  }, [rolling, reducedMotion]);

  const rotation = useMemo(() => {
    const target = FACE_ROTATION[face];
    if (reducedMotion) return target;
    return {
      rx: target.rx - turns.current.x * 360,
      ry: target.ry - turns.current.y * 360,
    };
  }, [face, reducedMotion, rolling]); // eslint-disable-line react-hooks/exhaustive-deps

  const duration = reducedMotion ? 0 : rollMs;

  return (
    <div className="die-stage">
      {inviting && !rolling && !reducedMotion ? <span className="die-halo" aria-hidden="true" /> : null}

      <div
        className={`die-lift${rolling && !reducedMotion ? ' is-rolling' : ''}${
          !rolling && !reducedMotion ? ' is-resting' : ''
        }`}
        style={{
          ['--roll-ms' as string]: `${duration}ms`,
          ['--altura' as string]: String(arremesso.current.altura),
          ['--deriva' as string]: `${arremesso.current.deriva}px`,
          ['--rodopio' as string]: `${arremesso.current.rodopio}deg`,
        }}
      >
        {/* Camada de camera: inclina a cena para que a face sorteada
            fique legivel de frente sem perder o volume do cubo. */}
        <div className="die-tilt">
          <div
            className="die-cube"
            style={{
              ['--rx' as string]: `${rotation.rx}deg`,
              ['--ry' as string]: `${rotation.ry}deg`,
              ['--roll-ms' as string]: `${duration}ms`,
            }}
          >
            {FACE_CLASS.map((name, index) => (
              <div key={name} className={`die-face die-face--${name}`}>
                <Pips face={FACE_VALUE[index]} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <span
        className={`die-shadow${rolling && !reducedMotion ? ' is-rolling' : ''}`}
        style={{
          ['--roll-ms' as string]: `${duration}ms`,
          // Mesma deriva do corpo: sem isto a sombra fica para tras.
          ['--deriva' as string]: `${arremesso.current.deriva}px`,
        }}
        aria-hidden="true"
      />

      <button
        type="button"
        className="die-hit"
        onClick={onRoll}
        disabled={disabled || rolling}
        aria-label={label}
        aria-busy={rolling}
      />
      <span className="sr-only" role="status">
        {rolling ? 'Rolando o dado' : `Dado parado na face ${face}`}
      </span>
    </div>
  );
}
