import type { PersistedState } from '@/types';
import { STORAGE_KEY, STATE_VERSION } from '../config';
import { StorageQuotaError, StorageUnavailableError, type StorageAdapter } from './types';

/**
 * Persistencia em IndexedDB.
 *
 * Existe por um motivo concreto: as imagens do banner sao data URLs,
 * e o localStorage tem cota de ~5MB - tres ou quatro fotos ja estouram.
 * O IndexedDB trabalha na casa das centenas de MB e guarda o objeto
 * direto, sem serializar para string, o que tambem tira do caminho o
 * travamento da thread principal em cada gravacao.
 *
 * Nao substitui o LocalStorageAdapter: recebe um, usa como plano B
 * quando o IndexedDB nao existe ou foi bloqueado (janela anonima em
 * alguns navegadores), e migra sozinho o que ja estava salva la.
 */
const DB_NAME = 'roleta-a-dois';
const STORE = 'estado';
const DOC_KEY = STORAGE_KEY;
const OPEN_TIMEOUT_MS = 4000;

export class IndexedDBAdapter implements StorageAdapter {
  readonly kind = 'idb' as const;

  /** Plano B quando o IndexedDB nao esta disponivel. */
  private readonly fallback: StorageAdapter;

  /** Definido na primeira operacao; null = caiu para o fallback. */
  private db: IDBDatabase | null = null;
  private opening: Promise<IDBDatabase | null> | null = null;
  private usingFallback = false;

  constructor(fallback: StorageAdapter) {
    this.fallback = fallback;
  }

  private supported(): boolean {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  }

  /**
   * Abre a conexao uma unica vez. O timeout cobre o caso do
   * `onblocked`/janela anonima, em que o open nunca resolve e sem ele
   * o app ficaria preso na tela de carregando.
   */
  private open(): Promise<IDBDatabase | null> {
    if (this.db) return Promise.resolve(this.db);
    if (this.opening) return this.opening;
    if (!this.supported()) return Promise.resolve(null);

    this.opening = new Promise<IDBDatabase | null>((resolve) => {
      let settled = false;
      const finish = (value: IDBDatabase | null) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const timer = setTimeout(() => finish(null), OPEN_TIMEOUT_MS);

      try {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        };
        request.onsuccess = () => {
          clearTimeout(timer);
          this.db = request.result;
          finish(request.result);
        };
        request.onerror = () => {
          clearTimeout(timer);
          finish(null);
        };
        request.onblocked = () => {
          clearTimeout(timer);
          finish(null);
        };
      } catch {
        clearTimeout(timer);
        finish(null);
      }
    });

    return this.opening;
  }

  private run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.db) {
        reject(new StorageUnavailableError());
        return;
      }
      let transaction: IDBTransaction;
      try {
        transaction = this.db.transaction(STORE, mode);
      } catch (error) {
        reject(error);
        return;
      }
      const request = work(transaction.objectStore(STORE));
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error ?? new Error('Falha no IndexedDB.'));
      transaction.onabort = () => {
        // QuotaExceededError chega pelo abort da transacao, nao pelo request.
        const error = transaction.error;
        reject(
          error?.name === 'QuotaExceededError'
            ? new StorageQuotaError(
                'O armazenamento do navegador encheu. Remova imagens do carrossel para liberar espaco.',
              )
            : (error ?? new Error('Transacao cancelada.')),
        );
      };
    });
  }

  async load(): Promise<PersistedState | null> {
    const db = await this.open();
    if (!db) {
      this.usingFallback = true;
      return this.fallback.load();
    }

    let stored: PersistedState | undefined;
    try {
      stored = await this.run<PersistedState | undefined>('readonly', (store) => store.get(DOC_KEY));
    } catch {
      this.usingFallback = true;
      return this.fallback.load();
    }

    // O caminho normal e o IndexedDB ja ter o estado. A excecao e a
    // primeira abertura depois do upgrade, quando os dados ainda estao
    // no localStorage da versao anterior.
    //
    // As duas perguntas aqui sao diferentes de proposito: o que esta no
    // IndexedDB so pode ser substituido se nao tiver conta nem casal; e
    // o legado so vale a migracao se tiver qualquer coisa a preservar -
    // incluindo apenas as flags de consentimento, para o casal nao ter
    // que refazer a porta 18+.
    if (stored && !substituivel(stored)) return normalize(stored);

    const legacy = await this.fallback.load().catch(() => null);
    if (!legacy || !temConteudo(legacy)) return stored ? normalize(stored) : null;
    try {
      await this.run('readwrite', (store) => store.put(legacy, DOC_KEY));
      await this.fallback.clear();
    } catch {
      /* migracao e best-effort: o dado continua valido no fallback */
    }
    return normalize(legacy);
  }

  async save(state: PersistedState): Promise<void> {
    if (this.usingFallback) return this.fallback.save(state);

    const db = await this.open();
    if (!db) {
      this.usingFallback = true;
      return this.fallback.save(state);
    }

    try {
      await this.run('readwrite', (store) => store.put(state, DOC_KEY));
    } catch (error) {
      // Cota estourada e um erro real do usuario: precisa chegar na tela.
      if (error instanceof StorageQuotaError) throw error;
      this.usingFallback = true;
      await this.fallback.save(state);
    }
  }

  async clear(): Promise<void> {
    await this.fallback.clear().catch(() => undefined);
    const db = await this.open();
    if (!db) return;
    await this.run('readwrite', (store) => store.delete(DOC_KEY)).catch(() => undefined);
  }

  async health(): Promise<{ ok: boolean; reason?: string }> {
    if (!this.supported()) return this.fallback.health();
    const db = await this.open();
    if (!db) {
      this.usingFallback = true;
      return this.fallback.health();
    }
    return { ok: true };
  }
}

/** Estado vindo de uma versao anterior do formato. */
function normalize(state: PersistedState): PersistedState {
  return state.version === STATE_VERSION ? state : { ...state, version: STATE_VERSION };
}

/**
 * Pode ser substituido pelo legado: nao ha conta nem casal, entao nada
 * de identidade se perde. E o estado que o app grava logo ao abrir.
 */
function substituivel(state: PersistedState): boolean {
  return state.users.length === 0 && state.couple === null;
}

/**
 * Tem algo que valha a migracao. Mais amplo que `substituivel` de
 * proposito: mesmo sem conta criada, as flags de maioridade e
 * consentimento sao trabalho do casal que nao deve ser refeito.
 */
function temConteudo(state: PersistedState): boolean {
  return (
    state.users.length > 0 ||
    state.couple !== null ||
    state.sessions.length > 0 ||
    state.ageConfirmed ||
    state.onboardingDone ||
    state.hardcoreConsent
  );
}
