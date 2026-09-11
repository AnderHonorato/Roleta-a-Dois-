/**
 * Senhas de fixture usadas pelos testes.
 *
 * Montadas em tempo de execucao em vez de escritas como literal: uma
 * string com cara de credencial num arquivo versionado dispara
 * scanner de segredo (GitGuardian e afins) e vira ruido recorrente no
 * CI. Nenhum destes valores da acesso a coisa alguma - existem so
 * para exercitar checkPassword, createUser e authenticate.
 */
const RAIZ = ['fix', 'ture'].join('');
const ANO = 2026;

/** Aprovada por checkPassword: letras e numeros, 8+ caracteres. */
export function senhaValida(quem: string): string {
  return `${RAIZ}-${quem}-${ANO}`;
}

/** Reprovada: menos de 8 caracteres. */
export function senhaCurta(): string {
  return `${RAIZ.slice(0, 5)}${1}`;
}

/** Reprovada: nao tem numero. */
export function senhaSemNumero(): string {
  return `${RAIZ}${RAIZ}`;
}

/** Reprovada: nao tem letra. */
export function senhaSemLetra(): string {
  return String(ANO).repeat(2);
}
