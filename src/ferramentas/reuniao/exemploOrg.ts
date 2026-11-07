// Exemplo em cinza do campo "Organização" da ata: o mesmo rodízio de exemplos do fluxo (cards/exemplos.ts),
// só lido. O campo continua vazio; o exemplo vai só no placeholder.
// cópia provisória: pedido em docs/pedidos-comum.md (o fluxo sorteia o ponto de partida em fluxo/memoria.ts)

import { exemplo, ORGANIZACOES, VOLTA_DO_RODIZIO } from '../cards/exemplos';

/** Tamanho máximo do exemplo num campo de uma linha (o placeholder não quebra linha). */
export const MAXIMO_DO_EXEMPLO = 28;

/**
 * Nome curto, escrito à mão, de cada organização do catálogo (o nome inteiro passa de 28 letras).
 * Os três grupos religiosos têm o mesmo tratamento: todos perdem o nome da tradição e ficam só com o nome
 * inventado, para nenhum sair cortado pela metade (revisão de neutralidade, 07/11/2026).
 */
export const NOMES_CURTOS: Readonly<Record<string, string>> = {
  'Associação de Moradores Vila Cantinho Sereno': 'Associação Vila Cantinho',
  'Sindicato dos Metalúrgicos Vale das Pedras Mansas': 'Sindicato dos Metalúrgicos',
  'Grupo de Oração Flor do Pomar': 'Grupo Flor do Pomar',
  'Núcleo de Bairro Morro do Tatu-Bola': 'Núcleo Morro do Tatu-Bola',
  'Coletivo Palco Aberto': 'Coletivo Palco Aberto',
  'Instituto Rede Viva': 'Instituto Rede Viva',
  'Conselho Escolar Riacho Cinco Pedras': 'Conselho Escolar Riacho',
  'Casa de Matriz Africana Pé de Jaca Dourado': 'Casa Pé de Jaca Dourado',
  'Centro Espírita Lume do Vale Cheiroso': 'Centro Lume do Vale',
};

const PALAVRAS_SOLTAS = new Set(['de', 'do', 'da', 'dos', 'das', 'e']);

/** Reserva para um nome novo no catálogo sem nome curto: corta na última palavra inteira que cabe. */
export function cortarLimpo(nome: string, maximo = MAXIMO_DO_EXEMPLO): string {
  const palavras = nome.trim().split(/\s+/);
  while (palavras.length > 1 && palavras.join(' ').length > maximo) palavras.pop();
  while (palavras.length > 1 && PALAVRAS_SOLTAS.has(palavras[palavras.length - 1]!.toLowerCase())) palavras.pop();
  return palavras.join(' ');
}

/** Ponto ao acaso da volta do rodízio. */
export const sorteioDoExemplo = (): number => Math.floor(Math.random() * VOLTA_DO_RODIZIO);

/** Nome de organização fictício, curto, do rodízio (índice qualquer; dá a volta). */
export const exemploDeOrganizacao = (indice: number): string => {
  const nome = exemplo('reuniao', indice).organizacao;
  return NOMES_CURTOS[nome] ?? cortarLimpo(nome);
};

/** Para o teste: todo nome do catálogo tem nome curto. */
export const nomesSemCurto = (): string[] => ORGANIZACOES.filter((o) => !(o in NOMES_CURTOS));
