/**
 * Verificacao de maioridade a partir da data de nascimento.
 *
 * A data em si NAO e persistida: o app guarda apenas a confirmacao de
 * que a checagem passou. Data de nascimento e dado pessoal, e este
 * produto se compromete a guardar o minimo (ver docs/PRIVACY.md).
 */
export const IDADE_MINIMA = 18;

export type ResultadoIdade =
  | { ok: true; idade: number }
  | { ok: false; motivo: string; idade?: number };

/** Idade completa em anos, considerando mes e dia. */
export function calcularIdade(nascimento: Date, hoje = new Date()): number {
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade -= 1;
  return idade;
}

/**
 * Valida a data digitada (formato do <input type="date">: aaaa-mm-dd).
 * Recusa data vazia, invalida, no futuro, implausivel e menor de idade.
 */
export function verificarMaioridade(valor: string, hoje = new Date()): ResultadoIdade {
  if (!valor) return { ok: false, motivo: 'Informe sua data de nascimento.' };

  const partes = valor.split('-').map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) {
    return { ok: false, motivo: 'Data invalida.' };
  }

  const [ano, mes, dia] = partes;
  const nascimento = new Date(ano, mes - 1, dia);

  // Rejeita datas que o Date "conserta" sozinho (31/02 vira 03/03).
  const real =
    nascimento.getFullYear() === ano &&
    nascimento.getMonth() === mes - 1 &&
    nascimento.getDate() === dia;
  if (!real) return { ok: false, motivo: 'Essa data nao existe.' };

  if (nascimento > hoje) return { ok: false, motivo: 'A data esta no futuro.' };

  const idade = calcularIdade(nascimento, hoje);
  if (idade > 120) return { ok: false, motivo: 'Confira o ano de nascimento.' };

  if (idade < IDADE_MINIMA) {
    return {
      ok: false,
      idade,
      motivo: `Este site e apenas para maiores de ${IDADE_MINIMA} anos.`,
    };
  }

  return { ok: true, idade };
}

/** Maior data aceitavel no campo: hoje. Evita escolher o futuro. */
export function hojeISO(hoje = new Date()): string {
  return hoje.toISOString().slice(0, 10);
}
