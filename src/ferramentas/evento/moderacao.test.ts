// O script de moderação (scripts/bloquear.mjs) bloqueia o evento, não só o link: a mesma coisa escrita de
// outro jeito (comprimida, com espaço no JSON) continua bloqueada na página.

import { describe, expect, it } from 'vitest';
import { estaBloqueado, impressaoDoLink } from '../../comum/entreTelas';
import { codificar, dadosCanonicos, decodificar, paraBase64Url } from './formato';
import type { Evento } from './validar';

const evento: Evento = {
  titulo: 'Mutirão de limpeza da praça',
  data: '2026-11-14',
  inicio: '08:30',
  fim: '12:00',
  local: 'Praça central, Rua das Flores, 120 - Centro',
  descricao: 'Traga luvas e sacos.',
  organizacao: 'Associação de moradores do Bairro Novo',
};

describe('script de moderação', () => {
  it('bloqueia a forma canônica: o mesmo evento escrito de outro jeito segue bloqueado', async () => {
    // @ts-expect-error script .mjs sem tipos
    const { impressoesDosDados } = await import('../../../scripts/bloquear.mjs');
    const comprimido = await codificar(evento, { comprimir: true });
    const { impressoes, leuOEvento } = await impressoesDosDados(comprimido);
    expect(leuOEvento).toBe(true);
    const lista = { bloqueados: impressoes };

    // Variante: sem compressão e com espaços no JSON.
    const json = JSON.stringify([evento.titulo, evento.data, evento.inicio, evento.fim, evento.local, evento.descricao, evento.organizacao], null, 1);
    const variante = `1r${paraBase64Url(new TextEncoder().encode(json))}`;
    expect(variante).not.toBe(comprimido);
    const lida = await decodificar(variante);
    expect(lida.ok).toBe(true);
    if (!lida.ok) return;
    // A página confere a impressão do link como veio e a da forma canônica (bloqueio.ts).
    const daPagina = await Promise.all([variante, dadosCanonicos(lida.evento)].map(impressaoDoLink));
    expect(daPagina.some((i) => estaBloqueado(i, lista))).toBe(true);
  }, 30000);

  it('link que não abre: bloqueia só o link exato', async () => {
    // @ts-expect-error script .mjs sem tipos
    const { impressoesDosDados } = await import('../../../scripts/bloquear.mjs');
    const r = await impressoesDosDados('1zlixo');
    expect(r.leuOEvento).toBe(false);
    expect(r.impressoes).toEqual([await impressaoDoLink('1zlixo')]);
  }, 30000);
});

describe('script de moderação: dados do link colado numa mensagem', () => {
  it('B-03: corta o que veio depois dos dados e junta só quebras de linha', async () => {
    // @ts-expect-error script .mjs sem tipos
    const { dadosDoLink, dadosValidos } = await import('../../../scripts/bloquear.mjs');
    const base = 'https://x.exemplo/p/#/evento/';
    for (const fim of ['.', ')', ' Obrigada!', '%20Obrigada!', ',']) {
      expect(dadosDoLink(base + '1rAbc-_09' + fim), JSON.stringify(fim)).toBe('1rAbc-_09');
    }
    expect(dadosDoLink(base + 'editar/1rAbc.')).toBe('1rAbc');
    expect(dadosDoLink(base + 'abc\n123 ')).toBe('abc123');
    expect(dadosDoLink(base + 'abc \r\n  123')).toBe('abc123');
    expect(dadosDoLink('sem marca')).toBe('');
    expect(dadosValidos(dadosDoLink(base + '1rAbc.'))).toBe(true);
  });

  it('avisa quem modera quando o que foi cortado parece comando', async () => {
    // @ts-expect-error script .mjs sem tipos
    const { dadosDoLink, sobraSuspeita } = await import('../../../scripts/bloquear.mjs');
    const base = 'https://x.exemplo/p/#/evento/';
    for (const ruim of ['1rAbc$(curl x|sh)', '1rAbc`id`', '1rAbc;rm', '1rAbc&x', `1rAbc ${'a'.repeat(41)}`]) {
      expect(sobraSuspeita(base + ruim), ruim).toBe(true);
      expect(dadosDoLink(base + ruim)).toBe('1rAbc');
    }
    for (const ok of ['1rAbc', '1rAbc.', '1rAbc Obrigada!', '1rAbc%20Valeu']) expect(sobraSuspeita(base + ok), ok).toBe(false);
  });
});
