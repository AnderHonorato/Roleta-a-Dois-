# Arquitetura — Roleta a Dois

Documento de referência técnica. O README cobre uso; aqui estão as decisões estruturais, o modelo de dados e o contrato do backend futuro.

---

## 1. Princípio central

**Nenhum componente conhece a origem dos dados.**

```
features/*  ──► useStore()  ──► app/store.tsx (reducer)
                                    │
                                    ▼
                          services/storage/index.ts
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
          IndexedDBAdapter                 ApiStorageAdapter
          (MODO_DEMO_LOCAL=true)         (MODO_DEMO_LOCAL=false)
                │
                └─ LocalStorageAdapter (plano B + migração)
```

A interface `StorageAdapter` (`services/storage/types.ts`) tem quatro métodos: `load`, `save`, `clear`, `health`. Qualquer implementação que os cumpra serve — foi assim que o IndexedDB entrou sem tocar em nenhuma tela, e é assim que um mock de teste entra (`setStorage()`).

Consequência prática: migrar para backend não toca em nenhuma tela.

---

## 2. Camadas

| Camada | Pasta | Regra |
|---|---|---|
| Domínio | `src/types/` | Só tipos. Sem lógica, sem import de React. |
| Dados | `src/data/` | Conteúdo estático (desafios, mensagens, conquistas, perfis). Puro. |
| Regras | `src/features/game/scoring.ts`, `achievements.ts` | Funções puras, testáveis isoladamente. |
| Serviços | `src/services/` | Persistência, autenticação, configuração. Não importam React. |
| Estado | `src/app/store.tsx`, `features/game/GameProvider.tsx` | Dois contextos: o persistido e o da partida em curso. |
| Apresentação | `src/features/*`, `src/components/` | Só React. Nenhuma regra de negócio. |
| Sistema visual | `src/design-system/`, `src/styles/` | Tokens, ícones, ornamentos. |

Utilitários (`src/lib/`) não importam nada do app — são funções isoladas (crypto, imagem, saneamento, sorteio, formatação).

---

## 3. Estado

### 3.1 Estado persistido (`app/store.tsx`)

Um único objeto `PersistedState`, manipulado por reducer. Grava com **debounce de 400ms** — digitar num campo não dispara uma gravação por tecla.

```ts
interface PersistedState {
  version: number;            // para migração
  users: User[];
  couple: Couple | null;
  members: CoupleMember[];
  sessions: GameSession[];
  rounds: GameRound[];
  unlocked: UnlockedAchievement[];
  activity: ActivityEntry[];  // limitado a 120 entradas
  currentUserId: string | null;
  onboardingDone: boolean;
  ageConfirmed: boolean;
  hardcoreConsent: boolean;
}
```

O store também expõe `saveStatus` (`idle`/`saving`/`saved`/`error`), `online` e `retrySave()` — é isso que alimenta os indicadores de estado da interface.

### 3.2 Estado da partida (`features/game/GameProvider.tsx`)

Efêmero, não persistido: fase (`idle`/`rolling`/`revealed`), desafio atual, face do dado, sequência, pontos da sessão, mensagem visível, flash de pontos, cronômetro do desafio.

Alguns valores ficam em `useRef` de propósito, porque não devem causar render: memória dos últimos sorteios, contagem de repetição por desafio, categorias já vistas, trava de clique duplo.

### 3.3 Migração de versão

`LocalStorageAdapter.load()` compara `version` com `STATE_VERSION`. Diferente → passa por `migrate()`. Estado corrompido (JSON inválido) é descartado e o app começa limpo, em vez de travar.

---

## 4. Modelo de dados

Definido em `src/types/index.ts`. Mapeia direto para tabelas relacionais.

