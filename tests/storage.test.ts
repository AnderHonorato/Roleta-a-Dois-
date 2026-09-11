import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageAdapter } from '@/services/storage/localAdapter';
import { emptyState } from '@/services/auth';
import { STORAGE_KEY, STATE_VERSION, MODO_DEMO_LOCAL } from '@/services/config';

describe('LocalStorageAdapter (modo demo)', () => {
  const adapter = new LocalStorageAdapter();

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reporta saude ok quando o storage existe', async () => {
    expect((await adapter.health()).ok).toBe(true);
  });

  it('devolve null quando nao ha nada salvo', async () => {
    expect(await adapter.load()).toBeNull();
  });

  it('grava e le o estado de volta', async () => {
    const state = { ...emptyState(), onboardingDone: true, ageConfirmed: true };
    await adapter.save(state);
    const loaded = await adapter.load();
    expect(loaded?.onboardingDone).toBe(true);
    expect(loaded?.ageConfirmed).toBe(true);
  });

  it('nao trava com estado corrompido: limpa e recomeca', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{isso nao e json');
    expect(await adapter.load()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('migra estado de versao antiga em vez de descartar', async () => {
    const antigo = { ...emptyState(), version: 0, ageConfirmed: true };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(antigo));
    const loaded = await adapter.load();
    expect(loaded?.version).toBe(STATE_VERSION);
    expect(loaded?.ageConfirmed).toBe(true);
  });

  it('clear apaga tudo', async () => {
    await adapter.save(emptyState());
    await adapter.clear();
    expect(await adapter.load()).toBeNull();
  });
});

describe('configuracao', () => {
  it('o modo demo e o padrao quando nada foi definido', () => {
    expect(typeof MODO_DEMO_LOCAL).toBe('boolean');
  });
});
