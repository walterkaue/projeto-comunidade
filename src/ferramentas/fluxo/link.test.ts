import { describe, expect, it, vi } from 'vitest';
import { MENSAGEM_DO_LINK_GRANDE, MENSAGEM_LINK_REMOVIDO, MENSAGEM_LINK_COM_EXEMPLO, MENSAGEM_SEM_INTERNET, MENSAGEM_SEM_LINK } from './apoio';
import { camposDoExemplo, dadosDoCardPreparado, dadosDoEvento, exemploDoFluxo, linkAindaVale, type DadosDoFluxo, type Tipo } from './estado';
import { linkDoFluxo, type DependenciasDoLink } from './link';

const HOJE = new Date(2026, 10, 5);
const BASE = 'https://exemplo.test/projeto/';
const deps = (maximo = 4000): DependenciasDoLink => ({
  codificar: vi.fn(async () => '1rDADOS'),
  completo: (dados, base) => `${base}#/evento/${dados}`,
  maximo,
});

/** Exemplo com título e organização trocados pelos da pessoa (o link só sai com a organização trocada). */
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

  it('"Fazer o card" sem mudança devolve o link original sem codificar; mudar o título gera link novo', async () => {
    const original = `${BASE}#/evento/1rORIGINAL`;
    const d = dadosDoCardPreparado({ modelo: 'evento', titulo: 'Mutirão', data: '2026-11-14', hora: '09:00', local: 'Praça', texto: 'Traga luvas', organizacao: 'Coletivo da Horta', link: original })!;
    const dp = deps();
    expect(await linkDoFluxo(d, BASE, dp)).toEqual({ link: original, aviso: '' });
    expect(dp.codificar).not.toHaveBeenCalled();
    d.titulo = 'Outro título';
    expect((await linkDoFluxo(d, BASE, dp)).link).toBe(`${BASE}#/evento/1rDADOS`);
    expect(dp.codificar).toHaveBeenCalledTimes(1);
  });

  it('"Criar outro" de evento com fim, quebra de linha e descrição longa devolve o link original sem mudança', async () => {
    const original = `${BASE}#/evento/1rORIGINAL`;
    const ev = { titulo: 'Festa', data: '2026-11-14', inicio: '18:00', fim: '20:00', local: 'Quadra', descricao: `Um\nDois ${'coisa boa '.repeat(30)}`, organizacao: 'Coletivo da Horta' };
    const d = dadosDoEvento(ev, original, BASE);
    const dp = deps();
    expect(await linkDoFluxo(d, BASE, dp)).toEqual({ link: original, aviso: '' });
    expect(dp.codificar).not.toHaveBeenCalled();
    d.titulo = 'Outra festa';
    expect((await linkDoFluxo(d, BASE, dp)).link).toBe(`${BASE}#/evento/1rDADOS`);
  });

  it('link original maior que o máximo: sem link e com a mensagem, sem gerar outro', async () => {
    const original = `${BASE}#/evento/1r${'A'.repeat(100)}`;
    const d = dadosDoCardPreparado({ modelo: 'evento', titulo: 'Mutirão', organizacao: 'Coletivo da Horta', link: original })!;
    const dp = deps(50);
    expect(await linkDoFluxo(d, BASE, dp)).toEqual({ link: '', aviso: MENSAGEM_DO_LINK_GRANDE });
    expect(dp.codificar).not.toHaveBeenCalled();
  });

  it('organização do catálogo com link original presente: sem link, com o aviso do exemplo', async () => {
    const original = `${BASE}#/evento/1rORIGINAL`;
    const org = exemploDoFluxo('evento', 0, HOJE).organizacao;
    const d = dadosDoCardPreparado({ modelo: 'evento', titulo: 'Mutirão', organizacao: org, link: original })!;
    expect(d.link).toBe(original);
    const dp = deps();
    expect(await linkDoFluxo(d, BASE, dp)).toEqual({ link: '', aviso: MENSAGEM_LINK_COM_EXEMPLO });
    expect(dp.codificar).not.toHaveBeenCalled();
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

  it('sem rede (o formato do evento não baixa): sem link, com a mensagem de internet e semRede', async () => {
    const d = daPessoa('evento');
    const r = await linkDoFluxo(d, BASE, undefined, () => Promise.reject(new Error('rede')));
    expect(r).toEqual({ link: '', aviso: MENSAGEM_SEM_INTERNET, semRede: true });
    expect(d.link).toBe('');
    // quando a rede volta, a mesma chamada gera o link
    const de_novo = await linkDoFluxo(d, BASE, undefined, async () => deps());
    expect(de_novo.link).toContain('#/evento/');
    expect(de_novo.semRede).toBeUndefined();
  });

  it('texto recusado não é "sem rede", mesmo com a rede caída', async () => {
    const d = daPessoa('evento');
    d.texto = 'Ligue para (11) 91234-5678';
    const r = await linkDoFluxo(d, BASE, undefined, () => Promise.reject(new Error('rede')));
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

  it('não gera link enquanto a organização for do exemplo, mesmo com o título trocado', async () => {
    for (const tipo of ['evento', 'reuniao'] as const) {
      const dp = deps();
      const tudo = exemploDoFluxo(tipo, 1, HOJE);
      expect(await linkDoFluxo(tudo, BASE, dp)).toEqual({ link: '', aviso: MENSAGEM_LINK_COM_EXEMPLO });
      const soTitulo = { ...exemploDoFluxo(tipo, 1, HOJE), titulo: 'Outro título' };
      expect(await linkDoFluxo(soTitulo, BASE, dp)).toEqual({ link: '', aviso: MENSAGEM_LINK_COM_EXEMPLO });
      expect(dp.codificar).not.toHaveBeenCalled();
      expect(tudo.link).toBe('');
    }
  });

  it('com a organização trocada o link sai, mesmo com o título do exemplo (que pode ser o de verdade)', async () => {
    for (const tipo of ['evento', 'reuniao'] as const) {
      const soOrg = { ...exemploDoFluxo(tipo, 1, HOJE), organizacao: 'Outra organização' };
      expect(camposDoExemplo(soOrg)).toContain('titulo');
      expect(await linkDoFluxo(soOrg, BASE, deps())).toEqual({ link: `${BASE}#/evento/1rDADOS`, aviso: '' });
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
    d.organizacao = exemploDoFluxo('evento', 0, HOJE).organizacao;
    expect(linkAindaVale(d)).toBe(false);
  });

  it('evento igual a um removido: sem link, com a mensagem e o motivo; a lista é conferida com a forma canônica', async () => {
    const d = daPessoa('evento');
    const bloqueado = vi.fn(async () => ({ tipo: 'regra', regra: 3 }) as const);
    const r = await linkDoFluxo(d, BASE, { ...deps(), canonico: () => 'canonico', bloqueado });
    expect(r).toEqual({ link: '', aviso: MENSAGEM_LINK_REMOVIDO, removido: { tipo: 'regra', regra: 3 } });
    expect(bloqueado).toHaveBeenCalledWith(['1rDADOS', 'canonico']);
    expect(d.link).toBe('');
  });

  it('evento fora da lista segue com link; lista que falha (null) também', async () => {
    const d = daPessoa('evento');
    const r = await linkDoFluxo(d, BASE, { ...deps(), bloqueado: async () => null });
    expect(r).toEqual({ link: `${BASE}#/evento/1rDADOS`, aviso: '' });
  });

  it('com o bloqueio de verdade, um evento comum não é removido', async () => {
    const r = await linkDoFluxo(daPessoa('reuniao', 2), BASE);
    expect(r.removido).toBeUndefined();
  });
});
