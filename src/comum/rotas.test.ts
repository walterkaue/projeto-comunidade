import { describe, expect, it } from 'vitest';
import { lerRota, linkPara } from './rotas';

describe('rotas por #', () => {
  it('endereço vazio ou desconhecido vai para a inicial', () => {
    expect(lerRota('')).toEqual({ nome: 'inicio', resto: '' });
    expect(lerRota('#')).toEqual({ nome: 'inicio', resto: '' });
    expect(lerRota('#/')).toEqual({ nome: 'inicio', resto: '' });
    expect(lerRota('#/naoexiste/x')).toEqual({ nome: 'inicio', resto: '' });
  });

  it('lê o nome e devolve o resto sem mexer', () => {
    expect(lerRota('#/cards')).toEqual({ nome: 'cards', resto: '' });
    expect(lerRota('#/evento/eyJ0IjoiRmVzdGEifQ%3D%3D')).toEqual({ nome: 'evento', resto: 'eyJ0IjoiRmVzdGEifQ%3D%3D' });
    expect(lerRota('#/evento/a/b?c=1')).toEqual({ nome: 'evento', resto: 'a/b?c=1' });
    expect(lerRota('#termos')).toEqual({ nome: 'termos', resto: '' });
  });

  it('monta o link de volta', () => {
    expect(linkPara('inicio')).toBe('#/');
    expect(linkPara('reuniao')).toBe('#/reuniao');
    expect(linkPara('evento', 'abc')).toBe('#/evento/abc');
    expect(lerRota(linkPara('evento', 'x/y'))).toEqual({ nome: 'evento', resto: 'x/y' });
  });
});
