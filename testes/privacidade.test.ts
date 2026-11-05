// Privacidade: nada sai do aparelho. O código do site não fala com outro domínio.
// - fetch só com endereço relativo ao próprio site ('./…', '../…' ou new URL('./…', import.meta.url));
//   o service worker (public/sw.js) pode repassar pedidos, desde que filtre o próprio domínio;
// - XMLHttpRequest, sendBeacon, WebSocket, EventSource, RTCPeerConnection, importScripts e acesso
//   disfarçado (window['fe'+'tch']): proibidos;
// - nada carregado ou aberto em outro domínio por código (script, imagem, fonte, CSS, import, Worker,
//   setAttribute, window.open, location.assign, meta refresh, ping);
// - link comum para outro site (<a href="https://…">) pode: não baixa nada, e o toque passa pelo aviso de
//   saída (src/comum/saida.ts);
// - o index.html tem a CSP que trava isso também no navegador;
// - exceção única: src/comum/metricas.ts pode carregar o script de métricas (desligado por padrão),
//   mas nem lá vale fetch, sendBeacon ou XHR.
// O build final também é varrido (testes/peso.test.ts, que já faz o build).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { METRICAS_ID } from '../src/comum/marca';
import { RAIZ, arquivosEm, relativo } from './arquivos';

const EXCECAO_METRICAS = 'src/comum/metricas.ts';
const SERVICE_WORKER = 'public/sw.js';

/** Outro domínio: "https://", "http://" ou "//host". O namespace do SVG (w3.org/2000/svg etc.) não é pedido. */
const FORA = String.raw`(?:https?:)?\/\/(?!www\.w3\.org\/)`;

