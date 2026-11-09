import { describe, expect, it } from 'vitest';
import { EMAIL_CONTATO } from '../../comum/marca';
import { REGRAS_DE_USO } from '../../comum/regras';
import { htmlDoParagrafo, REGRAS_DE_PROTECAO_A_CRIANCAS, textosDoRemovido } from './removido';

// Auditoria 05/11/2026, M7 e M8: a tela de link removido diz o motivo e como pedir revisão.
describe('tela de link removido', () => {
  it('com a regra ferida, diz a decisão e mostra o texto da regra', () => {
    const t = textosDoRemovido({ tipo: 'regra', regra: 5 });
    expect(t.titulo).toBe('Este link foi removido após denúncia');
    expect(t.paragrafos).toContain(
      `Removemos este link porque, na nossa análise, ele fere esta regra de uso: ${REGRAS_DE_USO[4]}`,
    );
  });

  it('regras de proteção a crianças e adolescentes nunca mostram o texto da regra', () => {
    for (const n of REGRAS_DE_PROTECAO_A_CRIANCAS) {
      const texto = textosDoRemovido({ tipo: 'regra', regra: n }).paragrafos.join(' ');
      expect(texto).toContain(
        'Removemos este link porque, na nossa análise, ele fere as Regras de uso de proteção a crianças e adolescentes.',
      );
      expect(texto).not.toContain('esta regra de uso');
      if (REGRAS_DE_USO[n - 1]) expect(texto).not.toContain(REGRAS_DE_USO[n - 1]);
    }
    expect(REGRAS_DE_PROTECAO_A_CRIANCAS).toEqual([8, 10]);
  });

  it('a pedido de quem criou, não diz "após denúncia"', () => {
    const t = textosDoRemovido({ tipo: 'pedido' });
    expect(t.titulo).toBe('Este link foi removido a pedido de quem o criou');
    expect(t.paragrafos.join(' ')).not.toMatch(/denúncia|Removemos|regra de uso/);
  });

  it('sem motivo (ou regra que não existe), não inventa motivo', () => {
    for (const m of [{ tipo: 'sem-motivo' }, { tipo: 'regra', regra: 99 }] as const) {
      expect(textosDoRemovido(m).paragrafos.join(' ')).not.toContain('Removemos');
    }
  });

  it('sempre diz como pedir revisão', () => {
    for (const m of [{ tipo: 'regra', regra: 1 }, { tipo: 'pedido' }, { tipo: 'sem-motivo' }] as const) {
      const texto = textosDoRemovido(m).paragrafos.join(' ');
      expect(texto).toContain(EMAIL_CONTATO);
      expect(texto).toContain('peça revisão');
      expect(texto).toContain('Uma pessoa responde em até 5 dias úteis.');
    }
  });
});

describe('D3: aviso de golpe na tela de link removido', () => {
  it('só a regra 5 acrescenta o aviso, logo depois da decisão', () => {
    const p = textosDoRemovido({ tipo: 'regra', regra: 5 }).paragrafos;
    const i = p.findIndex((x) => x.startsWith('Removemos este link'));
    expect(p[i + 1]).toBe('Se você recebeu este link, não pague nem mande documentos. Avise quem mandou.');
    for (const motivo of [{ tipo: 'regra', regra: 1 }, { tipo: 'pedido' }] as Parameters<typeof textosDoRemovido>[0][]) {
      expect(textosDoRemovido(motivo).paragrafos.join(' ')).not.toContain('Se você recebeu este link');
    }
  });
});

describe('e-mail de contato na tela', () => {
  it('ganha <wbr> depois do @ e dos pontos, sem mudar uma palavra', () => {
    for (const motivo of [{ tipo: 'pedido' }, { tipo: 'regra', regra: 1 }] as Parameters<typeof textosDoRemovido>[0][]) {
      const p = textosDoRemovido(motivo).paragrafos.find((x) => x.includes(EMAIL_CONTATO))!;
      const html = htmlDoParagrafo(p);
      expect(html).toContain('<wbr>');
      expect(html).not.toContain(EMAIL_CONTATO);
      expect(html.replaceAll('<wbr>', '')).toBe(p);
      expect(html).toContain('contato.<wbr>projetocomunidade@<wbr>gmail.<wbr>com');
    }
  });
});
