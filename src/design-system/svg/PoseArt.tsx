import type { Audience, Category } from '@/types';
import './pose-art.css';

/**
 * Ilustracoes de execucao.
 *
 * Sao silhuetas desenhadas a mao em SVG, nao fotos nem clip-art: duas
 * figuras entrelacadas, construidas com curvas continuas e membros de
 * traco arredondado. Sugerem a cena sem descrever anatomia - o que
 * mantem o produto adulto e elegante em vez de grafico, e deixa a
 * ilustracao herdar a paleta de cada tema.
 *
 * A figura muda conforme o publico do casal (ombro, quadril e cabelo),
 * e a composicao muda conforme a categoria do desafio.
 */

type Corpo = 'masc' | 'fem' | 'neutro';

/** Pares de corpos por perfil. Queer/neutro usam o par neutro. */
const CORPOS: Record<Audience, [Corpo, Corpo]> = {
  gay: ['masc', 'masc'],
  lesbian: ['fem', 'fem'],
  hetero: ['masc', 'fem'],
  bi: ['neutro', 'fem'],
  queer: ['neutro', 'neutro'],
  neutral: ['neutro', 'neutro'],
};

/** Proporcoes por corpo: ombro, quadril e comprimento do cabelo. */
const FORMA: Record<Corpo, { ombro: number; quadril: number; cabelo: number }> = {
  masc: { ombro: 17, quadril: 11.5, cabelo: 0 },
  fem: { ombro: 11.5, quadril: 16, cabelo: 17 },
  neutro: { ombro: 14, quadril: 13.5, cabelo: 8 },
};

interface FiguraProps {
  corpo: Corpo;
  /** Ancora do quadril. */
  x: number;
  y: number;
  /** Graus. A figura inteira gira em torno do quadril. */
  rotacao?: number;
  /** Espelha horizontalmente. */
  espelha?: boolean;
  /** Desenho dos bracos: cada pose escolhe o seu. */
  bracos: string;
  /** Desenho das pernas. */
  pernas: string;
  className?: string;
}

/**
 * Uma figura: quadril na origem, torso subindo, cabeca no topo.
 * Bracos e pernas vem de fora porque sao o que muda entre as poses.
 */
function Figura({ corpo, x, y, rotacao = 0, espelha = false, bracos, pernas, className = '' }: FiguraProps) {
  const { ombro, quadril, cabelo } = FORMA[corpo];
  const alturaTorso = 58;
  const pescoco = -alturaTorso - 6;
  const cabecaY = pescoco - 9.5;

  return (
    <g
      className={className}
      transform={`translate(${x} ${y}) rotate(${rotacao}) ${espelha ? 'scale(-1 1)' : ''}`}
    >
      {/* cabelo atras da cabeca */}
      {cabelo > 0 ? (
        <path
          d={`M -9 ${cabecaY - 3} q -5 ${cabelo * 0.5} -2 ${cabelo}
              q 6 4 11 4 q 6 0 11 -4 q 3 -${cabelo * 0.5} -2 -${cabelo} z`}
          className="pose__cabelo"
        />
      ) : null}

      {/* torso: uma curva so, do quadril ao ombro */}
      <path
        d={`M ${-quadril} 0
            C ${-quadril - 3} ${-alturaTorso * 0.42}, ${-ombro - 2} ${-alturaTorso * 0.72}, ${-ombro} ${-alturaTorso}
            q ${ombro} -9 ${ombro * 2} 0
            C ${ombro + 2} ${-alturaTorso * 0.72}, ${quadril + 3} ${-alturaTorso * 0.42}, ${quadril} 0
            q ${-quadril} 11 ${-quadril * 2} 0 z`}
        className="pose__torso"
      />

      {/* pescoco: sem contorno proprio, senao vira um retangulo
          riscado sobre a cabeca */}
      <path d={`M -3.5 ${pescoco + 8} h 7 v -9 h -7 z`} className="pose__pescoco" />

      {/* cabeca */}
      <ellipse cx="0" cy={cabecaY} rx="8.5" ry="9.8" className="pose__cabeca" />

      <path d={bracos} className="pose__membro" />
      <path d={pernas} className="pose__membro" />
    </g>
  );
}

/**
 * Composicoes disponiveis.
 *
 * Todas sao de figuras em pe: a `Figura` e construida na vertical
 * (quadril na origem, torso subindo), entao poses deitadas sairiam
 * flutuando fora do chao. Quatro composicoes que funcionam valem mais
 * que seis com duas quebradas.
 */
export type PoseNome = 'abraco' | 'conduz' | 'sussurro' | 'presa';

/** Qual composicao ilustra cada categoria de desafio. */
const POR_CATEGORIA: Record<Category, PoseNome> = {
  aquecimento: 'abraco',
  toque: 'sussurro',
  palavras: 'sussurro',
  posicao: 'conduz',
  jogo: 'abraco',
  controle: 'presa',
  provocacao: 'conduz',
  surpresa: 'conduz',
};

