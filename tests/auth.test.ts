import { beforeAll, describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';
import { authenticate, changePassword, createUser, emptyState, resetPasswordWithPartner } from '@/services/auth';
import { hashPassword, createSalt, safeEqual, verifyPassword } from '@/lib/crypto';

// jsdom nao expoe WebCrypto completo; usamos o do Node.
beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  }
});

describe('derivacao de senha', () => {
  it('nunca devolve a senha em texto puro', async () => {
    const salt = createSalt();
    const hash = await hashPassword('senhaboa1', salt);
    expect(hash).not.toContain('senhaboa1');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('salts diferentes produzem hashes diferentes', async () => {
    const a = await hashPassword('senhaboa1', createSalt());
    const b = await hashPassword('senhaboa1', createSalt());
    expect(a).not.toBe(b);
  });

  it('verifica corretamente', async () => {
    const salt = createSalt();
    const hash = await hashPassword('senhaboa1', salt);
    expect(await verifyPassword('senhaboa1', salt, hash)).toBe(true);
    expect(await verifyPassword('outrasenha1', salt, hash)).toBe(false);
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
    password: 'senhaboa1',
  };

  it('cria usuario com hash e salt', async () => {
    const result = await createUser(valid);
    expect(result.ok).toBe(true);
    expect(result.data?.passwordHash).toBeTruthy();
    expect(result.data?.passwordSalt).toBeTruthy();
    expect(JSON.stringify(result.data)).not.toContain('senhaboa1');
  });

  it('recusa e-mail invalido', async () => {
    const result = await createUser({ ...valid, email: 'nao-e-email' });
    expect(result.ok).toBe(false);
  });

  it('recusa senha fraca', async () => {
    const result = await createUser({ ...valid, password: 'abc' });
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
      password: 'senhaboa1',
    });
    const users = [created.data!];

    expect((await authenticate(users, 'sam', 'senhaboa1')).ok).toBe(true);
    expect((await authenticate(users, 'sam@exemplo.com', 'senhaboa1')).ok).toBe(true);
    expect((await authenticate(users, 'sam', 'errada1')).ok).toBe(false);
  });

  it('nao revela se o usuario existe', async () => {
    const created = await createUser({
      email: 'sam@exemplo.com',
      username: 'sam',
      displayName: 'Sam',
      password: 'senhaboa1',
    });
    const inexistente = await authenticate([created.data!], 'ninguem', 'senhaboa1');
    const senhaErrada = await authenticate([created.data!], 'sam', 'errada1');
    expect(inexistente.error).toBe(senhaErrada.error);
  });
});

describe('troca e recuperacao de senha', () => {
  it('exige a senha atual para trocar', async () => {
    const created = await createUser({
      email: 'a@b.com',
      username: 'alex',
      displayName: 'Alex',
      password: 'senhaboa1',
    });
    const user = created.data!;

    expect((await changePassword(user, 'errada1', 'novasenha1')).ok).toBe(false);

    const changed = await changePassword(user, 'senhaboa1', 'novasenha1');
    expect(changed.ok).toBe(true);
    expect(await verifyPassword('novasenha1', changed.data!.passwordSalt, changed.data!.passwordHash)).toBe(true);
  });

  it('exige a senha da outra pessoa para redefinir', async () => {
    const [one, two] = await Promise.all([
      createUser({ email: 'a@b.com', username: 'alex', displayName: 'Alex', password: 'senhaboa1' }),
      createUser({ email: 'c@d.com', username: 'sam', displayName: 'Sam', password: 'outrasenha1' }),
    ]);

    const semAutorizacao = await resetPasswordWithPartner(one.data!, two.data!, 'chute1234', 'novasenha1');
    expect(semAutorizacao.ok).toBe(false);

    const autorizado = await resetPasswordWithPartner(one.data!, two.data!, 'outrasenha1', 'novasenha1');
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
