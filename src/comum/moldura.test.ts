import { describe, expect, it } from 'vitest';
import { estaEmMoldura, telaDaMoldura } from './moldura';

// Auditoria de segurança, 05/11/2026, B3: dentro de um iframe de outro site, só o link para abrir direto.
describe('site dentro de outro site', () => {
  it('sabe quando está numa moldura', () => {
    const janela = {};
    expect(estaEmMoldura({ top: janela, self: janela })).toBe(false);
    expect(estaEmMoldura({ top: {}, self: janela })).toBe(true);
    const recusa = { self: janela, get top(): unknown { throw new Error('bloqueado'); } };
    expect(estaEmMoldura(recusa)).toBe(true);
  });

  it('mostra só o título e o link para abrir o site', () => {
    const html = telaDaMoldura('https://walterkaue.github.io/projeto-comunidade/#/evento/1rAAA');
    expect(html).toContain('<h1 tabindex="-1">');
    expect(html).toContain('href="https://walterkaue.github.io/projeto-comunidade/#/evento/1rAAA"');
    expect(html).toContain('>Abrir o site</a>');
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).not.toMatch(/<(form|input|button|iframe|script)/);
  });

  it('nunca leva endereço perigoso', () => {
    expect(telaDaMoldura('javascript:alert(1)')).toContain('href="#"');
    expect(telaDaMoldura('https://x.exemplo/"><script>')).not.toContain('<script>');
  });
});
