import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Preenche o service worker (public/sw.js) depois do build: a lista de todos os arquivos de assets/
 * (para guardar o app inteiro na instalação, ferramentas sob demanda incluídas) e uma versão tirada
 * desses nomes. Versão nova = sw.js diferente = o navegador instala de novo e troca o cache.
 */
function precargaDoServiceWorker(): Plugin {
  let saida = '';
  let arquivos: string[] = [];
  return {
    name: 'precarga-do-service-worker',
    apply: 'build',
    configResolved(c) {
      saida = resolve(c.root, c.build.outDir);
    },
    generateBundle(_, pacote) {
      arquivos = Object.keys(pacote)
        .filter((f) => f.startsWith('assets/'))
        .sort();
    },
    closeBundle() {
      const sw = join(saida, 'sw.js');
      // Build que falhou também passa aqui: não esconde o erro original.
      if (!existsSync(sw)) return;
      const versao = createHash('sha256').update(arquivos.join('\n')).digest('hex').slice(0, 10);
      const antes = readFileSync(sw, 'utf8');
      const depois = antes
        .replace("const VERSAO = 'pc-dev';", `const VERSAO = 'pc-${versao}';`)
        .replace('const PRECARGA = [];', `const PRECARGA = ${JSON.stringify(arquivos)};`);
      if (!depois.includes(`pc-${versao}`) || !depois.includes('const PRECARGA = ["')) {
        throw new Error('sw.js: não achei as linhas de VERSAO e PRECARGA para preencher.');
      }
      writeFileSync(sw, depois);
    },
  };
}

// Base relativa ('./'): o mesmo build funciona em walterkaue.github.io/projeto-comunidade/
// e, depois, na raiz de um domínio próprio, sem retrabalho. As rotas vão depois do # (src/comum/rotas.ts),
// então o servidor só precisa entregar o index.html.
export default defineConfig({
  base: './',
  plugins: [precargaDoServiceWorker()],
  build: {
    target: 'es2022',
  },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'testes/**/*.test.ts'],
    // O teste de peso faz um build completo.
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
