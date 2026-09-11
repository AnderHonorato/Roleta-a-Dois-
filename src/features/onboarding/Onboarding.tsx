import { useState } from 'react';
import type { Audience, Level } from '@/types';
import { AUDIENCES } from '@/data/audiences';
import { LEVELS, LEVEL_ORDER } from '@/data/challenges';
import { Icon } from '@/design-system/icons/Icons';
import { useStore } from '@/app/store';
import { buildDemoState } from '@/services/demoSeed';
import { MODO_DEMO_LOCAL, APP_NAME } from '@/services/config';
import { Wordmark } from '@/design-system/svg/Wordmark';
import { AuthPanel } from '@/features/auth/AuthPanel';

/**
 * Onboarding em 4 passos curtos:
 * 1. porta 18+ (maioridade + consentimento, os dois obrigatorios)
 * 2. perfil do casal (define tema e vocabulario)
 * 3. limite de intensidade (hardcore exige um sim extra)
 * 4. entrada: convidado (demo) ou contas vinculadas
 */
type Step = 'gate' | 'audience' | 'level' | 'entry';

export function Onboarding() {
  const { state, dispatch, logActivity } = useStore();
  const [step, setStep] = useState<Step>(state.ageConfirmed ? 'audience' : 'gate');
  const [isAdult, setIsAdult] = useState(state.ageConfirmed);
  const [consent, setConsent] = useState(state.ageConfirmed);
  const [audience, setAudience] = useState<Audience>(state.couple?.theme ?? 'neutral');
  const [level, setLevel] = useState<Level>(state.couple?.maxLevel ?? 'quente');
  const [hardcoreOk, setHardcoreOk] = useState(state.hardcoreConsent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // O tema ja reage a escolha antes mesmo de confirmar.
  const previewTheme = (next: Audience) => {
    setAudience(next);
    document.documentElement.dataset.theme = next;
  };

  const gateReady = isAdult && consent;
  const levelReady = level !== 'hardcore' || hardcoreOk;

  async function enterDemo() {
    setBusy(true);
    setError(null);
    try {
      const demo = await buildDemoState(audience);
      dispatch({
        type: 'hydrate',
        state: {
          ...demo,
          couple: demo.couple ? { ...demo.couple, theme: audience, maxLevel: level } : null,
          ageConfirmed: true,
          hardcoreConsent: hardcoreOk,
          onboardingDone: true,
        },
      });
      logActivity('profile', 'Entraram em modo convidado');
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="onb">
      <header className="onb__head">
        <Wordmark />
        <span className="eyebrow">
          {step === 'gate' ? 'Antes de comecar' : `Passo ${stepNumber(step)} de 4`}
        </span>
      </header>

      {step === 'gate' ? (
        <section className="onb__step anim-rise" aria-labelledby="onb-gate">
          <p className="eyebrow">Conteudo adulto</p>
          <h1 id="onb-gate" className="display onb__title">
            Isto aqui e para <em>dois</em> adultos que <em>querem</em>.
          </h1>
          <p className="lede">
            {APP_NAME} sorteia desafios e posicoes para casais. Tem linguagem explicita e conteudo
            sexual. Nada aqui substitui conversa: o que voces nao quiserem, voces nao fazem.
          </p>

          <div className="onb__checks">
            <label className="check">
              <input
                type="checkbox"
                checked={isAdult}
                onChange={(event) => setIsAdult(event.target.checked)}
              />
              <span className="check__box">
                <Icon name="check" size={15} />
              </span>
              <span className="check__text">
                Tenho 18 anos ou mais e a outra pessoa tambem.
              </span>
            </label>

            <label className="check">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span className="check__box">
                <Icon name="check" size={15} />
              </span>
              <span className="check__text">
                Entendi que qualquer pessoa pode dizer nao, a qualquer momento, sem explicacao. Vamos
                combinar uma palavra de parada.
              </span>
            </label>
          </div>

          <button
            type="button"
            className="btn btn--primary btn--lg btn--block"
            disabled={!gateReady}
            onClick={() => {
              dispatch({ type: 'setFlag', key: 'ageConfirmed', value: true });
              setStep('audience');
            }}
          >
            Confirmar e continuar
            <Icon name="continue" size={18} />
          </button>

          <p className="help-text center">
            Se voce nao tem 18 anos, feche esta pagina.
          </p>
        </section>
      ) : null}

      {step === 'audience' ? (
        <section className="onb__step anim-rise" aria-labelledby="onb-aud">
          <h1 id="onb-aud" className="display onb__title">
            Quem esta jogando?
          </h1>
          <p className="lede">
            Isso muda as cores, as palavras e os desafios que aparecem. Da para trocar depois.
          </p>

          <ul className="choice-list">
            {AUDIENCES.map((profile) => (
              <li key={profile.id}>
                <button
                  type="button"
                  className={`choice${audience === profile.id ? ' is-selected' : ''}`}
                  onClick={() => previewTheme(profile.id)}
                  aria-pressed={audience === profile.id}
                >
                  <span className="choice__mark" aria-hidden="true" />
                  <span className="grow">
                    <span className="choice__label">{profile.label}</span>
                    <span className="choice__hint">{profile.tagline}</span>
                  </span>
                  {audience === profile.id ? <Icon name="check" size={18} /> : null}
                </button>
              </li>
            ))}
          </ul>

          <div className="onb__nav">
            <button type="button" className="btn btn--quiet" onClick={() => setStep('gate')}>
              <Icon name="back" size={18} /> Voltar
            </button>
            <button
              type="button"
              className="btn btn--primary grow"
              onClick={() => setStep('level')}
            >
              Continuar <Icon name="continue" size={18} />
            </button>
          </div>
        </section>
      ) : null}

      {step === 'level' ? (
        <section className="onb__step anim-rise" aria-labelledby="onb-lvl">
          <h1 id="onb-lvl" className="display onb__title">
            Ate onde voces vao hoje?
          </h1>
          <p className="lede">
            O dado nunca sorteia acima deste limite. Voces podem subir ou descer quando quiserem.
          </p>

          <ul className="choice-list">
            {LEVEL_ORDER.map((id, position) => {
              const meta = LEVELS[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={`choice choice--level${level === id ? ' is-selected' : ''}`}
                    onClick={() => setLevel(id)}
                    aria-pressed={level === id}
                  >
                    <span className="choice__meter" aria-hidden="true">
                      {[0, 1, 2, 3].map((bar) => (
                        <i key={bar} className={bar <= position ? 'is-on' : ''} />
                      ))}
                    </span>
                    <span className="grow">
                      <span className="choice__label">
                        {meta.label}
                        {meta.gated ? <span className="pill pill--accent">18+ reforcado</span> : null}
                      </span>
                      <span className="choice__hint">{meta.tagline}</span>
                    </span>
                    <span className="choice__points num">+{meta.basePoints}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {level === 'hardcore' ? (
            <label className="check anim-fade">
              <input
                type="checkbox"
                checked={hardcoreOk}
                onChange={(event) => setHardcoreOk(event.target.checked)}
              />
              <span className="check__box">
                <Icon name="check" size={15} />
              </span>
              <span className="check__text">
                Nos dois somos maiores de 18, consentimos com conteudo intenso e vamos combinar uma
                palavra de parada antes de comecar.
              </span>
            </label>
          ) : null}

          <div className="onb__nav">
            <button type="button" className="btn btn--quiet" onClick={() => setStep('audience')}>
              <Icon name="back" size={18} /> Voltar
            </button>
            <button
              type="button"
              className="btn btn--primary grow"
              disabled={!levelReady}
              onClick={() => {
                dispatch({ type: 'setFlag', key: 'hardcoreConsent', value: hardcoreOk });
                setStep('entry');
              }}
            >
              Continuar <Icon name="continue" size={18} />
            </button>
          </div>
        </section>
      ) : null}

      {step === 'entry' ? (
        <section className="onb__step anim-rise" aria-labelledby="onb-entry">
          <h1 id="onb-entry" className="display onb__title">
            Como voces querem entrar?
          </h1>
          <p className="lede">
            Como funciona: toca no dado, ele sorteia um desafio. Voces fazem e marcam
            &ldquo;Fizemos&rdquo;, ou trocam por outro. Pontos sobem, sequencia multiplica.
          </p>

          {MODO_DEMO_LOCAL ? (
            <div className="entry-option">
              <div className="row row--between">
                <div className="grow">
                  <h2 className="entry-option__title">Modo convidado</h2>
                  <p className="faint" style={{ fontSize: 'var(--fs-sm)' }}>
                    Sem cadastro e sem servidor. Tudo fica salvo so neste navegador.
                  </p>
                </div>
                <span className="pill pill--accent">Demo local</span>
              </div>
              <button
                type="button"
                className="btn btn--primary btn--lg btn--block"
                onClick={() => void enterDemo()}
                disabled={busy}
              >
                {busy ? 'Preparando...' : 'Jogar agora'}
                <Icon name="die" size={18} />
              </button>
            </div>
          ) : null}

          <div className="entry-divider">
            <span>ou criem o perfil de voces</span>
          </div>

          <AuthPanel
            audience={audience}
            level={level}
            onDone={() => dispatch({ type: 'setFlag', key: 'onboardingDone', value: true })}
          />

          {error ? <p className="error-text">{error}</p> : null}

          <button type="button" className="btn btn--quiet" onClick={() => setStep('level')}>
            <Icon name="back" size={18} /> Voltar
          </button>
        </section>
      ) : null}
    </div>
  );
}

function stepNumber(step: Step): number {
  return { gate: 1, audience: 2, level: 3, entry: 4 }[step];
}
