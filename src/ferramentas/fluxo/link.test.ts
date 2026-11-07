import { describe, expect, it, vi } from 'vitest';
import { MENSAGEM_DO_LINK_GRANDE, MENSAGEM_LINK_REMOVIDO, MENSAGEM_SEM_INTERNET, MENSAGEM_SEM_LINK } from './apoio';
import { decodificar } from '../evento/formato';
import { cheio } from './dados-de-teste';
import { dadosDoCardPreparado, dadosDoEvento, dadosNovos, exemploDoRodizio, linkAindaVale, type DadosDoFluxo, type Tipo } from './estado';
import { dependenciasPadrao, linkDoFluxo, type DependenciasDoLink } from './link';

const HOJE = new Date(2026, 10, 5);
const BASE = 'https://exemplo.test/projeto/';
const deps = (maximo = 4000): DependenciasDoLink => ({
  codificar: vi.fn(async () => '1rDADOS'),
  completo: (dados, base) => `${base}#/evento/${dados}`,
  maximo,
});

/** Dados preenchidos, com título e organização da pessoa. */
const daPessoa = (tipo: Tipo, i = 0): DadosDoFluxo => ({
  ...cheio(tipo, i, HOJE),
  titulo: 'Mutirão da horta',
  organizacao: 'Coletivo da Horta',
});

describe('linkDoFluxo', () => {
  it('aviso, conquista e agradecimento não têm link', async () => {
    const d = cheio('aviso', 0, HOJE);
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

  it('link original com organização do catálogo continua valendo: é o link normal', async () => {
    const original = `${BASE}#/evento/1rORIGINAL`;
    const org = cheio('evento', 0, HOJE).organizacao;
    const d = dadosDoCardPreparado({ modelo: 'evento', titulo: 'Mutirão', organizacao: org, link: original })!;
    expect(d.link).toBe(original);
    const dp = deps();
    expect(await linkDoFluxo(d, BASE, dp)).toEqual({ link: original, aviso: '' });
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

  it('o pedaço da lista de bloqueio que não baixa também é "sem internet" (como o formato)', async () => {
    const d = daPessoa('evento');
    const r = await linkDoFluxo(d, BASE, undefined, () =>
      dependenciasPadrao(
        () => import('../evento/formato'),
        () => Promise.reject(new Error('rede')),
      ),
    );
    expect(r).toEqual({ link: '', aviso: MENSAGEM_SEM_INTERNET, semRede: true });
    expect(d.link).toBe('');
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

  it('com organização e texto vazios o link sai, e os dados dele não têm organização', async () => {
    const ex = exemploDoRodizio('evento', 2, HOJE);
    for (const tipo of ['evento', 'reuniao'] as const) {
      const d = dadosNovos(tipo, exemploDoRodizio(tipo, 2, HOJE));
      d.titulo = 'Mutirão da horta';
      d.data = '2026-11-14';
      d.hora = '18:00';
      d.local = 'Quadra do bairro';
      if (tipo === 'reuniao') d.pauta = 'Contas\nCalendário';
      const r = await linkDoFluxo(d, BASE);
      expect(r.aviso).toBe('');
      expect(r.link.startsWith(`${BASE}#/evento/`)).toBe(true);
      const lido = await decodificar(r.link.slice(r.link.indexOf('#/evento/') + '#/evento/'.length));
      expect(lido.ok).toBe(true);
      if (!lido.ok) continue;
      expect(lido.evento.organizacao).toBe('');
      expect(lido.evento.titulo).toBe('Mutirão da horta');
      if (tipo === 'evento') expect(lido.evento.descricao).toBe('');
      // nada do exemplo vai para o link
      const tudo = JSON.stringify(lido.evento);
      for (const t of [ex.titulo, ex.organizacao, ex.texto, ex.local]) expect(tudo).not.toContain(t);
    }
  });

  it('dados de link com organização do catálogo geram link normal; a organização muda, o link novo sai', async () => {
    const org = cheio('evento', 0, HOJE).organizacao;
    const d: DadosDoFluxo = { ...daPessoa('evento'), origem: 'link', organizacao: org };
    const dp = deps();
    expect((await linkDoFluxo(d, BASE, dp)).link).toBe(`${BASE}#/evento/1rDADOS`);
    expect(dp.codificar).toHaveBeenCalledTimes(1);
  });

  it('mudar a organização derruba o link que já existia', async () => {
    const d = daPessoa('evento');
    await linkDoFluxo(d, BASE, deps());
    expect(linkAindaVale(d)).toBe(true);
    d.organizacao = 'Outra organização';
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
