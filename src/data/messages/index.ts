import type { Audience } from '@/types';
import { pickDifferent } from '@/lib/rng';

export type MessageEvent =
  | 'welcome'
  | 'rolling'
  | 'revealed'
  | 'confirmed'
  | 'skipped'
  | 'idle'
  | 'idleLong'
  | 'streak'
  | 'levelUp'
  | 'record'
  | 'returning'
  | 'longSession'
  | 'sessionEnd'
  | 'achievement'
  | 'empty'
  | 'win'
  | 'loss'
  | 'flirty';

type Bank = Record<MessageEvent, string[]>;

/** Base comum: serve a qualquer casal. */
const base: Bank = {
  welcome: [
    'A noite e de voces. A roleta so da o empurrao.',
    'Regra unica: os dois querendo. O resto e sorte.',
    'Tudo pronto. Falta so alguem ter coragem de tocar no dado.',
    'Voces de novo por aqui. Otimo sinal.',
  ],
  rolling: [
    'Rolando...',
    'Deixa o dado decidir.',
    'Agora nao tem volta.',
    'Segura ai.',
  ],
  revealed: [
    'Foi isso que saiu. Boa sorte.',
    'O dado falou. Quem executa sao voces.',
    'Olha o que apareceu.',
    'Pronto. Agora e com voces dois.',
    'Essa caiu bem, hein?',
  ],
  confirmed: [
    'Anotado. E contabilizado.',
    'Isso sim. Proxima.',
    'Voces nao estao brincando hoje.',
    'Placar atualizado. E a noite mal comecou.',
    'Feito. E ainda sobrou folego?',
  ],
  skipped: [
    'Essa assustou voces?',
    'Ta bom... vamos fingir que essa nao apareceu.',
    'Covardia detectada. Proxima!',
    'Talvez a proxima seja pior.',
    'Sem problema. A roleta tem memoria curta. Mais ou menos.',
    'Guardaram essa pra depois, ne? Sei.',
  ],
  idle: [
    'Voces estao ocupados demais para clicar?',
    'Ja faz um tempinho...',
    'A roleta ainda esta esperando voces.',
    'Hmm... silencio suspeito.',
    'Sem pressa. Mas o cronometro esta correndo.',
  ],
  idleLong: [
    'Ok, agora ficou obvio o que aconteceu aqui.',
    'Quando voltarem, o placar continua igual.',
    'A gente espera. Nao e como se tivesse mais o que fazer.',
    'Tudo pausado. Aproveitem.',
  ],
  streak: [
    'Sequencia em andamento. Nao estraga agora.',
    'Tres seguidas. Alguem esta inspirado.',
    'O multiplicador agradece.',
    'Nesse ritmo voces batem recorde.',
  ],
  levelUp: [
    'Subiu o nivel. Sem volta.',
    'Ficou serio agora.',
    'Nivel novo desbloqueado. Respira.',
    'A partir daqui a roleta joga sujo.',
  ],
  record: [
    'Recorde novo. Anota essa data.',
    'Melhor pontuacao de voces ate hoje.',
    'Superaram a propria marca. Impressionante.',
  ],
  returning: [
    'Voltaram. A roleta nem tinha desligado.',
    'De novo aqui. Nao julgamos.',
    'Bem-vindos de volta. Continuamos de onde parou.',
  ],
  longSession: [
    'Uma hora de jogo. Bebam agua, serio.',
    'Sessao longa. Alongamento e recomendado.',
    'Voces estao nisso ha um bom tempo. Respeito.',
  ],
  sessionEnd: [
    'Fim de sessao. Olha so o que voces fizeram.',
    'Encerrado. O resumo esta logo abaixo.',
    'Por hoje e so. Ou nao.',
  ],
  achievement: [
    'Conquista nova.',
    'Desbloqueado.',
    'Isso aqui vale um selo.',
  ],
  empty: [
    'Nao sobrou nada com esses filtros. Solta um pouco.',
    'Voces filtraram tanto que a roleta ficou sem opcao.',
  ],
  win: [
    'Ganhou 😏 Agora escolhe quem vai conduzir a proxima.',
    'Ponto seu. E essa cara de satisfeito nao engana ninguem. 🔥',
    'Vitória registrada. O outro vai ter que se virar agora. ❤️',
    'Essa rodada foi sua. Aproveita a vantagem. 😈',
  ],
  loss: [
    'Perdeu 😈 Sem drama. A roleta ainda tem planos.',
    'Ops... perdeu. Hora de encarar a próxima. 😏',
    'A sorte virou a cara. Não fica com vergonha. 🔥',
    'Perdeu a rodada. Pelo menos ganhou uma boa desculpa para continuar. ❤️',
  ],
  flirty: [
    'Essa combinação ficou perigosamente boa. 😏',
    'Dois homens, uma roleta e zero garantia de tranquilidade. 🔥',
    'Essa rodada tem química. Não desperdicem. ❤️',
    'A roleta percebeu a tensão antes de vocês. 👀',
  ],
};

/**
 * Camada por publico: alguns eventos ganham variacoes proprias,
 * mudando o vocabulario sem cair em estereotipo. O que nao for
 * sobrescrito cai no banco comum.
 */
const byAudience: Partial<Record<Audience, Partial<Bank>>> = {
  gay: {
    win: ['Bonito. Ganhou e ainda vai ficar se achando. 😏', 'Ponto para você. O outro que aguente a provocação. 🔥'],
    loss: ['Perdeu, gato. Agora segura a provocação. 😈', 'A sorte escolheu o outro. Faz parte. 😉'],
    flirty: ['Essa caiu com uma tensão deliciosa. 😏🔥', 'A química de vocês acabou de ganhar uma rodada. ❤️'],
    revealed: ['Saiu essa. Decidam quem comeca.', 'A roleta escolheu. Agora e com os dois.'],
    skipped: ['Serio? Essa era facil.', 'Passou essa. A proxima nao vai ser tao gentil.'],
    confirmed: ['Feito. Placar subindo.', 'Isso ai. Proxima ja.'],
  },
  lesbian: {
    revealed: ['A roleta gostou de voces. Olha o que veio.', 'Essa aqui tem cara de demorar.'],
    skipped: ['Trocaram. Tudo bem, a noite e longa.', 'Deixaram essa pra depois. Fica anotado.'],
    confirmed: ['Contabilizado. Sem pressa pra proxima.', 'Isso. Continuem assim.'],
  },
  hetero: {
    revealed: ['Saiu. Quem vai primeiro?', 'Essa e pra hoje mesmo.'],
    skipped: ['Pulou. Quem foi que amarelou?', 'Proxima. E dessa vez nao vale fugir.'],
  },
  bi: {
    revealed: ['A roleta nao escolhe lado. Olha o que caiu.', 'Essa serve pros dois. Aproveitem.'],
    confirmed: ['Marcado. O placar agradece.', 'Feito e bem feito.'],
  },
  queer: {
    revealed: ['Sem manual, sem regra pronta. So isso aqui.', 'Caiu essa. Adaptem do jeito de voces.'],
    confirmed: ['Do jeito de voces. Pontuado.', 'Feito. Proxima.'],
  },
};

/** Sorteia uma mensagem do evento, evitando repetir a anterior. */
export function getMessage(
  event: MessageEvent,
  audience: Audience = 'neutral',
  previous: string | null = null,
): string {
  const custom = byAudience[audience]?.[event] ?? [];
  const pool = [...custom, ...base[event]];
  return pickDifferent(pool, previous) ?? base[event][0];
}

export function messageCount(): number {
  return Object.values(base).reduce((total, list) => total + list.length, 0);
}

export { base as baseMessages };
