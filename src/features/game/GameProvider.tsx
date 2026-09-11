import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Category, Challenge, GameSession, Level } from '@/types';
import { createId } from '@/lib/id';
import { pickWeighted, randomInt } from '@/lib/rng';
import { filterChallenges, LEVELS, levelIndex } from '@/data/challenges';
import { getMessage, type MessageEvent } from '@/data/messages';
import { useStore } from '@/app/store';
import { useSound, type SoundName } from '@/hooks/useSound';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useInactivity } from '@/hooks/useInactivity';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { applySkipPenalty, highestLevel, multiplierFor, nextTier, scoreRound } from './scoring';
import { evaluateAchievements, type AchievementContext } from './achievements';
import type { DieFace } from '../roulette/Die';

export type GamePhase = 'idle' | 'rolling' | 'revealed';

export interface PointsFlash {
  id: string;
  amount: number;
  labels: string[];
  multiplier: number;
}

export interface GameValue {
  phase: GamePhase;
  current: Challenge | null;
  face: DieFace;
  streak: number;
  sessionPoints: number;
  multiplier: number;
  nextMultiplier: { multiplier: number; missing: number } | null;
  session: GameSession | null;
  elapsedMs: number;
  message: string;
  flash: PointsFlash | null;
  newAchievements: string[];
  idleMs: number;
  isIdle: boolean;
  idleMessage: string | null;
  poolSize: number;
  challengeEndsAt: number | null;
  /** Duracao do arremesso atual, em ms. Muda a cada lance. */
  rollMs: number;
  reducedMotion: boolean;
  soundEnabled: boolean;
  roll: () => void;
  confirm: () => void;
  skip: () => void;
  endSession: () => void;
  startSession: () => string | null;
  dismissFlash: () => void;
  dismissAchievements: () => void;
  playSound: (name: SoundName) => void;
}

const GameContext = createContext<GameValue | null>(null);

/**
 * Duracao do arremesso. Sorteada a cada lance: com tempo fixo o olho
 * aprende quando o dado vai parar e a expectativa morre.
 */
const ROLL_MS_MIN = 2500;
const ROLL_MS_MAX = 3400;
const IDLE_THRESHOLD = 90_000;
const RECENT_MEMORY = 8;

