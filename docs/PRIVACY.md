# Política de Privacidade — Roleta a Dois

**Última atualização:** setembro de 2026

Este produto trata de intimidade adulta. Por isso foi desenhado para guardar o mínimo possível.

---

## O que NÃO coletamos

- **Câmera e microfone.** Nunca são solicitados nem acessados, para nenhuma finalidade — inclusive o detector de inatividade, que usa apenas cliques e toques na página.
- **Localização.** Nenhuma API de geolocalização é chamada.
- **Analytics e rastreio.** Não há Google Analytics, pixels, tags de marketing ou SDK de terceiros.
- **Conteúdo íntimo.** O app não pede nem armazena descrições, fotos ou relatos além do que vocês mesmos escreverem nos campos de perfil e nas imagens que subirem para o banner.
- **Identificadores de publicidade.**

O app não faz nenhuma requisição a domínio externo além do carregamento da fonte tipográfica (Google Fonts) — e funciona corretamente se essa requisição falhar.

---

## O que guardamos

| Dado | Para quê |
|---|---|
| Nome de exibição, @usuário, e-mail | Identificar cada pessoa do casal |
| Hash e salt da senha | Autenticar sem nunca guardar a senha |
| Apelido, bio, avatar | Personalização do perfil |
| Nome, descrição e data do casal | Perfil compartilhado |
| Tema, nível máximo, categorias excluídas, som, volume, movimento | Preferências |
| Pontuação, sequências, sessões, rodadas feitas e trocadas | Placar e histórico |
| Conquistas desbloqueadas | Progressão |
| Imagens do banner | Exibição no perfil do casal |
| Registro de atividade (últimas 120 entradas) | Histórico visível ao próprio casal |

**Senhas nunca são armazenadas em texto puro**, em nenhum modo de operação. São derivadas com PBKDF2-SHA256 (150.000 iterações, salt aleatório por usuário).

---

## Onde os dados ficam

**Modo demo local** (`VITE_MODO_DEMO_LOCAL=true`, padrão): tudo fica no `localStorage` do próprio navegador. Não existe servidor, não existe banco, nada é transmitido. Limpar os dados do site apaga tudo — sem backup e sem recuperação.

**Modo produção** (`VITE_MODO_DEMO_LOCAL=false`): os dados ficam na conta do casal, no servidor configurado por quem instalou o produto. A sessão usa cookie `HttpOnly` e o hashing de senha acontece no backend.

---

## Compartilhamento

Nenhum. Os dados não são vendidos, cedidos, cruzados ou enviados a terceiros. Não há ranking público, comparação entre casais ou qualquer recurso social.

---

## Apagar

Em **Configurações → Apagar tudo deste dispositivo**. Remove contas, perfil do casal, imagens, pontuação, conquistas e histórico. É imediato e definitivo.

Também é possível **desvincular parceiro**, que remove a conta da outra pessoa do perfil do casal preservando o histórico compartilhado.

---

## Consentimento e conteúdo

O produto assume dois adultos que consentem.

- É exigida confirmação de maioridade antes de qualquer acesso.
- É exigida confirmação de entendimento sobre consentimento e palavra de parada.
- O nível Hardcore exige uma confirmação adicional e explícita dos dois.
- Qualquer pessoa pode parar a qualquer momento, sem precisar justificar.

O catálogo não contém, e não deve receber, conteúdo envolvendo menores de idade, violência real, coerção, pessoas incapazes de consentir ou qualquer prática ilegal.

---

## Cookies

O modo demo não usa cookies. Em produção, é usado um único cookie de sessão, `HttpOnly` e `SameSite=Lax`, estritamente necessário para manter o login — sem finalidade de rastreio.

---

## Contato

Dúvidas ou pedidos relativos a dados: abra uma issue em
<https://github.com/AnderHonorato/Roleta-a-Dois-/issues>.

Não inclua informações íntimas ou dados pessoais na issue — ela é pública.
