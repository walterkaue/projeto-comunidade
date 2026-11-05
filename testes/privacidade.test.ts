// Privacidade: nada sai do aparelho. O código do site não fala com outro domínio.
// - fetch só com endereço relativo ao próprio site ('./…', '../…' ou new URL('…', import.meta.url));
//   o service worker (public/sw.js) pode repassar pedidos, desde que filtre o próprio domínio;
// - XMLHttpRequest, sendBeacon, WebSocket, EventSource e importScripts: proibidos;
// - nada carregado de outro domínio (script, imagem, fonte, folha de estilo, import dinâmico);
// - exceção única: src/comum/metricas.ts, o script de métricas (só roda quando METRICAS_ID está preenchido).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RAIZ, arquivosEm, relativo } from './arquivos';

const EXCECAO_METRICAS = 'src/comum/metricas.ts';
const SERVICE_WORKER = 'public/sw.js';

const PROIBIDOS: readonly [string, RegExp][] = [
  ['XMLHttpRequest', /\bXMLHttpRequest\b/],
  ['sendBeacon', /\bsendBeacon\b/],
  ['WebSocket', /\bWebSocket\b/],
  ['EventSource', /\bEventSource\b/],
  ['importScripts', /\bimportScripts\b/],
  ['import de outro site', /\bimport\s*\(\s*['"`](https?:)?\/\//],
  ['recurso de outro site', /\b(src|href|srcset|action)\s*=\s*\\?["'`]?(https?:)?\/\/(?!www\.w3\.org)/i],
  ['url() de outro site', /url\(\s*['"]?(https?:)?\/\//i],
  ['@import de outro site', /@import\s+(url\()?\s*['"]?(https?:)?\/\//i],
];

/** fetch( seguido de algo que não é endereço relativo do próprio site. */
const FETCH = /\bfetch\s*\(([^)]{0,120})/g;
const fetchRelativo = (arg: string) => /^\s*['"`]\.{1,2}\//.test(arg) || /^\s*new URL\(\s*['"`]\.{0,2}\/?[^'"`:]*['"`]\s*,\s*import\.meta\.url/.test(arg);

/** Problemas de privacidade num arquivo (vazio = tudo certo). */
export function problemasDeRede(caminho: string, codigo: string): string[] {
  if (caminho === EXCECAO_METRICAS) return [];
  // Comentários de linha não contam (muitos explicam justamente a regra).
  const semComentario = codigo.replace(/^\s*(\/\/|\*|<!--).*$/gm, '');
  const achados = PROIBIDOS.filter(([, re]) => re.test(semComentario)).map(([nome]) => nome);
  for (const m of semComentario.matchAll(FETCH)) {
    const arg = m[1] ?? '';
    if (caminho === SERVICE_WORKER) continue;
    if (!fetchRelativo(arg)) achados.push(`fetch(${arg.trim().slice(0, 40)}…)`);
  }
  if (caminho === SERVICE_WORKER && !/url\.origin\s*!==\s*self\.location\.origin/.test(semComentario)) {
    achados.push('service worker sem o filtro do próprio domínio');
  }
  return achados;
}

describe('privacidade: nenhuma chamada para fora do site', () => {
  const lista = [
    ...arquivosEm(join(RAIZ, 'src'), /\.(ts|css|html)$/),
    ...arquivosEm(join(RAIZ, 'public'), /\.(js|html|css|webmanifest|svg)$/),
    join(RAIZ, 'index.html'),
  ];

  it('acha o que deve achar (o teste funciona)', () => {
    expect(problemasDeRede('src/x.ts', "fetch('https://api.exemplo.com/x')")).toHaveLength(1);
    expect(problemasDeRede('src/x.ts', 'await fetch(url)')).toHaveLength(1);
    expect(problemasDeRede('src/x.ts', 'navigator.sendBeacon("/m", dados)')).toEqual(['sendBeacon']);
    expect(problemasDeRede('src/x.ts', 'new XMLHttpRequest()')).toEqual(['XMLHttpRequest']);
    expect(problemasDeRede('src/x.ts', 'el.innerHTML = `<img src="https://rastreador.exemplo/p.gif">`')).toEqual(['recurso de outro site']);
    expect(problemasDeRede('src/x.css', "@import url('https://fonts.googleapis.com/css2?family=X');")).toContain('@import de outro site');
    expect(problemasDeRede('src/x.ts', "await import('https://cdn.exemplo/lib.js')")).toEqual(['import de outro site']);
    expect(problemasDeRede('public/sw.js', 'fetch(req)')).toEqual(['service worker sem o filtro do próprio domínio']);
  });

  it('deixa passar o que é do próprio site', () => {
    expect(problemasDeRede('src/x.ts', "fetch('./modelos/convite.json')")).toEqual([]);
    expect(problemasDeRede('src/x.ts', "fetch(new URL('./fonte.ttf', import.meta.url))")).toEqual([]);
    expect(problemasDeRede('src/x.ts', "const { encode } = await import('uqr')")).toEqual([]);
    expect(problemasDeRede('src/x.ts', '<a href="mailto:contato@exemplo.org">')).toEqual([]);
    expect(problemasDeRede('public/sw.js', 'if (url.origin !== self.location.origin) return;\nfetch(req)')).toEqual([]);
    expect(problemasDeRede(EXCECAO_METRICAS, "s.src = 'https://gc.zgo.at/count.js'")).toEqual([]);
  });

  it(`nenhum arquivo do site fala com outro domínio (${lista.length} arquivos)`, () => {
    const achados = lista.flatMap((a) => problemasDeRede(relativo(a), readFileSync(a, 'utf8')).map((p) => `${relativo(a)}: ${p}`));
    expect(achados).toEqual([]);
  });
});
