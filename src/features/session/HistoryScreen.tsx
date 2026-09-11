import { useMemo } from 'react';
import { EmptyState } from '@/components/StateViews';
import { LEVELS, findChallenge } from '@/data/challenges';
import { useStore } from '@/app/store';
import { formatDate, formatDuration, formatPoints } from '@/lib/format';
import { Flourish } from '@/design-system/svg/Wordmark';

/**
 * Historico do casal: resumo de cada sessao encerrada e as
 * rodadas que compuseram a ultima delas.
 */
export function HistoryScreen() {
  const { state } = useStore();

  const sessions = useMemo(
    () => [...state.sessions].sort((a, b) => b.startedAt - a.startedAt),
    [state.sessions],
  );

  const lastSession = sessions[0] ?? null;
  const lastRounds = useMemo(
    () =>
      lastSession
        ? state.rounds.filter((round) => round.sessionId === lastSession.id).reverse()
        : [],
    [state.rounds, lastSession],
  );

  if (sessions.length === 0) {
    return (
      <div className="screen">
        <EmptyState
          icon="history"
          title="Nenhuma sessao ainda"
          description="Assim que voces rolarem o primeiro dado, o historico aparece aqui."
        />
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="section">
        <p className="eyebrow">Historico</p>
        <h1 className="display screen__title">O que ja rolou</h1>
      </header>

      <ul className="sessions">
        {sessions.map((session) => {
          const duration = (session.endedAt ?? Date.now()) - session.startedAt;
          return (
            <li key={session.id} className="sessions__row">
              <div className="sessions__when">
                <strong className="num">{formatDate(session.startedAt)}</strong>
                <span className="faint num">{formatDuration(duration)}</span>
              </div>
              <div className="sessions__stats">
                <span className="pill pill--accent num">{formatPoints(session.points)} pts</span>
                <span className="pill num">{session.completed} feitos</span>
                <span className="pill num">{session.skips} trocas</span>
                <span className="pill num">seq. {session.maxStreak}</span>
                {session.maxLevelReached ? (
                  <span className="pill">{LEVELS[session.maxLevelReached].label}</span>
                ) : null}
              </div>
              {session.endedAt === null ? <span className="pill pill--solid">Em andamento</span> : null}
            </li>
          );
        })}
      </ul>

      {lastRounds.length > 0 ? (
        <>
          <Flourish />
          <section className="section" aria-labelledby="history-rounds">
            <h2 id="history-rounds" className="section__title display">
              Rodadas da ultima sessao
            </h2>
            <ul className="timeline">
              {lastRounds.map((round) => {
                const challenge = findChallenge(round.challengeId);
                return (
                  <li key={round.id} className="timeline__row">
                    <span
                      className={`timeline__dot${round.result === 'done' ? ' is-done' : ''}`}
                      aria-hidden="true"
                    />
                    <div className="grow">
                      <strong className="timeline__label">
                        {challenge?.title ?? 'Desafio removido do catalogo'}
                      </strong>
                      <span className="faint">
                        {' '}
                        — {round.result === 'done' ? `+${round.points} pontos` : 'trocado'}
                      </span>
                    </div>
                    <span className="faint num">{LEVELS[round.level].label}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
