// Exemplo em cinza do campo "Organização" da ata: o mesmo rodízio de exemplos do fluxo (cards/exemplos.ts),
// só lido. O campo continua vazio; o exemplo vai só no placeholder.
// cópia provisória: pedido em docs/pedidos-comum.md (o fluxo sorteia o ponto de partida em fluxo/memoria.ts)

import { exemplo, VOLTA_DO_RODIZIO } from '../cards/exemplos';

/** Tamanho máximo do exemplo num campo de uma linha (o placeholder não quebra linha). */
export const MAXIMO_DO_EXEMPLO = 28;

const PALAVRAS_SOLTAS = new Set(['de', 'do', 'da', 'dos', 'das', 'e']);

/** Corta o nome na última palavra inteira que cabe, sem deixar "de", "do"… pendurado no fim. */
export function cortarLimpo(nome: string, maximo = MAXIMO_DO_EXEMPLO): string {
  const palavras = nome.trim().split(/\s+/);
  while (palavras.length > 1 && palavras.join(' ').length > maximo) palavras.pop();
  while (palavras.length > 1 && PALAVRAS_SOLTAS.has(palavras[palavras.length - 1]!.toLowerCase())) palavras.pop();
  return palavras.join(' ');
}

/** Ponto ao acaso da volta do rodízio. */
export const sorteioDoExemplo = (): number => Math.floor(Math.random() * VOLTA_DO_RODIZIO);

/** Nome de organização fictício, curto, do rodízio (índice qualquer; dá a volta). */
export const exemploDeOrganizacao = (indice: number): string => cortarLimpo(exemplo('reuniao', indice).organizacao);
