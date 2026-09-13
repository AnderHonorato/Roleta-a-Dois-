/**
 * Saneamento de entrada. O React ja escapa texto por padrao;
 * aqui cortamos caracteres de controle / zero-width e limitamos
 * tamanho antes de persistir, para nao guardar lixo nem payload
 * gigante vindo de um campo livre.
 */
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F\\u200B-\\u200D\\uFEFF]', 'g');

export function cleanText(value: string, maxLength = 280): string {
  return value.replace(CONTROL_CHARS, '').trim().slice(0, maxLength);
}

export function cleanLine(value: string, maxLength = 60): string {
  return cleanText(value, maxLength).replace(/\s+/g, ' ');
}

export function cleanUsername(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 24);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return EMAIL_RE.test(trimmed) && trimmed.length <= 254;
}

export interface PasswordCheck {
  ok: boolean;
  message: string;
}

export function checkPassword(value: string): PasswordCheck {
  if (value.length < 8) return { ok: false, message: 'Use pelo menos 8 caracteres.' };
  if (value.length > 128) return { ok: false, message: 'Senha longa demais (maximo 128).' };
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) {
    return { ok: false, message: 'Misture letras e numeros.' };
  }
  return { ok: true, message: 'Senha aceita.' };
}

/** Nome de arquivo seguro para uploads (usado no modo servidor). */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'arquivo';
  return base
    .normalize('NFKD')
    .replace(/[^\w.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(-80);
}