export function GameProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, currentUser, logActivity } = useStore();
  const couple = state.couple;
  const preferences = couple?.preferences;

  const reducedMotion = useReducedMotion(preferences?.reducedMotion ?? null);
  const { play, unlock, startMusic, stopMusic } = useSound(
    preferences?.soundEnabled ?? true,
    preferences?.volume ?? 0.5,
  );

  const [phase, setPhase] = useState<GamePhase>('idle');
  const [current, setCurrent] = useState<Challenge | null>(null);
  const [face, setFace] = useState<DieFace>(3);
  const [streak, setStreak] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState(() => getMessage('welcome', couple?.theme ?? 'neutral'));
  const [flash, setFlash] = useState<PointsFlash | null>(null);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [challengeEndsAt, setChallengeEndsAt] = useState<number | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [idleMessage, setIdleMessage] = useState<string | null>(null);
  const [rollMs, setRollMs] = useState(ROLL_MS_MIN);

  const recentIds = useRef<string[]>([]);
  const seenCounts = useRef<Map<string, number>>(new Map());
  const categoriesSeen = useRef<Set<Category>>(new Set());
  const skipsInRow = useRef(0);
  const rollLock = useRef(false);
  const rollTimer = useRef<number | null>(null);

  const session = useMemo(
    () => state.sessions.find((item) => item.id === sessionId) ?? null,
    [state.sessions, sessionId],
  );

  const elapsedMs = useSessionTimer(session?.startedAt ?? null, !session?.endedAt);

  const { idleMs, isIdle, isDeeplyIdle, reset: resetIdle } = useInactivity(
    IDLE_THRESHOLD,
    phase !== 'rolling',
  );

  // Catalogo disponivel para este casal, ja recortado por publico,
  // nivel maximo e categorias excluidas nas preferencias.
  const pool = useMemo(() => {
    if (!couple) return [];
    return filterChallenges({
      audience: couple.theme,
      maxLevel: couple.maxLevel,
      excludedCategories: preferences?.excludedCategories ?? [],
    });
  }, [couple, preferences?.excludedCategories]);

  const playSound = useCallback(
    (name: SoundName) => {
      unlock();
      play(name);
    },
    [play, unlock],
  );

  // --- sessao ---
  /**
   * Abre a sessao e devolve o id ja criado. Devolver o id importa:
   * o primeiro sorteio acontece no mesmo tick e nao pode esperar o
   * setState para registrar a rodada.
   */
  const startSession = useCallback((): string | null => {
    if (!couple) return null;
    if (sessionId) return sessionId;
    const created: GameSession = {
      id: createId('ses'),
      coupleId: couple.id,
      startedAt: Date.now(),
      endedAt: null,
      points: 0,
      rounds: 0,
      completed: 0,
      skips: 0,
      maxStreak: 0,
      maxLevelReached: null,
    };
    dispatch({ type: 'addSession', session: created });
    setSessionId(created.id);
    setSessionPoints(0);
    setStreak(0);
    skipsInRow.current = 0;
    seenCounts.current.clear();
    categoriesSeen.current.clear();
    logActivity('session_start', 'Sessao iniciada');
    return created.id;
  }, [couple, sessionId, dispatch, logActivity]);

  const endSession = useCallback(() => {
    if (!sessionId) return;
    stopMusic();
    dispatch({ type: 'patchSession', sessionId, patch: { endedAt: Date.now() } });
    logActivity('session_end', 'Sessao encerrada', `${sessionPoints} pontos`);
    setMessage(getMessage('sessionEnd', couple?.theme ?? 'neutral'));
    setSessionId(null);
    setPhase('idle');
    setCurrent(null);
    setChallengeEndsAt(null);
  }, [sessionId, dispatch, logActivity, sessionPoints, couple?.theme, stopMusic]);

  // --- conquistas ---
  const runAchievements = useCallback(
    (context: Omit<AchievementContext, 'unlocked'>) => {
      const unlockedSlugs = new Set(state.unlocked.map((item) => item.slug));
      const earned = evaluateAchievements({ ...context, unlocked: unlockedSlugs });
      if (earned.length === 0) return;
      earned.forEach((slug) => {
        dispatch({ type: 'unlock', slug });
        logActivity('achievement', 'Conquista desbloqueada', slug);
      });
      setNewAchievements((previous) => [...previous, ...earned]);
      playSound('achievement');
    },
    [state.unlocked, dispatch, logActivity, playSound],
  );

  // --- sorteio ---
  const roll = useCallback(() => {
    if (rollLock.current || !couple) return;
    if (pool.length === 0) {
      setMessage(getMessage('empty', couple.theme));
      return;
    }
    rollLock.current = true;
    resetIdle();
    setIdleMessage(null);
    const activeSession = sessionId ?? startSession();

    setPhase('rolling');
    setFlash(null);
    setChallengeEndsAt(null);
    setMessage(getMessage('rolling', couple.theme, message));
    playSound('roll');
    // A trilha entra com o primeiro arremesso e so sai quando a sessao
    // encerra - ela marca "estamos jogando", nao cada rodada.
    startMusic();

    const picked = pickWeighted(pool, recentIds.current, (item) => item.id);
    setFace(randomInt(1, 6) as DieFace);
    const duracao = randomInt(ROLL_MS_MIN, ROLL_MS_MAX);
    setRollMs(duracao);

    const settle = () => {
      if (!picked) {
        setPhase('idle');
        rollLock.current = false;
        return;
      }
      recentIds.current = [picked.id, ...recentIds.current].slice(0, RECENT_MEMORY);
      seenCounts.current.set(picked.id, (seenCounts.current.get(picked.id) ?? 0) + 1);
      categoriesSeen.current.add(picked.category);

      const id = createId('rnd');
      setRoundId(id);
      setCurrent(picked);
      setPhase('revealed');
      setMessage(getMessage('revealed', couple.theme, message));
      playSound('reveal');
      window.setTimeout(() => playSound('heartbeat'), 380);

      if (preferences?.timerEnabled && picked.durationSec > 0) {
        setChallengeEndsAt(Date.now() + picked.durationSec * 1000);
      }

      if (activeSession) {
        dispatch({
          type: 'addRound',
          round: {
            id,
            sessionId: activeSession,
            challengeId: picked.id,
            level: picked.level,
            result: 'pending',
            points: 0,
            multiplier: multiplierFor(streak + 1),
            startedAt: Date.now(),
            completedAt: null,
          },
        });
      }
      rollLock.current = false;
    };

    if (reducedMotion) {
      settle();
    } else {
      rollTimer.current = window.setTimeout(settle, duracao);
    }
  }, [
    couple,
    pool,
    sessionId,
    startSession,
    message,
    playSound,
    reducedMotion,
    preferences?.timerEnabled,
    dispatch,
    streak,
    resetIdle,
    startMusic,
  ]);

  useEffect(
    () => () => {
      if (rollTimer.current) window.clearTimeout(rollTimer.current);
      stopMusic();
    },
    [stopMusic],
  );

  // --- confirmar ("Fizemos") ---
  const confirm = useCallback(() => {
    if (phase !== 'revealed' || !current || !couple || !sessionId) return;
    resetIdle();

    const startedAt = state.rounds.find((round) => round.id === roundId)?.startedAt ?? Date.now();
    const breakdown = scoreRound({
      challenge: current,
      streak,
      elapsedMs: Date.now() - startedAt,
      repeatCount: (seenCounts.current.get(current.id) ?? 1) - 1,
    });

    const nextStreak = streak + 1;
    const nextPoints = sessionPoints + breakdown.total;
    const previousLevel = session?.maxLevelReached ?? null;
    const reachedLevel = highestLevel(previousLevel, current.level);

    setStreak(nextStreak);
    setSessionPoints(nextPoints);
    skipsInRow.current = 0;

    if (roundId) {
      dispatch({
        type: 'patchRound',
        roundId,
        patch: {
          result: 'done',
          points: breakdown.total,
          multiplier: breakdown.multiplier,
          completedAt: Date.now(),
        },
      });
    }

    dispatch({
      type: 'patchSession',
      sessionId,
      patch: {
        points: nextPoints,
        rounds: (session?.rounds ?? 0) + 1,
        completed: (session?.completed ?? 0) + 1,
        maxStreak: Math.max(session?.maxStreak ?? 0, nextStreak),
        maxLevelReached: reachedLevel,
      },
    });

    const totalPoints = couple.totalPoints + breakdown.total;
    dispatch({
      type: 'patchCouple',
      patch: { totalPoints, bestStreak: Math.max(couple.bestStreak, nextStreak) },
    });

    setFlash({
      id: createId('flash'),
      amount: breakdown.total,
      labels: breakdown.labels,
      multiplier: breakdown.multiplier,
    });
    playSound('score');
    logActivity('round_done', current.title, `+${breakdown.total} pontos`);

    const levelWentUp =
      previousLevel !== null && levelIndex(current.level) > levelIndex(previousLevel);
    const beatRecord = nextStreak > couple.bestStreak && nextStreak >= 3;

    let event: MessageEvent = 'confirmed';
    if (beatRecord) event = 'record';
    else if (levelWentUp) event = 'levelUp';
    else if (nextStreak >= 3 && nextStreak % 3 === 0) event = 'streak';
    setMessage(getMessage(event, couple.theme, message));

    runAchievements({
      streak: nextStreak,
      totalPoints,
      sessionDurationMs: elapsedMs,
      skipsInSession: session?.skips ?? 0,
      roundsInSession: (session?.rounds ?? 0) + 1,
      categories: categoriesSeen.current,
      level: current.level,
      multiplier: breakdown.multiplier,
      recoveredAfterSkips: skipsInRow.current === 0 && (session?.skips ?? 0) >= 3,
      challengeTags: current.tags,
      hour: new Date().getHours(),
    });

    setPhase('idle');
    setCurrent(null);
    setChallengeEndsAt(null);
    setRoundId(null);
  }, [
    phase,
    current,
    couple,
    sessionId,
    streak,
    sessionPoints,
    session,
    roundId,
    state.rounds,
    dispatch,
    playSound,
    logActivity,
    message,
    runAchievements,
    elapsedMs,
    resetIdle,
  ]);

  // --- desistir e tentar outro ---
  const skip = useCallback(() => {
    if (phase !== 'revealed' || !current || !couple || !sessionId) return;
    resetIdle();
    skipsInRow.current += 1;

    if (roundId) {
      dispatch({
        type: 'patchRound',
        roundId,
        patch: { result: 'skipped', points: -0, completedAt: Date.now() },
      });
    }

    const nextPoints = applySkipPenalty(sessionPoints);
    setSessionPoints(nextPoints);

    dispatch({
      type: 'patchSession',
      sessionId,
      patch: {
        points: nextPoints,
        rounds: (session?.rounds ?? 0) + 1,
        skips: (session?.skips ?? 0) + 1,
      },
    });

    playSound('skip');
    logActivity('round_skip', current.title, 'Trocaram de desafio');
    setMessage(getMessage('skipped', couple.theme, message));

    // A sequencia NAO quebra: trocar e parte do jogo, nao punicao.
    setPhase('idle');
    setCurrent(null);
    setChallengeEndsAt(null);
    setRoundId(null);
    window.setTimeout(() => roll(), reducedMotion ? 0 : 260);
  }, [
    phase,
    current,
    couple,
    sessionId,
    roundId,
    sessionPoints,
    session,
    dispatch,
    playSound,
    logActivity,
    message,
    roll,
    reducedMotion,
    resetIdle,
  ]);

  // --- mensagens de inatividade ---
  useEffect(() => {
    if (!couple) return;
    if (isDeeplyIdle) {
      setIdleMessage((previous) => previous ?? getMessage('idleLong', couple.theme));
    } else if (isIdle) {
      setIdleMessage((previous) => previous ?? getMessage('idle', couple.theme));
    } else {
      setIdleMessage(null);
    }
  }, [isIdle, isDeeplyIdle, couple]);

  // --- sessao longa ---
  const longSessionNotified = useRef(false);
  useEffect(() => {
    if (!couple || longSessionNotified.current) return;
    if (elapsedMs > 60 * 60 * 1000) {
      longSessionNotified.current = true;
      setMessage(getMessage('longSession', couple.theme));
    }
  }, [elapsedMs, couple]);

  // --- boas-vindas de retorno ---
  useEffect(() => {
    if (!couple) return;
    if (state.sessions.length > 0 && !sessionId) {
      setMessage(getMessage('returning', couple.theme));
    }
    // Roda so na montagem: e uma saudacao, nao um feedback continuo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: GameValue = {
    phase,
    current,
    face,
    streak,
    sessionPoints,
    multiplier: multiplierFor(streak),
    nextMultiplier: nextTier(streak),
    session,
    elapsedMs,
    message,
    flash,
    newAchievements,
    idleMs,
    isIdle,
    idleMessage,
    poolSize: pool.length,
    challengeEndsAt,
    rollMs,
    reducedMotion,
    soundEnabled: preferences?.soundEnabled ?? true,
    roll,
    confirm,
    skip,
    endSession,
    startSession,
    dismissFlash: () => setFlash(null),
    dismissAchievements: () => setNewAchievements([]),
    playSound,
  };

  // currentUser nao muda a mecanica, mas entra no log de atividade.
  void currentUser;

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameValue {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame precisa estar dentro de <GameProvider>.');
  return context;
}

export type { Level };
export { LEVELS };
