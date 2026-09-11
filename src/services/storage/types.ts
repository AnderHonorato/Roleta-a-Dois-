import type { PersistedState } from '@/types';

/**
 * Contrato de persistencia. O app inteiro fala com esta interface,
 * nunca com localStorage ou fetch direto. Trocar o modo demo por um
 * backend real e trocar a implementacao registrada em
 * services/storage/index.ts - nenhum componente muda.
 */
export interface StorageAdapter {
  readonly kind: 'local' | 'idb' | 'api';
  /** Carrega o estado completo. Retorna null quando nao ha nada salvo. */
  load(): Promise<PersistedState | null>;
  /** Grava o estado completo. */
  save(state: PersistedState): Promise<void>;
  /** Apaga tudo (exclusao de conta / reset do demo). */
  clear(): Promise<void>;
  /** Indica se a camada esta disponivel (cota, rede, permissao). */
  health(): Promise<{ ok: boolean; reason?: string }>;
}

export class StorageQuotaError extends Error {
  constructor(message = 'Espaco de armazenamento cheio.') {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

export class StorageUnavailableError extends Error {
  constructor(message = 'Armazenamento indisponivel neste navegador.') {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}
