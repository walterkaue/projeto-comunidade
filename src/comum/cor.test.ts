import { describe, expect, it } from 'vitest';
import { ajustarParaContraste, corDeTexto, CONTRASTE_MINIMO, CONTRASTE_TEXTO_GRANDE, luminancia, passaContraste, razaoDeContraste } from './cor';

describe('luminância', () => {
  it('preto 0, branco 1, aceita #rgb', () => {
    expect(luminancia('#000000')).toBe(0);
    expect(luminancia('#ffffff')).toBeCloseTo(1, 10);
    expect(luminancia('#fff')).toBeCloseTo(1, 10);
    expect(luminancia('#f00')).toBeCloseTo(0.2126, 4);
  });
  it('valor inválido vira preto', () => {
    expect(luminancia('azul')).toBe(0);
  });
});

describe('razão de contraste', () => {
  it('preto x branco = 21 (nos dois sentidos)', () => {
    expect(razaoDeContraste('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(razaoDeContraste('#ffffff', '#000')).toBeCloseTo(21, 5);
  });
  it('cor igual = 1', () => {
    expect(razaoDeContraste('#336699', '#336699')).toBeCloseTo(1, 10);
  });
  it('#777777 x branco ≈ 4,48 (não passa) e #767676 ≈ 4,54 (passa)', () => {
    expect(razaoDeContraste('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(passaContraste('#777777', '#ffffff')).toBe(false);
    expect(razaoDeContraste('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
    expect(passaContraste('#767676', '#ffffff')).toBe(true);
  });
  it('texto grande aceita 3', () => {
    expect(passaContraste('#777777', '#ffffff', CONTRASTE_TEXTO_GRANDE)).toBe(true);
    expect(CONTRASTE_MINIMO).toBe(4.5);
  });
});

describe('corDeTexto', () => {
  it('escolhe a de maior contraste', () => {
    expect(corDeTexto('#ffffff')).toBe('#111111');
    expect(corDeTexto('#000000')).toBe('#ffffff');
    expect(corDeTexto('#0b57d0')).toBe('#ffffff');
    expect(corDeTexto('#ffd400')).toBe('#111111');
  });
  it('aceita opções próprias', () => {
    expect(corDeTexto('#ffffff', ['#ff0000', '#222222'])).toBe('#222222');
  });
});

describe('ajustarParaContraste', () => {
  it('cor que já passa fica como está', () => {
    expect(ajustarParaContraste('#111111', '#ffffff')).toBe('#111111');
  });
  it('escurece sobre fundo claro até passar, sem exagerar', () => {
    const r = ajustarParaContraste('#777777', '#ffffff');
    expect(passaContraste(r, '#ffffff')).toBe(true);
    expect(razaoDeContraste(r, '#ffffff')).toBeLessThan(4.8);
  });
  it('clareia sobre fundo escuro', () => {
    const r = ajustarParaContraste('#555555', '#000000');
    expect(passaContraste(r, '#000000')).toBe(true);
    expect(luminancia(r)).toBeGreaterThan(luminancia('#555555'));
  });
  it('mantém o matiz aproximado (amarelo sobre branco continua amarelado)', () => {
    const r = ajustarParaContraste('#ffd400', '#ffffff');
    expect(passaContraste(r, '#ffffff')).toBe(true);
    const [rr, gg, bb] = [1, 3, 5].map((i) => parseInt(r.slice(i, i + 2), 16)) as [number, number, number];
    expect(rr).toBeGreaterThan(bb);
    expect(gg).toBeGreaterThan(bb);
  });
  it('respeita o mínimo pedido', () => {
    const r = ajustarParaContraste('#aaaaaa', '#ffffff', 3);
    expect(passaContraste(r, '#ffffff', 3)).toBe(true);
  });
});
