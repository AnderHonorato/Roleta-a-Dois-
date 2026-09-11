/**
 * Derivacao de senha com PBKDF2-SHA256 via WebCrypto.
 *
 * ATENCAO: no modo demo isso roda no navegador apenas para que
 * NENHUMA senha fique em texto puro no localStorage. Nao substitui
 * hashing no servidor. Em producao a derivacao acontece no backend
 * (argon2id/bcrypt) e o cliente nunca guarda hash algum.
 */
const ITERATIONS = 150_000;
const KEY_BITS = 256;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function createSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

function hexToBytes(hex: string): ArrayBuffer {
  const buffer = new ArrayBuffer(hex.length / 2);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return buffer;
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexToBytes(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    KEY_BITS,
  );
  return toHex(bits);
}

/** Comparacao em tempo constante, para nao vazar prefixo por timing. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const actual = await hashPassword(password, salt);
  return safeEqual(actual, expectedHash);
}
