import { useState } from 'react';
import type { Audience, Category, Level } from '@/types';
import { Icon } from '@/design-system/icons/Icons';
import { Sheet } from '@/components/Sheet';
import { AUDIENCES } from '@/data/audiences';
import { CATEGORIES, LEVELS, LEVEL_ORDER } from '@/data/challenges';
import { useStore } from '@/app/store';
import { changePassword, resetPasswordWithPartner } from '@/services/auth';
import { MODO_DEMO_LOCAL, APP_NAME } from '@/services/config';
import { Flourish } from '@/design-system/svg/Wordmark';
import { DEMO_CREDENTIALS } from '@/services/demoSeed';
import type { Route } from '@/app/router';

/**
 * Configuracoes: aparencia, jogo, som, acessibilidade, conta e
 * dados. Mudancas sensiveis (redefinir senha, desvincular, apagar
 * tudo) exigem confirmacao — e, quando fazem sentido, a senha da
 * outra pessoa do casal.
 */
export function SettingsScreen({ navigate }: { navigate: (route: Route) => void }) {
  const { state, dispatch, currentUser, partner, hardReset, logActivity } = useStore();
  const couple = state.couple;
  const [sheet, setSheet] = useState<null | 'password' | 'recover' | 'unlink' | 'wipe'>(null);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '' });
  const [recoverForm, setRecoverForm] = useState({ partnerPassword: '', next: '' });
  const [busy, setBusy] = useState(false);

  if (!couple) return null;

  const preferences = couple.preferences;

  function setTheme(theme: Audience) {
    dispatch({ type: 'patchCouple', patch: { theme } });
    document.documentElement.dataset.theme = theme;
  }

  function setLevel(maxLevel: Level) {
    if (maxLevel === 'hardcore' && !state.hardcoreConsent) {
      setSheet(null);
      setFeedback({
        tone: 'error',
        text: 'O nivel hardcore precisa da confirmacao dos dois. Marque a caixa abaixo antes.',
      });
      return;
    }
    dispatch({ type: 'patchCouple', patch: { maxLevel } });
  }

  function toggleCategory(category: Category) {
    const excluded = preferences.excludedCategories.includes(category)
      ? preferences.excludedCategories.filter((item) => item !== category)
      : [...preferences.excludedCategories, category];
    dispatch({ type: 'patchPreferences', patch: { excludedCategories: excluded } });
  }

  async function submitPassword() {
    if (!currentUser) return;
    setBusy(true);
    const result = await changePassword(currentUser, passwordForm.current, passwordForm.next);
    setBusy(false);
    if (!result.ok || !result.data) {
      setFeedback({ tone: 'error', text: result.error ?? 'Nao deu.' });
      return;
    }
    dispatch({ type: 'upsertUser', user: result.data });
    logActivity('profile', 'Senha alterada', currentUser.displayName);
    setPasswordForm({ current: '', next: '' });
    setSheet(null);
    setFeedback({ tone: 'ok', text: 'Senha trocada.' });
  }

  async function submitRecover() {
    if (!currentUser || !partner) return;
    setBusy(true);
    const result = await resetPasswordWithPartner(
      currentUser,
      partner,
      recoverForm.partnerPassword,
      recoverForm.next,
    );
    setBusy(false);
    if (!result.ok || !result.data) {
      setFeedback({ tone: 'error', text: result.error ?? 'Nao deu.' });
      return;
    }
    dispatch({ type: 'upsertUser', user: result.data });
    logActivity('profile', 'Senha redefinida com confirmacao do parceiro');
    setRecoverForm({ partnerPassword: '', next: '' });
    setSheet(null);
    setFeedback({ tone: 'ok', text: 'Senha redefinida.' });
  }

  function unlinkPartner() {
    if (!partner) return;
    dispatch({ type: 'removeUser', userId: partner.id });
    logActivity('profile', 'Parceiro desvinculado');
    setSheet(null);
    setFeedback({ tone: 'ok', text: 'Conta desvinculada do perfil do casal.' });
  }

  async function wipeEverything() {
    await hardReset();
    document.documentElement.dataset.theme = 'neutral';
    setSheet(null);
  }

  return (
    <div className="screen">
      <header className="section">
        <p className="eyebrow">Ajustes</p>
        <h1 className="display screen__title">Do jeito de voces</h1>
      </header>

      {feedback ? (
        <p className={feedback.tone === 'ok' ? 'help-text' : 'error-text'} role="status">
          {feedback.text}
        </p>
      ) : null}

      {/* --- aparencia --- */}
      <section className="section" aria-labelledby="set-theme">
        <h2 id="set-theme" className="section__title display">
          Perfil e visual
        </h2>
        <div className="rail" role="radiogroup" aria-label="Perfil do casal">
          {AUDIENCES.map((profile) => (
            <button
              key={profile.id}
              type="button"
              role="radio"
              aria-checked={couple.theme === profile.id}
              className={`theme-chip${couple.theme === profile.id ? ' is-selected' : ''}`}
              onClick={() => setTheme(profile.id)}
            >
              <span className="theme-chip__swatch" data-theme={profile.id} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {profile.label}
            </button>
          ))}
        </div>
      </section>

      <Flourish />

      {/* --- intensidade --- */}
      <section className="section" aria-labelledby="set-level">
        <h2 id="set-level" className="section__title display">
          Limite de intensidade
        </h2>
        <ul className="choice-list">
          {LEVEL_ORDER.map((id, position) => (
            <li key={id}>
              <button
                type="button"
                className={`choice choice--level${couple.maxLevel === id ? ' is-selected' : ''}`}
                aria-pressed={couple.maxLevel === id}
                onClick={() => setLevel(id)}
              >
                <span className="choice__meter" aria-hidden="true">
                  {[0, 1, 2, 3].map((bar) => (
                    <i key={bar} className={bar <= position ? 'is-on' : ''} />
                  ))}
                </span>
                <span className="grow">
                  <span className="choice__label">{LEVELS[id].label}</span>
                  <span className="choice__hint">{LEVELS[id].tagline}</span>
                </span>
                {couple.maxLevel === id ? <Icon name="check" size={18} /> : null}
              </button>
            </li>
          ))}
        </ul>

        <label className="check">
          <input
            type="checkbox"
            checked={state.hardcoreConsent}
            onChange={(event) => {
              dispatch({ type: 'setFlag', key: 'hardcoreConsent', value: event.target.checked });
              if (!event.target.checked && couple.maxLevel === 'hardcore') {
                dispatch({ type: 'patchCouple', patch: { maxLevel: 'intenso' } });
              }
            }}
          />
          <span className="check__box">
            <Icon name="check" size={15} />
          </span>
          <span className="check__text">
            Nos dois confirmamos 18+ e consentimos com o nivel hardcore, com palavra de parada
            combinada.
          </span>
        </label>
      </section>

      <Flourish />

      {/* --- categorias --- */}
      <section className="section" aria-labelledby="set-cat">
        <h2 id="set-cat" className="section__title display">
          O que nao queremos ver
        </h2>
        <p className="lede">Categorias desmarcadas nunca sao sorteadas.</p>
        <div className="chip-row">
          {(Object.keys(CATEGORIES) as Category[]).map((category) => {
            const excluded = preferences.excludedCategories.includes(category);
            return (
              <button
                key={category}
                type="button"
                className={`chip${excluded ? '' : ' is-on'}`}
                aria-pressed={!excluded}
                onClick={() => toggleCategory(category)}
              >
                {excluded ? null : <Icon name="check" size={14} />}
                {CATEGORIES[category]}
              </button>
            );
          })}
        </div>
      </section>

      <Flourish />

      {/* --- som e movimento --- */}
      <section className="section" aria-labelledby="set-sound">
        <h2 id="set-sound" className="section__title display">
          Som e movimento
        </h2>

        <div className="band">
          <div className="grow">
            <strong>Sons do jogo</strong>
            <p className="faint" style={{ fontSize: 'var(--fs-sm)' }}>
              Efeitos curtos, gerados na hora. Nunca comecam sozinhos.
            </p>
          </div>
          <button
            type="button"
            className="switch"
            role="switch"
            aria-checked={preferences.soundEnabled}
            aria-label="Sons do jogo"
            onClick={() =>
              dispatch({ type: 'patchPreferences', patch: { soundEnabled: !preferences.soundEnabled } })
            }
          >
            <span />
          </button>
        </div>

        <div className="field-group">
          <label className="label" htmlFor="set-volume">
            Volume ({Math.round(preferences.volume * 100)}%)
          </label>
          <input
            id="set-volume"
            type="range"
            min={0}
            max={100}
            value={Math.round(preferences.volume * 100)}
            onChange={(event) =>
              dispatch({ type: 'patchPreferences', patch: { volume: Number(event.target.value) / 100 } })
            }
          />
        </div>

        <div className="band">
          <div className="grow">
            <strong>Cronometro nos desafios</strong>
            <p className="faint" style={{ fontSize: 'var(--fs-sm)' }}>
              Mostra a duracao sugerida contando para tras.
            </p>
          </div>
          <button
            type="button"
            className="switch"
            role="switch"
            aria-checked={preferences.timerEnabled}
            aria-label="Cronometro nos desafios"
            onClick={() =>
              dispatch({ type: 'patchPreferences', patch: { timerEnabled: !preferences.timerEnabled } })
            }
          >
            <span />
          </button>
        </div>

        <div className="field-group">
          <span className="label">Animacoes</span>
          <div className="chip-row">
            {[
              { value: null, label: 'Seguir o sistema' },
              { value: false, label: 'Sempre animar' },
              { value: true, label: 'Reduzir movimento' },
            ].map((option) => (
              <button
                key={String(option.value)}
                type="button"
                className={`chip${preferences.reducedMotion === option.value ? ' is-on' : ''}`}
                aria-pressed={preferences.reducedMotion === option.value}
                onClick={() =>
                  dispatch({ type: 'patchPreferences', patch: { reducedMotion: option.value } })
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="band">
          <div className="grow">
            <strong>Banner passa sozinho</strong>
            <p className="faint" style={{ fontSize: 'var(--fs-sm)' }}>
              Troca a cada {Math.round(preferences.bannerIntervalMs / 1000)} segundos.
            </p>
          </div>
          <button
            type="button"
            className="switch"
            role="switch"
            aria-checked={preferences.autoplayBanner}
            aria-label="Banner passa sozinho"
            onClick={() =>
              dispatch({
                type: 'patchPreferences',
                patch: { autoplayBanner: !preferences.autoplayBanner },
              })
            }
          >
            <span />
          </button>
        </div>
      </section>

      <Flourish />

      {/* --- conta --- */}
      <section className="section" aria-labelledby="set-account">
        <h2 id="set-account" className="section__title display">
          Conta e seguranca
        </h2>

        {currentUser ? (
          <ul className="menu-list">
            <li>
              <button type="button" className="menu-row" onClick={() => setSheet('password')}>
                <Icon name="shield" size={18} />
                <span className="grow">Trocar minha senha</span>
                <Icon name="chevron-right" size={16} />
              </button>
            </li>
            {partner ? (
              <li>
                <button type="button" className="menu-row" onClick={() => setSheet('recover')}>
                  <Icon name="couple" size={18} />
                  <span className="grow">Redefinir senha com a outra pessoa</span>
                  <Icon name="chevron-right" size={16} />
                </button>
              </li>
            ) : null}
            <li>
              <button
                type="button"
                className="menu-row"
                onClick={() => {
                  dispatch({ type: 'setCurrentUser', userId: null });
                  navigate('auth');
                }}
              >
                <Icon name="logout" size={18} />
                <span className="grow">Sair desta conta</span>
                <Icon name="chevron-right" size={16} />
              </button>
            </li>
            {partner ? (
              <li>
                <button type="button" className="menu-row menu-row--danger" onClick={() => setSheet('unlink')}>
                  <Icon name="link-off" size={18} />
                  <span className="grow">Desvincular parceiro</span>
                  <Icon name="chevron-right" size={16} />
                </button>
              </li>
            ) : null}
            <li>
              <button type="button" className="menu-row menu-row--danger" onClick={() => setSheet('wipe')}>
                <Icon name="trash" size={18} />
                <span className="grow">Apagar tudo deste dispositivo</span>
                <Icon name="chevron-right" size={16} />
              </button>
            </li>
          </ul>
        ) : (
          <button type="button" className="btn btn--primary" onClick={() => navigate('auth')}>
            Entrar <Icon name="login" size={18} />
          </button>
        )}
      </section>

      <Flourish />

      <section className="section" aria-labelledby="set-privacy">
        <h2 id="set-privacy" className="section__title display">
          Privacidade
        </h2>
        <p className="lede">
          {APP_NAME} nao usa camera, microfone, localizacao nem analytics. Nao registramos o que
          voces fazem alem do necessario para a pontuacao.
          {MODO_DEMO_LOCAL
            ? ' No modo demo, tudo fica apenas no armazenamento deste navegador.'
            : ' Em producao, os dados ficam na conta do casal no servidor configurado.'}
        </p>
        <button type="button" className="btn btn--ghost" onClick={() => navigate('privacy')}>
          Ler a politica completa
        </button>
      </section>

      {/* --- painel: trocar senha --- */}
      <Sheet
        open={sheet === 'password'}
        title="Trocar senha"
        description="Precisa da senha atual."
        onClose={() => setSheet(null)}
        footer={
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => void submitPassword()}
            disabled={busy}
          >
            {busy ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        }
      >
        <div className="stack stack-4">
          <div className="field-group">
            <label className="label" htmlFor="pw-current">
              Senha atual
            </label>
            <input
              id="pw-current"
              type="password"
              className="input"
              value={passwordForm.current}
              autoComplete="current-password"
              onChange={(event) => setPasswordForm({ ...passwordForm, current: event.target.value })}
            />
          </div>
          <div className="field-group">
            <label className="label" htmlFor="pw-next">
              Nova senha
            </label>
            <input
              id="pw-next"
              type="password"
              className="input"
              value={passwordForm.next}
              autoComplete="new-password"
              onChange={(event) => setPasswordForm({ ...passwordForm, next: event.target.value })}
            />
            <p className="help-text">Minimo 8 caracteres, com letras e numeros.</p>
          </div>
        </div>
      </Sheet>

      {/* --- painel: recuperar com parceiro --- */}
      <Sheet
        open={sheet === 'recover'}
        title="Redefinir com a outra pessoa"
        description="Mudanca sensivel: precisa do sim de quem esta junto."
        onClose={() => setSheet(null)}
        footer={
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => void submitRecover()}
            disabled={busy}
          >
            {busy ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
        }
      >
        <div className="stack stack-4">
          <p className="lede">
            {partner?.displayName} digita a senha dele(a) para autorizar a troca da sua.
          </p>
          <div className="field-group">
            <label className="label" htmlFor="rc-partner">
              Senha de {partner?.displayName}
            </label>
            <input
              id="rc-partner"
              type="password"
              className="input"
              value={recoverForm.partnerPassword}
              autoComplete="off"
              onChange={(event) =>
                setRecoverForm({ ...recoverForm, partnerPassword: event.target.value })
              }
            />
          </div>
          <div className="field-group">
            <label className="label" htmlFor="rc-next">
              Sua nova senha
            </label>
            <input
              id="rc-next"
              type="password"
              className="input"
              value={recoverForm.next}
              autoComplete="new-password"
              onChange={(event) => setRecoverForm({ ...recoverForm, next: event.target.value })}
            />
          </div>
          {MODO_DEMO_LOCAL ? (
            <p className="help-text">
              Em producao isto vira um link por e-mail com token de uso unico.
            </p>
          ) : null}
        </div>
      </Sheet>

      {/* --- painel: desvincular --- */}
      <Sheet
        open={sheet === 'unlink'}
        title="Desvincular parceiro"
        onClose={() => setSheet(null)}
        footer={
          <button type="button" className="btn btn--danger btn--block" onClick={unlinkPartner}>
            Desvincular mesmo assim
          </button>
        }
      >
        <p className="lede">
          A conta de {partner?.displayName} sai do perfil do casal. O historico compartilhado
          continua, mas a pessoa perde o acesso por este dispositivo.
        </p>
      </Sheet>

      {/* --- painel: apagar tudo --- */}
      <Sheet
        open={sheet === 'wipe'}
        title="Apagar tudo"
        onClose={() => setSheet(null)}
        footer={
          <button
            type="button"
            className="btn btn--danger btn--block"
            onClick={() => void wipeEverything()}
          >
            Apagar definitivamente
          </button>
        }
      >
        <p className="lede">
          Isso remove contas, perfil do casal, imagens, pontuacao e historico deste navegador. Nao
          da para desfazer.
        </p>
        {MODO_DEMO_LOCAL ? (
          <p className="help-text">
            Modo convidado: as contas de exemplo sao{' '}
            <strong>{DEMO_CREDENTIALS.accounts.map((account) => account.identifier).join(' e ')}</strong>
            , senha <strong>{DEMO_CREDENTIALS.password}</strong>.
          </p>
        ) : null}
      </Sheet>
    </div>
  );
}
