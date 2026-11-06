import { describe, expect, it, vi } from 'vitest';
import {
  avisoDeErros,
  avisoDoCompartilhamento,
  camposDoPasso,
  criarAgendador,
  enderecoDaPaginaDoEvento,
  escalaDaMiniatura,
  esperaDoRedesenho,
  idsDaDescricao,
  nomeDoArquivoDoFluxo,
  paletaDoFluxo,
  precisaConfirmar,
} from './apoio';
import { exemploDoFluxo } from './estado';

const HOJE = new Date(2026, 10, 5);

describe('paletaDoFluxo', () => {
  it('uma das seis pelo id', () => {
    expect(paletaDoFluxo({ paletaId: 'mar', corLivre: '#3d6b73' }).id).toBe('mar');
  });
  it('cor livre vira paleta livre com a faixa na cor', () => {
    const p = paletaDoFluxo({ paletaId: 'livre', corLivre: '#3d6b73' });
    expect(p.id).toBe('livre');
    expect(p.destaque).toBe('#3d6b73');
  });
  it('cor livre inválida cai na paleta padrão', () => {
    expect(paletaDoFluxo({ paletaId: 'livre', corLivre: 'nada' }).id).toBe('papel');
  });
  it('id desconhecido cai na paleta padrão', () => {
    expect(paletaDoFluxo({ paletaId: 'xyz', corLivre: '' }).id).toBe('papel');
  });
});

describe('miniatura', () => {
  it('a escala deixa o card com a altura pedida (vezes a densidade)', () => {
    expect(escalaDaMiniatura('conversa') * 1080).toBeCloseTo(192);
    expect(escalaDaMiniatura('status') * 1920).toBeCloseTo(192);
    expect(escalaDaMiniatura('cartaz', 50, 1) * 1527).toBeCloseTo(50);
  });
  it('espera 450 ms, ou 900 ms em aparelho leve', () => {
    expect(esperaDoRedesenho('normal')).toBe(450);
    expect(esperaDoRedesenho('leve')).toBe(900);
  });
});

describe('campos de cada passo', () => {
  it('passo 1', () => {
    expect(camposDoPasso('reuniao', 1)).toEqual(['titulo', 'organizacao', 'pauta']);
    expect(camposDoPasso('aviso', 1)).toEqual(['titulo', 'organizacao', 'texto']);
  });
  it('passo 2', () => {
    expect(camposDoPasso('evento', 2)).toEqual(['data', 'hora', 'local']);
    expect(camposDoPasso('agradecimento', 2)).toEqual(['data']);
  });
});

describe('avisos', () => {
  it('conta os campos', () => {
    expect(avisoDeErros(1)).toBe('Confira 1 campo.');
    expect(avisoDeErros(3)).toBe('Confira 3 campos.');
  });
  it('compartilhar: copiado e falhou orientam a baixar a imagem; cancelado fica quieto', () => {
    expect(avisoDoCompartilhamento('copiado')).toMatch(/Baixe a imagem/);
    expect(avisoDoCompartilhamento('falhou')).toMatch(/Baixar a imagem/);
    expect(avisoDoCompartilhamento('cancelado')).toBe('');
    expect(avisoDoCompartilhamento('arquivo')).toMatch(/Pronto/);
  });
});

describe('endereço da página do evento', () => {
  const base = 'https://exemplo.test/projeto/';
  it('vira um endereço interno com os dados', () => {
    expect(enderecoDaPaginaDoEvento(`${base}#/evento/1rAbc_-9`, base)).toBe('#/evento/1rAbc_-9');
  });
  it('link de outro site ou estranho não vira nada', () => {
    expect(enderecoDaPaginaDoEvento('https://outro.test/projeto/#/evento/1rAbc', base)).toBe('');
    expect(enderecoDaPaginaDoEvento(`${base}#/evento/a"><script>`, base)).toBe('');
    expect(enderecoDaPaginaDoEvento('javascript:alert(1)', base)).toBe('');
    expect(enderecoDaPaginaDoEvento('', base)).toBe('');
  });
  it('a base é o endereço deste site, nunca o próprio link: link de outro site não passa', () => {
    const dele = 'https://outro.test/#/evento/1rAbc';
    expect(enderecoDaPaginaDoEvento(dele, dele)).toBe('#/evento/1rAbc'); // por isso a base nunca pode ser o link
    expect(enderecoDaPaginaDoEvento(dele, base)).toBe('');
    expect(enderecoDaPaginaDoEvento('http://exemplo.test/projeto/#/evento/1rAbc', base)).toBe('');
  });
});

describe('nome do arquivo', () => {
  it('usa o formato escolhido ou o pedido', () => {
    const d = exemploDoFluxo('evento', 0, HOJE);
    d.formato = 'status';
    expect(nomeDoArquivoDoFluxo(d)).toBe('card-evento-status.png');
    expect(nomeDoArquivoDoFluxo(d, 'cartaz')).toBe('card-evento-cartaz.png');
  });
});

describe('criarAgendador', () => {
  it('só roda depois da espera e reinicia a contagem a cada pedido', () => {
    vi.useFakeTimers();
    const acao = vi.fn();
    const a = criarAgendador(450, acao);
    a.agendar();
    vi.advanceTimersByTime(400);
    a.agendar();
    vi.advanceTimersByTime(400);
    expect(acao).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60);
    expect(acao).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
  it('cancelar impede', () => {
    vi.useFakeTimers();
    const acao = vi.fn();
    const a = criarAgendador(100, acao);
    a.agendar();
    a.cancelar();
    vi.advanceTimersByTime(500);
    expect(acao).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('confirmação do Pronto (sem DOM)', () => {
  it('sem campos do exemplo, nunca pergunta', () => {
    expect(precisaConfirmar([], false)).toBe(false);
    expect(precisaConfirmar([], true)).toBe(false);
  });

  it('com campos do exemplo, pergunta', () => {
    expect(precisaConfirmar(['organizacao', 'local'], false)).toBe(true);
  });

  it('depois de confirmar, não pergunta mais; visita nova pergunta de novo', () => {
    let confirmou = false;
    expect(precisaConfirmar(['titulo'], confirmou)).toBe(true);
    confirmou = true;
    expect(precisaConfirmar(['titulo'], confirmou)).toBe(false);
    // Nova visita ao Pronto: a tela é montada de novo e o "já confirmou" começa falso.
    confirmou = false;
    expect(precisaConfirmar(['titulo'], confirmou)).toBe(true);
  });

  it('o aviso do exemplo vem primeiro no aria-describedby', () => {
    expect(idsDaDescricao(true, 'fluxo-mandar-dica')).toBe('fluxo-aviso-exemplo fluxo-mandar-dica');
    expect(idsDaDescricao(false, 'fluxo-mandar-dica')).toBe('fluxo-mandar-dica');
  });
});
