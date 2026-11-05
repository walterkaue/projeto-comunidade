// As Regras de uso: o que não pode. Fonte única para a página Regras de uso e para a tela de link removido.
// O Gem de triagem (docs/gemini-triagem.md, seção 4) tem uma cópia à mão: mudou aqui, mude lá e no Gem.
//
// O NÚMERO de cada regra (posição + 1) vai em public/bloqueados.json ("motivo": "regra-5") e na planilha de
// controle (docs/moderacao.md). Nunca mude a ordem nem tire uma regra do meio: regra nova entra no fim.

export const REGRAS_DE_USO = [
  'Ofensa, humilhação ou perseguição a pessoa ou grupo.',
  'Discurso de ódio, racismo e outras formas de discriminação.',
  'Ameaça e incentivo à violência.',
  'Mentira comprovada, principalmente sobre saúde, segurança ou eleição.',
  'Golpe, ou pedido de dinheiro ou de dado pessoal por meio de engano.',
  'Dados de outras pessoas sem permissão: telefone, endereço, foto, lista de presença.',
  'Conteúdo que viole direito autoral ou use marca de outra pessoa sem direito.',
  'Conteúdo sexual envolvendo crianças ou adolescentes.',
  // 9, auditoria 05/11/2026 (M6): convocação falsa em nome de outra organização ou de órgão público.
  'Fingir ser outra pessoa, organização ou órgão público.',
] as const;

/** Texto da regra pelo número (1 a REGRAS_DE_USO.length), ou vazio se o número não existir. */
export function textoDaRegra(numero: number): string {
  return Number.isInteger(numero) && numero >= 1 ? (REGRAS_DE_USO[numero - 1] ?? '') : '';
}
