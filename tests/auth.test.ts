import { beforeAll, describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';
import { authenticate, changePassword, createUser, emptyState, resetPasswordWithPartner } from '@/services/auth';
import { hashPassword, createSalt, safeEqual, verifyPassword } from '@/lib/crypto';
import { senhaCurta, senhaValida } from './fixtures';

const SENHA = senhaValida('alex');
const SENHA_PARCEIRO = senhaValida('sam');
const SENHA_NOVA = senhaValida('nova');
const SENHA_ERRADA = senhaValida('chute');

// jsdom nao expoe WebCrypto completo; usamos o do Node.
beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  }
});

describe('derivacao de senha', () => {
  it('nunca devolve a senha em texto puro', async () => {
    const salt = createSalt();
    const hash = await hashPassword(SENHA, salt);
    expect(hash).not.toContain(SENHA);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('salts diferentes produzem hashes diferentes', async () => {
    const a = await hashPassword(SENHA, createSalt());
    const b = await hashPassword(SENHA, createSalt());
    expect(a).not.toBe(b);
  });

  it('verifica corretamente', async () => {
    const salt = createSalt();
    const hash = await hashPassword(SENHA, salt);
    expect(await verifyPassword(SENHA, salt, hash)).toBe(true);
    expect(await verifyPassword(SENHA_PARCEIRO, salt, hash)).toBe(false);
  });

  it('comparacao em tempo constante funciona como igualdade', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('cadastro', () => {
  const valid = {
    email: 'alex@exemplo.com',
    username: 'alex',
    displayName: 'Alex',
    password: SENHA,
  };

  it('cria usuario com hash e salt', async () => {
    const result = await createUser(valid);
    expect(result.ok).toBe(true);
    expect(result.data?.passwordHash).toBeTruthy();
    expect(result.data?.passwordSalt).toBeTruthy();
    expect(JSON.stringify(result.data)).not.toContain(SENHA);
  });

  it('recusa e-mail invalido', async () => {
    const result = await createUser({ ...valid, email: 'nao-e-email' });
    expect(result.ok).toBe(false);
  });

  it('recusa senha fraca', async () => {
    const result = await createUser({ ...valid, password: senhaCurta() });
    expect(result.ok).toBe(false);
  });

  it('recusa usuario curto demais', async () => {
    const result = await createUser({ ...valid, username: 'a' });
    expect(result.ok).toBe(false);
  });
});

describe('login', () => {
  it('aceita e-mail ou usuario e recusa senha errada', async () => {
    const created = await createUser({
      email: 'sam@exemplo.com',
      username: 'sam',
      displayName: 'Sam',
      password: SENHA,
    });
    const users = [created.data!];

    expect((await authenticate(users, 'sam', SENHA)).ok).toBe(true);
    expect((await authenticate(users, 'sam@exemplo.com', SENHA)).ok).toBe(true);
    expect((await authenticate(users, 'sam', SENHA_ERRADA)).ok).toBe(false);
  });

  it('nao revela se o usuario existe', async () => {
    const created = await createUser({
      email: 'sam@exemplo.com',
      username: 'sam',
      displayName: 'Sam',
      password: SENHA,
    });
    const inexistente = await authenticate([created.data!], 'ninguem', SENHA);
    const senhaErrada = await authenticate([created.data!], 'sam', SENHA_ERRADA);
    expect(inexistente.error).toBe(senhaErrada.error);
  });
});

describe('troca e recuperacao de senha', () => {
  it('exige a senha atual para trocar', async () => {
    const created = await createUser({
      email: 'a@b.com',
      username: 'alex',
      displayName: 'Alex',
      password: SENHA,
    });
    const user = created.data!;

    expect((await changePassword(user, SENHA_ERRADA, SENHA_NOVA)).ok).toBe(false);

    const changed = await changePassword(user, SENHA, SENHA_NOVA);
    expect(changed.ok).toBe(true);
    expect(await verifyPassword(SENHA_NOVA, changed.data!.passwordSalt, changed.data!.passwordHash)).toBe(true);
  });

  it('exige a senha da outra pessoa para redefinir', async () => {
    const [one, two] = await Promise.all([
      createUser({ email: 'a@b.com', username: 'alex', displayName: 'Alex', password: SENHA }),
      createUser({ email: 'c@d.com', username: 'sam', displayName: 'Sam', password: SENHA_PARCEIRO }),
    ]);

    const semAutorizacao = await resetPasswordWithPartner(one.data!, two.data!, SENHA_ERRADA, SENHA_NOVA);
    expect(semAutorizacao.ok).toBe(false);

    const autorizado = await resetPasswordWithPartner(one.data!, two.data!, SENHA_PARCEIRO, SENHA_NOVA);
    expect(autorizado.ok).toBe(true);
  });
});

describe('estado inicial', () => {
  it('comeca sem usuario, sem casal e sem consentimentos', () => {
    const state = emptyState();
    expect(state.users).toEqual([]);
    expect(state.couple).toBeNull();
    expect(state.currentUserId).toBeNull();
    expect(state.ageConfirmed).toBe(false);
    expect(state.hardcoreConsent).toBe(false);
    expect(state.onboardingDone).toBe(false);
  });
});
