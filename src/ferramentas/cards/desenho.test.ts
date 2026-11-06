// Testes do motor de desenho com um contexto de mentira: a medida é ~0,58 × tamanho por letra
// (aproximação do Atkinson Hyperlegible em negrito; "Conseguimos" a 161 px fica perto de 1025 px).

import { describe, expect, it } from 'vitest';
import { cortesDoCartaz, desenharCard, escolherTamanho } from './desenho';
import { exemplo } from './exemplos';
import { linhasDaPauta } from './pauta';
import { PALETA_PADRAO } from './paletas';
import { DEF_FORMATOS, FORMATOS, type CamposDoCard, type Formato } from './modelos';

interface Desenho {
  textos: { texto: string; tamanho: number }[];
}

function contexto(): { ctx: CanvasRenderingContext2D; desenho: Desenho } {
  const desenho: Desenho = { textos: [] };
  const estado: Record<string, unknown> = { font: '400 10px x' };
  const tamanho = () => Number(/(\d+(?:\.\d+)?)px/.exec(String(estado.font))?.[1] ?? 10);
  const ctx = new Proxy(estado, {
    get(alvo, nome: string) {
      if (nome === 'measureText') return (s: string) => ({ width: [...s].length * 0.58 * tamanho() });
      if (nome === 'fillText')
        return (texto: string) => {
          desenho.textos.push({ texto, tamanho: tamanho() });
        };
      if (nome in alvo) return alvo[nome];
      return () => undefined;
    },
    set(alvo, nome: string, valor) {
      alvo[nome] = valor;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, desenho };
}

const campos = (extra: Partial<CamposDoCard>): CamposDoCard => ({ modelo: 'resultado', titulo: '', data: '', hora: '', local: '', texto: '', organizacao: '', link: '', ...extra });
const medirDe = (tam: number) => (s: string) => [...s].length * 0.58 * tam;

function desenhar(c: CamposDoCard, formato: Formato, qr = false): Desenho {
  const { ctx, desenho } = contexto();
  desenharCard(ctx, c, formato, PALETA_PADRAO, { escala: 1, rodape: false, ...(qr ? { qr: [[true]] } : {}) });
  return desenho;
}

describe('título (A-01): nunca parte palavra quando há tamanho que caiba', () => {
  const titulos = ['Conseguimos', 'Agradecemos', 'Inauguração', 'Conseguimos o asfalto da rua 4', 'Conseguimos a quadra coberta!'];
  for (const formato of ['status', 'conversa', 'cartaz'] as const)
    for (const titulo of titulos)
      it(`${formato}: "${titulo}"`, () => {
        const d = desenhar(campos({ titulo }), formato);
        const desenhadas = new Set(d.textos.flatMap((t) => t.texto.split(' ')));
        for (const palavra of titulo.split(' ')) expect(desenhadas.has(palavra), `"${palavra}" partida`).toBe(true);
      });
  it('a mentira de medida bate com o caso real (161 px → cerca de 1025 px)', () => {
    expect(medirDe(161)('Conseguimos')).toBeGreaterThan(936);
  });
  it('o tamanho escolhido faz a palavra mais longa caber na largura', () => {
    const { ctx } = contexto();
    const { k } = escolherTamanho(ctx, campos({ titulo: 'Conseguimos' }), 'status', 936, 1000);
    expect(medirDe(124 * k)('Conseguimos')).toBeLessThanOrEqual(936);
  });
});

describe('pauta no card (A-10, B-13)', () => {
  const itens = (n: number) => Array.from({ length: n }, (_, i) => `Assunto ${i + 1} do bairro`);
  const medir = medirDe(54);
  for (const n of [9, 12]) {
    it(`${n} itens: só itens inteiros e "e mais N assuntos" certo`, () => {
      const lista = itens(n);
      const p = linhasDaPauta(medir, lista, 936, 7);
      const ultima = p.linhas[p.linhas.length - 1]!;
      expect(p.linhas.length).toBeLessThanOrEqual(7);
      expect(p.fora).toBeGreaterThan(0);
      expect(ultima).toBe(`e mais ${p.fora} assuntos`);
      const mostrados = p.linhas.filter((l) => /^\d+\. /.test(l)).length;
      expect(mostrados + p.fora).toBe(n);
      for (const l of p.linhas.slice(0, -1)) if (/^\d+\. /.test(l)) expect(l).toMatch(/^\d+\. Assunto \d+ do bairro$/);
    });
  }
  it('"e mais 1 assunto" no singular', () => {
    const p = linhasDaPauta(medir, ['Assunto 1 com um título bem comprido do bairro', 'Assunto 2 com um título bem comprido do bairro', 'Assunto 3 com um título bem comprido do bairro'], 936, 5);
    expect(p.fora).toBe(1);
    expect(p.linhas[p.linhas.length - 1]).toBe('e mais 1 assunto');
  });
  it('cabendo tudo, não diz "e mais"', () => {
    const p = linhasDaPauta(medir, ['Limpeza do córrego', 'Coleta'], 936, 6);
    expect(p).toEqual({ linhas: ['1. Limpeza do córrego', '2. Coleta'], fora: 0 });
  });
  it('item longo quebra em 2 linhas e corta numa palavra inteira com "…"', () => {
    const longo = Array.from({ length: 40 }, (_, i) => `palavra${i}`).join(' ');
    const p = linhasDaPauta(medir, [longo], 936, 6);
    expect(p.linhas).toHaveLength(2);
    expect(p.linhas[1]).toMatch(/ palavra\d+…$/);
    for (const l of p.linhas) for (const w of l.replace(/…$/, '').split(' ')) expect(w).toMatch(/^(\d+\.|palavra\d+)$/);
  });
  it('desenha a pauta com o rótulo PAUTA, numerada e sem palavra cortada', () => {
    const d = desenhar(campos({ modelo: 'reuniao', titulo: 'Assembleia', pauta: itens(9) }), 'status');
    const linhas = d.textos.map((t) => t.texto);
    expect(linhas).toContain('PAUTA');
    expect(linhas.some((l) => l.startsWith('1. Assunto'))).toBe(true);
    expect(linhas.some((l) => /^e mais \d+ assuntos$/.test(l))).toBe(true);
    expect(linhas.filter((l) => /…$/.test(l))).toEqual([]);
  });
});

describe('cartaz sem cortar endereço e organização (B-04)', () => {
  const local = 'Avenida Central do Jardim das Acácias, número 1500, fundos, salão dos fundos do Centro, perto da praça';
  const base = campos({ modelo: 'evento', titulo: 'Mutirão', local, organizacao: 'Associação de Moradores do Jardim das Acácias e Arredores' });
  it('local de 119 letras cabe sem cortar', () => {
    const l = 'Rua das Palmeiras Imperiais, número 1500, fundos, Centro, ao lado da escola municipal e da quadra de esportes do bairro.'.slice(0, 119);
    expect([...l]).toHaveLength(119);
    const c = campos({ ...base, local: l });
    const { ctx } = contexto();
    expect(cortesDoCartaz(ctx, c, true)).not.toContain('local');
    const d = desenhar(c, 'cartaz', true);
    expect(d.textos.filter((t) => t.texto.endsWith('…'))).toEqual([]);
    expect(d.textos.some((t) => /1500/.test(t.texto))).toBe(true);
  });
  it('organização longa cabe em 2 linhas sem "…"', () => {
    const c = campos({ ...base, local: 'Praça', organizacao: 'Associação de Moradores e Amigos do Jardim das Acácias' });
    const { ctx } = contexto();
    expect(cortesDoCartaz(ctx, c, true)).not.toContain('organizacao');
    expect(desenhar(c, 'cartaz', true).textos.filter((t) => t.texto.endsWith('…'))).toEqual([]);
  });
  it('o que ainda é cortado no piso aparece em cortesDoCartaz', () => {
    const c = campos({ ...base, local: 'Rua das Acácias, '.repeat(20), organizacao: 'Associação '.repeat(15) });
    const { ctx } = contexto();
    expect(cortesDoCartaz(ctx, c, true)).toEqual(['local', 'organizacao']);
  });
  it('Status e Grupo continuam cortando com "…" como antes', () => {
    const c = campos({ ...base, local: 'Rua das Acácias, '.repeat(20) });
    for (const f of ['status', 'conversa'] as const) expect(desenhar(c, f).textos.some((t) => t.texto.endsWith('…'))).toBe(true);
  });
});

describe('formatos', () => {
  it('tem os mesmos três formatos, com a palavra Grupo', () => {
    expect(FORMATOS.map((f) => DEF_FORMATOS[f].nome)).toEqual(['Status', 'Grupo', 'Cartaz A4']);
  });
  it('exemplos de todos os formatos desenham sem palavra do título partida', () => {
    for (const f of FORMATOS)
      for (const i of [0, 7, 14]) {
        const c = exemplo('resultado', i);
        const d = new Set(desenhar(c, f).textos.flatMap((t) => t.texto.split(' ')));
        for (const p of c.titulo.split(' ')) expect(d.has(p), `${f} ${p}`).toBe(true);
      }
  });
});
