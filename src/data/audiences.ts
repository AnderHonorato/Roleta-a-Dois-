import type { Audience } from '@/types';

export interface AudienceProfile {
  id: Audience;
  label: string;
  /** Frase curta de identidade, usada no onboarding e no cabecalho. */
  tagline: string;
  /** Como o app se refere as duas pessoas em textos genericos. */
  pairWord: string;
  /** Assinatura da tela principal, muda o tom do produto. */
  signature: string;
}

/**
 * Perfis disponiveis. A escolha aqui troca tema (CSS), vocabulario
 * (data/messages) e o recorte do catalogo (data/challenges).
 */
export const AUDIENCES: AudienceProfile[] = [
  {
    id: 'hetero',
    label: 'Casal hetero',
    tagline: 'Fogo direto, sem rodeio.',
    pairWord: 'voces dois',
    signature: 'Quem manda hoje decide no dado.',
  },
  {
    id: 'gay',
    label: 'Casal gay',
    tagline: 'Frio por fora, elétrico por dentro.',
    pairWord: 'voces dois',
    signature: 'Dois no comando. Um dado pra decidir.',
  },
  {
    id: 'lesbian',
    label: 'Casal lesbico',
    tagline: 'Calor lento, sem hora pra acabar.',
    pairWord: 'voces duas',
    signature: 'Sem pressa. A noite e longa de proposito.',
  },
  {
    id: 'bi',
    label: 'Bissexual',
    tagline: 'Duas correntes no mesmo circuito.',
    pairWord: 'voces dois',
    signature: 'Sem lado certo. So o que voces quiserem.',
  },
  {
    id: 'queer',
    label: 'Queer',
    tagline: 'Sem manual, sem molde.',
    pairWord: 'voces',
    signature: 'As regras sao as que voces escreverem.',
  },
  {
    id: 'neutral',
    label: 'Neutro / do nosso jeito',
    tagline: 'Elegante, quente e sem rotulo.',
    pairWord: 'voces',
    signature: 'O dado sorteia. Voces definem o resto.',
  },
];

export function getAudience(id: Audience): AudienceProfile {
  return AUDIENCES.find((profile) => profile.id === id) ?? AUDIENCES[AUDIENCES.length - 1];
}
