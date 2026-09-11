import { useEffect } from 'react';
import { Icon, type IconName } from '@/design-system/icons/Icons';
import { Wordmark } from '@/design-system/svg/Wordmark';
import { OfflineBanner, SaveIndicator, ErrorState } from '@/components/StateViews';
import { Onboarding } from '@/features/onboarding/Onboarding';
import { GameProvider } from '@/features/game/GameProvider';
import { GameScreen } from '@/features/game/GameScreen';
import { CoupleScreen } from '@/features/couple/CoupleScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { AchievementsScreen } from '@/features/achievements/AchievementsScreen';
import { HistoryScreen } from '@/features/session/HistoryScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { PrivacyScreen } from '@/features/settings/PrivacyScreen';
import { AuthPanel } from '@/features/auth/AuthPanel';
import { SHOW_DEMO_BADGE } from '@/services/config';
import { useStore } from './store';
import { useRoute, type Route } from './router';
import { Splash } from './Splash';

const NAV: Array<{ route: Route; label: string; icon: IconName }> = [
  { route: 'game', label: 'Jogar', icon: 'die' },
  { route: 'couple', label: 'Casal', icon: 'couple' },
  { route: 'achievements', label: 'Conquistas', icon: 'trophy' },
  { route: 'history', label: 'Historico', icon: 'history' },
  { route: 'profile', label: 'Perfil', icon: 'profile' },
];

export function App() {
  const { state, booted, bootError, saveStatus, saveError, online, retrySave, theme } = useStore();
  const [route, navigate] = useRoute();

  // O tema do casal e a fonte de verdade do data-theme.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const ready = booted && state.onboardingDone && state.couple !== null;

  return (
    <>
      <div className="field" aria-hidden="true">
        <span className="field__aura field__aura--a" />
        <span className="field__aura field__aura--b" />
      </div>

      <Splash done={booted} />

      <a className="skip-link" href="#main">
        Pular para o conteudo
      </a>

      <div className="shell">
        <header className="topbar">
          <Wordmark compact={ready} />
          <div className="row">
            {SHOW_DEMO_BADGE ? (
              <span className="pill" title="Roda sem servidor, salvando neste navegador">
                Demo local
              </span>
            ) : null}
            {ready ? (
              <button
                type="button"
                className="icon-btn"
                aria-label="Configuracoes"
                aria-current={route === 'settings'}
                onClick={() => navigate('settings')}
              >
                <Icon name="settings" />
              </button>
            ) : null}
          </div>
        </header>

        <OfflineBanner online={online} />
        <SaveIndicator status={saveStatus} error={saveError} onRetry={retrySave} />

        <main id="main" className="main">
          {!booted ? null : bootError && !state.couple ? (
            <ErrorState
              title="Nao consegui abrir o armazenamento"
              message={bootError}
              onRetry={() => window.location.reload()}
            />
          ) : !ready ? (
            <Onboarding />
          ) : (
            <GameProvider>
              {route === 'game' ? <GameScreen navigate={navigate} /> : null}
              {route === 'couple' ? <CoupleScreen /> : null}
              {route === 'profile' ? <ProfileScreen navigate={navigate} /> : null}
              {route === 'achievements' ? <AchievementsScreen /> : null}
              {route === 'history' ? <HistoryScreen /> : null}
              {route === 'settings' ? <SettingsScreen navigate={navigate} /> : null}
              {route === 'privacy' ? <PrivacyScreen /> : null}
              {route === 'auth' ? (
                <div className="screen">
                  <header className="section">
                    <p className="eyebrow">Contas</p>
                    <h1 className="display screen__title">Quem esta entrando?</h1>
                  </header>
                  <AuthPanel
                    audience={theme}
                    level={state.couple?.maxLevel ?? 'quente'}
                    initialMode="login"
                    onDone={() => navigate('game')}
                  />
                </div>
              ) : null}
            </GameProvider>
          )}
        </main>

        {ready ? (
          <nav className="tabbar" aria-label="Navegacao principal">
            {NAV.map((item) => (
              <button
                key={item.route}
                type="button"
                className={`tabbar__item${route === item.route ? ' is-active' : ''}`}
                onClick={() => navigate(item.route)}
                aria-current={route === item.route ? 'page' : undefined}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        ) : null}
      </div>
    </>
  );
}