### User
| Campo | Tipo | Observação |
|---|---|---|
| `id` | string | `usr_*` |
| `email` | string | único, minúsculo |
| `username` | string | único, `[a-z0-9._-]`, 3–24 |
| `passwordHash` | string | hex, 64 chars |
| `passwordSalt` | string | hex, 32 chars |
| `displayName` | string | ≤ 40 |
| `avatar` | string \| null | data URL (demo) ou URL |
| `bio` | string | ≤ 160 |
| `nickname` | string | ≤ 24 |
| `createdAt` / `updatedAt` | number | epoch ms |

### Couple
`id`, `name`, `description`, `banner`, `gallery: BannerImage[]`, `theme: Audience`, `maxLevel: Level`, `since`, `preferences: CouplePreferences`, `totalPoints`, `bestStreak`, `createdAt`, `updatedAt`.

### CoupleMember
`coupleId`, `userId`, `role: 'owner' | 'partner'`, `joinedAt`. Chave composta `(coupleId, userId)`.

### GameSession
`id`, `coupleId`, `startedAt`, `endedAt`, `points`, `rounds`, `completed`, `skips`, `maxStreak`, `maxLevelReached`.

### GameRound
`id`, `sessionId`, `challengeId`, `level`, `result: 'done' | 'skipped' | 'pending'`, `points`, `multiplier`, `startedAt`, `completedAt`.

### Challenge
`id`, `audience: Audience[]`, `level`, `category`, `title`, `description`, `hint?`, `durationSec`, `score`, `tags`, `active`.

`active: false` tira do sorteio sem apagar histórico — é o que permite o painel administrativo futuro desativar conteúdo sem quebrar `GameRound.challengeId`.

### Achievement
`id`, `slug`, `title`, `description`, `order`. O desbloqueio é registrado em `UnlockedAchievement { slug, unlockedAt }`.

---

## 5. Contrato do backend

O `ApiStorageAdapter` já implementa este contrato. Ele falha explicitamente enquanto não houver servidor — não finge sucesso.

| Método | Rota | Resposta |
|---|---|---|
| `GET` | `/api/state` | `PersistedState` · `401` quando não autenticado (o adapter devolve `null`) |
| `PUT` | `/api/state` | `204` |
| `DELETE` | `/api/state` | `204` |
| `GET` | `/api/health` | `200` |

Autenticação por cookie de sessão `HttpOnly` (`credentials: 'include'`). O servidor emite `X-CSRF-Token` no `GET`; o adapter o reenvia em toda escrita.

Rotas de autenticação a implementar, espelhando `src/services/auth/`:

| Rota | Substitui |
|---|---|
| `POST /api/auth/signup` | `createUser` + `createCouple` + `linkMember` |
| `POST /api/auth/login` | `authenticate` |
| `POST /api/auth/logout` | `dispatch setCurrentUser(null)` |
| `POST /api/auth/password` | `changePassword` |
| `POST /api/auth/reset` | `resetPasswordWithPartner` (vira token por e-mail) |
| `DELETE /api/account` | `removeUser` / `hardReset` |

No servidor, o hashing muda para **argon2id** (ou bcrypt) com pepper fora do banco. O cliente deixa de derivar qualquer coisa.

---

## 6. Motor do dado

`features/roulette/Die.tsx` + `die.css`.

**Estrutura em três camadas**, cada uma com uma responsabilidade de transform — misturá-las quebraria a animação:

```
.die-stage   perspective: 900px            ← câmera
  .die-lift  translateY (keyframes)        ← o voo: sobe, cai, quica
    .die-tilt rotateX(-14deg) rotateY(18deg) ← inclinação fixa da cena
      .die-cube rotateX(--rx) rotateY(--ry)  ← rotação até a face sorteada
        .die-face × 6                        ← translateZ(±half)
```

A camada `.die-tilt` existe porque, sem ela, trazer a face sorteada exatamente para a frente deixaria o dado chapado — um quadrado 2D. Com a inclinação, a face continua legível e o cubo mantém volume.

As faces usam `inset: -1px` (1px de sobreposição). Sem isso, o raio de canto abre um vão visível nas arestas quando a cena é inclinada.

**Rotação acumulativa.** Cada arremesso soma 2–3 voltas em X e 3–5 em Y ao valor anterior (`turns` em `useRef`). O dado nunca "desgira" — sempre avança, como um dado real.

