// Apoio do grupo G2 (B3 e B4): servidor próprio que serve o dist/ no caminho /projeto-comunidade/ (como o GitHub
// Pages), com modos de "Wi-Fi com página de login", e o relato de achados em .saidas/g2-log.jsonl.
// Só desenvolvimento. Nada daqui entra no site publicado.

import { appendFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { SAIDAS } from './aparelhos';

const DIST = fileURLToPath(new URL('../../../dist/', import.meta.url));
export const BASE_PATH = '/projeto-comunidade/';

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

export const PAGINA_DO_PORTAL = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Wi-Fi da Rodoviária</title></head>
<body><h1>Wi-Fi da Rodoviária</h1><p>Para usar a internet, aceite os termos e toque em Conectar.</p><button>Conectar</button></body></html>`;

/** normal: serve o dist. portal: tudo responde a página do portal (200, text/html). lista-html: só bloqueados.json vem como HTML do portal. */
export type ModoDoServidor = 'normal' | 'portal' | 'lista-html';

export interface Servidor {
  /** Endereço do app, com barra no fim: http://localhost:<porta>/projeto-comunidade/ */
  url: string;
  origem: string;
  modo: ModoDoServidor;
  /** Conteúdo de bloqueados.json no modo normal (padrão: o do dist). */
  lista?: string;
  pedidos: { caminho: string; modo: ModoDoServidor }[];
  fechar(): Promise<void>;
}

export async function subirServidor(): Promise<Servidor> {
  const s = { modo: 'normal', pedidos: [] } as unknown as Servidor;
  const http: Server = createServer((req, res) => {
    const u = new URL(req.url ?? '/', 'http://x');
    s.pedidos.push({ caminho: u.pathname, modo: s.modo });
    const html = (corpo: string, status = 200) => {
      res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
      res.end(corpo);
    };
    if (s.modo === 'portal') return html(PAGINA_DO_PORTAL);
    if (!u.pathname.startsWith(BASE_PATH)) return html('<h1>404 (como o GitHub Pages)</h1>', 404);
    let rel = decodeURIComponent(u.pathname.slice(BASE_PATH.length));
    if (rel === '') rel = 'index.html';
    if (rel === 'bloqueados.json') {
      if (s.modo === 'lista-html') return html(PAGINA_DO_PORTAL);
      if (s.lista !== undefined) {
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-cache' });
        return void res.end(s.lista);
      }
    }
    const arq = join(DIST, rel);
    if (!arq.startsWith(DIST) || !existsSync(arq) || !statSync(arq).isFile()) return html('<h1>404 (como o GitHub Pages)</h1>', 404);
    const ext = arq.slice(arq.lastIndexOf('.'));
    res.writeHead(200, { 'content-type': TIPOS[ext] ?? 'application/octet-stream', 'cache-control': rel.startsWith('assets/') ? 'max-age=3600' : 'no-cache' });
    res.end(readFileSync(arq));
  });
  await new Promise<void>((ok) => http.listen(0, '127.0.0.1', ok));
  const porta = (http.address() as { port: number }).port;
  // "localhost" (e não 127.0.0.1) para ser o mesmo nome que o resto do projeto usa.
  s.origem = `http://localhost:${porta}`;
  s.url = `${s.origem}${BASE_PATH}`;
  s.fechar = () => new Promise<void>((ok) => http.close(() => ok()));
  return s;
}

/** Anota uma observação da simulação, com a evidência, para montar o relato depois. */
export function anotar(grupo: string, chave: string, dado: unknown): void {
  appendFileSync(`${SAIDAS}/${grupo}-log.jsonl`, JSON.stringify({ chave, dado, quando: new Date().toISOString() }) + '\n');
}

/** Texto visível da página (ou do h1) sem falhar. */
export async function texto(page: Page): Promise<string> {
  return (await page.locator('body').innerText().catch(() => '')).replace(/\s+\n/g, '\n').trim();
}

export const HASH_EVENTO = '#/evento/';

/** Dados (depois de "#/evento/") de um link completo. */
export const dadosDoLink = (link: string): string => link.slice(link.indexOf(HASH_EVENTO) + HASH_EVENTO.length);
