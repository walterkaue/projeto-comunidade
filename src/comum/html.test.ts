import { describe, expect, it } from 'vitest';
import { esc, urlSegura } from './html';

describe('esc', () => {
  it('neutraliza HTML digitado', () => {
    expect(esc('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(esc("Festa d'Ajuda & Cia")).toBe('Festa d&#39;Ajuda &amp; Cia');
  });

  it('urlSegura só deixa passar http, https, mailto e tel', () => {
    expect(urlSegura('https://exemplo.org/a?b=1')).toBe('https://exemplo.org/a?b=1');
    expect(urlSegura('  mailto:contato@exemplo.org ')).toBe('mailto:contato@exemplo.org');
    expect(urlSegura('tel:+5511999999999')).toBe('tel:+5511999999999');
    expect(urlSegura('javascript:alert(1)')).toBe('#');
    expect(urlSegura(' JaVaScRiPt:alert(1)')).toBe('#');
    expect(urlSegura('java	script:alert(1)')).toBe('#');
    expect(urlSegura('data:text/html,<script>alert(1)</script>')).toBe('#');
    expect(urlSegura('exemplo.org')).toBe('#');
    expect(urlSegura('')).toBe('#');
  });

  it('não mexe em texto comum com acento', () => {
    expect(esc('Reunião da associação')).toBe('Reunião da associação');
  });
});