export interface PoseArtProps {
  audience: Audience;
  category?: Category;
  /** Sobrepoe a escolha por categoria. */
  pose?: PoseNome;
  className?: string;
  /** Rotulo acessivel. Sem ele, a arte e tratada como decorativa. */
  title?: string;
}

export function PoseArt({ audience, category, pose, className = '', title }: PoseArtProps) {
  const escolhida: PoseNome = pose ?? (category ? POR_CATEGORIA[category] : 'abraco');
  const [corpoA, corpoB] = CORPOS[audience];

  return (
    <svg
      className={`pose ${className}`}
      viewBox="0 0 260 200"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {/* chao: a sombra que assenta as figuras na cena */}
      <ellipse cx="130" cy="182" rx="80" ry="8" className="pose__chao" />
      <Composicao nome={escolhida} corpoA={corpoA} corpoB={corpoB} />
    </svg>
  );
}

function Composicao({ nome, corpoA, corpoB }: { nome: PoseNome; corpoA: Corpo; corpoB: Corpo }) {
  switch (nome) {
    // Frente a frente, bracos passando um pelo outro.
    case 'abraco':
      return (
        <>
          <Figura
            className="pose__fig pose__fig--b"
            corpo={corpoB}
            x={150}
            y={126}
            rotacao={6}
            espelha
            bracos="M -16 -54 q -22 10 -34 20 M 16 -54 q 20 12 28 5"
            pernas="M -8 -2 q -3 26 -2 46 M 8 -2 q 4 26 2 46"
          />
          <Figura
            className="pose__fig pose__fig--a"
            corpo={corpoA}
            x={110}
            y={126}
            rotacao={-6}
            bracos="M -16 -54 q -20 12 -28 5 M 16 -54 q 22 10 34 20"
            pernas="M -8 -2 q -4 26 -2 46 M 8 -2 q 3 26 2 46"
          />
        </>
      );

    // Uma de pe atras da outra, conduzindo pelo quadril.
    case 'conduz':
      return (
        <>
          <Figura
            className="pose__fig pose__fig--b"
            corpo={corpoB}
            x={146}
            y={124}
            rotacao={7}
            bracos="M -20 -58 q -18 26 -14 44 M 20 -58 q 18 24 14 42"
            pernas="M -10 -2 q -6 28 -4 50 M 10 -2 q 8 28 6 50"
          />
          <Figura
            className="pose__fig pose__fig--a"
            corpo={corpoA}
            x={108}
            y={126}
            rotacao={-4}
            bracos="M -20 -58 q 14 24 34 28 M 20 -58 q 16 22 32 26"
            pernas="M -10 -2 q -8 28 -6 50 M 10 -2 q 6 28 4 50"
          />
        </>
      );

    // Cabecas juntas, uma mao na nuca da outra.
    case 'sussurro':
      return (
        <>
          <Figura
            className="pose__fig pose__fig--b"
            corpo={corpoB}
            x={150}
            y={126}
            rotacao={9}
            espelha
            bracos="M -20 -58 q -30 -6 -40 -14 M 20 -58 q 20 22 16 40"
            pernas="M -10 -2 q -4 30 -2 50 M 10 -2 q 6 30 4 50"
          />
          <Figura
            className="pose__fig pose__fig--a"
            corpo={corpoA}
            x={110}
            y={126}
            rotacao={-9}
            bracos="M -20 -58 q -18 24 -14 42 M 20 -58 q 30 -8 40 -16"
            pernas="M -10 -2 q -6 30 -4 50 M 10 -2 q 4 30 2 50"
          />
        </>
      );

    // Pulsos presos acima da cabeca pela outra.
    case 'presa':
    default:
      return (
        <>
          <Figura
            className="pose__fig pose__fig--b"
            corpo={corpoB}
            x={106}
            y={126}
            rotacao={3}
            bracos="M -20 -58 q -6 -30 -2 -46 M 20 -58 q 4 -30 0 -46"
            pernas="M -10 -2 q -6 28 -4 50 M 10 -2 q 8 28 6 50"
          />
          {/* a mao que prende: um traco atravessando os pulsos */}
          <path d="M 92 22 q 14 -7 28 0" className="pose__membro pose__membro--forte" />
          <Figura
            className="pose__fig pose__fig--a"
            corpo={corpoA}
            x={172}
            y={126}
            rotacao={-9}
            espelha
            bracos="M -20 -58 q -34 -22 -44 -38 M 20 -58 q 16 26 12 44"
            pernas="M -10 -2 q -6 28 -4 50 M 10 -2 q 8 28 6 50"
          />
        </>
      );

  }
}
