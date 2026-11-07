import { beforeEach, describe, expect, it, vi } from 'vitest';
import { convocacaoVazia } from '../reuniao/convocacao';
import { rascunho } from '../reuniao/rascunho';
import { cheio } from './dados-de-teste';
import { dadosDoEvento, exemploDoRodizio, marcarMudanca, PERGUNTA_DA_TROCA_DO_RASCUNHO, SEM_EXEMPLO } from './estado';
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
    guardar(cheio('evento', 0, HOJE));
    expect(trocarPorDadosDeLink(doLink(), confirmar)).toBe(true);
    expect(confirmar).not.toHaveBeenCalled();
    expect(dadosDo('evento').titulo).toBe('Festa');
  });

  it('com o que a pessoa escreveu, pergunta; recusou, o rascunho dela fica', () => {
    const d = cheio('evento', 0, HOJE);
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

describe('rodízio dos exemplos (D6)', () => {
  it('o começo é sorteado em 0 … VOLTA_DO_RODIZIO − 1 e anda um a cada exemplo novo', async () => {
    const { VOLTA_DO_RODIZIO } = await import('../cards/exemplos');
    for (const [sorteio, inicio] of [[0, 0], [0.999999, VOLTA_DO_RODIZIO - 1]] as const) {
      vi.resetModules();
      vi.spyOn(Math, 'random').mockReturnValue(sorteio);
      const mem = await import('./memoria');
      const est = await import('./estado');
      vi.restoreAllMocks();
      expect(mem.dadosDo('reuniao', HOJE).exemplo).toEqual(est.exemploDoRodizio('reuniao', inicio, HOJE));
      expect(mem.dadosDo('evento', HOJE).exemplo).toEqual(est.exemploDoRodizio('evento', inicio + 1, HOJE));
    }
  });

  it('dados de link também ganham o próximo exemplo do rodízio (para o placeholder)', async () => {
    vi.resetModules();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const mem = await import('./memoria');
    const est = await import('./estado');
    vi.restoreAllMocks();
    const novo = doLink();
    expect(novo.exemplo).toBe(SEM_EXEMPLO);
    expect(mem.trocarPorDadosDeLink(novo, () => true)).toBe(true);
    const { titulo, organizacao, texto, local } = est.exemploDoRodizio('evento', 0, HOJE);
    expect(mem.dadosDo('evento', HOJE).exemplo).toMatchObject({ titulo, organizacao, texto, local });
    expect(mem.dadosDo('evento', HOJE).titulo).toBe('Festa');
  });

  it('dados novos começam vazios; o exemplo fica à parte', () => {
    const d = dadosDo('reuniao', HOJE);
    expect([d.titulo, d.organizacao, d.texto, d.pauta, d.data, d.hora, d.local]).toEqual(['', '', '', '', '', '', '']);
    expect(d.origem).toBe('novo');
    expect(d.exemplo.titulo).not.toBe('');
    expect(exemploDoRodizio('reuniao', 0, HOJE).titulo).not.toBe('');
  });
});
