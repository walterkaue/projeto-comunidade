// Início: contraste da porta em destaque nos dois temas e marcação das portas.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { razaoDeContraste, CONTRASTE_MINIMO } from '../comum/cor';

const css = readFileSync(join(__dirname, '../comum/tema.css'), 'utf8');
const idxEscuro = css.indexOf('prefers-color-scheme: dark');
const claro = css.slice(0, idxEscuro);
const escuro = css.slice(idxEscuro, css.indexOf('*,', idxEscuro));
const token = (bloco: string, nome: string): string => {
  const m = bloco.match(new RegExp(`--${nome}: *(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token ${nome} não achado`);
  return m[1]!;
};

describe('porta em destaque do início', () => {
  for (const [tema, bloco] of [['claro', claro], ['escuro', escuro]] as const) {
    it(`título e descrição passam de 4,5:1 no tema ${tema}`, () => {
      const fundo = token(bloco, 'porta-fundo');
      expect(razaoDeContraste(token(bloco, 'porta-texto'), fundo)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      expect(razaoDeContraste(token(bloco, 'porta-desc'), fundo)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
    });
  }
});

describe('portas do início', () => {
  it('cada porta é um link com ícone escondido do leitor de tela', async () => {
    const { telaInicio, PORTAS } = await import('./inicio');
    const raiz = { innerHTML: '' } as HTMLElement;
    telaInicio(raiz, { nome: 'inicio', resto: '' });
    expect(raiz.innerHTML.match(/<svg[^>]*aria-hidden="true"[^>]*focusable="false"/g)).toHaveLength(PORTAS.length);
    for (const p of PORTAS) expect(raiz.innerHTML).toContain(`href="#/fazer/${p.tipo}"`);
  });
});
