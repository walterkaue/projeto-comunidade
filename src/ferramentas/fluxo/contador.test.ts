import { describe, expect, it } from 'vitest';
import { deveAnunciarOContador, faixaDoContador } from './contador';

describe('contador da pauta', () => {
  it('separa as faixas em 50, 20, 10, 0 e passou', () => {
    expect([100, 51, 50, 21, 20, 11, 10, 1, 0, -1].map(faixaDoContador)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 5]);
  });
  it('fala só ao entrar numa faixa mais perto do fim', () => {
    expect(deveAnunciarOContador(0, 1)).toBe(true);
    expect(deveAnunciarOContador(1, 1)).toBe(false);
    expect(deveAnunciarOContador(3, 2)).toBe(false);
    expect(deveAnunciarOContador(4, 5)).toBe(true);
  });
});
