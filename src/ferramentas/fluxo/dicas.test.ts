import { describe, expect, it } from 'vitest';
import { DEF_MODELOS } from '../cards/modelos';

describe('dicas do texto de conquista e agradecimento (B4)', () => {
  it('conquista fala do grupo, sem puxar crédito para uma pessoa', () => {
    expect(DEF_MODELOS.resultado.dicaTexto).toBe('O que o grupo conseguiu.');
  });

  it('agradecimento prefere o nome do grupo e proíbe nome de criança ou adolescente', () => {
    const dica = DEF_MODELOS.agradecimento.dicaTexto;
    expect(dica).toContain('Prefira o nome do grupo.');
    expect(dica).toContain('Nome de criança ou adolescente nunca.');
  });
});
