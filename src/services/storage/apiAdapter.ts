import type { PersistedState } from '@/types';
import { API_URL } from '../config';
import type { StorageAdapter } from './types';

/**
 * Implementacao de producao.
 *
 * Fala com o backend por cookie de sessao HttpOnly (credentials:
 * 'include') e envia o header de anti-CSRF que o servidor emite.
 * O contrato de rotas esta em docs/ARCHITECTURE.md; enquanto o
 * backend nao existe, este adaptador falha de forma explicita em
 * vez de fingir sucesso.
 */
export class ApiStorageAdapter implements StorageAdapter {
  readonly kind = 'api' as const;

  private csrfToken: string | null = null;

  private url(path: string): string {
    if (!API_URL) throw new Error('VITE_API_URL nao configurada.');
    return `${API_URL}${path}`;
  }

  private headers(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.csrfToken) headers['X-CSRF-Token'] = this.csrfToken;
    return headers;
  }

  async load(): Promise<PersistedState | null> {
    const response = await fetch(this.url('/api/state'), {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    this.csrfToken = response.headers.get('X-CSRF-Token') ?? this.csrfToken;
    if (response.status === 401) return null;
    if (!response.ok) throw new Error(`Falha ao carregar estado (${response.status}).`);
    return (await response.json()) as PersistedState;
  }

  async save(state: PersistedState): Promise<void> {
    const response = await fetch(this.url('/api/state'), {
      method: 'PUT',
      credentials: 'include',
      headers: this.headers(),
      body: JSON.stringify(state),
    });
    if (!response.ok) throw new Error(`Falha ao salvar (${response.status}).`);
  }

  async clear(): Promise<void> {
    const response = await fetch(this.url('/api/state'), {
      method: 'DELETE',
      credentials: 'include',
      headers: this.headers(),
    });
    if (!response.ok) throw new Error(`Falha ao apagar (${response.status}).`);
  }

  async health(): Promise<{ ok: boolean; reason?: string }> {
    if (!API_URL) {
      return { ok: false, reason: 'VITE_API_URL nao configurada e modo demo desligado.' };
    }
    try {
      const response = await fetch(this.url('/api/health'), { credentials: 'include' });
      return response.ok ? { ok: true } : { ok: false, reason: `Servidor respondeu ${response.status}.` };
    } catch {
      return { ok: false, reason: 'Sem conexao com o servidor.' };
    }
  }
}
