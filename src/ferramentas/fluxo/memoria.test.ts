import { beforeEach, describe, expect, it, vi } from 'vitest';
import { convocacaoVazia } from '../reuniao/convocacao';
import { rascunho } from '../reuniao/rascunho';
import { exemploDoFluxo, marcarMudanca, PERGUNTA_DA_TROCA_DO_RASCUNHO, dadosDoEvento } from './estado';
import { dadosDo, esquecerTudo, existe, guardar, trocarPorDadosDeLink } from './memoria';

const HOJE = new Date(2026, 10, 5);
const BASE = 'https://exemplo.test/projeto/';
const doLink = () =>
  dadosDoEvento(
    { titulo: 'Festa', data: '2026-11-14', inicio: '18:00', fim: '', local: 'Quadra', descricao: 'Traga um prato', organizacao: 'Coletivo' },
    `${BASE}#/evento/1rABC`,
    BASE,
  );

beforeEach(() => esquecerTudo());

describe('existe', () => {
  it('só depois de haver dados do tipo nesta aba', () => {
    expect(existe('evento')).toBe(false);
    dadosDo('evento', HOJE);
    expect(existe('evento')).toBe(true);
    expect(existe('aviso')).toBe(false);
    esquecerTudo();
    expect(existe('evento')).toBe(false);
  });
});

describe('Fazer outro', () => {
  it('esquece também a convocação que foi para a ata', () => {
    rascunho.convocacao = { ...convocacaoVazia(), organizacao: 'Associação', pauta: ['Contas'] };
    esquecerTudo();
    expect(rascunho.convocacao).toEqual(convocacaoVazia());
  });
});

describe('trocar o rascunho pelos dados de um link', () => {
  it('sem rascunho da pessoa, troca sem perguntar', () => {
    const confirmar = vi.fn(() => false);
    guardar(exemploDoFluxo('evento', 0, HOJE));
    expect(trocarPorDadosDeLink(doLink(), confirmar)).toBe(true);
    expect(confirmar).not.toHaveBeenCalled();
    expect(dadosDo('evento').titulo).toBe('Festa');
  });

  it('com o que a pessoa escreveu, pergunta; recusou, o rascunho dela fica', () => {
    const d = exemploDoFluxo('evento', 0, HOJE);
    marcarMudanca(d);
    guardar(d);
    const confirmar = vi.fn(() => false);
    expect(trocarPorDadosDeLink(doLink(), confirmar)).toBe(false);
    expect(confirmar).toHaveBeenCalledWith(PERGUNTA_DA_TROCA_DO_RASCUNHO);
    expect(dadosDo('evento')).toBe(d);
    expect(trocarPorDadosDeLink(doLink(), () => true)).toBe(true);
    expect(dadosDo('evento').titulo).toBe('Festa');
  });

  it('a pergunta é a do plano', () => {
    expect(PERGUNTA_DA_TROCA_DO_RASCUNHO).toBe('Trocar o que você estava fazendo pelos dados deste evento?');
  });
});
