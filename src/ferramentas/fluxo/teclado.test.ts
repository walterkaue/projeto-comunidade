import { describe, expect, it } from 'vitest';
import { abreTeclado, rolagemParaOCampo, tecladoAberto } from './teclado';

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
  it('limites exatos: perda de 150 e altura de 500 ainda não contam', () => {
    expect(tecladoAberto({ alturaVisivel: 550, alturaDaJanela: 700, campoDeTextoEmFoco: false })).toBe(false);
    expect(tecladoAberto({ alturaVisivel: 549, alturaDaJanela: 700, campoDeTextoEmFoco: false })).toBe(true);
    expect(tecladoAberto({ alturaVisivel: 500, alturaDaJanela: 500, campoDeTextoEmFoco: true })).toBe(false);
    expect(tecladoAberto({ alturaVisivel: 499, alturaDaJanela: 499, campoDeTextoEmFoco: true })).toBe(true);
  });
  it('celular alto (Android encolhe a janela): menos de 75% da maior altura com campo em foco é teclado', () => {
    expect(tecladoAberto({ alturaVisivel: 600, alturaDaJanela: 600, campoDeTextoEmFoco: true, alturaMaxima: 900 })).toBe(true);
    expect(tecladoAberto({ alturaVisivel: 700, alturaDaJanela: 700, campoDeTextoEmFoco: true, alturaMaxima: 900 })).toBe(false);
  });
  it('zoom de pinça não é teclado', () => {
    expect(tecladoAberto({ alturaVisivel: 350, alturaDaJanela: 700, campoDeTextoEmFoco: true, escala: 2 })).toBe(false);
  });
});

describe('rolagemParaOCampo', () => {
  it('campo atrás do teclado: rola até ele aparecer com folga', () => {
    expect(rolagemParaOCampo(500, 0, 400)).toBe(116);
  });
  it('campo já visível: não rola', () => {
    expect(rolagemParaOCampo(300, 0, 400)).toBe(0);
  });
  it('conta o deslocamento da área visível', () => {
    expect(rolagemParaOCampo(500, 200, 400)).toBe(0);
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