**Desaceleração.** Uma `transition` com `cubic-bezier(0.14, 0.72, 0.18, 1)` sobre 1700ms. Sem `requestAnimationFrame` por frame: o navegador compõe na GPU.

**Movimento reduzido.** Com `prefers-reduced-motion`, a duração vai a zero, as animações são desligadas e a face simplesmente troca. A revelação do resultado acontece na hora, sem esperar os 1700ms.

---

## 7. Pontuação

`features/game/scoring.ts` — função pura.

```
total = max(1, round((base + bônusTempo − penalRepetição) × multiplicador))
```

| Componente | Regra |
|---|---|
| `base` | `challenge.score`, ou o base do nível se ausente |
| `multiplicador` | por sequência **incluindo esta rodada**: <3 → x1 · ≥3 → x1,5 · ≥6 → x2 · ≥10 → x3 |
| `bônusTempo` | +15% se cumpriu a duração sugerida; −10% se terminou em menos de 35% dela |
| `penalRepetição` | −25% por repetição do mesmo desafio na sessão, até −50% |
| troca | −5 pontos fixos, nunca deixando o placar negativo, **sem zerar a sequência** |

---

## 8. Temas

Cada tema é um bloco `[data-theme='...']` em `styles/themes.css` que redefine **apenas tokens de cor e de gesto**. Nenhum seletor de componente é duplicado por tema.

Tokens que um tema controla:

| Token | Efeito |
|---|---|
| `--bg-deep` / `--bg-raise` / `--bg-sunken` | os três planos de profundidade |
| `--ink` / `--ink-dim` / `--ink-faint` | hierarquia de texto (todos ≥ 4,5:1 sobre o fundo) |
| `--accent` / `--accent-2` / `--accent-3` | destaque, gradiente e contraponto |
| `--field` | o gradiente de fundo da tela inteira |
| `--grain-opacity` | intensidade da textura de grão |
| `--motif-skew` | inclinação dos ornamentos e divisórias |
| `--motif-radius` | raio de canto característico do tema |
| `--display-weight` | peso da tipografia de destaque |

É por isso que os temas não parecem "o mesmo app pintado": `--motif-skew` de 12° e raio de 6px (queer) produzem uma forma diferente de −2° e raio de 10px (hétero), com o mesmo CSS.

O tema é aplicado como atributo no `<html>` pelo `App.tsx`, lendo `couple.theme`. Durante o onboarding, a pré-visualização escreve direto no `dataset` para a troca ser instantânea.

---

## 9. Sistema de mensagens

`data/messages/index.ts`. Duas camadas:

1. **`base`** — 16 eventos com 3 a 6 variações cada, servindo qualquer casal.
2. **`byAudience`** — sobrescritas parciais por perfil. O que não for sobrescrito cai no banco comum.

`getMessage(evento, perfil, anterior)` concatena as duas camadas e sorteia evitando a mensagem anterior (`pickDifferent`), com no máximo 8 tentativas antes de aceitar repetição.

---

## 10. Inatividade

`hooks/useInactivity.ts`. Conta apenas tempo sem interação com a página: `pointerdown`, `keydown`, `wheel`, `touchstart`.

Duas regras importantes:

- **Nenhum sensor.** Câmera e microfone não são usados — nem para isso, nem para nada.
- **A aba oculta congela o contador.** Ao voltar, o relógio retoma de onde parou. Sair da tela não é "ficar parado" — e, neste produto, é provavelmente o oposto.

Em 90s aparece a primeira mensagem; em 180s, a versão mais direta.

---

## 11. Áudio

`hooks/useSound.ts`. Cinco efeitos gerados por osciladores Web Audio, descritos como receitas de voz (frequência, forma de onda, duração, ganho, sweep, delay).

