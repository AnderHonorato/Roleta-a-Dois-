import { initialsOf } from '@/lib/format';

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  /** Marca visual de quem esta com a sessao aberta no dispositivo. */
  active?: boolean;
}

/**
 * Avatar com fallback em iniciais. Sem imagem quebrada: se o
 * arquivo falhar, o bloco de iniciais continua no lugar.
 */
export function Avatar({ name, src, size = 44, active = false }: AvatarProps) {
  return (
    <span
      className={`avatar${active ? ' avatar--active' : ''}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.34) }}
      aria-hidden="true"
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
      <span className="avatar__initials">{initialsOf(name)}</span>
    </span>
  );
}
