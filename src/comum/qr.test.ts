import { describe, expect, it, vi } from 'vitest';
import { desenharQr, matrizDoQr, retangulosDoQr } from './qr';

describe('retangulosDoQr', () => {
  const m = [
    [true, true, false],
    [false, true, false],
    [true, false, true],
  ];

  it('junta escuros seguidos na linha e usa pixels inteiros', () => {
    // 3 módulos + 2 de margem de cada lado = 7; lado 70 => módulo 10, sem sobra
    const r = retangulosDoQr(m, 70, 2);
    expect(r).toEqual([
      { x: 20, y: 20, l: 20, a: 10 },
      { x: 30, y: 30, l: 10, a: 10 },
      { x: 20, y: 40, l: 10, a: 10 },
      { x: 40, y: 40, l: 10, a: 10 },
    ]);
  });

  it('arredonda o módulo para baixo e centraliza a sobra', () => {
    // 7 módulos em 75 px => módulo 10, total 70, sobra 5 => desloca 2
    const r = retangulosDoQr(m, 75, 2);
    expect(r[0]).toEqual({ x: 22, y: 22, l: 20, a: 10 });
    for (const q of r) {
      expect(Number.isInteger(q.x) && Number.isInteger(q.y) && Number.isInteger(q.l) && Number.isInteger(q.a)).toBe(true);
      expect(q.x + q.l).toBeLessThanOrEqual(75);
    }
  });

  it('matriz vazia e lado pequeno não quebram', () => {
    expect(retangulosDoQr([], 100)).toEqual([]);
    expect(retangulosDoQr(m, 3, 4)[0]?.a).toBe(1);
  });
});

describe('matrizDoQr', () => {
  it('devolve matriz quadrada com módulos escuros', async () => {
    const m = await matrizDoQr('https://exemplo.org');
    expect(m.length).toBeGreaterThanOrEqual(21);
    for (const linha of m) expect(linha).toHaveLength(m.length);
    expect(m.flat().some(Boolean)).toBe(true);
    // canto superior esquerdo: marcador de posição (borda escura)
    expect(m[0]?.[0]).toBe(true);
  });
});

describe('desenharQr', () => {
  it('pinta fundo e depois os módulos', () => {
    const chamadas: string[] = [];
    const ctx = {
      fillStyle: '',
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(function (this: { fillStyle: string }, x: number, y: number, l: number, a: number) {
        chamadas.push(`${this.fillStyle}:${x},${y},${l},${a}`);
      }),
    };
    desenharQr(ctx as unknown as CanvasRenderingContext2D, [[true]], 100, 200, 90, { margem: 4 });
    expect(chamadas[0]).toBe('#ffffff:100,200,90,90');
    // 1 módulo + 8 de margem = 9; módulo 10; módulo escuro em (40,40) dentro do quadrado
    expect(chamadas[1]).toBe('#111111:140,240,10,10');
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });
});
