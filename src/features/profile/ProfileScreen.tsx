import { useRef, useState } from 'react';
import type { User } from '@/types';
import { Icon } from '@/design-system/icons/Icons';
import { Avatar } from '@/components/Avatar';
import { useStore } from '@/app/store';
import { cleanLine, cleanText, cleanUsername } from '@/lib/sanitize';
import { readAndResizeImage, validateImageFile } from '@/lib/image';
import { formatPoints } from '@/lib/format';
import { Flourish } from '@/design-system/svg/Wordmark';
import type { Route } from '@/app/router';

/**
 * Perfil individual. Cada pessoa edita o proprio cartao; a lista
 * abaixo mostra quem mais esta no casal e permite trocar de conta
 * no mesmo dispositivo.
 */
export function ProfileScreen({ navigate }: { navigate: (route: Route) => void }) {
  const { state, dispatch, currentUser, logActivity } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => toDraft(currentUser));
  const [dirty, setDirty] = useState(false);

  if (!currentUser) {
    return (
      <div className="screen">
        <section className="section">
          <h1 className="display section__title">Ninguem conectado</h1>
          <p className="lede">Entre com uma das contas do casal para editar o perfil.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate('auth')}>
            Entrar <Icon name="login" size={18} />
          </button>
        </section>
      </div>
    );
  }

  const stats = personalStats(state.rounds.length, state.sessions.length, state.couple?.totalPoints ?? 0);

  async function handleAvatar(files: FileList | null) {
    if (!files?.[0] || !currentUser) return;
    const check = validateImageFile(files[0]);
    if (!check.ok) {
      setError(check.reason ?? 'Arquivo recusado.');
      return;
    }
    try {
      const avatar = await readAndResizeImage(files[0], 320, 0.85);
      dispatch({ type: 'upsertUser', user: { ...currentUser, avatar, updatedAt: Date.now() } });
      logActivity('profile', 'Avatar atualizado', currentUser.displayName);
      setError(null);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function save() {
    if (!currentUser) return;
    dispatch({
      type: 'upsertUser',
      user: {
        ...currentUser,
        displayName: cleanLine(draft.displayName, 40) || currentUser.displayName,
        username: cleanUsername(draft.username) || currentUser.username,
        nickname: cleanLine(draft.nickname, 24),
        bio: cleanText(draft.bio, 160),
        updatedAt: Date.now(),
      },
    });
    setDirty(false);
    logActivity('profile', 'Perfil atualizado', currentUser.displayName);
  }

  return (
    <div className="screen">
      <section className="profile-head">
        <div className="profile-head__avatar">
          <Avatar name={currentUser.displayName} src={currentUser.avatar} size={92} active />
          <button
            type="button"
            className="btn btn--ghost profile-head__upload"
            onClick={() => fileInput.current?.click()}
          >
            <Icon name="image" size={16} /> Trocar foto
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            aria-label="Escolher uma foto de perfil"
            onChange={(event) => void handleAvatar(event.target.files)}
          />
        </div>
        <div className="grow">
          <h1 className="display profile-head__name">{currentUser.displayName}</h1>
          <p className="faint">@{currentUser.username}</p>
          {currentUser.bio ? <p className="lede">{currentUser.bio}</p> : null}
        </div>
      </section>

      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}

      <Flourish />

      <section className="section" aria-labelledby="profile-edit">
        <h2 id="profile-edit" className="section__title display">
          Seus dados
        </h2>

        <div className="stack stack-4">
          <div className="field-group">
            <label className="label" htmlFor="pf-name">
              Nome de exibicao
            </label>
            <input
              id="pf-name"
              className="input"
              value={draft.displayName}
              maxLength={40}
              onChange={(event) => {
                setDraft({ ...draft, displayName: event.target.value });
                setDirty(true);
              }}
            />
          </div>

          <div className="field-group">
            <label className="label" htmlFor="pf-user">
              Usuario (@)
            </label>
            <input
              id="pf-user"
              className="input"
              value={draft.username}
              maxLength={24}
              onChange={(event) => {
                setDraft({ ...draft, username: event.target.value });
                setDirty(true);
              }}
            />
          </div>

          <div className="field-group">
            <label className="label" htmlFor="pf-nick">
              Como a outra pessoa te chama
            </label>
            <input
              id="pf-nick"
              className="input"
              value={draft.nickname}
              maxLength={24}
              onChange={(event) => {
                setDraft({ ...draft, nickname: event.target.value });
                setDirty(true);
              }}
            />
          </div>

          <div className="field-group">
            <label className="label" htmlFor="pf-bio">
              Bio curta
            </label>
            <textarea
              id="pf-bio"
              className="textarea"
              value={draft.bio}
              maxLength={160}
              onChange={(event) => {
                setDraft({ ...draft, bio: event.target.value });
                setDirty(true);
              }}
            />
            <p className="help-text">{draft.bio.length}/160</p>
          </div>

          <button type="button" className="btn btn--primary" onClick={save} disabled={!dirty}>
            Salvar alteracoes
          </button>
        </div>
      </section>

      <Flourish />

      <section className="section" aria-labelledby="profile-stats">
        <h2 id="profile-stats" className="section__title display">
          Numeros
        </h2>
        <div className="numbers">
          <div className="numbers__item">
            <span className="eyebrow">Pontos do casal</span>
            <strong className="num">{formatPoints(stats.points)}</strong>
          </div>
          <div className="numbers__item">
            <span className="eyebrow">Rodadas</span>
            <strong className="num">{stats.rounds}</strong>
          </div>
          <div className="numbers__item">
            <span className="eyebrow">Sessoes</span>
            <strong className="num">{stats.sessions}</strong>
          </div>
        </div>
        <p className="help-text">
          As estatisticas sao do casal. Nada do que voces fazem e comparado, ranqueado ou enviado
          para lugar nenhum.
        </p>
      </section>

      <Flourish />

      <section className="section" aria-labelledby="profile-switch">
        <h2 id="profile-switch" className="section__title display">
          Quem esta no perfil
        </h2>
        <ul className="people">
          {state.users.map((user) => (
            <li key={user.id} className="people__row">
              <Avatar name={user.displayName} src={user.avatar} size={44} active={user.id === currentUser.id} />
              <div className="grow">
                <strong>{user.displayName}</strong>
                <p className="faint" style={{ fontSize: 'var(--fs-xs)' }}>
                  @{user.username}
                  {user.id === currentUser.id ? ' — conectado agora' : ''}
                </p>
              </div>
              {user.id === currentUser.id ? (
                <button
                  type="button"
                  className="btn btn--quiet"
                  onClick={() => {
                    dispatch({ type: 'setCurrentUser', userId: null });
                    logActivity('profile', `${user.displayName} saiu`);
                    navigate('auth');
                  }}
                >
                  <Icon name="logout" size={16} /> Sair
                </button>
              ) : (
                <button type="button" className="btn btn--quiet" onClick={() => navigate('auth')}>
                  <Icon name="login" size={16} /> Trocar
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function toDraft(user: User | null) {
  return {
    displayName: user?.displayName ?? '',
    username: user?.username ?? '',
    nickname: user?.nickname ?? '',
    bio: user?.bio ?? '',
  };
}

function personalStats(rounds: number, sessions: number, points: number) {
  return { rounds, sessions, points };
}
