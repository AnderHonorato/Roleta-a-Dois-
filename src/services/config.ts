/**
 * Configuracao de ambiente.
 *
 * MODO_DEMO_LOCAL e a unica chave que decide se o app roda sem
 * servidor. Tudo que depende dele passa por aqui, para que o modo
 * demo possa ser removido no futuro mexendo em poucos arquivos
 * (ver "Removendo o modo demo" no README).
 */
const env = import.meta.env ?? ({} as ImportMetaEnv);

function readBool(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

export const MODO_DEMO_LOCAL = readBool(env.VITE_MODO_DEMO_LOCAL, true);

export const APP_NAME = (env.VITE_APP_NAME as string) || 'Roleta a Dois';

export const API_URL = ((env.VITE_API_URL as string) || '').replace(/\/+$/, '');

export const MAX_UPLOAD_MB = Number(env.VITE_MAX_UPLOAD_MB ?? 4) || 4;

export const STORAGE_KEY = 'roleta-a-dois:state:v1';

export const STATE_VERSION = 1;

/** Quando true, a UI mostra o selo de demo e o aviso de dados locais. */
export const SHOW_DEMO_BADGE = MODO_DEMO_LOCAL;
