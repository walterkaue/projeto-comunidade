import { describe, expect, it } from 'vitest';
import { ORGANIZACOES, QUANTOS_EXEMPLOS, VOLTA_DO_RODIZIO } from '../cards/exemplos';

// B5: os exemplos usam lugares inventados. Estes nomes existem de verdade (bairro, município, religião).
const LUGARES_REAIS = ['Jardim das Flores', 'Vale Azul', 'Luz do Amanhecer', 'Zona Norte', 'Rio Claro', 'Pedrinhas'];

describe('organizações de exemplo', () => {
  it('não usam nomes de lugar que existem', () => {
    for (const org of ORGANIZACOES) for (const lugar of LUGARES_REAIS) expect(org).not.toContain(lugar);
  });

  it('são 7 tipos (o religioso em 3 tradições), todas diferentes', () => {
    expect(QUANTOS_EXEMPLOS).toBe(7);
    expect(VOLTA_DO_RODIZIO).toBe(21);
    expect(new Set(ORGANIZACOES).size).toBe(ORGANIZACOES.length);
    expect(ORGANIZACOES.length).toBe(9);
  });
});
