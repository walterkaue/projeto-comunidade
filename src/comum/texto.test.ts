import { describe, expect, it } from 'vitest';
import { cortarTexto, letras, normalizarEspacos, quebrarTexto, type Medir } from './texto';

const medir = (s: string) => s.length * 10;

describe('normalizarEspacos', () => {
  it('junta espaços repetidos e apara', () => {
    expect(normalizarEspacos('  oi   você \t aqui  ')).toBe('oi você aqui');
  });
  it('mantém quebras de linha', () => {
    expect(normalizarEspacos('a  b \r\n  c ')).toBe('a b\nc');
  });
});

describe('quebrarTexto', () => {
  it('quebra por palavras na largura', () => {
    expect(quebrarTexto(medir, 'um dois tres quatro', 90)).toEqual(['um dois', 'tres', 'quatro']);
  });
  it('cabe numa linha só', () => {
    expect(quebrarTexto(medir, 'oi', 100)).toEqual(['oi']);
  });
  it('espaços repetidos não geram linha vazia', () => {
    expect(quebrarTexto(medir, 'a     b      c', 30)).toEqual(['a b', 'c']);
  });
  it('respeita \\n digitado', () => {
    expect(quebrarTexto(medir, 'ab\ncd', 200)).toEqual(['ab', 'cd']);
  });
  it('linha em branco digitada separa parágrafos', () => {
    expect(quebrarTexto(medir, 'ab\n\ncd', 200)).toEqual(['ab', '', 'cd']);
  });
  it('parte palavra maior que a largura', () => {
    expect(quebrarTexto(medir, 'abcdefghij', 40)).toEqual(['abcd', 'efgh', 'ij']);
    expect(quebrarTexto(medir, 'ver abcdefgh', 50)).toEqual(['ver', 'abcde', 'fgh']);
  });
  it('largura menor que um caractere não trava', () => {
    expect(quebrarTexto(medir, 'abc', 1)).toEqual(['a', 'b', 'c']);
  });
  it('só espaços não gera texto', () => {
    expect(quebrarTexto(medir, '   ', 100).join('')).toBe('');
  });
  it('maxLinhas põe reticências na última', () => {
    const r = quebrarTexto(medir, 'um dois tres quatro cinco seis', 70, 2);
    expect(r).toHaveLength(2);
    expect(r[0]).toBe('um dois');
    expect(r[1]?.endsWith('…')).toBe(true);
    expect(medir(r[1] ?? '')).toBeLessThanOrEqual(70);
  });
  it('maxLinhas sem sobra não põe reticências', () => {
    expect(quebrarTexto(medir, 'um dois tres', 70, 2)).toEqual(['um dois', 'tres']);
  });
});

describe('cortarTexto', () => {
  it('não mexe no que cabe', () => {
    expect(cortarTexto(medir, 'abc', 30)).toBe('abc');
  });
  it('corta com reticências dentro da largura', () => {
    const r = cortarTexto(medir, 'abcdefghij', 50);
    expect(r).toBe('abcd…');
    expect(medir(r)).toBeLessThanOrEqual(50);
  });
  it('largura mínima devolve só as reticências', () => {
    expect(cortarTexto(medir, 'abcdefghij', 5)).toBe('…');
  });
});

describe('emoji composto', () => {
  const porLetra: Medir = (s) => letras(s).length;
  it('não parte bandeira, família nem tom de pele', () => {
    expect(letras('🇧🇷👨‍👩‍👧👍🏽a')).toEqual(['🇧🇷', '👨‍👩‍👧', '👍🏽', 'a']);
    expect(quebrarTexto(porLetra, '🇧🇷👨‍👩‍👧👍🏽', 1)).toEqual(['🇧🇷', '👨‍👩‍👧', '👍🏽']);
    expect(cortarTexto(porLetra, '👨‍👩‍👧👨‍👩‍👧👨‍👩‍👧', 2)).toBe('👨‍👩‍👧…');
  });
});
