import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./tema.css', import.meta.url), 'utf-8');

describe('tema.css', () => {
  it('contraste forçado: botão principal com fundo e foco visível', () => {
    const i = css.indexOf('@media (forced-colors: active)');
    expect(i).toBeGreaterThan(-1);
    const bloco = css.slice(i);
    expect(bloco).toContain('.botao:not(.botao-sec):not(.botao-grande)');
    expect(bloco).toContain('forced-color-adjust: none');
    expect(bloco).toContain('background: ButtonText');
    expect(bloco).toContain('color: ButtonFace');
    expect(bloco).toContain('border-color: ButtonText');
    expect(bloco).toContain('outline-color: Highlight');
  });
  it('links do rodapé têm 12 px entre as linhas', () => {
    expect(css).toMatch(/\.rodape ul \{[^}]*gap: 12px 1rem;/);
  });
});
