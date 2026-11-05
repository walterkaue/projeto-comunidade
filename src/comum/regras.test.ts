import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REGRAS_DE_USO, textoDaRegra } from './regras';

describe('Regras de uso', () => {
  it('textoDaRegra pelo número, começando em 1', () => {
    expect(textoDaRegra(1)).toBe(REGRAS_DE_USO[0]);
    expect(textoDaRegra(9)).toMatch(/^Fingir ser outra pessoa/);
    for (const n of [0, -1, 1.5, REGRAS_DE_USO.length + 1, Number.NaN]) expect(textoDaRegra(n)).toBe('');
  });

  it('o Gem de triagem tem as mesmas regras, com o mesmo número', () => {
    const doc = readFileSync(new URL('../../docs/gemini-triagem.md', import.meta.url), 'utf8');
    REGRAS_DE_USO.forEach((regra, i) => {
      // O Gem pode ter um exemplo ou explicação a mais no fim; o começo tem de bater.
      expect(doc, `regra ${i + 1}`).toContain(`${i + 1}. ${regra.slice(0, 25)}`);
    });
  });
});
