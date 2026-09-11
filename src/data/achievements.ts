import type { Achievement } from '@/types';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', slug: 'primeira-rodada', title: 'Primeira rodada', description: 'Voces tocaram no dado. Comecou.', order: 1 },
  { id: 'a2', slug: 'cinco-seguidas', title: 'Cinco seguidas', description: 'Cinco desafios confirmados em sequencia.', order: 2 },
  { id: 'a3', slug: 'dez-seguidas', title: 'Dez seguidas', description: 'Dez em sequencia, sem desistir de nenhum.', order: 3 },
  { id: 'a4', slug: 'sem-desistir', title: 'Sem desistir', description: 'Uma sessao inteira sem usar o botao de trocar.', order: 4 },
  { id: 'a5', slug: 'exploradores', title: 'Exploradores', description: 'Desafios de pelo menos quatro categorias diferentes.', order: 5 },
  { id: 'a6', slug: 'madrugada', title: 'Madrugada', description: 'Uma rodada confirmada entre 2h e 5h da manha.', order: 6 },
  { id: 'a7', slug: 'sessao-longa', title: 'Sessao longa', description: 'Mais de uma hora na mesma sessao.', order: 7 },
  { id: 'a8', slug: 'modo-intenso', title: 'Modo intenso', description: 'Primeiro desafio de nivel intenso ou acima confirmado.', order: 8 },
  { id: 'a9', slug: 'pontuacao-alta', title: 'Pontuacao alta', description: 'Mil pontos acumulados pelo casal.', order: 9 },
  { id: 'a10', slug: 'multiplicador-maximo', title: 'Multiplicador maximo', description: 'Chegaram ao multiplicador x3.', order: 10 },
  { id: 'a11', slug: 'volta-por-cima', title: 'Volta por cima', description: 'Recuperaram uma sequencia depois de tres trocas.', order: 11 },
  { id: 'a12', slug: 'casa-inteira', title: 'A casa inteira', description: 'Confirmaram um desafio que muda de comodo.', order: 12 },
];

export function getAchievement(slug: string): Achievement | null {
  return ACHIEVEMENTS.find((item) => item.slug === slug) ?? null;
}
