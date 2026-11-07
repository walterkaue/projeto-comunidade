import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { razaoDeContraste } from './cor';

const css = readFileSync(new URL('./tema.css', import.meta.url), 'utf-8');

// ---------- leitura dos tokens do próprio tema.css ----------
// Claro: o :root fora da media query. Escuro: o :root de dentro de @media (prefers-color-scheme: dark), por cima
// do claro. Porta: a regra [data-porta='x'] e a regra [data-porta] por cima do modo. var(--x) é resolvido.

type Tokens = Record<string, string>;

const MEDIA_ESCURO = '@media (prefers-color-scheme: dark)';

/** Conteúdo entre a chave que abre em `inicio` e a que fecha com ela. */
function bloco(texto: string, inicio: number): { dentro: string; fim: number } {
  const abre = texto.indexOf('{', inicio);
  let nivel = 0;
  for (let i = abre; i < texto.length; i++) {
    if (texto[i] === '{') nivel++;
    else if (texto[i] === '}' && --nivel === 0) return { dentro: texto.slice(abre + 1, i), fim: i + 1 };
  }
  throw new Error('chave sem par');
}

function declaracoes(corpo: string): Tokens {
  const t: Tokens = {};
  const semComentario = corpo.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of semComentario.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) t[m[1]!] = m[2]!.trim();
  return t;
}

/** Declarações da regra cujo seletor é exatamente `seletor`, no trecho dado (fora de media queries aninhadas). */
function regra(texto: string, seletor: string): Tokens {
  const semComentario = texto.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = new RegExp(`(^|[}\\s])${seletor.replace(/[[\]'().*]/g, '\\$&')}\\s*\\{`, 'g');
  const t: Tokens = {};
  for (const m of semComentario.matchAll(re)) Object.assign(t, declaracoes(bloco(semComentario, m.index!).dentro));
  return t;
}

const iEscuro = css.indexOf(MEDIA_ESCURO);
const { dentro: cssEscuro, fim: fimEscuro } = bloco(css, iEscuro);
const cssForaDoEscuro = css.slice(0, iEscuro) + css.slice(fimEscuro);

const raizClara = regra(css.slice(0, iEscuro), ':root');
const raizEscura = regra(cssEscuro, ':root');

function resolver(t: Tokens, nome: string, visto: string[] = []): string {
  const v = t[nome];
  if (v === undefined) throw new Error(`token ${nome} não achado`);
  if (visto.includes(nome)) throw new Error(`token ${nome} em ciclo`);
  const m = /^var\((--[\w-]+)\)$/.exec(v);
  return m ? resolver(t, m[1]!, [...visto, nome]) : v;
}

type Modo = 'claro' | 'escuro';
const MODOS: readonly Modo[] = ['claro', 'escuro'];
const PORTAS = ['reuniao', 'evento', 'aviso', 'resultado', 'agradecimento'] as const;

function tokens(modo: Modo, porta?: (typeof PORTAS)[number]): Tokens {
  const base = modo === 'claro' ? { ...raizClara } : { ...raizClara, ...raizEscura };
  if (!porta) return base;
  const daPorta = regra(cssForaDoEscuro, `[data-porta='${porta}']`);
  const geral = regra(cssForaDoEscuro, '[data-porta]');
  // Na porta, uma variável com var() é calculada ali: resolve os valores dela contra a base do modo.
  const comPorta: Tokens = { ...base, ...daPorta };
  const resolvidos: Tokens = {};
  for (const k of Object.keys(daPorta)) resolvidos[k] = resolver(comPorta, k);
  const final: Tokens = { ...base, ...resolvidos };
  for (const k of Object.keys(geral)) final[k] = geral[k]!;
  return final;
}

const hex = (t: Tokens, nome: string): string => {
  const v = resolver(t, nome);
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`token ${nome} não é cor: ${v}`);
  return v;
};

// ---------- os pares de docs/visual.md, seção 3 ----------

type Par = [descricao: string, frente: string, fundo: string, minimo: number];

const PARES_DA_BASE: readonly Par[] = [
  ['texto sobre a página', '--tinta', '--papel', 4.5],
  ['texto sobre cartão e campo', '--tinta', '--superficie', 4.5],
  ['texto suave sobre a página', '--tinta-suave', '--papel', 4.5],
  ['texto suave sobre cartão', '--tinta-suave', '--superficie', 4.5],
  ['exemplo em cinza no campo', '--exemplo', '--superficie', 4.5],
  ['borda do campo sobre o campo', '--borda-campo', '--superficie', 3],
  ['borda do campo sobre a página', '--borda-campo', '--papel', 3],
  ['erro sobre a página', '--erro', '--papel', 4.5],
  ['erro (borda) sobre o campo', '--erro', '--superficie', 3],
  ['texto do aviso de atenção', '--tinta', '--atencao', 4.5],
  ['aviso que some (papel sobre tinta)', '--papel', '--tinta', 4.5],
];

