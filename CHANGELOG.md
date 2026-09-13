# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [1.2.0] — 2026-09-11

### Adicionado
- **Porta 18+ com data de nascimento**: o checkbox virou campo de data com cálculo real de idade, recusando futuro, data inexistente (31/02), ano implausível e menor de idade. A data NÃO é persistida — só a confirmação (11 testes cobrem a regra).
- **Ilustrações de execução** (`PoseArt`): silhuetas desenhadas em SVG, com os corpos do perfil do casal (incluindo casal gay) e a composição escolhida pela categoria do desafio. Sem arquivo de imagem: herdam a paleta do tema.
- **Atmosfera permanente** (`Ambience`): véus de luz que respiram e brasas subindo, sempre na tela, atrás de tudo e sem interceptar toque.
- **Trilha sonora** sintetizada por Web Audio: baixo pulsante a 68 BPM, pad de duas vozes e ar no contratempo. Entra no primeiro arremesso e sai por fade quando a sessão encerra.
- **Peça por tema**: no tema gay o dado vira uma brasa (pedra escura, veios incandescentes pulsando, pips de fogo). Couro e brasa no hetero, acetinado no lésbico, cristal no bi, holográfico no queer.
- 19 desafios novos (94 no total), incluindo a categoria `provocacao`.

### Alterado
- **Hardcore reescrito**: 22 itens (era 15), com linguagem direta e cenas longas. Todo item com risco físico agora traz orientação de segurança específica, não genérica.
- **Física do arremesso**: duração sorteada entre 2,5s e 3,4s (era fixa em 1,7s), com altura, deriva lateral e rodopio próprios a cada lance. Os quiques decaem em amplitude e se aproximam no fim, e o giro tem cauda longa depois do impacto.
- **Paleta sonora** trocada de bipes para sons com corpo: batimento cardíaco grave na revelação, ar, pele e tecido.

### Corrigido
- A ilustração não aparecia: `url(#id)` dentro de custom property não resolve de forma confiável — as figuras passaram a usar cor sólida dos tokens.
- A ilustração ficava fora de vista: `height:auto` com `max-height` faz o SVG assumir a altura intrínseca e apenas cortar a caixa. Agora a altura é explícita.

### Notas
- As poses deitadas foram retiradas: a `Figura` é construída na vertical e elas saíam flutuando fora do chão. Ficaram as quatro composições em pé, que o sistema desenha bem.

## [1.1.0] — 2026-09-11

### Adicionado
- **Persistência em IndexedDB** no modo demo (`IndexedDBAdapter`), com o `LocalStorageAdapter` como plano B e migração automática de quem já tinha dados salvos.
- 13 testes novos cobrindo gravação, leitura, `clear`, migração, proteção contra sobrescrever estado real e queda para o plano B (76 no total).

### Corrigido
- O banner deixa de esbarrar na cota de ~5MB do `localStorage`. Medido com imagens de ruído incompressível de 1280px (pior caso): o `localStorage` já recusava 6 imagens (8,3MB), enquanto o IndexedDB aceitou 40 (55,2MB).
- Gravar o estado não paga mais um `JSON.stringify` do objeto inteiro na thread principal a cada alteração.

### Notas
- A cota do navegador continua existindo e depende do espaço livre do aparelho. Quando estoura, `StorageQuotaError` chega à tela em vez de o progresso sumir em silêncio — esse caso não é engolido por fallback.
- O `open()` do IndexedDB tem timeout de 4s. Sem ele, um `onblocked` que nunca resolve deixaria o app preso na tela de carregando.

## [1.0.0] — 2026-09-11

Primeira versão funcional. O repositório continha apenas um README de uma linha; tudo abaixo foi construído do zero.

### Adicionado

**Fluxo de entrada**
- Porta 18+ com confirmação de maioridade e de consentimento (as duas obrigatórias).
- Onboarding em 4 telas: porta, perfil do casal, limite de intensidade, entrada.
- Nível Hardcore bloqueado até confirmação explícita dos dois.
- Modo convidado sem cadastro e sem servidor.
- Tela de abertura curta, com teto de 1,4s para não atrasar o acesso.

**Jogo**
- Dado de seis faces em 2.5D com CSS 3D transforms — sobe, gira, desacelera, cai e quica.
- Sorteio com memória dos 8 últimos desafios.
- 75 desafios em 4 níveis (Leve, Quente, Intenso, Hardcore) e 7 categorias.
- "Fizemos 🔥" e "Desistir e tentar outro", habilitados só após a revelação.
- Pontuação com multiplicador de sequência (x1 / x1,5 / x2 / x3), bônus de tempo e desconto por repetição.
- Troca de desafio custa 5 pontos e não quebra a sequência.
- Cronômetro por desafio e cronômetro de sessão.
- Detector de inatividade com contador visível, que pausa quando a aba perde o foco.
- Banco de microtextos por evento, com variações por perfil de casal.
- 12 conquistas, resumo de sessão e histórico de rodadas.

**Casal e perfis**
- Duas contas com e-mail e senha individuais, vinculadas a um perfil de casal.
- Login, logout, troca de conta, troca de senha, redefinição com confirmação da outra pessoa.
- Desvincular parceiro e apagar tudo do dispositivo.
- Avatar, nome, @usuário, apelido e bio por pessoa; nome, descrição, data e banner por casal.
- Registro de atividade do casal.

**Banner**
- Carrossel próprio com upload múltiplo, reordenação, ativar/desativar e remoção.
- Troca automática a cada 30 segundos, ajustável de 5s a 120s.
- Swipe no mobile, setas no desktop, indicadores, lazy loading.

**Sistema visual**
- Biblioteca de tokens: cor, tipografia, espaçamento, raio, sombra, blur, duração e easing.
- 6 temas que mudam paleta, fundo, textura, glow, forma e vocabulário.
- 28 ícones autorais em SVG.
- Composição editorial sem grid de cards; mobile-first com composição própria de desktop.

**Infraestrutura**
- Camada de persistência abstrata (`StorageAdapter`) com implementação local e de API.
- Autenticação com PBKDF2-SHA256 (150k iterações, salt por usuário).
- Validação de upload por MIME, extensão, tamanho e decodificação real.
- Saneamento de toda entrada livre antes de persistir.
- Estados de carregando, vazio, erro, offline, salvando, salvo e falha.
- 63 testes automatizados (Vitest).
- README completo, documentação de arquitetura e política de privacidade.

### Segurança
- Nenhuma senha em texto puro, nem nos dados de exemplo.
- Comparação de hash em tempo constante; login com mensagem genérica.
- Zero dependências de runtime além de React e React DOM.
- `.env` fora do versionamento, com `.env.example` documentado.

### Acessibilidade
- Contraste AA em todos os 6 temas, inclusive texto terciário.
- Navegação por teclado, skip-link e foco visível.
- Alvos de toque de no mínimo 44px.
- `prefers-reduced-motion` respeitado, com override manual.
