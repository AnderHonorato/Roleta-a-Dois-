import type { Couple, CoupleMember, PersistedState, User } from '@/types';
import { createId } from '@/lib/id';
import { createSalt, hashPassword, verifyPassword } from '@/lib/crypto';
import { checkPassword, cleanLine, cleanUsername, isValidEmail } from '@/lib/sanitize';
import { STATE_VERSION } from '../config';

/**
 * Autenticacao do modo demo.
 *
 * Roda no cliente e serve para que o fluxo completo (cadastro,
 * login, troca de senha, exclusao) exista e possa ser testado sem
 * servidor. As senhas passam por PBKDF2 antes de serem gravadas:
 * nada em texto puro, nem no modo demo.
 *
 * Em producao estas mesmas funcoes viram chamadas ao backend, que
 * faz o hashing (argon2id/bcrypt), aplica rate limiting e emite um
 * cookie de sessao HttpOnly. O contrato de retorno e o mesmo.
 */

export interface AuthResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export const DEFAULT_PREFERENCES: Couple['preferences'] = {
  soundEnabled: true,
  volume: 0.5,
  reducedMotion: null,
  autoplayBanner: true,
  bannerIntervalMs: 30_000,
  excludedCategories: [],
  timerEnabled: true,
};

export function emptyState(): PersistedState {
  return {
    version: STATE_VERSION,
    users: [],
    couple: null,
    members: [],
    sessions: [],
    rounds: [],
    unlocked: [],
    activity: [],
    currentUserId: null,
    onboardingDone: false,
    ageConfirmed: false,
    hardcoreConsent: false,
  };
}

export interface SignUpInput {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

/** Cria um usuario ja com hash de senha. Nao vincula a casal nenhum. */
export async function createUser(input: SignUpInput): Promise<AuthResult<User>> {
  const email = input.email.trim().toLowerCase();
  const username = cleanUsername(input.username);
  const displayName = cleanLine(input.displayName, 40);

  if (!isValidEmail(email)) return { ok: false, error: 'E-mail invalido.' };
  if (username.length < 3) return { ok: false, error: 'Usuario precisa de ao menos 3 caracteres.' };
  if (displayName.length < 2) return { ok: false, error: 'Informe um nome de exibicao.' };

  const password = checkPassword(input.password);
  if (!password.ok) return { ok: false, error: password.message };

  const salt = createSalt();
  const passwordHash = await hashPassword(input.password, salt);
  const now = Date.now();

  return {
    ok: true,
    data: {
      id: createId('usr'),
      email,
      username,
      passwordHash,
      passwordSalt: salt,
      displayName,
      avatar: null,
      bio: '',
      nickname: '',
      createdAt: now,
      updatedAt: now,
    },
  };
}

/** Verifica credenciais contra a lista de usuarios do casal. */
export async function authenticate(
  users: User[],
  identifier: string,
  password: string,
): Promise<AuthResult<User>> {
  const key = identifier.trim().toLowerCase();
  const user = users.find((item) => item.email === key || item.username === key);

  // Mensagem unica para nao revelar se o e-mail existe.
  const generic = { ok: false, error: 'E-mail, usuario ou senha incorretos.' } as const;
  if (!user) {
    // Custo artificial para nao vazar a ausencia do usuario por timing.
    await hashPassword(password, createSalt());
    return generic;
  }

  const valid = await verifyPassword(password, user.passwordSalt, user.passwordHash);
  return valid ? { ok: true, data: user } : generic;
}

export async function changePassword(
  user: User,
  currentPassword: string,
  newPassword: string,
): Promise<AuthResult<User>> {
  const valid = await verifyPassword(currentPassword, user.passwordSalt, user.passwordHash);
  if (!valid) return { ok: false, error: 'Senha atual incorreta.' };

  const check = checkPassword(newPassword);
  if (!check.ok) return { ok: false, error: check.message };

  const salt = createSalt();
  const passwordHash = await hashPassword(newPassword, salt);
  return { ok: true, data: { ...user, passwordSalt: salt, passwordHash, updatedAt: Date.now() } };
}

/**
 * Recuperacao de senha.
 * No modo demo nao existe e-mail para enviar link, entao a
 * redefinicao acontece com a confirmacao da outra pessoa do casal -
 * o que tambem e a regra de "mudancas sensiveis exigem os dois".
 * Em producao isto vira um token de uso unico com expiracao.
 */
export async function resetPasswordWithPartner(
  user: User,
  partner: User,
  partnerPassword: string,
  newPassword: string,
): Promise<AuthResult<User>> {
  const partnerOk = await verifyPassword(partnerPassword, partner.passwordSalt, partner.passwordHash);
  if (!partnerOk) return { ok: false, error: 'A senha da outra pessoa nao confere.' };

  const check = checkPassword(newPassword);
  if (!check.ok) return { ok: false, error: check.message };

  const salt = createSalt();
  const passwordHash = await hashPassword(newPassword, salt);
  return { ok: true, data: { ...user, passwordSalt: salt, passwordHash, updatedAt: Date.now() } };
}

export function createCouple(name: string, theme: Couple['theme']): Couple {
  const now = Date.now();
  return {
    id: createId('cpl'),
    name: cleanLine(name, 40) || 'Nosso perfil',
    description: '',
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
  };
}

export function linkMember(coupleId: string, userId: string, role: CoupleMember['role']): CoupleMember {
  return { coupleId, userId, role, joinedAt: Date.now() };
}