const PARES_DA_PORTA: readonly Par[] = [
  ['cor sobre a página (texto, link, foco)', '--cor', '--papel', 4.5],
  ['cor sobre o cartão (ícone)', '--cor', '--superficie', 3],
  ['texto do botão sobre a cor', '--sobre-cor', '--cor', 4.5],
  ['tinta sobre a clara', '--tinta', '--cor-clara', 4.5],
  ['texto suave sobre a clara', '--tinta-suave', '--cor-clara', 4.5],
  ['cor sobre a clara (ícone, verbo)', '--cor', '--cor-clara', 4.5],
  ['borda do campo sobre a clara', '--borda-campo', '--cor-clara', 3],
];

describe('tema.css: contraste dos pares de docs/visual.md, seção 3', () => {
  for (const modo of MODOS) {
    describe(`base, modo ${modo}`, () => {
      const t = tokens(modo);
      for (const [desc, frente, fundo, minimo] of PARES_DA_BASE) {
        it(`${desc}: ${minimo}:1 ou mais`, () => {
          expect(razaoDeContraste(hex(t, frente), hex(t, fundo))).toBeGreaterThanOrEqual(minimo);
        });
      }
    });
    // Fora de uma porta a --cor é a tinta: o botão principal e os avisos de informação também passam.
    describe(`fora de uma porta, modo ${modo}`, () => {
      const t = tokens(modo);
      it('--cor é a tinta, --cor-clara é a de atenção e o foco é a tinta', () => {
        expect(hex(t, '--cor')).toBe(hex(t, '--tinta'));
        expect(hex(t, '--cor-clara')).toBe(hex(t, '--atencao'));
        expect(hex(t, '--foco')).toBe(hex(t, '--tinta'));
      });
      for (const [desc, frente, fundo, minimo] of PARES_DA_PORTA) {
        it(`${desc}: ${minimo}:1 ou mais`, () => {
          expect(razaoDeContraste(hex(t, frente), hex(t, fundo))).toBeGreaterThanOrEqual(minimo);
        });
      }
    });
    for (const porta of PORTAS) {
      describe(`porta ${porta}, modo ${modo}`, () => {
        const t = tokens(modo, porta);
        it('tem cor própria, diferente da tinta, e o foco é a cor dela', () => {
          expect(hex(t, '--cor')).not.toBe(hex(t, '--tinta'));
          expect(hex(t, '--cor-clara')).not.toBe(hex(t, '--atencao'));
          expect(t['--foco']).toBe('var(--cor)');
        });
        for (const [desc, frente, fundo, minimo] of PARES_DA_PORTA) {
          it(`${desc}: ${minimo}:1 ou mais`, () => {
            expect(razaoDeContraste(hex(t, frente), hex(t, fundo))).toBeGreaterThanOrEqual(minimo);
          });
        }
      });
    }
  }

  it('o leitor do teste falha se a cor não for achada (o teste funciona)', () => {
    expect(() => hex(tokens('claro'), '--nao-existe')).toThrow();
    expect(razaoDeContraste('#777777', '#ffffff')).toBeLessThan(4.5);
  });
});

describe('tema.css: tokens', () => {
  it('valores de docs/visual.md, seção 2 (base clara e escura)', () => {
    const claro = tokens('claro');
    const escuro = tokens('escuro');
    expect([hex(claro, '--papel'), hex(escuro, '--papel')]).toEqual(['#fbf6ee', '#1a1512']);
    expect([hex(claro, '--sobre-cor'), hex(escuro, '--sobre-cor')]).toEqual(['#ffffff', '#1a1512']);
    for (const nome of ['--sombra', '--sombra-barra']) {
      expect(claro[nome]).toMatch(/rgba\(74, 52, 30/);
      expect(escuro[nome]).toMatch(/rgba\(0, 0, 0/);
    }
  });
  it('nomes antigos continuam valendo como apelidos (saem quando as telas trocarem)', () => {
    for (const modo of MODOS) {
      const t = tokens(modo);
      expect(hex(t, '--destaque')).toBe(hex(t, '--cor'));
      expect(hex(t, '--sobre-destaque')).toBe(hex(t, '--sobre-cor'));
      const r = tokens(modo, 'reuniao');
      expect(hex(t, '--porta-fundo')).toBe(hex(r, '--cor-clara'));
      expect(hex(t, '--porta-texto')).toBe(hex(t, '--tinta'));
      expect(hex(t, '--porta-desc')).toBe(hex(t, '--tinta-suave'));
    }
    expect(regra(cssForaDoEscuro, '[data-porta]')['--destaque']).toBe('var(--cor)');
  });
});

describe('tema.css', () => {
  it('contraste forçado: botão principal com fundo e foco visível', () => {
    const i = css.indexOf('@media (forced-colors: active)');
    expect(i).toBeGreaterThan(-1);
    const b = css.slice(i);
    expect(b).toContain('.botao:not(.botao-sec):not(.botao-grande)');
    expect(b).toContain('forced-color-adjust: none');
    expect(b).toContain('background: ButtonText');
    expect(b).toContain('color: ButtonFace');
    expect(b).toContain('border-color: ButtonText');
    expect(b).toContain('outline-color: Highlight');
  });
  it('links do rodapé têm 12 px entre as linhas', () => {
    expect(css).toMatch(/\.rodape ul \{[^}]*gap: 12px 1rem;/);
  });
});
