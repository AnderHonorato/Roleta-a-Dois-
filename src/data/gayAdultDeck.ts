/**
 * Conteudo complementar da roleta.
 * As combinacoes sao deliberadamente compostas para sempre formar
 * uma frase/jogada coerente. Linguagem adulta e provocante, sem
 * descricao grafica.
 */
export const gayAdultDeck = {
  roles: ['DOMINANTE', 'SUBMISSO', 'AMBOS', 'QUEM GANHOU'],
  verbs: [
    'beijar', 'abraçar', 'provocar', 'encarar', 'elogiar',
    'sussurrar', 'escolher', 'conduzir', 'desafiar', 'surpreender',
  ],
  styles: [
    'bem devagar', 'sem desviar o olhar', 'com carinho',
    'com confiança', 'alternando', 'por uma rodada inteira',
    'até o outro sorrir', 'deixando o outro escolher a próxima',
  ],
  questions: [
    'O que mais te provoca no seu parceiro?',
    'Qual apelido você gostaria de ouvir hoje?',
    'Quem costuma tomar a iniciativa?',
    'Qual foi o momento mais romântico de vocês?',
    'O que faz você perder a pose?',
  ],
  rewards: [
    'Escolha quem começa a próxima rodada.',
    'Ganhe +10 pontos.',
    'Desbloqueie uma rodada surpresa.',
    'Escolha a categoria da próxima rodada.',
    'Troque o papel por uma rodada.',
  ],
  events: [
    'INVERTA OS PAPÉIS',
    'RODADA DUPLA',
    'ESCOLHA DO PARCEIRO',
    'CONFISSÃO',
    'BÔNUS DE CORAGEM',
  ],
} as const;

export type GayDeckCategory = keyof typeof gayAdultDeck;

/** Garante que duas palavras selecionadas possam formar uma jogada válida. */
export const compatiblePairs = [
  ['beijar', 'bem devagar'],
  ['abraçar', 'com carinho'],
  ['provocar', 'até o outro sorrir'],
  ['encarar', 'sem desviar o olhar'],
  ['elogiar', 'com confiança'],
  ['sussurrar', 'bem devagar'],
  ['escolher', 'a próxima'],
  ['conduzir', 'por uma rodada inteira'],
  ['desafiar', 'alternando'],
  ['surpreender', 'deixando o outro escolher a próxima'],
] as const;
