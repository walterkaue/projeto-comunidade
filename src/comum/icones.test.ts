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

  // Os cinco das portas continuam os de antes (docs/visual.md, seção 6). Até 07/11/2026 eles moravam em
  // src/paginas/inicio.ts; desde a Sessão 3 o início usa icone(), então os caminhos ficam fixos aqui.
  it('as cinco portas continuam com os caminhos de antes', () => {
    expect(CAMINHOS.reuniao).toBe(
      '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 14.5c3 0 7 1.5 7 5.5"/>',
    );
    expect(CAMINHOS.evento).toBe('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>');
    expect(CAMINHOS.aviso).toBe('<path d="M3 10v4h4l8 5V5l-8 5H3zM18 9a4 4 0 0 1 0 6"/>');
    expect(CAMINHOS.resultado).toBe(
      '<path d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8"/>',
    );
    expect(CAMINHOS.agradecimento).toBe(
      '<path d="M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20z"/>',
    );
  });

  it('o início não tem mais caminhos de ícone próprios', () => {
    const fonte = readFileSync(new URL('../paginas/inicio.ts', import.meta.url), 'utf8');
    expect(fonte).not.toContain('const ICONES');
    expect(fonte).toContain("from '../comum/icones'");
  });
});
