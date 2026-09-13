# Contribuindo

## Antes de tudo

Este é um projeto de conteúdo adulto consensual. Contribuições que introduzam conteúdo envolvendo menores, violência real, coerção, pessoas incapazes de consentir ou qualquer prática ilegal serão recusadas sem discussão.

## Ambiente

```bash
npm install
cp .env.example .env
npm run dev
```

## Antes de abrir um PR

```bash
npm run typecheck   # precisa passar limpo
npm run test        # 63 testes, todos verdes
npm run build       # precisa buildar
```

## Convenções

**Commits** seguem o padrão `tipo: descrição no imperativo`.

```
feat: adiciona nivel de intensidade personalizado
fix: corrige contador de inatividade em aba oculta
docs: atualiza instrucoes de deploy
refactor: extrai calculo de multiplicador
test: cobre penalidade de repeticao
style: ajusta espacamento do painel de resultado
```

**Código.**

- TypeScript em modo strict. Nada de `any`.
- Componente não contém regra de negócio — ela vai para `features/*/[nome].ts` como função pura.
- Nada de `localStorage` ou `fetch` direto no componente: use `useStore()` ou o `StorageAdapter`.
- Comentário explica *por quê*, não *o quê*. Comentário que repete o código é ruído.
- Arquivo grande demais é sinal de responsabilidade misturada — separe.

**Estilo.**

- Cor, espaçamento, raio, sombra e duração vêm de tokens (`styles/tokens.css`). Valor cru no componente só com motivo.
- Evite o padrão de grid de cards. Prefira faixas, trilhos, painéis e divisórias.
- Emoji pode aparecer dentro de texto; nunca como ícone estrutural. Ícone novo entra em `design-system/icons/Icons.tsx`, na mesma grade 24×24 e traço 1,6.

**Acessibilidade** (não é opcional):

- Todo controle sem texto precisa de `aria-label`.
- Todo campo precisa de `<label>` associado.
- Alvo de toque com no mínimo 44px de altura.
- Contraste mínimo de 4,5:1 sobre o fundo do tema.
- Animação nova precisa respeitar `prefers-reduced-motion`.

## Adicionando conteúdo

Desafios novos entram por *append* em `src/data/challenges/<nivel>.ts`. O passo a passo e o formato do objeto estão no README, em "Adicionar desafios". Rode `npm run test` depois: a suíte verifica id duplicado, campos obrigatórios e cobertura por perfil.

Escreva assumindo adultos que consentem. Itens com risco físico precisam de `hint` com a orientação de segurança.

## Reportando problemas

Abra uma issue com passos para reproduzir, o que era esperado, o que aconteceu, navegador e tamanho de tela.

**Não coloque informações íntimas nem dados pessoais na issue** — ela é pública.
