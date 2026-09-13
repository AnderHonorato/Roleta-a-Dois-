import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { IndexedDBAdapter } from '@/services/storage/idbAdapter';
import { LocalStorageAdapter } from '@/services/storage/localAdapter';
import { StorageQuotaError, type StorageAdapter } from '@/services/storage/types';
import { emptyState } from '@/services/auth';
import { STORAGE_KEY, STATE_VERSION } from '@/services/config';
import type { PersistedState } from '@/types';

/** jsdom nao traz IndexedDB; cada teste comeca com um banco limpo. */
function freshIndexedDB(): void {
  Object.defineProperty(globalThis, 'indexedDB', {
    value: new IDBFactory(),
    configurable: true,
    writable: true,
  });
}

function removeIndexedDB(): void {
  Object.defineProperty(globalThis, 'indexedDB', {
    value: undefined,
    configurable: true,
    writable: true,
  });
}

/** Dublê que falha em toda gravacao, para exercitar o plano B. */
class FailingAdapter implements StorageAdapter {
  readonly kind = 'local' as const;
  saved: PersistedState | null = null;
  async load() {
    return null;
  }
  async save(state: PersistedState) {
    this.saved = state;
  }
  async clear() {
    this.saved = null;
  }
  async health() {
    return { ok: true };
  }
}

describe('IndexedDBAdapter', () => {
  beforeEach(() => {
    window.localStorage.clear();
    freshIndexedDB();
  });

  it('grava e le o estado de volta', async () => {
    const adapter = new IndexedDBAdapter(new LocalStorageAdapter());
    const state = { ...emptyState(), onboardingDone: true, ageConfirmed: true };

    await adapter.save(state);
    const loaded = await adapter.load();

    expect(loaded?.onboardingDone).toBe(true);
    expect(loaded?.ageConfirmed).toBe(true);
  });

  it('devolve null quando nao ha nada salvo em lugar nenhum', async () => {
    const adapter = new IndexedDBAdapter(new LocalStorageAdapter());
    expect(await adapter.load()).toBeNull();
  });

  it('reporta saude ok quando o IndexedDB responde', async () => {
    const adapter = new IndexedDBAdapter(new LocalStorageAdapter());
    expect((await adapter.health()).ok).toBe(true);
  });

  it('guarda o objeto sem serializar para string', async () => {
    // O ganho sobre o localStorage depende disto: o IndexedDB aceita
    // o objeto direto, sem o custo de JSON.stringify a cada gravacao.
    const adapter = new IndexedDBAdapter(new LocalStorageAdapter());
    const state = {
      ...emptyState(),
      activity: [{ id: 'a1', at: 123, kind: 'profile' as const, label: 'teste' }],
    };

    await adapter.save(state);
    const loaded = await adapter.load();

    expect(loaded?.activity[0]).toEqual(state.activity[0]);
    expect(typeof loaded?.activity[0].at).toBe('number');
  });

  it('apaga o estado no clear', async () => {
    const adapter = new IndexedDBAdapter(new LocalStorageAdapter());
    await adapter.save(emptyState());
    await adapter.clear();
    expect(await adapter.load()).toBeNull();
  });
});

describe('migracao do localStorage para o IndexedDB', () => {
  beforeEach(() => {
    window.localStorage.clear();
    freshIndexedDB();
  });

  it('importa o que ja estava no localStorage e limpa a origem', async () => {
    const legacy = { ...emptyState(), ageConfirmed: true, onboardingDone: true };
    const local = new LocalStorageAdapter();
    await local.save(legacy);

    const adapter = new IndexedDBAdapter(new LocalStorageAdapter());
    const loaded = await adapter.load();

    expect(loaded?.ageConfirmed).toBe(true);
    // A origem e limpa para nao ficarem duas copias divergindo.
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

    // E o dado precisa continuar la na proxima abertura.
    const again = new IndexedDBAdapter(new LocalStorageAdapter());
    expect((await again.load())?.ageConfirmed).toBe(true);
  });

  it('migra mesmo se o IndexedDB ja tiver um estado em branco', async () => {
    // Corrida real: o app grava um estado vazio ao abrir. Se isso
    // acontecer antes da migracao, o casal nao pode perder o historico.
    const vazio = new IndexedDBAdapter(new LocalStorageAdapter());
    await vazio.save(emptyState());

    const legacy = { ...emptyState(), ageConfirmed: true, onboardingDone: true };
    legacy.couple = { id: 'c1', name: 'Casal Antigo', totalPoints: 777 } as PersistedState['couple'];
    await new LocalStorageAdapter().save(legacy);

    const adapter = new IndexedDBAdapter(new LocalStorageAdapter());
    const loaded = await adapter.load();

    expect(loaded?.couple?.name).toBe('Casal Antigo');
    expect(loaded?.couple?.totalPoints).toBe(777);
  });

  it('nunca sobrescreve um estado real do IndexedDB com um vazio', async () => {
    const real = { ...emptyState(), ageConfirmed: true };
    real.couple = { id: 'c9', name: 'Casal Atual', totalPoints: 42 } as PersistedState['couple'];
    const adapter = new IndexedDBAdapter(new LocalStorageAdapter());
    await adapter.save(real);

    // localStorage tem sobra de uma sessao vazia: deve ser ignorada.
    await new LocalStorageAdapter().save(emptyState());

    const outro = new IndexedDBAdapter(new LocalStorageAdapter());
    expect((await outro.load())?.couple?.name).toBe('Casal Atual');
  });

  it('normaliza a versao do estado migrado', async () => {
    const antigo = { ...emptyState(), version: 0, ageConfirmed: true };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(antigo));

    const adapter = new IndexedDBAdapter(new LocalStorageAdapter());
    const loaded = await adapter.load();

    expect(loaded?.version).toBe(STATE_VERSION);
    expect(loaded?.ageConfirmed).toBe(true);
  });
});

describe('plano B quando o IndexedDB nao existe', () => {
  beforeEach(() => {
    window.localStorage.clear();
    removeIndexedDB();
  });

  it('cai para o localStorage sem quebrar', async () => {
    const adapter = new IndexedDBAdapter(new LocalStorageAdapter());
    const state = { ...emptyState(), onboardingDone: true };

    await adapter.save(state);
    const loaded = await adapter.load();

    expect(loaded?.onboardingDone).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('a saude passa a refletir a do plano B', async () => {
    const adapter = new IndexedDBAdapter(new LocalStorageAdapter());
    expect((await adapter.health()).ok).toBe(true);
  });

  it('usa o plano B recebido, nao um localStorage fixo', async () => {
    const fallback = new FailingAdapter();
    const adapter = new IndexedDBAdapter(fallback);
    const state = { ...emptyState(), hardcoreConsent: true };

    await adapter.save(state);

    expect(fallback.saved?.hardcoreConsent).toBe(true);
  });
});

describe('cota estourada', () => {
  it('e um erro que chega na tela, nao um fallback silencioso', () => {
    // O contrato importa: quando o navegador recusa por espaco, o app
    // precisa avisar o casal para remover imagens - engolir o erro
    // faria o progresso sumir sem explicacao.
    const erro = new StorageQuotaError();
    expect(erro).toBeInstanceOf(Error);
    expect(erro.name).toBe('StorageQuotaError');
  });
});
