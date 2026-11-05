// A faixa "em revisão jurídica" só pode sair junto com LANCAMENTO_PUBLICO = true.
// Este teste falha quando a constante vira true e a faixa ainda está no código.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANCAMENTO_PUBLICO } from '../comum/marca';
import { paginaEmHtml } from './render';
import { PAGINAS } from './textos';

const MARCA = 'em revisão jurídica';
const pasta = __dirname;
const fontes = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? fontes(join(dir, e.name)) : /\.ts$/.test(e.name) && !/\.test\.ts$/.test(e.name) ? [join(dir, e.name)] : [],
  );

describe('faixa de revisão jurídica', () => {
  it('Termos, Privacidade e Regras mostram a faixa enquanto o lançamento não é público', () => {
    for (const nome of ['termos', 'privacidade', 'regras'] as const) {
      const p = PAGINAS[nome]!;
      expect(paginaEmHtml(p, '', false)).toContain(MARCA);
      expect(paginaEmHtml(p, '', true)).not.toContain(MARCA);
    }
  });

  it('as outras páginas não levam a faixa', () => {
    for (const nome of ['sobre', 'denunciar', 'contato'] as const) {
      expect(paginaEmHtml(PAGINAS[nome]!, '', false)).not.toContain(MARCA);
    }
  });

  it('lançamento público: a faixa não pode mais estar no código (remova FAIXA_PROVISORIA em render.ts)', () => {
    if (!LANCAMENTO_PUBLICO) return;
    const achados = fontes(pasta).filter((f) => readFileSync(f, 'utf8').includes(MARCA));
    expect(achados).toEqual([]);
  });
});
