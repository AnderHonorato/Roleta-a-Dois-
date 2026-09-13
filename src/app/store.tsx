import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  ActivityEntry,
  Audience,
  Couple,
  CouplePreferences,
  GameRound,
  GameSession,
  Level,
  PersistedState,
  User,
} from '@/types';
import { createId } from '@/lib/id';
import { getStorage, StorageQuotaError } from '@/services/storage';
import { emptyState } from '@/services/auth';
import { MODO_DEMO_LOCAL } from '@/services/config';

// ============================================================
// Reducer do estado persistido.
// Toda mutacao passa por aqui; a gravacao e um efeito debounced,
// para que nenhuma tela precise saber onde os dados moram.
// ============================================================

type Action =
  | { type: 'hydrate'; state: PersistedState }
  | { type: 'reset' }
  | { type: 'setUsers'; users: User[] }
  | { type: 'upsertUser'; user: User }
  | { type: 'removeUser'; userId: string }
  | { type: 'setCouple'; couple: Couple | null }
  | { type: 'patchCouple'; patch: Partial<Couple> }
  | { type: 'patchPreferences'; patch: Partial<CouplePreferences> }
  | { type: 'setMembers'; members: PersistedState['members'] }
  | { type: 'setCurrentUser'; userId: string | null }
  | { type: 'setFlag'; key: 'onboardingDone' | 'ageConfirmed' | 'hardcoreConsent'; value: boolean }
  | { type: 'addSession'; session: GameSession }
  | { type: 'patchSession'; sessionId: string; patch: Partial<GameSession> }
  | { type: 'addRound'; round: GameRound }
  | { type: 'patchRound'; roundId: string; patch: Partial<GameRound> }
  | { type: 'unlock'; slug: string }
  | { type: 'activity'; entry: ActivityEntry };

const MAX_ACTIVITY = 120;

function reducer(state: PersistedState, action: Action): PersistedState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'reset':
      return emptyState();
    case 'setUsers':
      return { ...state, users: action.users };
    case 'upsertUser': {
      const exists = state.users.some((user) => user.id === action.user.id);
      return {
        ...state,
        users: exists
          ? state.users.map((user) => (user.id === action.user.id ? action.user : user))
          : [...state.users, action.user],
      };
    }
    case 'removeUser':
      return {
        ...state,
        users: state.users.filter((user) => user.id !== action.userId),
        members: state.members.filter((member) => member.userId !== action.userId),
        currentUserId: state.currentUserId === action.userId ? null : state.currentUserId,
      };
    case 'setCouple':
      return { ...state, couple: action.couple };
    case 'patchCouple':
      return state.couple
        ? { ...state, couple: { ...state.couple, ...action.patch, updatedAt: Date.now() } }
        : state;
    case 'patchPreferences':
      return state.couple
        ? {
            ...state,
            couple: {
              ...state.couple,
              preferences: { ...state.couple.preferences, ...action.patch },
              updatedAt: Date.now(),
            },
          }
        : state;
    case 'setMembers':
      return { ...state, members: action.members };
    case 'setCurrentUser':
      return { ...state, currentUserId: action.userId };
    case 'setFlag':
      return { ...state, [action.key]: action.value };
    case 'addSession':
      return { ...state, sessions: [...state.sessions, action.session] };
    case 'patchSession':
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.sessionId ? { ...session, ...action.patch } : session,
        ),
      };
    case 'addRound':
      return { ...state, rounds: [...state.rounds, action.round] };
    case 'patchRound':
      return {
        ...state,
        rounds: state.rounds.map((round) =>
          round.id === action.roundId ? { ...round, ...action.patch } : round,
        ),
      };
    case 'unlock':
      return state.unlocked.some((item) => item.slug === action.slug)
        ? state
        : { ...state, unlocked: [...state.unlocked, { slug: action.slug, unlockedAt: Date.now() }] };
    case 'activity':
      return { ...state, activity: [action.entry, ...state.activity].slice(0, MAX_ACTIVITY) };
    default:
      return state;
  }
}

// ============================================================
// Contexto
// ============================================================

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface StoreValue {
  state: PersistedState;
  dispatch: React.Dispatch<Action>;
  booted: boolean;
  bootError: string | null;
  saveStatus: SaveStatus;
  saveError: string | null;
  online: boolean;
  /** Usuario logado no dispositivo, se houver. */
  currentUser: User | null;
  /** A outra pessoa do casal. */
  partner: User | null;
  theme: Audience;
  maxLevel: Level;
  logActivity: (kind: ActivityEntry['kind'], label: string, detail?: string) => void;
  hardReset: () => Promise<void>;
  retrySave: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, emptyState);
  const [booted, setBooted] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const dirty = useRef(false);
  const saveTimer = useRef<number | null>(null);

  // --- carga inicial ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const storage = getStorage();
        const health = await storage.health();
        if (!health.ok && !MODO_DEMO_LOCAL) {
          throw new Error(health.reason ?? 'Armazenamento indisponivel.');
        }
        const loaded = await storage.load();
        if (cancelled) return;
        if (loaded) dispatch({ type: 'hydrate', state: loaded });
        setBootError(health.ok ? null : (health.reason ?? null));
      } catch (error) {
        if (!cancelled) setBootError((error as Error).message);
      } finally {
        if (!cancelled) setBooted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- gravacao debounced ---
  const persist = useCallback(
    async (snapshot: PersistedState) => {
      setSaveStatus('saving');
      try {
        await getStorage().save(snapshot);
        setSaveStatus('saved');
        setSaveError(null);
        dirty.current = false;
      } catch (error) {
        setSaveStatus('error');
        setSaveError(
          error instanceof StorageQuotaError
            ? error.message
            : `Nao consegui salvar: ${(error as Error).message}`,
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (!booted) return;
    dirty.current = true;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void persist(state), 400);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state, booted, persist]);

  // --- estado de rede ---
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  // --- limpa o selo "salvo" depois de um tempo ---
  useEffect(() => {
    if (saveStatus !== 'saved') return;
    const id = window.setTimeout(() => setSaveStatus('idle'), 1600);
    return () => window.clearTimeout(id);
  }, [saveStatus]);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  );

  const partner = useMemo(() => {
    if (!currentUser) return state.users[1] ?? null;
    return state.users.find((user) => user.id !== currentUser.id) ?? null;
  }, [state.users, currentUser]);

  const logActivity = useCallback(
    (kind: ActivityEntry['kind'], label: string, detail?: string) => {
      dispatch({
        type: 'activity',
        entry: { id: createId('act'), at: Date.now(), kind, label, detail },
      });
    },
    [],
  );

  const hardReset = useCallback(async () => {
    await getStorage().clear();
    dispatch({ type: 'reset' });
  }, []);

  const retrySave = useCallback(() => {
    void persist(state);
  }, [persist, state]);

  const value: StoreValue = {
    state,
    dispatch,
    booted,
    bootError,
    saveStatus,
    saveError,
    online,
    currentUser,
    partner,
    theme: state.couple?.theme ?? 'neutral',
    maxLevel: state.couple?.maxLevel ?? 'quente',
    logActivity,
    hardReset,
    retrySave,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore precisa estar dentro de <StoreProvider>.');
  return context;
}
