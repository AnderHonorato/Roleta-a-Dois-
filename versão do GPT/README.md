# Roleta a Dois — versão do GPT

Implementação independente criada dentro da pasta `versão do GPT/` para não misturar arquivos com outras versões do projeto.

## O que esta versão entrega

- Interface **mobile first**, adaptada para desktop.
- Visual adulto, editorial, quente e sem grade de cards.
- Temas: gay, lésbico, hétero, bi, queer e livre.
- Confirmação 18+ e lembrete de consentimento.
- Níveis Leve, Quente, Intenso e Hardcore.
- Dado visual com profundidade 2.5D em CSS, sem WebGL ou engine 3D.
- Animação de salto, giro, queda e quique do dado entre duas palavras do resultado.
- Resultados e desafios divididos por nível.
- Botões `Fizemos 🔥` e `Desistir e tentar outro`.
- Pontuação, multiplicador de sequência, contador da sessão e tempo sem ação.
- Mensagens dinâmicas para sorteio, confirmação, troca e inatividade.
- Histórico local de rodadas.
- Conquistas.
- Perfil local de duas pessoas vinculado ao casal.
- Estrutura visual pronta para duas contas independentes, sem guardar senha no protótipo local.
- Carrossel de banners com troca automática a cada 30 segundos.
- Upload local de até quatro banners de teste.
- Sons sintéticos opcionais gerados no navegador.
- Persistência local via `localStorage`.
- Respeito a `prefers-reduced-motion`.

## Estrutura

```text
versão do GPT/
├── index.html
├── styles.css
├── data.js
├── app.js
├── favicon.svg
├── manifest.webmanifest
└── README.md
```

## Como testar sem servidor

Abra diretamente:

```text
versão do GPT/index.html
```

A versão usa JavaScript tradicional, sem módulos e sem dependências externas, portanto o fluxo principal funciona abrindo o arquivo localmente no navegador.

> Alguns recursos de PWA/manifest ficam limitados quando a página é aberta com `file://`. Isso não afeta o jogo.

## Modo demo local

O modo atual é propositalmente local e não exige:

- Node.js;
- npm;
- banco de dados;
- API;
- login real;
- servidor.

Dados persistidos no navegador:

- tipo de casal/tema;
- nível máximo;
- nomes;
- pontos;
- sequência;
- histórico;
- conquistas;
- preferência de som;
- banners locais (limitados para evitar estourar o armazenamento do navegador).

## Autenticação futura

A tela de perfil demonstra a estrutura de duas pessoas dentro do mesmo casal, mas **não armazena senha** no modo local.

Para produção, implementar autenticação real com:

- usuários separados;
- e-mails únicos;
- hash seguro de senha (Argon2id ou bcrypt com configuração atualizada);
- sessão HTTP segura;
- recuperação de senha;
- confirmação de e-mail;
- tabela de relacionamento `CoupleMember` entre usuário e casal;
- rate limiting;
- proteção contra abuso.

### Modelo sugerido

```text
User
- id
- email
- username
- passwordHash
- displayName
- avatarUrl

Couple
- id
- name
- theme
- maxLevel
- bannerSettings

CoupleMember
- coupleId
- userId
- role

GameSession
- id
- coupleId
- startedAt
- endedAt
- points
- rounds
- skips
- maxStreak

GameRound
- id
- sessionId
- challengeId
- result
- points
- completedAt
```

## Conteúdo

Os desafios e mensagens ficam em `data.js`, separados da interface. Para adicionar um desafio:

```js
{
  level: 'quente',
  left: 'PALAVRA 1',
  right: 'PALAVRA 2',
  title: 'Nome da rodada',
  desc: 'Descrição curta e consensual.',
  tags: ['posição']
}
```

Níveis aceitos:

- `leve`
- `quente`
- `intenso`
- `hardcore`

## Temas

O tema é aplicado no atributo `data-theme` do `<body>` e altera os tokens CSS.

Exemplo:

```css
body[data-theme="gay"] {
  --accent: #8fd7ff;
  --accent-2: #8f62ff;
  --hot: #ff5b9d;
}
```

A arquitetura permite criar novas identidades sem duplicar toda a folha de estilos.

## Banners

Existem três banners gráficos padrão em CSS. No perfil do casal é possível adicionar imagens locais para teste.

Regras atuais:

- até 4 imagens locais;
- até ~1,5 MB por imagem;
- troca automática a cada 30 segundos;
- navegação pelos indicadores;
- imagens armazenadas como Data URL no `localStorage` apenas no protótipo.

Para produção, usar storage real (S3, Supabase Storage, Cloudflare R2 ou equivalente) e salvar somente URLs no banco.

## Privacidade

O protótipo não usa:

- localização;
- câmera;
- microfone;
- analytics externo;
- cookies de terceiros.

Não existe necessidade de registrar detalhes íntimos das ações. Em produção, mantenha coleta de dados mínima.

## Segurança para produção

Antes de publicar com contas reais:

1. mover autenticação para backend;
2. nunca salvar senha em `localStorage`;
3. validar e sanitizar entradas no servidor;
4. validar tipo e tamanho de uploads;
5. aplicar CSP;
6. usar HTTPS;
7. proteger sessão e cookies;
8. adicionar rate limiting;
9. criar política de privacidade e termos 18+;
10. revisar o conteúdo de desafios e consentimento.

## Acessibilidade

Incluído:

- foco semântico básico;
- labels;
- `aria-live` para a área do jogo;
- botões com nomes acessíveis;
- controles com tamanho adequado para toque;
- suporte a `prefers-reduced-motion`;
- contraste alto nos estados principais.

## Performance

Não há frameworks ou bibliotecas externas. A interface usa:

- HTML;
- CSS;
- JavaScript puro;
- SVG inline;
- Web Audio apenas para bipes opcionais.

Isso mantém o protótipo leve e reduz dependências.

## Evolução recomendada

- backend e autenticação real;
- sincronização entre os dois usuários;
- painel administrativo para desafios;
- upload de avatar e banner em storage;
- filtros de conteúdo por preferências;
- sessões compartilhadas em tempo real;
- ranking privado do próprio casal;
- exportação/limpeza de dados;
- testes automatizados E2E;
- deploy separado para esta versão.

## Importante

Todo o conteúdo desta versão foi criado de forma independente dentro de `versão do GPT/`. Não depende de arquivos fora dessa pasta e não altera a implementação de outras versões do repositório.
