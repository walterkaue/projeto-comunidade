// Lista os arquivos da plataforma que os testes de regra varrem. Só textos e código que o site
// entrega (src/, public/, index.html); testes e documentos ficam de fora.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = fileURLToPath(new URL('..', import.meta.url));

export function arquivosEm(pasta: string, extensoes: RegExp): string[] {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivosEm(caminho, extensoes);
    return extensoes.test(nome) && !/\.test\.ts$/.test(nome) ? [caminho] : [];
  });
}

/** Caminho com barras normais, a partir da raiz do repositório (para mensagens e exceções). */
export const relativo = (caminho: string): string => relative(RAIZ, caminho).replace(/\\/g, '/');
