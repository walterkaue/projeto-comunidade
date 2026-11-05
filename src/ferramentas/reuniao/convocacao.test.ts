import { describe, expect, it } from 'vitest';
import { dataPorExtenso, horaEmTexto } from './data';
import { convocacaoVazia, moverItem, pautaPreenchida, tirarItem, type Convocacao } from './convocacao';

const c: Convocacao = {
  organizacao: 'Associação de Moradores do Bairro Novo',
  data: '2026-11-12',
  hora: '19:00',
  local: 'Salão da escola',
  pauta: ['Mutirão de limpeza', '  ', 'Contas  do mês'],
  link: '',
};

describe('datas', () => {
  it('escreve a data por extenso', () => {
    expect(dataPorExtenso('2026-11-12')).toBe('quinta-feira, 12/11/2026');
    expect(dataPorExtenso('2026-02-30')).toBe('');
    expect(dataPorExtenso('')).toBe('');
  });
  it('escreve a hora', () => {
    expect(horaEmTexto('19:00')).toBe('19h00');
    expect(horaEmTexto('25:00')).toBe('');
  });
});

describe('pauta', () => {
  it('ignora itens vazios e espaços repetidos', () => {
    expect(pautaPreenchida(c.pauta)).toEqual(['Mutirão de limpeza', 'Contas do mês']);
  });
  it('sobe, desce e tira sem mexer na lista original', () => {
    const l = ['a', 'b', 'c'];
    expect(moverItem(l, 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moverItem(l, 1, 1)).toEqual(['a', 'c', 'b']);
    expect(moverItem(l, 0, -1)).toEqual(['a', 'b', 'c']);
    expect(moverItem(l, 2, 1)).toEqual(['a', 'b', 'c']);
    expect(tirarItem(l, 1)).toEqual(['a', 'c']);
    expect(l).toEqual(['a', 'b', 'c']);
  });
});

describe('convocação vazia', () => {
  it('começa com um item de pauta em branco e sem link', () => {
    expect(convocacaoVazia()).toEqual({ organizacao: '', data: '', hora: '', local: '', pauta: [''], link: '' });
  });
});
