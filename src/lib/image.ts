import { safeFileName } from './sanitize';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
const MAX_MB = Number(import.meta.env?.VITE_MAX_UPLOAD_MB ?? 4) || 4;

export interface ImageValidation {
  ok: boolean;
  reason?: string;
}

/** Validacao de upload: MIME declarado, extensao e tamanho. */
export function validateImageFile(file: File): ImageValidation {
  if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
    return { ok: false, reason: 'Formato nao suportado. Use JPG, PNG, WebP ou AVIF.' };
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return { ok: false, reason: `Imagem acima de ${MAX_MB}MB. Escolha uma menor.` };
  }
  const name = safeFileName(file.name);
  if (!/\.(jpe?g|png|webp|avif)$/i.test(name)) {
    return { ok: false, reason: 'Extensao de arquivo invalida.' };
  }
  return { ok: true };
}

/**
 * Le a imagem, confere que ela realmente decodifica (sniffing basico:
 * um arquivo que nao decodifica nao passa) e reduz para caber no
 * armazenamento local sem estourar a cota.
 */
export function readAndResizeImage(
  file: File,
  maxEdge = 1280,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Nao consegui ler o arquivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo nao e uma imagem valida.'));
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas indisponivel neste navegador.'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
