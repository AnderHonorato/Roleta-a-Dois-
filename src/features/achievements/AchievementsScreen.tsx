import { useMemo } from 'react';
import { Icon } from '@/design-system/icons/Icons';
import { ACHIEVEMENTS } from '@/data/achievements';
import { useStore } from '@/app/store';
import { formatDate } from '@/lib/format';

/**
 * Conquistas em lista editorial (nao em grid de cards): cada linha
 * e uma faixa com estado ligado/desligado e a data em que caiu.
 */
export function AchievementsScreen() {
  const { state } = useStore();

  const unlocked = useMemo(
    () => new Map(state.unlocked.map((item) => [item.slug, item.unlockedAt])),
    [state.unlocked],
  );

  const progress = Math.round((unlocked.size / ACHIEVEMENTS.length) * 100);

  return (
    <div className="screen">
      <header className="section">
        <p className="eyebrow">Progresso</p>
        <h1 className="display screen__title">
          {unlocked.size} de {ACHIEVEMENTS.length}
        </h1>
        <div className="progress" aria-hidden="true">
          <span className="progress__fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="lede">
          Nada disso vale premio nenhum. E so um jeito de lembrar do que voces ja aprontaram.
        </p>
      </header>

      <ul className="achievements">
        {[...ACHIEVEMENTS]
          .sort((a, b) => a.order - b.order)
          .map((achievement) => {
            const at = unlocked.get(achievement.slug);
            const isOn = at !== undefined;
            return (
              <li key={achievement.slug} className={`achievement${isOn ? ' is-on' : ''}`}>
                <span className="achievement__glyph" aria-hidden="true">
                  <Icon name={isOn ? 'trophy' : 'shield'} size={18} />
                </span>
                <div className="grow">
                  <strong className="achievement__title">{achievement.title}</strong>
                  <p className="faint" style={{ fontSize: 'var(--fs-sm)' }}>
                    {achievement.description}
                  </p>
                </div>
                <span className="achievement__state faint num">
                  {isOn ? formatDate(at) : 'Bloqueada'}
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
