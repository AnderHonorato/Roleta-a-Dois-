import { MODO_DEMO_LOCAL } from '../config';
import { LocalStorageAdapter } from './localAdapter';
import { ApiStorageAdapter } from './apiAdapter';
import type { StorageAdapter } from './types';

let instance: StorageAdapter | null = null;

/**
 * Unico ponto do app que decide qual implementacao usar.
 * Remover o modo demo = apagar o ramo local daqui.
 */
export function getStorage(): StorageAdapter {
  if (!instance) {
    instance = MODO_DEMO_LOCAL ? new LocalStorageAdapter() : new ApiStorageAdapter();
  }
  return instance;
}

/** Usado nos testes para injetar um adaptador falso. */
export function setStorage(adapter: StorageAdapter | null): void {
  instance = adapter;
}

export * from './types';
export { LocalStorageAdapter, ApiStorageAdapter };
