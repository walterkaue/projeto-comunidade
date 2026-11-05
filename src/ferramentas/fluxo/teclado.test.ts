import { describe, expect, it } from 'vitest';
import { abreTeclado, tecladoAberto } from './teclado';

describe('tecladoAberto', () => {
  it('sem perda de altura e sem campo em foco: fechado', () => {
    expect(tecladoAberto({ alturaVisivel: 700, alturaDaJanela: 700, campoDeTextoEmFoco: false })).toBe(false);
  });
  it('área visível bem menor que a janela: aberto (iPhone)', () => {
    expect(tecladoAberto({ alturaVisivel: 420, alturaDaJanela: 700, campoDeTextoEmFoco: false })).toBe(true);
  });
  it('perda pequena (barra do navegador) não conta', () => {
    expect(tecladoAberto({ alturaVisivel: 600, alturaDaJanela: 700, campoDeTextoEmFoco: true })).toBe(false);
  });
  it('janela já encolhida (Android) com campo em foco: aberto', () => {
    expect(tecladoAberto({ alturaVisivel: 380, alturaDaJanela: 380, campoDeTextoEmFoco: true })).toBe(true);
  });
  it('altura baixa sem campo em foco: não decide por si', () => {
    expect(tecladoAberto({ alturaVisivel: 380, alturaDaJanela: 380, campoDeTextoEmFoco: false })).toBe(false);
  });
});

describe('abreTeclado', () => {
  it('texto, hora e área de texto abrem o teclado', () => {
    expect(abreTeclado('INPUT', 'text')).toBe(true);
    expect(abreTeclado('input', 'time')).toBe(true);
    expect(abreTeclado('TEXTAREA')).toBe(true);
  });
  it('radio, caixa, arquivo e cor não abrem', () => {
    for (const t of ['radio', 'checkbox', 'file', 'color']) expect(abreTeclado('input', t)).toBe(false);
    expect(abreTeclado('button')).toBe(false);
  });
});
