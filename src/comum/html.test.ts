import { describe, expect, it } from 'vitest';
import { esc } from './html';

describe('esc', () => {
  it('neutraliza HTML digitado', () => {
    expect(esc('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(esc("Festa d'Ajuda & Cia")).toBe('Festa d&#39;Ajuda &amp; Cia');
  });

  it('não mexe em texto comum com acento', () => {
    expect(esc('Reunião da associação')).toBe('Reunião da associação');
  });
});
