import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  dadosDoLinkDoEvento,
  ehLinkDoEvento,
  estaBloqueado,
  impressaoDoLink,
  lerDadosDoCard,
  lerLinkDenunciado,
  linkDeDenuncia,
  linkDoCard,
} from './entreTelas';

const BASE = 'https://walterkaue.github.io/projeto-comunidade/#/cards';
const EVENTO = 'https://walterkaue.github.io/projeto-comunidade/#/evento/abc123';

describe('link do card preenchido', () => {
  it('ida e volta', () => {
    const dados = {
      modelo: 'evento' as const,
      titulo: 'Mutirão da praça',
      data: '2026-11-21',
      hora: '09:00',
      local: 'Praça Central & arredores',
      texto: 'Traga luva.',
      organizacao: 'Associação de Moradores',
      link: EVENTO,
    };
    const link = linkDoCard(dados);
    expect(link.startsWith('#/cards/')).toBe(true);
    expect(lerDadosDoCard(link.slice('#/cards/'.length), BASE)).toEqual(dados);
  });

  it('descarta o que não vale e corta o comprido', () => {
    const resto = new URLSearchParams({
      modelo: 'comicio',
      data: '21/11/2026',
      hora: '25:00',
      titulo: 'x'.repeat(200),
      link: 'https://outro.exemplo/#/evento/abc',
      texto: '  linha\num  ',
    }).toString();
    const d = lerDadosDoCard(resto, BASE);
    expect(d.modelo).toBeUndefined();
    expect(d.data).toBeUndefined();
    expect(d.hora).toBeUndefined();
    expect(d.link).toBeUndefined();
    expect(d.titulo).toHaveLength(80);
    expect(d.texto).toBe('linha um');
  });

  it('não lança com lixo', () => {
    expect(lerDadosDoCard('%E0%A4%A', BASE)).toEqual({});
    expect(lerDadosDoCard('', BASE)).toEqual({});
  });
});

describe('link de evento do próprio site', () => {
  it('aceita só evento deste site', () => {
    expect(ehLinkDoEvento(EVENTO, BASE)).toBe(true);
    expect(ehLinkDoEvento('https://walterkaue.github.io/projeto-comunidade/index.html#/evento/abc', BASE)).toBe(true);
    expect(ehLinkDoEvento('https://walterkaue.github.io/outro-projeto/#/evento/abc', BASE)).toBe(false);
    expect(ehLinkDoEvento('https://exemplo.org/projeto-comunidade/#/evento/abc', BASE)).toBe(false);
    expect(ehLinkDoEvento('http://walterkaue.github.io/projeto-comunidade/#/evento/abc', BASE)).toBe(false);
    expect(ehLinkDoEvento('https://walterkaue.github.io/projeto-comunidade/?x=1#/evento/abc', BASE)).toBe(false);
    expect(ehLinkDoEvento('https://walterkaue.github.io/projeto-comunidade/#/evento/', BASE)).toBe(false);
    expect(ehLinkDoEvento('https://walterkaue.github.io/projeto-comunidade/#/cards/abc', BASE)).toBe(false);
    expect(ehLinkDoEvento('javascript:alert(1)//#/evento/abc', BASE)).toBe(false);
    expect(ehLinkDoEvento('nada', BASE)).toBe(false);
  });

  it('tira os dados do link', () => {
    expect(dadosDoLinkDoEvento(EVENTO, BASE)).toBe('abc123');
    expect(dadosDoLinkDoEvento('https://exemplo.org/#/evento/abc', BASE)).toBe('');
  });
});

describe('denúncia', () => {
  it('ida e volta, só para evento deste site', () => {
    const link = linkDeDenuncia(EVENTO);
    expect(link.startsWith('#/denunciar/')).toBe(true);
    expect(lerLinkDenunciado(link.slice('#/denunciar/'.length), BASE)).toBe(EVENTO);
    expect(lerLinkDenunciado(encodeURIComponent('https://golpe.exemplo/'), BASE)).toBe('');
    expect(lerLinkDenunciado('%E0%A4%A', BASE)).toBe('');
    expect(lerLinkDenunciado('', BASE)).toBe('');
  });
});

describe('lista de bloqueio', () => {
  it('impressão é o SHA-256 dos dados (igual ao do Node, usado no script de moderação)', async () => {
    const dados = 'abc123';
    expect(await impressaoDoLink(dados)).toBe(createHash('sha256').update(dados).digest('hex'));
  });

  it('confere a lista com tolerância', async () => {
    const imp = await impressaoDoLink('abc123');
    expect(estaBloqueado(imp, { bloqueados: [imp.toUpperCase()] })).toBe(true);
    expect(estaBloqueado(imp, { bloqueados: [] })).toBe(false);
    expect(estaBloqueado(imp, null)).toBe(false);
    expect(estaBloqueado(imp, { bloqueados: 'tudo' })).toBe(false);
    expect(estaBloqueado(imp, [imp])).toBe(false);
  });
});

describe('script de moderação', () => {
  it('calcula a mesma impressão que o site', async () => {
    // @ts-expect-error script .mjs sem tipos
    const { dadosDoLink, impressao } = await import('../../scripts/bloquear.mjs');
    expect(dadosDoLink(EVENTO)).toBe('abc123');
    expect(dadosDoLink('https://exemplo.org/')).toBe('');
    expect(impressao('abc123')).toBe(await impressaoDoLink('abc123'));
  });
});
