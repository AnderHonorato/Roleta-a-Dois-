import { APP_NAME, MODO_DEMO_LOCAL } from '@/services/config';
import { Flourish } from '@/design-system/svg/Wordmark';

/** Politica de privacidade em linguagem direta. */
export function PrivacyScreen() {
  return (
    <div className="screen">
      <header className="section">
        <p className="eyebrow">Privacidade</p>
        <h1 className="display screen__title">O que fazemos com os dados de voces</h1>
        <p className="lede">
          Resumo honesto: quase nada. {APP_NAME} e conteudo intimo, entao o projeto foi desenhado
          para guardar o minimo possivel.
        </p>
      </header>

      <Flourish />

      <section className="section prose">
        <h2 className="section__title display">O que NAO coletamos</h2>
        <ul className="bullets">
          <li>Camera, microfone ou qualquer sensor do aparelho.</li>
          <li>Localizacao, IP para perfilamento ou identificadores de publicidade.</li>
          <li>Analytics, pixels de rastreio ou scripts de terceiros.</li>
          <li>O conteudo dos desafios associado a voces fora do seu proprio historico.</li>
        </ul>

        <h2 className="section__title display">O que guardamos</h2>
        <ul className="bullets">
          <li>Nome de exibicao, usuario, e-mail e um hash da senha (nunca a senha em si).</li>
          <li>Preferencias do casal: tema, nivel maximo, som, categorias excluidas.</li>
          <li>Pontuacao, sequencias, sessoes e quais desafios foram feitos ou trocados.</li>
          <li>As imagens que voces mesmos subirem para o banner.</li>
        </ul>

        <h2 className="section__title display">Onde isso fica</h2>
        {MODO_DEMO_LOCAL ? (
          <p>
            Neste modo (demo local), tudo fica no armazenamento do proprio navegador. Nada e enviado
            para servidor nenhum — nao existe servidor. Limpar os dados do site apaga tudo, sem
            backup e sem recuperacao.
          </p>
        ) : (
          <p>
            Os dados ficam na conta do casal, no servidor configurado pelo administrador desta
            instalacao. A sessao usa cookie HttpOnly e a senha e derivada com algoritmo proprio para
            senhas no backend.
          </p>
        )}

        <h2 className="section__title display">Apagar</h2>
        <p>
          Em Configuracoes, &ldquo;Apagar tudo deste dispositivo&rdquo; remove contas, perfil,
          imagens, pontuacao e historico. E imediato e definitivo.
        </p>

        <h2 className="section__title display">Consentimento</h2>
        <p>
          O produto assume dois adultos que consentem. Nao existe conteudo envolvendo menores,
          violencia real, coercao ou qualquer pessoa incapaz de consentir. Qualquer pessoa pode
          parar a qualquer momento, sem precisar justificar.
        </p>
      </section>
    </div>
  );
}
