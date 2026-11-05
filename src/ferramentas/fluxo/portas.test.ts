import { describe, expect, it } from 'vitest';
import { PORTAS as DO_INICIO } from '../../paginas/inicio';
import { PORTAS, TIPOS } from './estado';

describe('as portas da página inicial', () => {
  it('a cópia leve de src/paginas/inicio.ts tem os mesmos textos e a mesma ordem das portas do fluxo', () => {
    expect(DO_INICIO.map((p) => p.tipo)).toEqual([...TIPOS]);
    for (const p of DO_INICIO) {
      expect({ verbo: p.verbo, exemplos: p.exemplos }, p.tipo).toEqual(PORTAS[p.tipo as keyof typeof PORTAS]);
    }
  });
});
