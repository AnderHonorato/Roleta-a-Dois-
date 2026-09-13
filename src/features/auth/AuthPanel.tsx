import { useState } from 'react';
import type { Audience, Level } from '@/types';
import { Icon } from '@/design-system/icons/Icons';
import { useStore } from '@/app/store';
import { authenticate, createCouple, createUser, linkMember } from '@/services/auth';
import { cleanLine } from '@/lib/sanitize';
import { MODO_DEMO_LOCAL } from '@/services/config';

/**
 * Cadastro do casal (duas contas vinculadas) e login individual.
 *
 * O cadastro cria as duas contas de uma vez, cada uma com e-mail e
 * senha proprios, ligadas ao mesmo perfil de casal. Depois disso
 * cada pessoa entra com a sua conta neste ou em outro dispositivo.
 */
export interface AuthPanelProps {
  audience: Audience;
  level: Level;
  onDone?: () => void;
  /** Quando ja existe casal cadastrado, abre direto no login. */
  initialMode?: 'signup' | 'login';
}

export function AuthPanel({ audience, level, onDone, initialMode }: AuthPanelProps) {
  const { state, dispatch, logActivity } = useStore();
  const hasCouple = state.couple !== null && state.users.length > 0;
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode ?? (hasCouple ? 'login' : 'signup'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [coupleName, setCoupleName] = useState('');
  const [one, setOne] = useState({ name: '', email: '', username: '', password: '' });
  const [two, setTwo] = useState({ name: '', email: '', username: '', password: '' });
  const [login, setLogin] = useState({ identifier: '', password: '' });

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (one.email.trim().toLowerCase() === two.email.trim().toLowerCase()) {
        setError('Cada pessoa precisa de um e-mail proprio.');
        return;
      }

      const [first, second] = await Promise.all([
        createUser({
          email: one.email,
          username: one.username || one.name,
          displayName: one.name,
          password: one.password,
        }),
        createUser({
          email: two.email,
          username: two.username || two.name,
          displayName: two.name,
          password: two.password,
        }),
      ]);

      if (!first.ok || !first.data) {
        setError(`Pessoa 1: ${first.error}`);
        return;
      }
      if (!second.ok || !second.data) {
        setError(`Pessoa 2: ${second.error}`);
        return;
      }
      if (first.data.username === second.data.username) {
        setError('Os dois usuarios ficaram iguais. Escolham @ diferentes.');
        return;
      }

      const couple = createCouple(cleanLine(coupleName, 40) || 'Nosso perfil', audience);
      couple.maxLevel = level;

      dispatch({ type: 'setUsers', users: [first.data, second.data] });
      dispatch({ type: 'setCouple', couple });
      dispatch({
        type: 'setMembers',
        members: [
          linkMember(couple.id, first.data.id, 'owner'),
          linkMember(couple.id, second.data.id, 'partner'),
        ],
      });
      dispatch({ type: 'setCurrentUser', userId: first.data.id });
      dispatch({ type: 'setFlag', key: 'onboardingDone', value: true });
      logActivity('profile', 'Perfil do casal criado', couple.name);
      onDone?.();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await authenticate(state.users, login.identifier, login.password);
      if (!result.ok || !result.data) {
        setError(result.error ?? 'Nao foi possivel entrar.');
        return;
      }
      dispatch({ type: 'setCurrentUser', userId: result.data.id });
      dispatch({ type: 'setFlag', key: 'onboardingDone', value: true });
      logActivity('profile', `${result.data.displayName} entrou`);
      onDone?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth__tabs" role="tablist" aria-label="Entrar ou cadastrar">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          className={`auth__tab${mode === 'signup' ? ' is-active' : ''}`}
          onClick={() => setMode('signup')}
        >
          Criar perfil do casal
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          className={`auth__tab${mode === 'login' ? ' is-active' : ''}`}
          onClick={() => setMode('login')}
        >
          Ja temos conta
        </button>
      </div>

      {mode === 'signup' ? (
        <form className="stack stack-4" onSubmit={handleSignup} noValidate>
          <div className="field-group">
            <label className="label" htmlFor="couple-name">
              Nome do casal (opcional)
            </label>
            <input
              id="couple-name"
              className="input"
              value={coupleName}
              onChange={(event) => setCoupleName(event.target.value)}
              placeholder="Ex.: Os insones"
              maxLength={40}
              autoComplete="off"
            />
          </div>

          {([
            ['Pessoa 1', one, setOne, 'p1'],
            ['Pessoa 2', two, setTwo, 'p2'],
          ] as const).map(([title, values, setValues, prefix]) => (
            <fieldset key={prefix} className="auth__person">
              <legend className="eyebrow">{title}</legend>
              <div className="field-group">
                <label className="label" htmlFor={`${prefix}-name`}>
                  Nome de exibicao
                </label>
                <input
                  id={`${prefix}-name`}
                  className="input"
                  value={values.name}
                  onChange={(event) => setValues({ ...values, name: event.target.value })}
                  required
                  maxLength={40}
                  autoComplete="nickname"
                />
              </div>
              <div className="field-group">
                <label className="label" htmlFor={`${prefix}-user`}>
                  Usuario (@)
                </label>
                <input
                  id={`${prefix}-user`}
                  className="input"
                  value={values.username}
                  onChange={(event) => setValues({ ...values, username: event.target.value })}
                  placeholder="minusculas, sem espaco"
                  maxLength={24}
                  autoComplete="username"
                />
              </div>
              <div className="field-group">
                <label className="label" htmlFor={`${prefix}-email`}>
                  E-mail
                </label>
                <input
                  id={`${prefix}-email`}
                  type="email"
                  className="input"
                  value={values.email}
                  onChange={(event) => setValues({ ...values, email: event.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="field-group">
                <label className="label" htmlFor={`${prefix}-pass`}>
                  Senha
                </label>
                <input
                  id={`${prefix}-pass`}
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={values.password}
                  onChange={(event) => setValues({ ...values, password: event.target.value })}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <p className="help-text">Minimo 8 caracteres, com letras e numeros.</p>
              </div>
            </fieldset>
          ))}

          <label className="check">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
            />
            <span className="check__box">
              <Icon name="check" size={15} />
            </span>
            <span className="check__text">Mostrar senhas enquanto digito</span>
          </label>

          {error ? <p className="error-text" role="alert">{error}</p> : null}

          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
            {busy ? 'Criando...' : 'Criar perfil do casal'}
            <Icon name="couple" size={18} />
          </button>

          {MODO_DEMO_LOCAL ? (
            <p className="help-text">
              No modo demo as contas ficam apenas neste navegador, com as senhas derivadas por
              PBKDF2. Nenhum dado sai do dispositivo.
            </p>
          ) : null}
        </form>
      ) : (
        <form className="stack stack-4" onSubmit={handleLogin} noValidate>
          <div className="field-group">
            <label className="label" htmlFor="login-id">
              E-mail ou usuario
            </label>
            <input
              id="login-id"
              className="input"
              value={login.identifier}
              onChange={(event) => setLogin({ ...login, identifier: event.target.value })}
              required
              autoComplete="username"
            />
          </div>
          <div className="field-group">
            <label className="label" htmlFor="login-pass">
              Senha
            </label>
            <input
              id="login-pass"
              type={showPassword ? 'text' : 'password'}
              className="input"
              value={login.password}
              onChange={(event) => setLogin({ ...login, password: event.target.value })}
              required
              autoComplete="current-password"
            />
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
            />
            <span className="check__box">
              <Icon name="check" size={15} />
            </span>
            <span className="check__text">Mostrar senha</span>
          </label>

          {error ? <p className="error-text" role="alert">{error}</p> : null}

          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
            {busy ? 'Entrando...' : 'Entrar'}
            <Icon name="login" size={18} />
          </button>

          <p className="help-text">
            Esqueceu a senha? Em Configuracoes, a outra pessoa do casal confirma com a senha dela e
            voces redefinem juntos.
          </p>
        </form>
      )}
    </div>
  );
}
