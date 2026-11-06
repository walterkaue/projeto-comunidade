// Service worker (public/sw.js) rodando em node, com cache e rede de mentira. Confere as regras que não dá para
// ver no navegador sem desligar a rede: onde o app abre sem internet e o que sobrevive à troca de versão.

import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const ESCOPO = 'https://walterkaue.github.io/projeto-comunidade/';
const FONTE = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

type Ouvinte = (evento: unknown) => void;

class CacheFalso {
  itens = new Map<string, Response>();
  async match(req: Request | string) {
    return this.itens.get(typeof req === 'string' ? req : req.url)?.clone();
  }
  async put(req: Request | string, resp: Response) {
    this.itens.set(typeof req === 'string' ? req : req.url, resp);
  }
}

function montar(versao: string, opcoes: { caches?: Map<string, CacheFalso>; rede?: (url: string) => Response | null } = {}) {
  const guardados = opcoes.caches ?? new Map<string, CacheFalso>();
  const ouvintes = new Map<string, Ouvinte>();
  const caches = {
    async open(nome: string) {
      if (!guardados.has(nome)) guardados.set(nome, new CacheFalso());
      return guardados.get(nome)!;
    },
    async keys() {
      return [...guardados.keys()];
    },
    async delete(nome: string) {
      return guardados.delete(nome);
    },
    async match(req: Request | string, o?: { cacheName?: string }) {
      const nomes = o?.cacheName ? [o.cacheName] : [...guardados.keys()];
      for (const n of nomes) {
        const r = await guardados.get(n)?.match(req);
        if (r) return r;
      }
      return undefined;
    },
  };
  // Sem `rede`, o aparelho está sem internet.
  const fetch = async (req: Request | string) => {
    const url = typeof req === 'string' ? req : req.url;
    const r = opcoes.rede?.(url);
    if (!r) throw new TypeError('sem rede');
    return r;
  };
  const self = {
    registration: { scope: ESCOPO },
    location: new URL(`${ESCOPO}sw.js`),
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener: (tipo: string, f: Ouvinte) => ouvintes.set(tipo, f),
  };
  const fonte = FONTE.replace(/const VERSAO = '[^']*';/, `const VERSAO = '${versao}';`);
  runInNewContext(fonte, { self, caches, fetch, Response, Request, URL, setTimeout, console });

  async function esperar(tipo: string, extra: object = {}) {
    let promessa: Promise<unknown> = Promise.resolve();
    ouvintes.get(tipo)!({ ...extra, waitUntil: (p: Promise<unknown>) => (promessa = p) });
    await promessa;
  }
  async function navegar(url: string): Promise<Response> {
    let resposta: Promise<Response> | undefined;
    const request = { url, method: 'GET', mode: 'navigate' };
    ouvintes.get('fetch')!({ request, respondWith: (r: Promise<Response>) => (resposta = r) });
    if (!resposta) throw new Error('o service worker não respondeu');
    return resposta;
  }
  return { guardados, instalar: () => esperar('install'), ativar: () => esperar('activate'), navegar };
}

const html = (texto: string) => new Response(texto, { headers: { 'content-type': 'text/html' } });
const json = (texto: string) => new Response(texto, { headers: { 'content-type': 'application/json' } });

/** Rede de um site no ar: o app, a tela offline e a lista de bloqueio. */
const siteNoAr = (lista = '{"bloqueados":["aaa"]}') => (url: string) => {
  const caminho = new URL(url).pathname;
  if (caminho === '/projeto-comunidade/' || caminho === '/projeto-comunidade/index.html') return html('APP');
  if (caminho === '/projeto-comunidade/offline.html') return html('OFFLINE');
  if (caminho === '/projeto-comunidade/bloqueados.json') return json(lista);
  return new Response('não achei', { status: 404 });
};

describe('service worker: onde o app abre sem rede (auditoria do fluxo, B7)', () => {
  async function instaladoESemRede() {
    const caches = new Map<string, CacheFalso>();
    const sw = montar('pc-v1', { caches, rede: siteNoAr() });
    await sw.instalar();
    await sw.ativar();
    return montar('pc-v1', { caches });
  }

  it('na pasta do app e no index.html, abre a página guardada', async () => {
    const sw = await instaladoESemRede();
    expect(await (await sw.navegar(ESCOPO)).text()).toBe('APP');
    expect(await (await sw.navegar(`${ESCOPO}?fbclid=x#/fazer/evento`)).text()).toBe('APP');
    expect(await (await sw.navegar(`${ESCOPO}index.html#/evento/1rAAA`)).text()).toBe('APP');
  });

  it('em outro caminho, mostra a tela offline e nunca o app', async () => {
    const sw = await instaladoESemRede();
    expect(await (await sw.navegar(`${ESCOPO}qualquer-texto`)).text()).toBe('OFFLINE');
    expect(await (await sw.navegar(`${ESCOPO}a/b#/evento/1rAAA`)).text()).toBe('OFFLINE');
  });

  it('com rede, outro caminho recebe o que o servidor mandar (404)', async () => {
    const sw = montar('pc-v1', { rede: siteNoAr() });
    const r = await sw.navegar(`${ESCOPO}qualquer-texto`);
    expect(r.status).toBe(404);
  });
});
