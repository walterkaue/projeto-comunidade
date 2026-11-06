// Textos da tela de link removido (puro, sem DOM). Auditoria 05/11/2026, M7 e M8: quem criou o link não recebe
// aviso nenhum (o site não tem o contato), então esta tela é o único lugar para dizer o motivo e como pedir
// revisão (docs/produto.md 4.1: quem foi denunciado pode pedir revisão).

import type { MotivoDaRemocao } from '../../comum/entreTelas';
import { EMAIL_CONTATO, PRAZO_DENUNCIA_DIAS_UTEIS } from '../../comum/marca';
import { textoDaRegra } from '../../comum/regras';

export interface TextosDoRemovido {
  titulo: string;
  paragrafos: string[];
}

/** Regras sobre criança e adolescente: o texto delas nunca aparece na tela (vai uma frase geral). Tratadas por
 * número, para valer mesmo antes de a regra 10 existir em src/comum/regras.ts. */
export const REGRAS_DE_PROTECAO_A_CRIANCAS = [8, 10];

/** Regra 5 (golpe): quem recebeu o link ainda pode cair nele, então a tela avisa (D3). */
const REGRA_DO_GOLPE = 5;
export const AVISO_DE_GOLPE = 'Se você recebeu este link, não pague nem mande documentos. Avise quem mandou.';

export function textosDoRemovido(motivo: MotivoDaRemocao): TextosDoRemovido {
  const revisao = `Criou este link e discorda? Escreva para ${EMAIL_CONTATO}, mande o link e peça revisão. Uma pessoa responde em até ${PRAZO_DENUNCIA_DIAS_UTEIS} dias úteis.`;
  if (motivo.tipo === 'pedido') {
    return {
      titulo: 'Este link foi removido a pedido de quem o criou',
      paragrafos: ['Ele não está mais disponível.', revisao],
    };
  }
  let decisao = '';
  let golpe = false;
  if (motivo.tipo === 'regra') {
    if (REGRAS_DE_PROTECAO_A_CRIANCAS.includes(motivo.regra)) {
      decisao = 'Removemos este link porque, na nossa análise, ele fere as Regras de uso de proteção a crianças e adolescentes.';
    } else {
      const regra = textoDaRegra(motivo.regra);
      golpe = motivo.regra === REGRA_DO_GOLPE;
      if (regra) decisao = `Removemos este link porque, na nossa análise, ele fere esta regra de uso: ${regra}`;
    }
  }
  return {
    titulo: 'Este link foi removido após denúncia',
    paragrafos: ['Ele não está mais disponível.', ...(decisao ? [decisao] : []), ...(golpe ? [AVISO_DE_GOLPE] : []), revisao],
  };
}
