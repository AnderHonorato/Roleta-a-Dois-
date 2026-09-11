import { useRef, useState } from 'react';
import type { BannerImage } from '@/types';
import { Icon } from '@/design-system/icons/Icons';
import { Avatar } from '@/components/Avatar';
import { Carousel } from '@/features/carousel/Carousel';
import { EmptyState, LoadingState } from '@/components/StateViews';
import { useStore } from '@/app/store';
import { createId } from '@/lib/id';
import { cleanLine, cleanText } from '@/lib/sanitize';
import { readAndResizeImage, validateImageFile } from '@/lib/image';
import { formatDate, formatPoints } from '@/lib/format';
import { ACHIEVEMENTS } from '@/data/achievements';
import { Flourish } from '@/design-system/svg/Wordmark';

/**
 * Perfil do casal: banner/carrossel, identidade, numeros e
 * gerenciamento das imagens (upload, ordem, ativar, remover).
 */
export function CoupleScreen() {
  const { state, dispatch, logActivity } = useStore();
  const couple = state.couple;
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: couple?.name ?? '',
    description: couple?.description ?? '',
    since: couple?.since ?? '',
  });

  if (!couple) return null;

  const unlockedCount = state.unlocked.length;
  const sessionsPlayed = state.sessions.length;
  const roundsDone = state.rounds.filter((round) => round.result === 'done').length;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !couple) return;
    setUploading(true);
    setUploadError(null);
    const accepted: BannerImage[] = [];
    try {
      for (const file of Array.from(files)) {
        const check = validateImageFile(file);
        if (!check.ok) {
          setUploadError(check.reason ?? 'Arquivo recusado.');
          continue;
        }
        const src = await readAndResizeImage(file);
        accepted.push({
          id: createId('img'),
          src,
          alt: '',
          order: couple.gallery.length + accepted.length,
          enabled: true,
        });
      }
      if (accepted.length > 0) {
        dispatch({ type: 'patchCouple', patch: { gallery: [...couple.gallery, ...accepted] } });
        logActivity('profile', `${accepted.length} imagem(ns) no banner`);
      }
    } catch (error) {
      setUploadError((error as Error).message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function patchImage(id: string, patch: Partial<BannerImage>) {
    if (!couple) return;
    dispatch({
      type: 'patchCouple',
      patch: {
        gallery: couple.gallery.map((image) => (image.id === id ? { ...image, ...patch } : image)),
      },
    });
  }

  function move(id: string, direction: -1 | 1) {
    if (!couple) return;
    const sorted = [...couple.gallery].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((image) => image.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
    dispatch({
      type: 'patchCouple',
      patch: { gallery: sorted.map((image, position) => ({ ...image, order: position })) },
    });
  }

  function remove(id: string) {
    if (!couple) return;
    dispatch({
      type: 'patchCouple',
      patch: { gallery: couple.gallery.filter((image) => image.id !== id) },
    });
  }

  function saveIdentity() {
    dispatch({
      type: 'patchCouple',
      patch: {
        name: cleanLine(draft.name, 40) || 'Nosso perfil',
        description: cleanText(draft.description, 200),
        since: draft.since || null,
      },
    });
    setEditing(false);
    logActivity('profile', 'Perfil do casal atualizado');
  }

  return (
    <div className="screen">
      <Carousel
        images={couple.gallery}
        intervalMs={couple.preferences.bannerIntervalMs}
        autoplay={couple.preferences.autoplayBanner}
        overlay={
          <div className="banner__identity">
            <div className="banner__faces">
              {state.users.slice(0, 2).map((user) => (
                <Avatar key={user.id} name={user.displayName} src={user.avatar} size={40} />
              ))}
            </div>
            <h1 className="display banner__name">{couple.name}</h1>
            {couple.since ? (
              <p className="banner__since faint">Juntos desde {couple.since}</p>
            ) : null}
          </div>
        }
      />

      <section className="numbers" aria-label="Numeros do casal">
        <div className="numbers__item">
          <span className="eyebrow">Pontos totais</span>
          <strong className="num">{formatPoints(couple.totalPoints)}</strong>
        </div>
        <div className="numbers__item">
          <span className="eyebrow">Melhor sequencia</span>
          <strong className="num">{couple.bestStreak}</strong>
        </div>
        <div className="numbers__item">
          <span className="eyebrow">Sessoes</span>
          <strong className="num">{sessionsPlayed}</strong>
        </div>
        <div className="numbers__item">
          <span className="eyebrow">Desafios feitos</span>
          <strong className="num">{roundsDone}</strong>
        </div>
        <div className="numbers__item">
          <span className="eyebrow">Conquistas</span>
          <strong className="num">
            {unlockedCount}/{ACHIEVEMENTS.length}
          </strong>
        </div>
      </section>

      <Flourish />

      <section className="section" aria-labelledby="couple-identity">
        <div className="row row--between">
          <h2 id="couple-identity" className="section__title display">
            Identidade
          </h2>
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => {
              setDraft({
                name: couple.name,
                description: couple.description,
                since: couple.since ?? '',
              });
              setEditing((value) => !value);
            }}
          >
            <Icon name="edit" size={16} /> {editing ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {editing ? (
          <div className="stack stack-4">
            <div className="field-group">
              <label className="label" htmlFor="cpl-name">
                Nome do casal
              </label>
              <input
                id="cpl-name"
                className="input"
                value={draft.name}
                maxLength={40}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </div>
            <div className="field-group">
              <label className="label" htmlFor="cpl-desc">
                Descricao
              </label>
              <textarea
                id="cpl-desc"
                className="textarea"
                value={draft.description}
                maxLength={200}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
              <p className="help-text">{draft.description.length}/200</p>
            </div>
            <div className="field-group">
              <label className="label" htmlFor="cpl-since">
                Juntos desde (opcional)
              </label>
              <input
                id="cpl-since"
                type="month"
                className="input"
                value={draft.since}
                onChange={(event) => setDraft({ ...draft, since: event.target.value })}
              />
            </div>
            <button type="button" className="btn btn--primary" onClick={saveIdentity}>
              Salvar
            </button>
          </div>
        ) : (
          <p className="lede">
            {couple.description || 'Voces ainda nao escreveram nada aqui. Fica a criterio.'}
          </p>
        )}
      </section>

      <Flourish />

      <section className="section" aria-labelledby="couple-banner">
        <div className="row row--between">
          <h2 id="couple-banner" className="section__title display">
            Banner
          </h2>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
          >
            <Icon name="plus" size={16} /> {uploading ? 'Enviando...' : 'Adicionar'}
          </button>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          aria-label="Escolher imagens para o banner do casal"
          onChange={(event) => void handleFiles(event.target.files)}
        />

        {uploadError ? (
          <p className="error-text" role="alert">
            {uploadError}
          </p>
        ) : null}

        {uploading ? <LoadingState label="Processando as imagens" /> : null}

        {couple.gallery.length === 0 && !uploading ? (
          <EmptyState
            icon="image"
            title="Nenhuma imagem ainda"
            description="Adicionem quantas quiserem. As imagens ficam so neste dispositivo e trocam sozinhas a cada 30 segundos."
          />
        ) : (
          <ul className="image-list">
            {[...couple.gallery]
              .sort((a, b) => a.order - b.order)
              .map((image, index, list) => (
                <li key={image.id} className="image-list__row">
                  <img src={image.src} alt="" className="image-list__thumb" loading="lazy" />
                  <div className="grow stack stack-2">
                    <input
                      className="input"
                      value={image.alt}
                      placeholder="Descricao da imagem (acessibilidade)"
                      maxLength={120}
                      onChange={(event) => patchImage(image.id, { alt: cleanLine(event.target.value, 120) })}
                    />
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={image.enabled}
                        onChange={(event) => patchImage(image.id, { enabled: event.target.checked })}
                      />
                      <span className="check__box">
                        <Icon name="check" size={15} />
                      </span>
                      <span className="check__text">Mostrar no carrossel</span>
                    </label>
                  </div>
                  <div className="image-list__actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => move(image.id, -1)}
                      disabled={index === 0}
                      aria-label="Mover para cima"
                    >
                      <Icon name="chevron-left" size={16} style={{ transform: 'rotate(90deg)' }} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => move(image.id, 1)}
                      disabled={index === list.length - 1}
                      aria-label="Mover para baixo"
                    >
                      <Icon name="chevron-right" size={16} style={{ transform: 'rotate(90deg)' }} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => remove(image.id)}
                      aria-label="Remover imagem"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}

        <div className="field-group">
          <label className="label" htmlFor="banner-interval">
            Trocar a cada {Math.round(couple.preferences.bannerIntervalMs / 1000)} segundos
          </label>
          <input
            id="banner-interval"
            type="range"
            min={5}
            max={120}
            step={5}
            value={couple.preferences.bannerIntervalMs / 1000}
            onChange={(event) =>
              dispatch({
                type: 'patchPreferences',
                patch: { bannerIntervalMs: Number(event.target.value) * 1000 },
              })
            }
          />
        </div>
      </section>

      <Flourish />

      <section className="section" aria-labelledby="couple-activity">
        <h2 id="couple-activity" className="section__title display">
          Atividade recente
        </h2>
        {state.activity.length === 0 ? (
          <p className="faint">Nada registrado ainda.</p>
        ) : (
          <ul className="timeline">
            {state.activity.slice(0, 12).map((entry) => (
              <li key={entry.id} className="timeline__row">
                <span className="timeline__dot" aria-hidden="true" />
                <div className="grow">
                  <strong className="timeline__label">{entry.label}</strong>
                  {entry.detail ? <span className="faint"> — {entry.detail}</span> : null}
                </div>
                <time className="faint num" dateTime={new Date(entry.at).toISOString()}>
                  {formatDate(entry.at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