- Zero arquivo de áudio no bundle, zero requisição.
- O `AudioContext` nasce no **primeiro gesto** do usuário — nada toca sozinho ao abrir.
- O ganho master começa em 0 e sobe com `setTargetAtTime`: não há estalo nem volume alto de surpresa.
- O contexto é fechado ao desmontar.

---

## 12. Preparação para o painel administrativo

O catálogo já tem a forma que um CRUD precisa:

| Operação | Como já é suportada |
|---|---|
| Adicionar | *append* em `data/challenges/<nivel>.ts` ou `INSERT` na tabela |
| Editar | mesma forma de objeto em arquivo ou linha |
| Desativar | `active: false` — sai do sorteio, preserva o histórico |
| Ordenar | `order` já existe em `BannerImage` e `Achievement`; desafios usam a ordem do array |
| Repontuar | `score` por item, independente do base do nível |
| Classificar por público | `audience: Audience[]` |
| Classificar por nível | `level: Level` |

`filterChallenges()` é o único ponto que decide o que entra no sorteio. Um painel administrativo troca a origem do array (`allChallenges` → resposta da API) sem mexer em mais nada.

---

## 12.1 Persistência no modo demo

`IndexedDBAdapter` (`services/storage/idbAdapter.ts`) é a implementação ativa quando `MODO_DEMO_LOCAL=true`. Ele recebe um `LocalStorageAdapter` no construtor e o usa como plano B — não o substitui.

**Por que IndexedDB.** As imagens do banner são data URLs. O `localStorage` tem cota de ~5MB e guarda apenas string, então cada gravação paga um `JSON.stringify` do estado inteiro na thread principal. O IndexedDB armazena o objeto direto e trabalha na casa das centenas de MB.

**Migração.** Na primeira abertura depois do upgrade, o IndexedDB está vazio e os dados do casal estão no `localStorage`. O `load()` importa, grava no IndexedDB e limpa a origem, para não ficarem duas cópias divergindo.

Duas perguntas separadas governam isso, e a distinção é deliberada:

| Função | Pergunta | Critério |
|---|---|---|
| `substituivel(state)` | o que está no IndexedDB pode ser trocado pelo legado? | sem conta **e** sem casal |
| `temConteudo(state)` | o legado vale a migração? | tem conta, casal, sessão **ou** qualquer flag de consentimento |

O critério de `temConteudo` é mais amplo de propósito: um casal que só passou pela porta 18+ ainda não tem conta, mas refazer aquilo é trabalho perdido. Já `substituivel` é restrito, para que um estado real nunca seja sobrescrito por sobra de sessão antiga.

**Quedas previstas.** Se o IndexedDB não existe, é bloqueado, ou o `open` nunca resolve (há um timeout de 4s para isso — sem ele o app ficaria preso na tela de carregando), o adaptador passa a usar o plano B e segue funcionando. A exceção é `StorageQuotaError`: cota estourada é erro do usuário e precisa chegar à tela, então não é engolida por fallback.

---

## 13. Limites conhecidos

- **Cota de armazenamento.** Resolvida em boa parte: a persistência do modo demo é IndexedDB desde a v1.1. Medição feita neste projeto, com imagens de ruído incompressível de 1280px (pior caso — fotos reais são bem menores):

  | Imagens | Tamanho | `localStorage` | IndexedDB |
  |---|---|---|---|
  | 6 | 8,3MB | cheio | ok |
  | 12 | 16,6MB | cheio | ok |
  | 24 | 33,1MB | cheio | ok |
  | 40 | 55,2MB | cheio | ok |

  A cota ainda existe e depende do espaço livre do aparelho; quando estoura, o erro chega à tela em vez de o progresso sumir em silêncio.
- **Sem sincronização entre dispositivos** no modo demo. Cada navegador tem o próprio estado.
- **Hash no cliente não é segurança de servidor.** Está documentado no próprio arquivo (`lib/crypto.ts`) e existe para que nada fique legível em disco, não para substituir o backend.
- **Verificação de navegador limitada.** A validação desta entrega rodou em Chromium. Safari, Firefox e aparelhos físicos não foram testados.
