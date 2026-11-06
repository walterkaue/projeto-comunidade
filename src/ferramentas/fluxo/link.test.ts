import { describe, expect, it, vi } from 'vitest';
import { MENSAGEM_DO_LINK_GRANDE, MENSAGEM_LINK_COM_EXEMPLO, MENSAGEM_SEM_LINK } from './apoio';
import { camposDoExemplo, exemploDoFluxo, linkAindaVale, type DadosDoFluxo, type Tipo } from './estado';
import { linkDoFluxo, type DependenciasDoLink } from './link';

const HOJE = new Date(2026, 10, 5);
const BASE = 'https://exemplo.test/projeto/';
const deps = (maximo = 4000): DependenciasDoLink => ({
  codificar: vi.fn(async () => '1rDADOS'),
  completo: (dados, base) => `${base}#/evento/${dados}`,
  maximo,
});

/** Exemplo com título e organização trocados pelos da pessoa (o link só sai assim). */
const daPessoa = (tipo: Tipo, i = 0): DadosDoFluxo => ({
  ...exemploDoFluxo(tipo, i, HOJE),
  titulo: 'Mutirão da horta',
  organizacao: 'Coletivo da Horta',
});

describe('linkDoFluxo', () => {
  it('aviso, conquista e agradecimento não têm link', async () => {
    const d = exemploDoFluxo('aviso', 0, HOJE);
    expect(await linkDoFluxo(d, BASE, deps())).toEqual({ link: '', aviso: '' });
  });

  it('evento e reunião geram o link e guardam a assinatura', async () => {
    for (const tipo of ['evento', 'reuniao'] as const) {
      const d = daPessoa(tipo);
      const r = await linkDoFluxo(d, BASE, deps());
      expect(r.link).toBe(`${BASE}#/evento/1rDADOS`);
      expect(d.link).toBe(r.link);
      expect(linkAindaVale(d)).toBe(true);
    }
  });

  it('link que ainda vale não é gerado de novo', async () => {
    const d = daPessoa('evento');
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
    const d = daPessoa('evento');
    const r = await linkDoFluxo(d, BASE, deps(10));
    expect(r).toEqual({ link: '', aviso: MENSAGEM_DO_LINK_GRANDE });
    expect(d.link).toBe('');
  });

  it('dados recusados pela validação: sem link', async () => {
    const d = daPessoa('evento');
    d.texto = 'Ligue para (11) 91234-5678';
    const r = await linkDoFluxo(d, BASE, deps());
    expect(r).toEqual({ link: '', aviso: MENSAGEM_SEM_LINK });
  });

  it('erro ao codificar não derruba a tela', async () => {
    const d = daPessoa('evento');
    const r = await linkDoFluxo(d, BASE, { ...deps(), codificar: async () => Promise.reject(new Error('x')) });
    expect(r.link).toBe('');
    expect(r.aviso).toBe(MENSAGEM_SEM_LINK);
  });

  it('com o formato de verdade, o link volta e cabe', async () => {
    const d = daPessoa('reuniao', 2);
    const r = await linkDoFluxo(d, BASE);
    expect(r.aviso).toBe('');
    expect(r.link.startsWith(`${BASE}#/evento/1`)).toBe(true);
  });

  it('não gera link enquanto o título ou a organização forem do exemplo', async () => {
    for (const tipo of ['evento', 'reuniao'] as const) {
      const dp = deps();
      const tudo = exemploDoFluxo(tipo, 1, HOJE);
      expect(await linkDoFluxo(tudo, BASE, dp)).toEqual({ link: '', aviso: MENSAGEM_LINK_COM_EXEMPLO });
      const soTitulo = { ...exemploDoFluxo(tipo, 1, HOJE), titulo: 'Outro título' };
      expect((await linkDoFluxo(soTitulo, BASE, dp)).link).toBe('');
      const soOrg = { ...exemploDoFluxo(tipo, 1, HOJE), organizacao: 'Outra organização' };
      expect((await linkDoFluxo(soOrg, BASE, dp)).link).toBe('');
      expect(dp.codificar).not.toHaveBeenCalled();
      expect(tudo.link).toBe('');
    }
  });

  it('com título e organização trocados o link sai, mesmo com o local do exemplo', async () => {
    const d = daPessoa('evento', 3);
    const r = await linkDoFluxo(d, BASE, deps());
    expect(r).toEqual({ link: `${BASE}#/evento/1rDADOS`, aviso: '' });
  });

  it('dados de link com organização do catálogo não geram link; organização parecida gera', async () => {
    const org = exemploDoFluxo('evento', 0, HOJE).organizacao;
    const deLink = (organizacao: string): DadosDoFluxo => {
      const d = daPessoa('evento');
      delete d.doExemplo;
      return { ...d, origem: 'link', organizacao };
    };
    const dp = deps();
    const igual = deLink(org);
    expect(camposDoExemplo(igual)).toEqual(['organizacao']);
    expect(await linkDoFluxo(igual, BASE, dp)).toEqual({ link: '', aviso: MENSAGEM_LINK_COM_EXEMPLO });
    expect(dp.codificar).not.toHaveBeenCalled();
    const parecida = deLink(`${org} Sul`);
    expect((await linkDoFluxo(parecida, BASE, dp)).link).toBe(`${BASE}#/evento/1rDADOS`);
  });

  it('voltar ao exemplo derruba o link que já existia', async () => {
    const d = daPessoa('evento');
    await linkDoFluxo(d, BASE, deps());
    expect(linkAindaVale(d)).toBe(true);
    const ex = exemploDoFluxo('evento', 0, HOJE);
    d.titulo = ex.titulo;
    d.organizacao = ex.organizacao;
    expect(linkAindaVale(d)).toBe(false);
  });
});
