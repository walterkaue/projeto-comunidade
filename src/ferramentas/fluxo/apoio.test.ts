import { describe, expect, it, vi } from 'vitest';
import {
  avisoDeErros,
  avisoDoCompartilhamento,
  camposDoPasso,
  criarAgendador,
  enderecoDaPaginaDoEvento,
  escalaDaMiniatura,
  esperaDoRedesenho,
  dicaDoMandar,
  frasePainel,
  MENSAGEM_DE_BAIXAR,
  nomeDoArquivoDoFluxo,
  notaDoCorte,
  paletaDoFluxo,
  precisaConfirmar,
  soFaltaARede,
  temMenuDeCompartilhar,
} from './apoio';
import { cheio } from './dados-de-teste';

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
  it('imagem recusada pelo menu (só o texto foi): diz o que fazer, sem "texto enviado"', () => {
    expect(avisoDoCompartilhamento('texto')).toBe('A imagem não foi junto. Toque em Baixar a imagem e mande no WhatsApp.');
    expect(avisoDoCompartilhamento('copiado')).toBe('Texto copiado. Baixe a imagem e mande junto no WhatsApp.');
  });
  it('a dica do "Mandar" depende do menu e do formato', () => {
    expect(dicaDoMandar('status', false)).toBe('Copia o texto. Depois, baixe a imagem e mande as duas no WhatsApp.');
    expect(dicaDoMandar('cartaz', false)).toBe(dicaDoMandar('conversa', false));
    expect(dicaDoMandar('status', true)).toBe('Abre o menu do celular. Escolha o WhatsApp e depois o seu status.');
    expect(dicaDoMandar('conversa', true)).toBe('Abre o menu do celular. Escolha o WhatsApp e a conversa.');
    expect(dicaDoMandar('cartaz', true)).toBe('Abre o menu do celular. Escolha o WhatsApp e a conversa.');
  });
  it('menu de compartilhar: a mesma condição de compartilhar.ts (existir share)', () => {
    expect(temMenuDeCompartilhar({})).toBe(false);
    expect(temMenuDeCompartilhar({ share: async () => undefined })).toBe(true);
  });
  it('baixar não diz "baixada": manda abrir no Chrome ou no Safari', () => {
    expect(MENSAGEM_DE_BAIXAR).toBe('Se a imagem não aparecer em Downloads ou na galeria, abra este site no Chrome ou no Safari.');
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
    const d = cheio('evento', 0, HOJE);
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
  it('só pergunta se a mensagem vai sem o link ou se falta a pergunta do órgão', () => {
    expect(precisaConfirmar(false, false)).toBe(false);
    expect(precisaConfirmar(true, false)).toBe(true);
    expect(precisaConfirmar(false, true)).toBe(true);
  });

  it('o exemplo não entra nunca: não existe mais painel nem aviso do exemplo', async () => {
    const { readFileSync } = await import('node:fs');
    const fonte = readFileSync(new URL('./pronto.ts', import.meta.url), 'utf8');
    expect(fonte).not.toContain('fluxo-aviso-exemplo');
  });
});

describe('aviso de apagar no Pronto (B6)', () => {
  it('o texto é o do relatório e a tela o usa junto de "Fazer outro"', async () => {
    const { AVISO_FAZER_OUTRO } = await import('./apoio');
    expect(AVISO_FAZER_OUTRO).toBe('Fazer outro apaga tudo o que você escreveu neste aparelho.');
    const { readFileSync } = await import('node:fs');
    const fonte = readFileSync(new URL('./pronto.ts', import.meta.url), 'utf8');
    expect(fonte).toContain('esc(AVISO_FAZER_OUTRO)');
    expect(fonte).toContain('aria-describedby="fluxo-outro-dica"');
  });
});

describe('nota do corte do cartaz (B-04)', () => {
  it('uma frase para cada caso, vazia sem corte', () => {
    expect(notaDoCorte([])).toBe('');
    expect(notaDoCorte(['local'])).toBe('O cartaz corta o endereço. Encurte o local.');
    expect(notaDoCorte(['organizacao'])).toBe('O cartaz corta o nome da organização. Encurte a organização.');
    expect(notaDoCorte(['local', 'organizacao'])).toBe('O cartaz corta o endereço e o nome da organização. Encurte os dois.');
    expect(notaDoCorte(['organizacao', 'local'])).toBe(notaDoCorte(['local', 'organizacao']));
  });
});

describe('confirmação sem o link (C-01)', () => {
  it('sem link pede confirmação; sem link e sem órgão, não', () => {
    expect(precisaConfirmar(true, false)).toBe(true);
    expect(precisaConfirmar(false, false)).toBe(false);
  });
  it('a frase é o aviso do link que falta', () => {
    expect(frasePainel(true)).toBe('A mensagem vai sem o link do evento.');
    expect(frasePainel(false)).toBe('');
  });
  it('a pergunta do órgão vem antes do aviso do link e também pede confirmação', () => {
    expect(precisaConfirmar(false, true)).toBe(true);
    expect(frasePainel(true, 'Pergunta?')).toBe('Pergunta? A mensagem vai sem o link do evento.');
    expect(frasePainel(false, 'Pergunta?')).toBe('Pergunta?');
  });
  it('"Tentar de novo" só quando a falta de rede é o único motivo', () => {
    expect(soFaltaARede(true, true, false)).toBe(true);
    expect(soFaltaARede(true, true, true)).toBe(false);
    expect(soFaltaARede(false, true, false)).toBe(false);
    expect(soFaltaARede(true, false, false)).toBe(false);
  });
});
