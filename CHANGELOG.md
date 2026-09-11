# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

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
