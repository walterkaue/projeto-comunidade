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

const TIPOS = ['reuniao', 'evento', 'aviso', 'resultado', 'agradecimento'] as const;

describe('cores das portas do início', () => {
  for (const [tema, bloco] of [['claro', claro], ['escuro', escuro]] as const) {
    for (const t of TIPOS) {
      it(`${t}, tema ${tema}: texto 4,5:1, ícone e chevron 3:1`, () => {
        const clara = token(bloco, `clara-${t}`);
        const cor = token(bloco, `cor-${t}`);
        expect(razaoDeContraste(token(bloco, 'tinta'), clara)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
        expect(razaoDeContraste(token(bloco, 'tinta-suave'), clara)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
        expect(razaoDeContraste(token(bloco, 'sobre-cor'), cor)).toBeGreaterThanOrEqual(3);
        expect(razaoDeContraste(cor, clara)).toBeGreaterThanOrEqual(3);
      });
    }
  }
});

describe('portas do início', () => {
  const montar = async () => {
    const { telaInicio, PORTAS } = await import('./inicio');
    const raiz = { innerHTML: '' } as HTMLElement;
    telaInicio(raiz, { nome: 'inicio', resto: '' });
    return { html: raiz.innerHTML, PORTAS };
  };

  it('cada porta leva o data-porta e o href certos, na ordem', async () => {
    const { html, PORTAS } = await montar();
    const achados = [...html.matchAll(/<a class="porta [^"]*" data-porta="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]);
    expect(achados).toEqual(PORTAS.map((p) => [p.tipo, `#/fazer/${p.tipo}`]));
    expect(PORTAS.map((p) => p.tipo)).toEqual([...TIPOS]);
  });

  it('o nome de cada porta começa pelo verbo', async () => {
    const { html, PORTAS } = await montar();
    for (const p of PORTAS) expect(html).toContain(`<span class="porta-verbo">${p.verbo}</span>`);
  });

  it('todo svg é aria-hidden e focusable="false"', async () => {
    const { html } = await montar();
    const svgs = html.match(/<svg[^>]*>/g) ?? [];
    expect(svgs.length).toBeGreaterThan(5);
    for (const s of svgs) {
      expect(s).toContain('aria-hidden="true"');
      expect(s).toContain('focusable="false"');
    }
  });

  it('faixa e marca são enfeite (aria-hidden)', async () => {
    const { html } = await montar();
    expect(html).toContain('<div class="faixa-cores" aria-hidden="true"></div>');
    expect(html).toMatch(/<p class="ini-marca"><svg[^>]*aria-hidden="true"/);
  });

  it('o botão da ata é Petróleo (data-porta="reuniao")', async () => {
    const { html } = await montar();
    expect(html).toMatch(/<a class="botao botao-sec ini-ata" data-porta="reuniao" href="#\/ata"/);
    expect(html).toContain('Depois da reunião: fazer a ata');
  });
});
