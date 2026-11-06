import { describe, expect, it } from 'vitest';
import { ORGANIZACOES } from '../cards/exemplos';

// B5: os exemplos usam lugares inventados. Estes nomes existem de verdade (bairro, município, religião).
const LUGARES_REAIS = ['Jardim das Flores', 'Vale Azul', 'Luz do Amanhecer', 'Zona Norte', 'Rio Claro'];

describe('organizações de exemplo', () => {
  it('não usam nomes de lugar que existem', () => {
    for (const org of ORGANIZACOES) for (const lugar of LUGARES_REAIS) expect(org).not.toContain(lugar);
  });

  it('continuam sendo 7, todas diferentes', () => {
    expect(new Set(ORGANIZACOES).size).toBe(7);
  });
});
