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
  ['texto suave dentro do aviso de atenção', '--tinta-suave', '--atencao', 4.5],
  ['erro dentro do aviso de atenção', '--erro', '--atencao', 4.5],
];

const PARES_DA_PORTA: readonly Par[] = [
  ['cor sobre a página (texto, link, foco)', '--cor', '--papel', 4.5],
  ['cor sobre o cartão (link de ação, foco, ícone)', '--cor', '--superficie', 4.5],
  ['cor dentro do aviso de atenção (link, foco)', '--cor', '--atencao', 4.5],
  ['erro dentro do aviso de informação', '--erro', '--cor-clara', 4.5],
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

// ---------- componentes.css: as classes de docs/visual.md, seção 10 ----------

const componentes = readFileSync(new URL('./componentes.css', import.meta.url), 'utf-8');
const visual = readFileSync(new URL('../../docs/visual.md', import.meta.url), 'utf-8');
const todoCss = css + componentes;

/** Corpo da primeira regra cujo seletor (sozinho ou numa lista) é `seletor`. */
function corpoDe(texto: string, seletor: string): string {
  const semComentario = texto.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = new RegExp(`(^|[},\\s])${seletor.replace(/[[\]'().*:]/g, '\\$&')}\\s*[,{]`, 'm');
  const m = re.exec(semComentario);
  if (!m) throw new Error(`regra ${seletor} não achada`);
  return bloco(semComentario, m.index).dentro;
}

describe('componentes.css', () => {
  const secao10 = visual.slice(visual.indexOf('## 10. Classes no código'));
  const classes = [...secao10.matchAll(/^\| `([\w-]+)`/gm)].map((m) => m[1]!);

  it('a seção 10 de docs/visual.md lista as classes', () => {
    expect(classes.length).toBeGreaterThan(15);
  });
  for (const c of classes) {
    it(`classe .${c} existe no CSS`, () => {
      expect(todoCss).toMatch(new RegExp(`\\.${c}(?![\\w-])`));
    });
  }

  it('botões: principal na --cor, secundário em contorno de tinta, terciário de cartão com ícone na --cor', () => {
    const b = corpoDe(css, '.botao');
    expect(b).toMatch(/background: var\(--cor\)/);
    expect(b).toMatch(/color: var\(--sobre-cor\)/);
    expect(b).toMatch(/min-height: var\(--toque\)/);
    expect(corpoDe(css, '.botao-sec')).toMatch(/border-color: var\(--tinta\)/);
    const ter = corpoDe(componentes, '.botao-ter');
    expect(ter).toMatch(/background: var\(--superficie\)/);
    expect(ter).toMatch(/border-color: var\(--borda-campo\)/);
    expect(corpoDe(componentes, '.botao-ter .icone')).toMatch(/color: var\(--cor\)/);
    expect(corpoDe(componentes, '.botao-alto')).toMatch(/min-height: 60px/);
  });

  it('alvos de toque: link de ação e pílula com 48 px ou mais', () => {
    expect(corpoDe(componentes, '.link-acao')).toMatch(/min-height: 48px/);
    expect(corpoDe(componentes, '.link-acao')).toMatch(/text-decoration: underline/);
    expect(corpoDe(componentes, '.pilula')).toMatch(/min-height: 48px/);
  });

  it('avisos sem borda, com fundo de cor; informação na --cor-clara, atenção na --atencao', () => {
    const comum = corpoDe(componentes, '.aviso-info');
    expect(comum).not.toMatch(/border:/);
    expect(componentes).toMatch(/\.aviso-info \{\s*background: var\(--cor-clara\);/);
    expect(componentes).toMatch(/\.aviso-atencao \{\s*background: var\(--atencao\);/);
  });

  it('pílula escolhida: cheia na --cor e com o ✓ (nunca só a cor)', () => {
    expect(corpoDe(componentes, ".pilula[aria-pressed='true']")).toMatch(/background: var\(--cor\)/);
    expect(componentes).toMatch(/\.pilula \.pilula-check \{\s*display: none;/);
    expect(componentes).toMatch(/\.pilula\[aria-pressed='true'\] \.pilula-check \{\s*display: inline-block;/);
  });

  it('campo: exemplo em --exemplo sem transparência, foco na --cor, erro com borda de 4 px', () => {
    const ph = corpoDe(componentes, '.campo-entrada::placeholder');
    expect(ph).toMatch(/color: var\(--exemplo\)/);
    expect(ph).toMatch(/opacity: 1/);
    const foco = corpoDe(componentes, '.campo-entrada:focus');
    expect(foco).toMatch(/outline: 3px solid var\(--cor\)/);
    expect(foco).toMatch(/border-color: var\(--cor\)/);
    expect(corpoDe(componentes, ".campo-entrada[aria-invalid='true']")).toMatch(/border-width: 4px/);
    expect(corpoDe(componentes, '.campo-entrada')).toMatch(/min-height: var\(--toque\)/);
  });

  it('painel: <dialog> de baixo, com fundo escurecido, e animação só sem "reduzir movimento"', () => {
    expect(corpoDe(componentes, '.painel')).toMatch(/margin: auto auto 0/);
    expect(componentes).toMatch(/\.painel::backdrop \{\s*background: rgba/);
    const i = componentes.indexOf('@media (prefers-reduced-motion: no-preference)');
    expect(i).toBeGreaterThan(-1);
    const fora = componentes.slice(0, i) + componentes.slice(bloco(componentes, i).fim);
    expect(fora).not.toMatch(/animation:/);
  });

  it('alto contraste: avisos, quadrados de ícone e painel com borda CanvasText', () => {
    const blocos = [...componentes.matchAll(/@media \(forced-colors: active\)/g)].map((m) => bloco(componentes, m.index!).dentro);
    const juntos = blocos.join('\n');
    for (const c of ['.aviso-info', '.aviso-atencao', '.icone-quadro', '.painel']) expect(juntos).toContain(c);
    expect(juntos).toContain('border: 2px solid CanvasText');
    expect(juntos).toMatch(/\.pilula\[aria-pressed='true'\] \{[^}]*background: Highlight/);
  });

  it('"reduzir movimento" tira toda animação e transição (tema.css)', () => {
    const i = css.indexOf('@media (prefers-reduced-motion: reduce)');
    const b = bloco(css, i).dentro;
    expect(b).toContain('animation: none !important');
    expect(b).toContain('transition: none !important');
  });
});

// public/offline.html não carrega o tema (abre sem o app): as cores vão escritas à mão e precisam bater com ele.
describe('public/offline.html usa as cores do tema', () => {
  const offline = readFileSync(new URL('../../public/offline.html', import.meta.url), 'utf-8');
  const claro = tokens('claro');
  const escuro = tokens('escuro');
  it('claro: fundo papel, texto tinta; escuro: fundo papel escuro, texto tinta clara', () => {
    expect(offline).toContain(`background:${hex(claro, '--papel')};color:${hex(claro, '--tinta')}`);
    expect(offline).toContain(`body{background:${hex(escuro, '--papel')};color:${hex(escuro, '--tinta')}}`);
  });
  it('theme-color claro e escuro iguais ao papel', () => {
    expect(offline).toContain(`content="${hex(claro, '--papel')}" media="(prefers-color-scheme: light)"`);
    expect(offline).toContain(`content="${hex(escuro, '--papel')}" media="(prefers-color-scheme: dark)"`);
  });
});
