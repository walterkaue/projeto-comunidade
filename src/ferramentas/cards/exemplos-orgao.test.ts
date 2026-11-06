// Nenhum exemplo da plataforma cita órgão público: o fluxo pergunta "fala em nome de um órgão público?" a quem
// cita um, e a pergunta não pode aparecer para quem só seguiu o exemplo (achado no e2e, 06/11/2026: "secretaria").

import { describe, expect, it } from 'vitest';
import { citaOrgaoPublico } from '../../comum/conteudo';
import { exemplo, VOLTA_DO_RODIZIO } from './exemplos';

const MODELOS = ['reuniao', 'evento', 'aviso', 'resultado', 'agradecimento'] as const;

describe('exemplos e órgão público', () => {
  it('nenhum campo de nenhum exemplo cita órgão público', () => {
    for (const modelo of MODELOS) {
      for (let i = 0; i < VOLTA_DO_RODIZIO; i++) {
        const c = exemplo(modelo, i);
        for (const campo of [c.titulo, c.texto, c.local, c.organizacao]) {
          expect(citaOrgaoPublico(campo), `${modelo} #${i}: ${campo}`).toBe(false);
        }
      }
    }
  });
});
