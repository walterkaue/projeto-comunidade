// Textos da tela de link removido (puro, sem DOM). Auditoria 05/11/2026, M7 e M8: quem criou o link não recebe
// aviso nenhum (o site não tem o contato), então esta tela é o único lugar para dizer o motivo e como pedir
// revisão (docs/produto.md 4.1: quem foi denunciado pode pedir revisão).

import type { MotivoDaRemocao } from '../../comum/entreTelas';
import { EMAIL_CONTATO } from '../../comum/marca';
import { textoDaRegra } from '../../comum/regras';

export interface TextosDoRemovido {
  titulo: string;
  paragrafos: string[];
}

export function textosDoRemovido(motivo: MotivoDaRemocao): TextosDoRemovido {
  const revisao = `Criou este link e discorda? Escreva para ${EMAIL_CONTATO}, mande o link e peça revisão. Uma pessoa responde.`;
  if (motivo.tipo === 'pedido') {
    return {
      titulo: 'Este link foi removido a pedido de quem o criou',
      paragrafos: ['Ele não está mais disponível.', revisao],
    };
  }
  const regra = motivo.tipo === 'regra' ? textoDaRegra(motivo.regra) : '';
  return {
    titulo: 'Este link foi removido após denúncia',
    paragrafos: [
      'Ele não está mais disponível.',
      ...(regra ? [`Regra de uso que ele fere: ${regra}`] : []),
      revisao,
    ],
  };
}
