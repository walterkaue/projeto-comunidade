import { describe, expect, it } from 'vitest';
import { impressaoDoLink } from '../../comum/entreTelas';
import { linkBloqueado } from './bloqueio';
import { codificar } from './formato';

const dados = '1rWyJhIl0';

describe('linkBloqueado', () => {
  it('bloqueia quando a impressão está na lista', async () => {
    const lista = { bloqueados: [await impressaoDoLink(dados)] };
    expect(await linkBloqueado(dados, async () => lista)).toBe(true);
  });

  it('a comparação não depende de maiúsculas', async () => {
    const lista = { bloqueados: [(await impressaoDoLink(dados)).toUpperCase()] };
    expect(await linkBloqueado(dados, async () => lista)).toBe(true);
  });

  it('não bloqueia link que não está na lista', async () => {
    const lista = { bloqueados: [await impressaoDoLink('outro')] };
    expect(await linkBloqueado(dados, async () => lista)).toBe(false);
    expect(await linkBloqueado(dados, async () => ({ bloqueados: [] }))).toBe(false);
  });

  it('com vários dados, basta um estar na lista', async () => {
    const lista = { bloqueados: [await impressaoDoLink('canonico')] };
    expect(await linkBloqueado([dados, 'canonico'], async () => lista)).toBe(true);
    expect(await linkBloqueado([dados, 'outro'], async () => lista)).toBe(false);
    expect(await linkBloqueado([], async () => lista)).toBe(false);
  });

  it('lista que não pôde ser lida: mostra o evento', async () => {
    expect(await linkBloqueado(dados, async () => Promise.reject(new Error('sem rede')))).toBe(false);
    expect(await linkBloqueado(dados, async () => null)).toBe(false);
    expect(await linkBloqueado(dados, async () => 'lixo')).toBe(false);
    expect(await linkBloqueado(dados, async () => ({ bloqueados: 'x' }))).toBe(false);
    expect(await linkBloqueado(dados, async () => ({ bloqueados: [1, null, {}] }))).toBe(false);
  });

  it('impressão que falha: mostra o evento', async () => {
    const lista = { bloqueados: [await impressaoDoLink(dados)] };
    expect(await linkBloqueado(dados, async () => lista, () => Promise.reject(new Error('sem crypto')))).toBe(false);
  });

  it('funciona de ponta a ponta com dados de verdade', async () => {
    const d = await codificar({
      titulo: 'Evento removido',
      data: '2026-11-14',
      inicio: '08:30',
      fim: '',
      local: 'Praça',
      descricao: '',
      organizacao: '',
    });
    const lista = { bloqueados: [await impressaoDoLink(d)] };
    expect(await linkBloqueado(d, async () => lista)).toBe(true);
  });
});
