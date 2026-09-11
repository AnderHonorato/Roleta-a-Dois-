import type { Audience, PersistedState } from '@/types';
import { createId } from '@/lib/id';
import { createSalt, hashPassword } from '@/lib/crypto';
import { DEFAULT_PREFERENCES, emptyState } from './auth';
import { STATE_VERSION } from './config';

/**
 * Casal mockado do modo demo/convidado.
 *
 * Isolado neste arquivo de proposito: ao remover o modo demo,
 * apaga-se este arquivo e a chamada em app/state.ts, nada mais.
 * As senhas do casal fake tambem passam por PBKDF2 - nada de
 * senha em texto puro, nem em dado de exemplo.
 */
const DEMO_PASSWORD = 'demo1234';

export async function buildDemoState(theme: Audience = 'neutral'): Promise<PersistedState> {
  const now = Date.now();
  const saltA = createSalt();
  const saltB = createSalt();
  const [hashA, hashB] = await Promise.all([
    hashPassword(DEMO_PASSWORD, saltA),
    hashPassword(DEMO_PASSWORD, saltB),
  ]);

  const userA = {
    id: createId('usr'),
    email: 'um@demo.local',
    username: 'um',
    passwordHash: hashA,
    passwordSalt: saltA,
    displayName: 'Alex',
    avatar: null,
    bio: 'Entrei so pra ver como funciona. Fiquei.',
    nickname: 'Lex',
    createdAt: now,
    updatedAt: now,
  };

  const userB = {
    id: createId('usr'),
    email: 'dois@demo.local',
    username: 'dois',
    passwordHash: hashB,
    passwordSalt: saltB,
    displayName: 'Sam',
    avatar: null,
    bio: 'Sempre acha que vai ganhar no par ou impar.',
    nickname: 'Sa',
    createdAt: now,
    updatedAt: now,
  };

  const coupleId = createId('cpl');

  return {
    ...emptyState(),
    version: STATE_VERSION,
    users: [userA, userB],
    couple: {
      id: coupleId,
      name: 'Modo convidado',
      description: 'Casal de demonstracao. Nada daqui sai deste navegador.',
      banner: null,
      gallery: [],
      theme,
      maxLevel: 'quente',
      since: null,
      preferences: { ...DEFAULT_PREFERENCES },
      totalPoints: 0,
      bestStreak: 0,
      createdAt: now,
      updatedAt: now,
    },
    members: [
      { coupleId, userId: userA.id, role: 'owner', joinedAt: now },
      { coupleId, userId: userB.id, role: 'partner', joinedAt: now },
    ],
    currentUserId: userA.id,
  };
}

export const DEMO_CREDENTIALS = {
  password: DEMO_PASSWORD,
  accounts: [
    { label: 'Alex', identifier: 'um' },
    { label: 'Sam', identifier: 'dois' },
  ],
};
