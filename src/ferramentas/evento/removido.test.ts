import { describe, expect, it } from 'vitest';
import { EMAIL_CONTATO } from '../../comum/marca';
import { REGRAS_DE_USO } from '../../comum/regras';
import { textosDoRemovido } from './removido';

// Auditoria 05/11/2026, M7 e M8: a tela de link removido diz o motivo e como pedir revisão.
describe('tela de link removido', () => {
  it('com a regra ferida, mostra o texto da regra', () => {
    const t = textosDoRemovido({ tipo: 'regra', regra: 5 });
    expect(t.titulo).toBe('Este link foi removido após denúncia');
    expect(t.paragrafos).toContain(`Regra de uso que ele fere: ${REGRAS_DE_USO[4]}`);
  });

  it('a pedido de quem criou, não diz "após denúncia"', () => {
    const t = textosDoRemovido({ tipo: 'pedido' });
    expect(t.titulo).toBe('Este link foi removido a pedido de quem o criou');
    expect(t.paragrafos.join(' ')).not.toMatch(/denúncia|Regra de uso/);
  });

  it('sem motivo (ou regra que não existe), não inventa motivo', () => {
    for (const m of [{ tipo: 'sem-motivo' }, { tipo: 'regra', regra: 99 }] as const) {
      expect(textosDoRemovido(m).paragrafos.join(' ')).not.toContain('Regra de uso');
    }
  });

  it('sempre diz como pedir revisão', () => {
    for (const m of [{ tipo: 'regra', regra: 1 }, { tipo: 'pedido' }, { tipo: 'sem-motivo' }] as const) {
      const texto = textosDoRemovido(m).paragrafos.join(' ');
      expect(texto).toContain(EMAIL_CONTATO);
      expect(texto).toContain('peça revisão');
    }
  });
});