const SEMPRE_PROIBIDOS: readonly [string, RegExp][] = [
  ['XMLHttpRequest', /\bXMLHttpRequest\b/],
  ['sendBeacon', /\bsendBeacon\b|['"`]send['"`]\s*\+\s*['"`]Beacon/],
  ['WebSocket', /\bWebSocket\b/],
  ['EventSource', /\bEventSource\b/],
  ['RTCPeerConnection', /\bRTCPeerConnection\b/],
  ['importScripts', /\bimportScripts\b/],
  ['fetch disfarçado', /\[\s*['"`]fe['"`]\s*\+|=\s*(window\.|globalThis\.|self\.)?fetch\s*[;,)\n]|\bfetch\s*\.\s*(call|apply|bind)\b/],
];

const CARREGA_DE_FORA: readonly [string, RegExp][] = [
  ['import de outro site', new RegExp(String.raw`\bimport\s*(\(\s*|[^'"\x60;]*\bfrom\s*)['"\x60]${FORA}`)],
  ['import estático de outro site', new RegExp(String.raw`^\s*import\s+['"\x60]${FORA}`, 'm')],
  ['recurso de outro site', new RegExp(String.raw`\b(src|srcset|poster|action|formaction|ping|data)\s*[=:]\s*\\?['"\x60]?\s*${FORA}`, 'i')],
  ['<link> de outro site', new RegExp(String.raw`<link\b[^>]*\bhref\s*=\s*\\?['"\x60]?${FORA}`, 'i')],
  ['setAttribute de outro site', new RegExp(String.raw`setAttribute\(\s*['"\x60](src|href|srcset|action|poster)['"\x60]\s*,\s*['"\x60]${FORA}`, 'i')],
  ['abre outro site por código', new RegExp(String.raw`\b(window\.open|location\.(assign|replace)|location\.href\s*=|new\s+(Shared)?Worker)\s*\(?\s*['"\x60]${FORA}`)],
  ['meta refresh', /http-equiv\s*=\s*['"]?refresh/i],
  ['url() de outro site', new RegExp(String.raw`url\(\s*['"]?${FORA}`, 'i')],
  ['@import de outro site', new RegExp(String.raw`@import\s+(url\()?\s*['"]?${FORA}`, 'i')],
];

/** fetch( seguido de algo que não é endereço relativo do próprio site. */
const FETCH = /\bfetch\s*\(([^)]{0,120})/g;
const fetchRelativo = (arg: string) =>
  /^\s*['"`]\.{1,2}\//.test(arg) || /^\s*new URL\(\s*['"`]\.{1,2}\/[^'"`:]*['"`]\s*,\s*import\.meta\.url/.test(arg);

/** Tira comentários (de linha, de bloco e de HTML) sem apagar o código que divide a linha com eles. */
export function semComentarios(codigo: string): string {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

/** Problemas de privacidade num arquivo (vazio = tudo certo). */
export function problemasDeRede(caminho: string, codigo: string): string[] {
  const limpo = semComentarios(codigo);
  const regras = caminho === EXCECAO_METRICAS ? SEMPRE_PROIBIDOS : [...SEMPRE_PROIBIDOS, ...CARREGA_DE_FORA];
  const achados = regras.filter(([, re]) => re.test(limpo)).map(([nome]) => nome);
  if (caminho !== SERVICE_WORKER) {
    for (const m of limpo.matchAll(FETCH)) {
      const arg = m[1] ?? '';
      if (!fetchRelativo(arg)) achados.push(`fetch(${arg.trim().slice(0, 40)}…)`);
    }
  } else if (!/url\.origin\s*!==\s*self\.location\.origin/.test(limpo)) {
    achados.push('service worker sem o filtro do próprio domínio');
  }
  return achados;
}

describe('privacidade: nenhuma chamada para fora do site', () => {
  const lista = [
    ...arquivosEm(join(RAIZ, 'src'), /\.(ts|tsx|js|mjs|css|html|svg|json)$/),
    ...arquivosEm(join(RAIZ, 'public'), /\.(js|html|css|webmanifest|svg|json)$/),
    join(RAIZ, 'index.html'),
  ];

  it('acha o que deve achar (o teste funciona)', () => {
    const casos = [
      "fetch('https://api.exemplo.com/x')",
      'await fetch(url)',
      "fetch(new URL('//outro.exemplo/x', import.meta.url))",
      'navigator.sendBeacon("/m", dados)',
      "navigator['send' + 'Beacon']('/m')",
      "window['fe' + 'tch']('https://x')",
      'const f = fetch;',
      'globalThis.fetch.call(null, u)',
      'new XMLHttpRequest()',
      'new RTCPeerConnection({ iceServers })',
      'el.innerHTML = `<img src="https://rastreador.exemplo/p.gif">`',
      "img.setAttribute('src', 'https://rastreador.exemplo/p.gif')",
      "const icone = { src: 'https://cdn.exemplo/i.png' }",
      "new Image().src = 'https://rastreador.exemplo/p.gif'",
      "window.open('https://outro.exemplo/?d=' + dados)",
      "location.assign('https://outro.exemplo/?d=' + dados)",
      "location.href = 'https://outro.exemplo/?d=' + dados",
      "new Worker('https://cdn.exemplo/w.js')",
      '<a ping="https://rastreador.exemplo/p" href="#">',
      '<meta http-equiv="refresh" content="0;url=https://outro.exemplo">',
      '<link rel="preconnect" href="https://fonts.gstatic.com">',
      "@import url('https://fonts.googleapis.com/css2?family=X');",
      '@font-face { src: url(https://cdn.exemplo/f.woff2) }',
      "await import('https://cdn.exemplo/lib.js')",
      "import { x } from 'https://cdn.exemplo/lib.js'",
      "<!-- comentário --><script src=\"https://cdn.exemplo/a.js\"></script>",
      "/* explicação */ fetch('https://x')",
      '<img src="https://www.w3.org.rastreador.exemplo/p.gif">',
    ];
    for (const c of casos) expect(problemasDeRede('src/x.ts', c), c).not.toEqual([]);
    expect(problemasDeRede('public/sw.js', 'fetch(req)')).toEqual(['service worker sem o filtro do próprio domínio']);
    expect(problemasDeRede(EXCECAO_METRICAS, "fetch('https://x?' + location.hash)")).not.toEqual([]);
  });

  it('deixa passar o que é do próprio site e link comum', () => {
    const casos = [
      "fetch('./modelos/convite.json')",
      "fetch(new URL('./fonte.ttf', import.meta.url))",
      "const { encode } = await import('uqr')",
      '<a href="mailto:contato@exemplo.org">',
      '<a class="botao" href="https://wa.me/?text=oi">WhatsApp</a>',
      "a.href = `https://wa.me/?text=${texto}`",
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
      '// fetch("https://x") num comentário explicando a regra',
      "const s = 'texto com // barras'; ",
    ];
    for (const c of casos) expect(problemasDeRede('src/x.ts', c), c).toEqual([]);
    expect(problemasDeRede('public/sw.js', 'if (url.origin !== self.location.origin) return;\nfetch(req)')).toEqual([]);
    expect(problemasDeRede(EXCECAO_METRICAS, "s.src = 'https://gc.zgo.at/count.js'")).toEqual([]);
  });

  it('o index.html trava a rede com CSP', () => {
    const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');
    const csp = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html)?.[1] ?? '';
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/connect-src 'self'( data:)?( blob:)?;/);
    expect(csp).toMatch(/script-src 'self';/);
  });

  it('a CSP só libera a contagem de visitas quando as métricas estão ligadas', () => {
    const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');
    const csp = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html)?.[1] ?? '';
    const imgSrc = /img-src ([^;]+);/.exec(csp)?.[1] ?? '';
    if (METRICAS_ID) {
      expect(imgSrc.split(' ')).toContain(`https://${METRICAS_ID}.goatcounter.com`);
    } else {
      expect(csp).not.toMatch(/goatcounter|zgo\.at/);
    }
    // Nunca pelo connect-src nem pelo script-src: a contagem é só uma imagem.
    expect(csp).not.toMatch(/(connect|script)-src[^;]*goatcounter/);
  });

  it(`nenhum arquivo do site fala com outro domínio (${lista.length} arquivos)`, () => {
    const achados = lista.flatMap((a) => problemasDeRede(relativo(a), readFileSync(a, 'utf8')).map((p) => `${relativo(a)}: ${p}`));
    expect(achados).toEqual([]);
  });
});
