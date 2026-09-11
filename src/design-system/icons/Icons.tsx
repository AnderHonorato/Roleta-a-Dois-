import type { SVGProps } from 'react';

/**
 * Conjunto de icones autorais.
 *
 * Todos desenhados na mesma grade 24x24, traco 1.6 e cantos vivos
 * para combinar com a tipografia do produto. Nao usamos emoji nem
 * biblioteca de terceiros como identidade: emoji aparece apenas
 * dentro de texto, nunca como elemento estrutural da interface.
 */
export type IconName =
  | 'profile'
  | 'couple'
  | 'die'
  | 'roulette'
  | 'intensity'
  | 'sound-on'
  | 'sound-off'
  | 'history'
  | 'trophy'
  | 'settings'
  | 'edit'
  | 'back'
  | 'close'
  | 'continue'
  | 'login'
  | 'logout'
  | 'check'
  | 'plus'
  | 'trash'
  | 'image'
  | 'timer'
  | 'flame'
  | 'shield'
  | 'chevron-left'
  | 'chevron-right'
  | 'eye'
  | 'eye-off'
  | 'link-off';

const PATHS: Record<IconName, JSX.Element> = {
  profile: (
    <>
      <path d="M12 12.4a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z" />
      <path d="M4.4 20.2c.7-3.6 3.8-5.8 7.6-5.8s6.9 2.2 7.6 5.8" />
    </>
  ),
  couple: (
    <>
      <path d="M8.4 10.6a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z" />
      <path d="M15.6 10.6a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z" />
      <path d="M2.8 20c.4-3 2.6-4.8 5.6-4.8 1.6 0 2.9.5 3.8 1.4" />
      <path d="M21.2 20c-.4-3-2.6-4.8-5.6-4.8-1.6 0-2.9.5-3.8 1.4" />
    </>
  ),
  die: (
    <>
      <path d="M12 2.6 20.4 7v10L12 21.4 3.6 17V7L12 2.6Z" />
      <path d="M3.6 7 12 11.6 20.4 7" />
      <path d="M12 11.6v9.8" />
      <circle cx="8" cy="14.4" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14.4" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.2" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),
  roulette: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 3.4v17.2M3.4 12h17.2" />
      <path d="M5.9 5.9l12.2 12.2M18.1 5.9 5.9 18.1" />
      <circle cx="12" cy="12" r="2.1" />
    </>
  ),
  intensity: (
    <>
      <path d="M4 19.2h3.2V12H4zM10.4 19.2h3.2V7.6h-3.2zM16.8 19.2H20V3.6h-3.2z" />
    </>
  ),
  'sound-on': (
    <>
      <path d="M4.6 9.4h3.2L12 5.6v12.8l-4.2-3.8H4.6z" />
      <path d="M15.6 9.2a4 4 0 0 1 0 5.6" />
      <path d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8" />
    </>
  ),
  'sound-off': (
    <>
      <path d="M4.6 9.4h3.2L12 5.6v12.8l-4.2-3.8H4.6z" />
      <path d="m16 9.6 4.4 4.8M20.4 9.6 16 14.4" />
    </>
  ),
  history: (
    <>
      <path d="M3.8 12a8.2 8.2 0 1 0 2.6-6" />
      <path d="M3.4 3.6v3.2h3.2" />
      <path d="M12 7.8V12l3 1.8" />
    </>
  ),
  trophy: (
    <>
      <path d="M7.4 4h9.2v4.6a4.6 4.6 0 0 1-9.2 0z" />
      <path d="M7.4 5.6H4.8v1.6a3 3 0 0 0 2.6 3" />
      <path d="M16.6 5.6h2.6v1.6a3 3 0 0 1-2.6 3" />
      <path d="M12 13.2v3.6M8.6 20.2h6.8M9.8 16.8h4.4l.8 3.4H9z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M10.4 3.2h3.2l.35 2.3 2.05.85 1.9-1.35 2.25 2.25-1.35 1.9.85 2.05 2.3.35v3.2l-2.3.35-.85 2.05 1.35 1.9-2.25 2.25-1.9-1.35-2.05.85-.35 2.3h-3.2l-.35-2.3-2.05-.85-1.9 1.35L3.8 19.1l1.35-1.9-.85-2.05-2.3-.35v-3.2l2.3-.35.85-2.05L3.8 7.3l2.25-2.25 1.9 1.35 2.05-.85z" />
    </>
  ),
  edit: (
    <>
      <path d="M15.6 4.6 19.4 8.4 8.8 19H5v-3.8z" />
      <path d="m13.4 6.8 3.8 3.8" />
    </>
  ),
  back: (
    <>
      <path d="M19.4 12H5" />
      <path d="m10.8 6.2-5.6 5.8 5.6 5.8" />
    </>
  ),
  close: <path d="m5.8 5.8 12.4 12.4M18.2 5.8 5.8 18.2" />,
  continue: (
    <>
      <path d="M4.6 12H19" />
      <path d="m13.2 6.2 5.6 5.8-5.6 5.8" />
    </>
  ),
  login: (
    <>
      <path d="M10.4 3.8H5.6v16.4h4.8" />
      <path d="M14 8.2 17.8 12 14 15.8M17.4 12H8.6" />
    </>
  ),
  logout: (
    <>
      <path d="M13.6 3.8H18.4v16.4h-4.8" />
      <path d="M10 8.2 6.2 12 10 15.8M6.6 12h8.8" />
    </>
  ),
  check: <path d="m4.8 12.6 4.6 4.6L19.2 6.8" />,
  plus: <path d="M12 4.8v14.4M4.8 12h14.4" />,
  trash: (
    <>
      <path d="M4.8 6.6h14.4" />
      <path d="M9.4 6.6V4.4h5.2v2.2" />
      <path d="M6.6 6.6 7.6 20h8.8l1-13.4" />
      <path d="M10.4 10.2v6M13.6 10.2v6" />
    </>
  ),
  image: (
    <>
      <path d="M3.6 5.4h16.8v13.2H3.6z" />
      <path d="m3.6 15.4 4.4-4 3.4 3 3.6-4.2 5.4 5.6" />
      <circle cx="8.6" cy="9.4" r="1.3" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.4" r="7.4" />
      <path d="M12 9.6v3.8l2.6 1.6M9.4 2.8h5.2M18.6 6.4l1.6-1.6" />
    </>
  ),
  flame: (
    <>
      <path d="M12 3.2c3.2 3.4 5.4 6 5.4 9a5.4 5.4 0 1 1-10.8 0c0-1.6.6-3 1.8-4.4.4 1.2 1 2 1.8 2.4-.4-2.6.1-4.9 1.8-7z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.2 19 6v5.4c0 4.2-2.8 7.4-7 9.4-4.2-2-7-5.2-7-9.4V6z" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" />
    </>
  ),
  'chevron-left': <path d="m14.4 5.8-6.2 6.2 6.2 6.2" />,
  'chevron-right': <path d="m9.6 5.8 6.2 6.2-6.2 6.2" />,
  eye: (
    <>
      <path d="M2.6 12S6.4 5.8 12 5.8 21.4 12 21.4 12 17.6 18.2 12 18.2 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M4.2 4.2 19.8 19.8" />
      <path d="M9.4 9.6A2.8 2.8 0 0 0 12 14.8c.7 0 1.4-.3 1.9-.7" />
      <path d="M6.4 6.9C4.2 8.4 2.6 12 2.6 12s3.8 6.2 9.4 6.2c1.5 0 2.8-.4 4-1" />
      <path d="M17.9 15.2c2-1.5 3.5-3.2 3.5-3.2S17.6 5.8 12 5.8c-.9 0-1.7.2-2.5.4" />
    </>
  ),
  'link-off': (
    <>
      <path d="M4.2 4.2 19.8 19.8" />
      <path d="M9.6 14.4 7.4 16.6a3.7 3.7 0 0 1-5.2-5.2l2.2-2.2" />
      <path d="M14.4 9.6l2.2-2.2a3.7 3.7 0 0 1 5.2 5.2l-2.2 2.2" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  /** Titulo acessivel. Sem ele o icone e marcado como decorativo. */
  title?: string;
}

export function Icon({ name, size = 22, title, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}
