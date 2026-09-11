// ============================================================
// Tipos de dominio compartilhados.
// Espelham o modelo de dados descrito em docs/ARCHITECTURE.md,
// para que a troca de LocalStorage -> API nao mude os contratos.
// ============================================================

/** Perfil do casal: define tema, linguagem e recorte de conteudo. */
export type Audience = 'gay' | 'lesbian' | 'hetero' | 'bi' | 'queer' | 'neutral';

/** Niveis de intensidade, em ordem crescente. */
export type Level = 'leve' | 'quente' | 'intenso' | 'hardcore';

export type Category =
  | 'aquecimento'
  | 'toque'
  | 'palavras'
  | 'posicao'
  | 'jogo'
  | 'controle'
  | 'surpresa';

export interface Challenge {
  id: string;
  /** Publicos para os quais o item foi escrito. 'neutral' vale para todos. */
  audience: Audience[];
  level: Level;
  category: Category;
  title: string;
  description: string;
  /** Instrucao curta, exibida como linha de apoio. */
  hint?: string;
  /** Duracao sugerida em segundos. 0 = sem cronometro. */
  durationSec: number;
  /** Pontuacao base antes de multiplicadores. */
  score: number;
  tags: string[];
  active: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  /** Hash derivado (PBKDF2). Nunca guardamos senha em texto puro. */
  passwordHash: string;
  passwordSalt: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  nickname: string;
  createdAt: number;
  updatedAt: number;
}

export type CoupleRole = 'owner' | 'partner';

export interface CoupleMember {
  coupleId: string;
  userId: string;
  role: CoupleRole;
  joinedAt: number;
}

export interface CouplePreferences {
  soundEnabled: boolean;
  volume: number;
  reducedMotion: boolean | null;
  autoplayBanner: boolean;
  bannerIntervalMs: number;
  excludedCategories: Category[];
  timerEnabled: boolean;
}

export interface Couple {
  id: string;
  name: string;
  description: string;
  banner: string | null;
  /** Imagens do carrossel (data URLs no modo demo). */
  gallery: BannerImage[];
  theme: Audience;
  maxLevel: Level;
  since: string | null;
  preferences: CouplePreferences;
  totalPoints: number;
  bestStreak: number;
  createdAt: number;
  updatedAt: number;
}

export interface BannerImage {
  id: string;
  src: string;
  alt: string;
  order: number;
  enabled: boolean;
}

export type RoundResult = 'done' | 'skipped' | 'pending';

export interface GameRound {
  id: string;
  sessionId: string;
  challengeId: string;
  level: Level;
  result: RoundResult;
  points: number;
  multiplier: number;
  startedAt: number;
  completedAt: number | null;
}

export interface GameSession {
  id: string;
  coupleId: string;
  startedAt: number;
  endedAt: number | null;
  points: number;
  rounds: number;
  completed: number;
  skips: number;
  maxStreak: number;
  maxLevelReached: Level | null;
}

export interface Achievement {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** Ordem de exibicao. */
  order: number;
}

export interface UnlockedAchievement {
  slug: string;
  unlockedAt: number;
}

export interface ActivityEntry {
  id: string;
  at: number;
  kind: 'session_start' | 'session_end' | 'round_done' | 'round_skip' | 'achievement' | 'profile';
  label: string;
  detail?: string;
}

/** Estado persistido completo (modo demo e cache de produção). */
export interface PersistedState {
  version: number;
  users: User[];
  couple: Couple | null;
  members: CoupleMember[];
  sessions: GameSession[];
  rounds: GameRound[];
  unlocked: UnlockedAchievement[];
  activity: ActivityEntry[];
  currentUserId: string | null;
  onboardingDone: boolean;
  ageConfirmed: boolean;
  hardcoreConsent: boolean;
}
