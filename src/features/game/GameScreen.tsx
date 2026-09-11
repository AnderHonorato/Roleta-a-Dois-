import { useEffect, useMemo, useRef } from 'react';
import { Icon } from '@/design-system/icons/Icons';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/StateViews';
import { formatClock, formatPoints } from '@/lib/format';
import { CATEGORIES, LEVELS } from '@/data/challenges';
import { getAudience } from '@/data/audiences';
import { getAchievement } from '@/data/achievements';
import { useStore } from '@/app/store';
import { useCountdown } from '@/hooks/useSessionTimer';
import { Die } from '../roulette/Die';
import { useGame } from './GameProvider';
import type { Route } from '@/app/router';

/**
 * Tela principal.
 *
 * Composicao editorial: faixa de status no topo, palco do dado
 * ocupando o centro da tela, resultado em painel sobreposto e
 * barra de acao fixa ao alcance do polegar. Nenhum grid de cards.
 */
export function GameScreen({ navigate }: { navigate: (route: Route) => void }) {
  const { state, currentUser, dispatch } = useStore();
  const game = useGame();
  const couple = state.couple;

  const audience = useMemo(() => getAudience(couple?.theme ?? 'neutral'), [couple?.theme]);
  const remaining = useCountdown(game.challengeEndsAt);
  const revealRef = useRef<HTMLElement>(null);

  const playerOne = state.users[0] ?? null;
  const playerTwo = state.users[1] ?? null;

  const preferences = couple?.preferences;
  const levelMeta = couple ? LEVELS[couple.maxLevel] : null;

  // O campo de fundo "carrega" enquanto o dado rola.
  useEffect(() => {
    const field = document.querySelector('.field');
    if (!field) return;
    field.classList.toggle('is-charged', game.phase !== 'idle');
  }, [game.phase]);

  // Ao revelar, traz o painel inteiro para a vista: no mobile os dois
  // botoes ficariam atras da barra de navegacao flutuante.
  useEffect(() => {
    if (game.phase !== 'revealed') return;
    revealRef.current?.scrollIntoView({
      behavior: game.reducedMotion ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [game.phase, game.reducedMotion]);

  if (!couple) return null;

  return (
    <div className="game">
      {/* --- faixa de status --- */}
      <div className="hud" role="group" aria-label="Situacao da partida">
        <div className="hud__cell">
          <span className="eyebrow">Pontos</span>
          <strong className="hud__value num">{formatPoints(game.sessionPoints)}</strong>
        </div>
        <div className="hud__cell">
          <span className="eyebrow">Sequencia</span>
          <strong className="hud__value num">
            {game.streak}
            {game.multiplier > 1 ? <em className="hud__mult">x{game.multiplier}</em> : null}
          </strong>
        </div>
        <div className="hud__cell">
          <span className="eyebrow">Sessao</span>
          <strong className="hud__value num">{formatClock(game.elapsedMs)}</strong>
        </div>
        <button
          type="button"
          className="hud__cell hud__cell--action"
          onClick={() => navigate('settings')}
        >
          <span className="eyebrow">Nivel</span>
          <strong className="hud__value hud__value--sm">{levelMeta?.label}</strong>
        </button>
      </div>

      {/* --- barra de progresso do multiplicador --- */}
      <div className="progress" aria-hidden="true">
        <span
          className="progress__fill"
          style={{
            width: game.nextMultiplier
              ? `${Math.min(100, ((game.streak % 10) / 10) * 100)}%`
              : '100%',
          }}
        />
      </div>
      <p className="progress__label faint">
        {game.nextMultiplier
          ? `Faltam ${game.nextMultiplier.missing} para o multiplicador x${game.nextMultiplier.multiplier}`
          : 'Multiplicador no maximo. Nao deixem cair.'}
      </p>

      {/* --- palco: nomes de um lado e do outro, dado ao centro --- */}
      <section className="stage" aria-label="Mesa de jogo">
        <div className="stage__player stage__player--left">
          <Avatar
            name={playerOne?.displayName ?? 'Pessoa 1'}
            src={playerOne?.avatar}
            active={currentUser?.id === playerOne?.id}
            size={48}
          />
          <span className="stage__name truncate">{playerOne?.displayName ?? 'Pessoa 1'}</span>
        </div>

        <Die
          face={game.face}
          rolling={game.phase === 'rolling'}
          reducedMotion={game.reducedMotion}
          disabled={game.phase === 'revealed'}
          inviting={game.phase === 'idle'}
          onRoll={game.roll}
          label={game.phase === 'idle' ? 'Rolar o dado' : 'Aguardando o resultado'}
        />

        <div className="stage__player stage__player--right">
          <Avatar
            name={playerTwo?.displayName ?? 'Pessoa 2'}
            src={playerTwo?.avatar}
            active={currentUser?.id === playerTwo?.id}
            size={48}
          />
          <span className="stage__name truncate">{playerTwo?.displayName ?? 'Pessoa 2'}</span>
        </div>
      </section>

      {/* --- microtexto dinamico --- */}
      <p className="ticker" aria-live="polite">
        {game.idleMessage ?? game.message}
      </p>

      {game.isIdle ? (
        <p className="idle-clock faint num" aria-live="off">
          Sem acao ha {formatClock(game.idleMs)}
        </p>
      ) : null}

      {/* --- resultado --- */}
      {game.phase === 'revealed' && game.current ? (
        <section
          className="reveal anim-rise"
          aria-live="polite"
          aria-label="Desafio sorteado"
          ref={revealRef}
        >
          <div className="reveal__meta">
            <span className="pill pill--accent">{LEVELS[game.current.level].label}</span>
            <span className="pill">{CATEGORIES[game.current.category]}</span>
            {game.current.durationSec > 0 && preferences?.timerEnabled ? (
              <span className="pill">
                <Icon name="timer" size={14} />
                <span className="num">{formatClock(remaining)}</span>
              </span>
            ) : null}
          </div>

          <h2 className="reveal__title display">{game.current.title}</h2>
          <p className="reveal__text">{game.current.description}</p>
          {game.current.hint ? (
            <p className="reveal__hint">
              <Icon name="shield" size={15} /> {game.current.hint}
            </p>
          ) : null}

          <div className="reveal__actions">
            <button type="button" className="btn btn--primary btn--lg grow" onClick={game.confirm}>
              Fizemos 🔥
            </button>
            <button type="button" className="btn btn--ghost btn--lg grow" onClick={game.skip}>
              Desistir e tentar outro
            </button>
          </div>
        </section>
      ) : null}

      {/* --- coluna lateral do desktop: ocupa o espaco do resultado
             enquanto ninguem sorteou nada (escondida no mobile) --- */}
      {game.phase !== 'revealed' ? (
        <aside className="sidecar" aria-label="Resumo da sessao">
          <p className="eyebrow">Nesta sessao</p>
          <dl className="sidecar__list">
            <div>
              <dt>Rodadas</dt>
              <dd className="num">{game.session?.rounds ?? 0}</dd>
            </div>
            <div>
              <dt>Confirmados</dt>
              <dd className="num">{game.session?.completed ?? 0}</dd>
            </div>
            <div>
              <dt>Trocas</dt>
              <dd className="num">{game.session?.skips ?? 0}</dd>
            </div>
            <div>
              <dt>Maior sequencia</dt>
              <dd className="num">{game.session?.maxStreak ?? 0}</dd>
            </div>
            <div>
              <dt>Nivel mais alto</dt>
              <dd>{game.session?.maxLevelReached ? LEVELS[game.session.maxLevelReached].label : '—'}</dd>
            </div>
            <div>
              <dt>Desafios no sorteio</dt>
              <dd className="num">{game.poolSize}</dd>
            </div>
          </dl>
          <p className="faint" style={{ fontSize: 'var(--fs-xs)' }}>
            O dado nunca sorteia acima de {levelMeta?.label}. Da para mudar em Configuracoes, a
            qualquer momento.
          </p>
        </aside>
      ) : null}

      {/* --- acao principal --- */}
      {game.phase !== 'revealed' ? (
        <div className="action-bar">
          <button
            type="button"
            className="btn btn--primary btn--lg grow"
            onClick={game.roll}
            disabled={game.phase === 'rolling' || game.poolSize === 0}
          >
            {game.phase === 'rolling' ? 'Rolando...' : game.session ? 'Sortear de novo' : 'Comecar'}
            <Icon name="die" size={20} />
          </button>

          <button
            type="button"
            className="icon-btn"
            aria-pressed={game.soundEnabled}
            aria-label={game.soundEnabled ? 'Desligar som' : 'Ligar som'}
            onClick={() => {
              game.playSound('tap');
              dispatch({
                type: 'patchPreferences',
                patch: { soundEnabled: !game.soundEnabled },
              });
            }}
          >
            <Icon name={game.soundEnabled ? 'sound-on' : 'sound-off'} />
          </button>

          <button
            type="button"
            className="icon-btn"
            aria-label="Configuracoes"
            onClick={() => navigate('settings')}
          >
            <Icon name="settings" />
          </button>
        </div>
      ) : null}

      {game.poolSize === 0 ? (
        <EmptyState
          icon="intensity"
          title="Sem desafios com esses filtros"
          description="Voces excluiram categorias demais ou o nivel esta muito restrito."
          action={
            <button type="button" className="btn btn--ghost" onClick={() => navigate('settings')}>
              Ajustar preferencias
            </button>
          }
        />
      ) : null}

      {/* --- assinatura do tema --- */}
      <p className="signature faint">{audience.signature}</p>

      {/* --- feedback de pontos --- */}
      {game.flash ? (
        <div className="flash anim-pop" role="status" key={game.flash.id}>
          <strong className="flash__amount num">+{game.flash.amount}</strong>
          {game.flash.multiplier > 1 ? (
            <span className="flash__mult">x{game.flash.multiplier}</span>
          ) : null}
          <ul className="flash__labels">
            {game.flash.labels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
          <button type="button" className="btn btn--quiet" onClick={game.dismissFlash}>
            Ok
          </button>
        </div>
      ) : null}

      {/* --- conquistas --- */}
      {game.newAchievements.length > 0 ? (
        <div className="achievement-toast anim-rise" role="status">
          <Icon name="trophy" size={20} />
          <div className="grow">
            <strong>
              {game.newAchievements.length > 1
                ? `${game.newAchievements.length} conquistas novas`
                : (getAchievement(game.newAchievements[0])?.title ?? 'Conquista nova')}
            </strong>
            <p className="faint" style={{ fontSize: 'var(--fs-xs)' }}>
              {game.newAchievements.length > 1
                ? 'Estao no perfil do casal.'
                : getAchievement(game.newAchievements[0])?.description}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={game.dismissAchievements}
            aria-label="Fechar aviso de conquista"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      ) : null}

      {/* --- encerrar sessao --- */}
      {game.session && game.phase !== 'revealed' ? (
        <button type="button" className="btn btn--quiet end-session" onClick={game.endSession}>
          Encerrar sessao e ver o resumo
        </button>
      ) : null}
    </div>
  );
}
