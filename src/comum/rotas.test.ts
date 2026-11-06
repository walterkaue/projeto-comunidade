import { describe, expect, it } from 'vitest';
import { lerRota, linkPara, mostraORodapeComum, parteDaRota } from './rotas';

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
    expect(lerRota('#/fazer/reuniao/2')).toEqual({ nome: 'fazer', resto: 'reuniao/2' });
    expect(lerRota('#/ata')).toEqual({ nome: 'ata', resto: '' });
  });

  it('monta o link de volta', () => {
    expect(linkPara('inicio')).toBe('#/');
    expect(linkPara('reuniao')).toBe('#/reuniao');
    expect(linkPara('evento', 'abc')).toBe('#/evento/abc');
    expect(lerRota(linkPara('evento', 'x/y'))).toEqual({ nome: 'evento', resto: 'x/y' });
  });
});

describe('qual parte abre cada endereço', () => {
  const parte = (hash: string) => parteDaRota(lerRota(hash));

  it('a página do evento continua com o Evento (links que já circulam)', () => {
    expect(parte('#/evento/1rWyJGZXN0YSJd')).toBe('evento');
  });

  it('os endereços antigos das ferramentas levam ao fluxo', () => {
    expect(parte('#/evento')).toBe('fluxo');
    expect(parte('#/evento/editar/1rWyJGZXN0YSJd')).toBe('fluxo');
    expect(parte('#/cards')).toBe('fluxo');
    expect(parte('#/reuniao')).toBe('fluxo');
    expect(parte('#/fazer/aviso')).toBe('fluxo');
  });

  it('a galeria, a ata, o início e as páginas', () => {
    expect(parte('#/cards/galeria')).toBe('galeria');
    expect(parte('#/ata')).toBe('ata');
    expect(parte('#/')).toBe('inicio');
    expect(parte('#/termos')).toBe('paginas');
    expect(parte('#/denunciar/x')).toBe('paginas');
  });
});

describe('mostraORodapeComum', () => {
  const mostra = (hash: string) => mostraORodapeComum(lerRota(hash));
  it('aparece nas páginas, na ata e na página de um evento', () => {
    for (const h of ['#/sobre', '#/denunciar', '#/ata', '#/evento/abc123']) expect(mostra(h), h).toBe(true);
  });
  it('some no início e em todo o fluxo (passos, Pronto, editar, endereços antigos)', () => {
    for (const h of ['#/', '#/fazer/reuniao', '#/fazer/aviso/3', '#/fazer/evento/pronto', '#/evento', '#/evento/editar/abc', '#/cards', '#/reuniao'])
      expect(mostra(h), h).toBe(false);
  });
});
