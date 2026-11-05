// Service worker do Projeto Comunidade (PWA). Sem push, sem notificação.
// Regra: a página sempre vem da rede quando há conexão (deploy novo aparece na hora); o cache só
// acelera o que nunca muda (arquivos com hash do build) e segura o site se a conexão cair.
// Nada de outro domínio passa por aqui, e este arquivo só chama fetch para o próprio site.
// Todos os caminhos são relativos ao escopo, então o mesmo arquivo serve em /projeto-comunidade/ e em /.

// VERSAO e PRECARGA são preenchidas no build (plugin em vite.config.ts): a versão muda a cada deploy,
// o que faz o navegador instalar o service worker de novo e guardar o app novo inteiro.
const VERSAO = 'pc-dev';
const PRECARGA = [];
const CACHE_PAGINA = `${VERSAO}-pagina`;
const CACHE_ARQUIVOS = `${VERSAO}-arquivos`;

const ESCOPO = new URL('./', self.registration.scope);
const caminho = (relativo) => new URL(relativo, ESCOPO);
const PAGINA = caminho('./').href;
const OFFLINE = caminho('offline.html').href;
const PREFIXO_ASSETS = caminho('assets/').pathname;
const PREFIXO_FONTES = caminho('fontes/').pathname;
const PREFIXO_ICONES = caminho('icones/').pathname;

// Arquivos fixos guardados na instalação (a tela offline vai junto com a página).
const FIXOS = ['manifest.webmanifest', 'favicon.svg', 'icones/icone-192.png', 'icones/icone-512.png', 'icones/apple-touch-icon.png'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(precarregar().then(() => self.skipWaiting()));
});

// Guarda a página, a tela offline, o manifest, os ícones e TODO o app: os arquivos de assets/ da
// lista do build (inclusive as ferramentas carregadas sob demanda, para abrirem sem rede), mais o que
// o index.html e os CSS citam (garantia para quando a lista estiver vazia, em `npm run dev`).
// Se algo falhar, a instalação segue: nada aqui é obrigatório.
async function precarregar() {
  const cachePagina = await caches.open(CACHE_PAGINA);
  const cacheArquivos = await caches.open(CACHE_ARQUIVOS);
  const guardar = async (cache, url) => {
    try {
      const resp = await fetch(url, { cache: 'reload' });
      if (resp.ok) await cache.put(url, resp.clone());
      return resp;
    } catch {
      return null;
    }
  };

  const pagina = await guardar(cachePagina, PAGINA);
  const html = pagina ? await pagina.text() : '';
  const alvos = new Set(PRECARGA.map((f) => caminho(f).href));
  for (const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const url = new URL(m[1], ESCOPO);
    if (url.origin === self.location.origin && url.pathname.startsWith(PREFIXO_ASSETS)) alvos.add(url.href);
  }
  await guardar(cachePagina, OFFLINE);
  await Promise.all(FIXOS.map((f) => guardar(cacheArquivos, caminho(f).href)));
  await Promise.all(
    [...alvos].map(async (href) => {
      const resp = await guardar(cacheArquivos, href);
      if (!resp || !href.endsWith('.css')) return;
      // Fontes e outros arquivos citados dentro do CSS (caminho relativo ao próprio CSS).
      const css = await resp.clone().text();
      for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
        if (m[1].startsWith('data:')) continue;
        const url = new URL(m[1], href);
        if (url.origin === self.location.origin) await guardar(cacheArquivos, url.href);
      }
    }),
  );
}

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      // Só os caches deste site ('pc-'): no github.io a origem é dividida com outros projetos do mesmo dono.
      await Promise.all(nomes.filter((n) => n.startsWith('pc-') && !n.startsWith(`${VERSAO}-`)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // A página: rede primeiro; sem rede, a última guardada; se nem ela existir, a tela offline.
  if (req.mode === 'navigate') {
    evento.respondWith(redePrimeiro(req));
    return;
  }
  // Arquivos do build têm hash no nome e nunca mudam: cache primeiro.
  if (url.pathname.startsWith(PREFIXO_ASSETS)) {
    evento.respondWith(cachePrimeiro(req));
    return;
  }
  // Fontes, ícones e favicon: devolve o que tem e atualiza por trás.
  if (url.pathname.startsWith(PREFIXO_FONTES) || url.pathname.startsWith(PREFIXO_ICONES) || url.pathname === caminho('favicon.svg').pathname) {
    evento.respondWith(cacheEAtualiza(req));
  }
});

// Internet fraca: se a rede não responder em alguns segundos e já houver página guardada, usa a guardada
// (a resposta da rede, quando chegar, atualiza o cache para a próxima vez).
const ESPERA_DA_REDE_MS = 4000;

async function redePrimeiro(req) {
  const cache = await caches.open(CACHE_PAGINA);
  const daRede = fetch(req).then(async (resp) => {
    // Só guarda como "a página" o próprio app (escopo ou index.html em HTML), nunca o og.png ou o manifest aberto direto.
    const ehOApp = [caminho('./').pathname, caminho('index.html').pathname].includes(new URL(req.url).pathname);
    if (resp.ok && ehOApp && (resp.headers.get('content-type') ?? '').includes('text/html')) await cache.put(PAGINA, resp.clone());
    return resp;
  });
  daRede.catch(() => {}); // se a guardada já respondeu, a falha da rede não importa
  const guardada = () => cache.match(PAGINA);
  const demorou = new Promise((ok) => setTimeout(ok, ESPERA_DA_REDE_MS)).then(guardada);
  try {
    const primeira = await Promise.race([daRede, demorou]);
    return primeira ?? (await daRede);
  } catch {
    return (await guardada()) ?? (await cache.match(OFFLINE)) ?? Response.error();
  }
}

async function cachePrimeiro(req) {
  const cache = await caches.open(CACHE_ARQUIVOS);
  const guardada = await cache.match(req);
  if (guardada) return guardada;
  const resp = await fetch(req);
  if (resp.ok) await cache.put(req, resp.clone());
  return resp;
}

async function cacheEAtualiza(req) {
  const cache = await caches.open(CACHE_ARQUIVOS);
  const guardada = await cache.match(req);
  const nova = fetch(req)
    .then(async (resp) => {
      if (resp.ok) await cache.put(req, resp.clone());
      return resp;
    })
    .catch(() => guardada ?? Response.error());
  return guardada ?? nova;
}
