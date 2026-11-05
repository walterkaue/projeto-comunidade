import { describe, expect, it } from 'vitest';
import { lerDadosDoCard } from '../../comum/entreTelas';
import { dataPorExtenso, horaEmTexto } from './data';
import {
  convocacaoVazia,
  enderecoDoCard,
  faltasDaConvocacao,
  moverItem,
  pautaPreenchida,
  textoDaConvocacao,
  tirarItem,
  type Convocacao,
} from './convocacao';

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

describe('faltas', () => {
  it('pede tudo quando está vazia', () => {
    expect(faltasDaConvocacao(convocacaoVazia()).map((f) => f.campo)).toEqual(['organizacao', 'data', 'hora', 'local', 'pauta']);
  });
  it('não pede nada quando está completa', () => {
    expect(faltasDaConvocacao(c)).toEqual([]);
  });
});

describe('texto da convocação', () => {
  it('sai com negrito do WhatsApp e pauta numerada', () => {
    const t = textoDaConvocacao(c);
    expect(t).toContain('*Convocação para reunião*');
    expect(t).toContain('*Associação de Moradores do Bairro Novo*');
    expect(t).toContain('📅 *Data:* quinta-feira, 12/11/2026');
    expect(t).toContain('*Hora:* 19h00');
    expect(t).toContain('*Local:* Salão da escola');
    expect(t).toContain('1. Mutirão de limpeza\n2. Contas do mês');
    expect(t).not.toContain('Mais informações');
  });
  it('põe o link do evento quando há', () => {
    expect(textoDaConvocacao(c, 'https://exemplo.org/#/evento/abc')).toContain('Mais informações: https://exemplo.org/#/evento/abc');
  });
});

describe('card da convocação', () => {
  it('abre o Cards no modelo reunião, com os dados', () => {
    const end = enderecoDoCard(c);
    expect(end.startsWith('#/cards/')).toBe(true);
    const d = lerDadosDoCard(end.slice('#/cards/'.length), 'https://x.org/');
    expect(d.modelo).toBe('reuniao');
    expect(d.organizacao).toBe(c.organizacao);
    expect(d.data).toBe('2026-11-12');
    expect(d.hora).toBe('19:00');
    expect(d.local).toBe('Salão da escola');
    expect(d.texto).toContain('1) Mutirão de limpeza');
  });
  it('leva o link do evento só se for do site', () => {
    const base = 'https://x.org/projeto/';
    const bom = 'https://x.org/projeto/#/evento/abc';
    const d = lerDadosDoCard(enderecoDoCard(c, bom).slice('#/cards/'.length), base);
    expect(d.link).toBe(bom);
    const ruim = lerDadosDoCard(enderecoDoCard(c, 'https://golpe.com/#/evento/abc').slice('#/cards/'.length), base);
    expect(ruim.link).toBeUndefined();
  });
});
