import { describe, expect, it } from 'vitest';
import { calcularIdade, verificarMaioridade, hojeISO, IDADE_MINIMA } from '@/lib/age';

const HOJE = new Date(2026, 8, 11); // 11/09/2026

describe('calcularIdade', () => {
  it('conta anos completos', () => {
    expect(calcularIdade(new Date(2000, 8, 11), HOJE)).toBe(26);
  });

  it('nao conta o ano quando o aniversario ainda nao chegou', () => {
    expect(calcularIdade(new Date(2000, 8, 12), HOJE)).toBe(25);
    expect(calcularIdade(new Date(2000, 9, 1), HOJE)).toBe(25);
  });

  it('conta no proprio dia do aniversario', () => {
    expect(calcularIdade(new Date(2008, 8, 11), HOJE)).toBe(18);
  });
});

describe('verificarMaioridade', () => {
  it('aceita maior de idade', () => {
    const r = verificarMaioridade('1995-03-22', HOJE);
    expect(r.ok).toBe(true);
    expect(r.ok && r.idade).toBe(31);
  });

  it('libera exatamente no dia em que faz 18', () => {
    expect(verificarMaioridade('2008-09-11', HOJE).ok).toBe(true);
  });

  it('recusa um dia antes de completar 18', () => {
    const r = verificarMaioridade('2008-09-12', HOJE);
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain(String(IDADE_MINIMA));
  });

  it('recusa menor de idade', () => {
    expect(verificarMaioridade('2015-06-10', HOJE).ok).toBe(false);
  });

  it('recusa vazio, data no futuro e ano implausivel', () => {
    expect(verificarMaioridade('', HOJE).ok).toBe(false);
    expect(verificarMaioridade('2030-01-01', HOJE).ok).toBe(false);
    expect(verificarMaioridade('1850-01-01', HOJE).ok).toBe(false);
  });

  it('recusa data que nao existe no calendario', () => {
    // 31/02 seria "consertado" para 03/03 pelo Date: precisa cair fora.
    const r = verificarMaioridade('1990-02-31', HOJE);
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('nao existe');
  });

  it('recusa formato invalido', () => {
    expect(verificarMaioridade('abc', HOJE).ok).toBe(false);
    expect(verificarMaioridade('1990-13', HOJE).ok).toBe(false);
  });
});

describe('hojeISO', () => {
  it('devolve aaaa-mm-dd, para limitar o campo ao passado', () => {
    expect(hojeISO(new Date(Date.UTC(2026, 8, 11)))).toBe('2026-09-11');
  });
});
