import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CAMINHOS, icone, type NomeDoIcone } from './icones';

const nomes = Object.keys(CAMINHOS) as NomeDoIcone[];

describe('icone', () => {
  it('tem as portas, os 26 novos e os 2 apelidos', () => {
    expect(nomes).toHaveLength(5 + 26 + 2);
  });

  it.each(nomes)('%s devolve um só <svg> decorativo, sem texto', (nome) => {
    const h = icone(nome);
    expect(h.startsWith('<svg ')).toBe(true);
    expect(h.endsWith('</svg>')).toBe(true);
    expect(h.match(/<svg[\s>]/g)).toHaveLength(1);
    expect(h).toContain('viewBox="0 0 24 24"');
    expect(h).toContain('aria-hidden="true"');
    expect(h).toContain('focusable="false"');
    const dentro = h.slice(h.indexOf('>') + 1, h.lastIndexOf('</svg>'));
    // só elementos path, circle e rect, e nenhum texto solto entre eles
    const tags = [...dentro.matchAll(/<(\w+)\b[^>]*\/>/g)];
    expect(tags.length).toBeGreaterThan(0);
    for (const t of tags) expect(['path', 'circle', 'rect']).toContain(t[1]);
    expect(dentro.replace(/<(\w+)\b[^>]*\/>/g, '')).toBe('');
    expect(h).not.toMatch(/<(text|title|desc)\b/);
  });

  it('padrão: 24 de tamanho, traço 2, classe "icone"', () => {
    const h = icone('check');
    expect(h).toContain('class="icone"');
    expect(h).toContain('width="24" height="24"');
    expect(h).toContain('stroke-width="2"');
    expect(h).toContain('stroke="currentColor"');
  });

  it('aplica tamanho, traço e classe', () => {
    const h = icone('erro', { tamanho: 20, traco: 2.25, classe: 'campo-erro-icone' });
    expect(h).toContain('class="icone campo-erro-icone"');
    expect(h).toContain('width="20" height="20"');
    expect(h).toContain('stroke-width="2.25"');
  });

  it('tamanho e traço inválidos voltam ao padrão', () => {
    for (const ruim of [0, -3, NaN, Infinity]) {
      const h = icone('mais', { tamanho: ruim, traco: ruim });
      expect(h).toContain('width="24" height="24"');
      expect(h).toContain('stroke-width="2"');
    }
  });

  it('escapa a classe', () => {
    const h = icone('mais', { classe: '"><script>alert(1)</script>' });
    expect(h).not.toContain('<script>');
    expect(h.match(/<svg[\s>]/g)).toHaveLength(1);
  });

  it('apelidos são iguais aos originais', () => {
    expect(CAMINHOS.pessoas).toBe(CAMINHOS.reuniao);
    expect(CAMINHOS.calendario).toBe(CAMINHOS.evento);
  });

  it('as cinco portas são iguais às de src/paginas/inicio.ts', () => {
    const fonte = readFileSync(new URL('../paginas/inicio.ts', import.meta.url), 'utf8');
    for (const nome of ['reuniao', 'evento', 'aviso', 'resultado', 'agradecimento'] as const) {
      const m = new RegExp(`\\b${nome}:\\s*'([^']*)'`).exec(fonte.slice(fonte.indexOf('const ICONES')));
      expect(m, nome).not.toBeNull();
      expect(CAMINHOS[nome], nome).toBe(m![1]);
    }
  });
});
