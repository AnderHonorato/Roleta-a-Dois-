import type { PersistedState } from '@/types';
import { STORAGE_KEY, STATE_VERSION } from '../config';
import { StorageQuotaError, StorageUnavailableError, type StorageAdapter } from './types';

/**
 * Implementacao do modo demo: tudo no localStorage do navegador.
 * Nada sai do dispositivo. Imagens ficam como data URL, por isso
 * sao redimensionadas em lib/image.ts antes de chegar aqui.
 */
export class LocalStorageAdapter implements StorageAdapter {
  readonly kind = 'local' as const;

  private available(): boolean {
    try {
      const probe = '__roleta_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }

  async load(): Promise<PersistedState | null> {
    if (!this.available()) throw new StorageUnavailableError();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as PersistedState;
      if (typeof parsed !== 'object' || parsed === null) return null;
      if (parsed.version !== STATE_VERSION) return migrate(parsed);
      return parsed;
    } catch {
      // Estado corrompido nao pode travar o app: comeca limpo.
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  async save(state: PersistedState): Promise<void> {
    if (!this.available()) throw new StorageUnavailableError();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      const name = (error as { name?: string })?.name ?? '';
      if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        throw new StorageQuotaError(
          'O armazenamento local encheu. Remova imagens do carrossel para liberar espaco.',
        );
      }
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada a fazer: navegador sem storage */
    }
  }

  async health(): Promise<{ ok: boolean; reason?: string }> {
    return this.available()
      ? { ok: true }
      : { ok: false, reason: 'Armazenamento bloqueado (janela anonima ou cookies desativados).' };
  }
}

/**
 * Migracao entre versoes do estado. Hoje so normaliza a versao;
 * quando o formato mudar, cada salto entra aqui.
 */
function migrate(old: PersistedState): PersistedState {
  return { ...old, version: STATE_VERSION };
}
