import { describe, expect, it, vi } from 'vitest';
import { MENSAGEM_DO_LINK_GRANDE, MENSAGEM_SEM_LINK } from './apoio';
import { exemploDoFluxo, linkAindaVale } from './estado';
import { linkDoFluxo, type DependenciasDoLink } from './link';

const HOJE = new Date(2026, 10, 5);
const BASE = 'https://exemplo.test/projeto/';
const deps = (maximo = 4000): DependenciasDoLink => ({
  codificar: vi.fn(async () => '1rDADOS'),
  completo: (dados, base) => `${base}#/evento/${dados}`,
  maximo,
});

describe('linkDoFluxo', () => {
  it('aviso, conquista e agradecimento não têm link', async () => {
    const d = exemploDoFluxo('aviso', 0, HOJE);
    expect(await linkDoFluxo(d, BASE, deps())).toEqual({ link: '', aviso: '' });
  });

  it('evento e reunião geram o link e guardam a assinatura', async () => {
    for (const tipo of ['evento', 'reuniao'] as const) {
      const d = exemploDoFluxo(tipo, 0, HOJE);
      const r = await linkDoFluxo(d, BASE, deps());
      expect(r.link).toBe(`${BASE}#/evento/1rDADOS`);
      expect(d.link).toBe(r.link);
      expect(linkAindaVale(d)).toBe(true);
    }
  });

  it('link que ainda vale não é gerado de novo', async () => {
    const d = exemploDoFluxo('evento', 0, HOJE);
    const dp = deps();
    await linkDoFluxo(d, BASE, dp);
    await linkDoFluxo(d, BASE, dp);
    expect(dp.codificar).toHaveBeenCalledTimes(1);
    d.titulo = 'Outro título';
    expect(linkAindaVale(d)).toBe(false);
    await linkDoFluxo(d, BASE, dp);
    expect(dp.codificar).toHaveBeenCalledTimes(2);
  });

  it('passou do máximo: sem link e com a mensagem', async () => {
    const d = exemploDoFluxo('evento', 0, HOJE);
    const r = await linkDoFluxo(d, BASE, deps(10));
    expect(r).toEqual({ link: '', aviso: MENSAGEM_DO_LINK_GRANDE });
    expect(d.link).toBe('');
  });

  it('dados recusados pela validação: sem link', async () => {
    const d = exemploDoFluxo('evento', 0, HOJE);
    d.texto = 'Ligue para (11) 91234-5678';
    const r = await linkDoFluxo(d, BASE, deps());
    expect(r).toEqual({ link: '', aviso: MENSAGEM_SEM_LINK });
  });

  it('erro ao codificar não derruba a tela', async () => {
    const d = exemploDoFluxo('evento', 0, HOJE);
    const r = await linkDoFluxo(d, BASE, { ...deps(), codificar: async () => Promise.reject(new Error('x')) });
    expect(r.link).toBe('');
    expect(r.aviso).toBe(MENSAGEM_SEM_LINK);
  });

  it('com o formato de verdade, o link volta e cabe', async () => {
    const d = exemploDoFluxo('reuniao', 2, HOJE);
    const r = await linkDoFluxo(d, BASE);
    expect(r.aviso).toBe('');
    expect(r.link.startsWith(`${BASE}#/evento/1`)).toBe(true);
  });
});
