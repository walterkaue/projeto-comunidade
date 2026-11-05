// Peso: o JS + CSS que a primeira visita baixa fica em até 80 KB gzip (internet fraca, plano de dados).
// Faz um build de verdade numa pasta temporária e soma o que o index.html carrega na abertura
// (script de entrada, modulepreload e folhas de estilo). As ferramentas baixam sob demanda e não contam,
// mas o teste confere que elas NÃO entraram no pacote inicial.

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RAIZ } from './arquivos';

export const LIMITE_KB = 80;

/** Arquivos de assets/ que o index.html carrega logo de cara (JS e CSS). */
export function arquivosIniciais(html: string): string[] {
  const achados = new Set<string>();
  for (const m of html.matchAll(/<(script|link)\b[^>]*>/g)) {
    const tag = m[0];
    const alvo = /(?:src|href)="([^"]+)"/.exec(tag)?.[1];
    if (!alvo || !/\.(js|css)$/.test(alvo)) continue;
    const ehCarga = m[1] === 'script' || /rel="(stylesheet|modulepreload)"/.test(tag);
    if (ehCarga) achados.add(alvo.replace(/^\.\//, ''));
  }
  return [...achados];
}

describe('peso do pacote inicial', () => {
  let saida = '';
  let html = '';
  /** Módulos de código-fonte que vão no pacote inicial (entrada + o que ela importa de forma estática). */
  let modulosIniciais: string[] = [];

  beforeAll(async () => {
    saida = mkdtempSync(join(tmpdir(), 'pc-peso-'));
    const resultado = await build({ root: RAIZ, logLevel: 'silent', build: { outDir: saida, emptyOutDir: true } });
    type Pedaco = { type: string; fileName: string; isEntry?: boolean; imports?: string[]; moduleIds?: string[] };
    const saidas = (Array.isArray(resultado) ? resultado : [resultado]).flatMap((r) => (r as { output: Pedaco[] }).output);
    const porNome = new Map(saidas.map((p) => [p.fileName, p]));
    const visitar = (p: Pedaco | undefined, vistos: Set<string>): void => {
      if (!p || p.type !== 'chunk' || vistos.has(p.fileName)) return;
      vistos.add(p.fileName);
      modulosIniciais.push(...(p.moduleIds ?? []).map((m) => m.replace(/\\/g, '/')));
      (p.imports ?? []).forEach((i) => visitar(porNome.get(i), vistos));
    };
    const vistos = new Set<string>();
    saidas.filter((p) => p.isEntry).forEach((p) => visitar(p, vistos));
    html = readFileSync(join(saida, 'index.html'), 'utf8');
  });

  afterAll(() => {
    if (saida) rmSync(saida, { recursive: true, force: true });
  });

  it('lê os arquivos iniciais do index.html (o teste funciona)', () => {
    expect(
      arquivosIniciais(
        '<script type="module" crossorigin src="./assets/index-a.js"></script><link rel="modulepreload" href="./assets/x.js"><link rel="stylesheet" href="./assets/index.css"><link rel="icon" href="./favicon.svg">',
      ),
    ).toEqual(['assets/index-a.js', 'assets/x.js', 'assets/index.css']);
  });

  it(`JS + CSS inicial até ${LIMITE_KB} KB gzip, sem as ferramentas`, () => {
    const iniciais = arquivosIniciais(html);
    expect(iniciais.some((a) => a.endsWith('.js'))).toBe(true);
    const tamanhos = iniciais.map((a) => ({ a, kb: gzipSync(readFileSync(join(saida, a)), { level: 9 }).length / 1024 }));
    const total = tamanhos.reduce((s, t) => s + t.kb, 0);
    console.log(`Pacote inicial: ${total.toFixed(1)} KB gzip (${tamanhos.map((t) => `${t.a} ${t.kb.toFixed(1)}`).join(', ')})`);
    expect(total).toBeLessThanOrEqual(LIMITE_KB);
    // Cada ferramenta (e as páginas institucionais) é um arquivo à parte, baixado só quando abre:
    // nenhum módulo delas pode estar no pacote inicial, nem por import estático.
    expect(modulosIniciais.some((m) => m.endsWith('/src/main.ts'))).toBe(true);
    expect(modulosIniciais.filter((m) => /\/src\/(ferramentas\/|paginas\/index\.ts)/.test(m))).toEqual([]);
  });
});
