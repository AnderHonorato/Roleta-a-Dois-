import { useMemo } from 'react';
import './ambience.css';

/**
 * Camada de atmosfera permanente.
 *
 * Fica atras de tudo, o tempo todo, e nunca intercepta um toque:
 * `pointer-events: none` no container e `aria-hidden` para o leitor de
 * tela. A ideia e que a tela nunca pareca parada, sem que nada disso
 * dispute com o conteudo.
 *
 * Custo: sao divs com `transform` e `opacity` animados por CSS, tudo
 * composto na GPU. Sem canvas, sem rAF, sem trabalho na thread
 * principal - a camada pode ficar ligada para sempre.
 */

/** Brasas subindo. Cada uma com trajetoria e tempo proprios. */
const BRASAS = 16;

export interface AmbienceProps {
  /** Com movimento reduzido, so o gradiente estatico permanece. */
  reducedMotion?: boolean;
  /** Sobe a intensidade enquanto a rodada esta em jogo. */
  intense?: boolean;
}

export function Ambience({ reducedMotion = false, intense = false }: AmbienceProps) {
  // As trajetorias sao sorteadas uma vez e nao mudam a cada render,
  // senao as brasas "saltariam" de lugar a cada atualizacao da tela.
  const brasas = useMemo(
    () =>
      Array.from({ length: BRASAS }, (_, i) => ({
        id: i,
        esquerda: Math.random() * 100,
        atraso: Math.random() * 18,
        duracao: 14 + Math.random() * 16,
        escala: 0.35 + Math.random() * 1.15,
        deriva: (Math.random() - 0.5) * 90,
        opacidade: 0.16 + Math.random() * 0.4,
      })),
    [],
  );

  if (reducedMotion) {
    return <div className="ambience ambience--still" aria-hidden="true" />;
  }

  return (
    <div className={`ambience${intense ? ' is-intense' : ''}`} aria-hidden="true">
      <span className="ambience__veu ambience__veu--a" />
      <span className="ambience__veu ambience__veu--b" />

      <div className="ambience__brasas">
        {brasas.map((b) => (
          <span
            key={b.id}
            className="ambience__brasa"
            style={{
              left: `${b.esquerda}%`,
              animationDelay: `${b.atraso}s`,
              animationDuration: `${b.duracao}s`,
              ['--escala' as string]: String(b.escala),
              ['--deriva' as string]: `${b.deriva}px`,
              ['--opacidade' as string]: String(b.opacidade),
            }}
          />
        ))}
      </div>

      <span className="ambience__grao" />
    </div>
  );
}
