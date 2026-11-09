import { describe, expect, it, vi } from 'vitest';
import type { Aberto } from '../evento/abrir';
import type { Evento } from '../evento/validar';
import { esc } from '../../comum/html';
import { linkPara } from '../../comum/rotas';
import { htmlDoParagrafo, textosDoRemovido } from '../evento/removido';
import { abrirParaEditar, type DependenciasDeEditar } from './editar';

const BASE = 'https://exemplo.test/projeto/';
const EVENTO: Evento = { titulo: 'Festa', data: '2026-11-14', inicio: '18:00', fim: '', local: 'Quadra', descricao: 'Traga um prato', organizacao: 'Coletivo' };

function raizFalsa() {
  const foco = vi.fn();
  const raiz = { innerHTML: '', querySelector: () => ({ focus: foco }) } as unknown as HTMLElement & { innerHTML: string };
  return { raiz, foco };
}

function deps(resultado: Aberto | Error, trocou = true) {
  const d = {
    abrirEvento: vi.fn(async () => {
      if (resultado instanceof Error) throw resultado;
      return resultado;
    }),
    linkCompleto: vi.fn((dados: string) => `${BASE}#/evento/${dados}`),
    base: () => BASE,
    guardar: vi.fn(() => trocou),
    ir: vi.fn(),
    avisar: vi.fn(),
  };
  return { d, tipada: d as unknown as DependenciasDeEditar };
}

describe('abrirParaEditar', () => {
  it('ok: guarda os dados do evento, vai ao passo 1 e avisa', async () => {
    const { raiz } = raizFalsa();
    const { d, tipada } = deps({ estado: 'ok', evento: EVENTO });
    await abrirParaEditar(raiz, '1rABC', () => true, tipada);
    expect(d.guardar).toHaveBeenCalledTimes(1);
    const guardado = (d.guardar.mock.calls[0] as unknown as [{ titulo: string; origem: string; link: string }])[0];
    expect(guardado).toMatchObject({ titulo: 'Festa', origem: 'link', link: `${BASE}#/evento/1rABC` });
    expect(d.ir).toHaveBeenCalledWith('#/fazer/evento');
    expect(d.avisar).toHaveBeenCalledWith('Dados do evento carregados. Mude o que quiser.');
  });

  it('ok, mas a pessoa recusou a troca: vai ao passo 1 com o rascunho dela', async () => {
    const { raiz } = raizFalsa();
    const { d, tipada } = deps({ estado: 'ok', evento: EVENTO }, false);
    await abrirParaEditar(raiz, '1rABC', () => true, tipada);
    expect(d.ir).toHaveBeenCalledWith('#/fazer/evento');
    expect(d.avisar).toHaveBeenCalledWith('Você ficou com o que estava fazendo.');
  });

  it('bloqueado: tela de aviso, sem guardar nem navegar', async () => {
    const { raiz, foco } = raizFalsa();
    const { d, tipada } = deps({ estado: 'bloqueado', motivo: { tipo: 'regra', regra: 5 } } as Aberto);
    await abrirParaEditar(raiz, '1rABC', () => true, tipada);
    expect(raiz.innerHTML).toContain('foi removido');
    expect(raiz.innerHTML).toContain('Fazer um evento');
    // O motivo e o caminho para pedir revisão, como na página do evento removido.
    for (const p of textosDoRemovido({ tipo: 'regra', regra: 5 }).paragrafos) expect(raiz.innerHTML).toContain(htmlDoParagrafo(p));
    expect(raiz.innerHTML).toContain(`href="${esc(linkPara('regras'))}"`);
    expect(raiz.innerHTML).toContain('Ver as Regras de uso');
    expect(foco).toHaveBeenCalled();
    expect(d.guardar).not.toHaveBeenCalled();
    expect(d.ir).not.toHaveBeenCalled();
  });

  it('bloqueado a pedido ou sem motivo: mostra o texto de cada um e o caminho da revisão', async () => {
    for (const motivo of [{ tipo: 'pedido' }, { tipo: 'sem-motivo' }] as const) {
      const { raiz } = raizFalsa();
      const { d, tipada } = deps({ estado: 'bloqueado', motivo } as Aberto);
      await abrirParaEditar(raiz, '1rABC', () => true, tipada);
      for (const p of textosDoRemovido(motivo).paragrafos) expect(raiz.innerHTML).toContain(htmlDoParagrafo(p));
      expect(raiz.innerHTML).toContain(`href="${esc(linkPara('regras'))}"`);
      expect(raiz.innerHTML).toContain('Fazer um evento');
      expect(d.guardar).not.toHaveBeenCalled();
    }
  });

  it('problema no link: tela de aviso', async () => {
    const { raiz } = raizFalsa();
    const { d, tipada } = deps({ estado: 'problema', problema: 'ilegivel' } as unknown as Aberto);
    await abrirParaEditar(raiz, 'x', () => true, tipada);
    expect(raiz.innerHTML).toContain('Não deu para abrir os dados desse link.');
    expect(d.guardar).not.toHaveBeenCalled();
  });

  it('erro inesperado: mesma tela de aviso', async () => {
    const { raiz } = raizFalsa();
    const { tipada } = deps(new Error('rede'));
    await abrirParaEditar(raiz, 'x', () => true, tipada);
    expect(raiz.innerHTML).toContain('Não deu para abrir os dados desse link.');
  });

  it('tela fechada no meio: não guarda, não navega, não mexe na tela', async () => {
    const { raiz } = raizFalsa();
    for (const r of [{ estado: 'ok', evento: EVENTO }, { estado: 'bloqueado', motivo: 'pedido' }, { estado: 'problema', problema: 'x' }] as unknown as Aberto[]) {
      const { d, tipada } = deps(r);
      await abrirParaEditar(raiz, 'x', () => false, tipada);
      expect(d.guardar).not.toHaveBeenCalled();
      expect(d.ir).not.toHaveBeenCalled();
      expect(d.avisar).not.toHaveBeenCalled();
      expect(raiz.innerHTML).toContain('Abrindo os dados do evento');
    }
    const { tipada } = deps(new Error('x'));
    await abrirParaEditar(raiz, 'x', () => false, tipada);
    expect(raiz.innerHTML).toContain('Abrindo os dados do evento');
  });
});
