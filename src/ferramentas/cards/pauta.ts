// Pauta no card: um item por linha, numerado, cortado só entre palavras (puro, sem DOM).

import { cortarTexto, normalizarEspacos, type Medir } from '../../comum/texto';

/** Linhas que um item ocupa no máximo. */
export const LINHAS_POR_ITEM = 2;

/** "e mais 1 assunto" / "e mais 4 assuntos". */
export const eMais = (n: number): string => `e mais ${n} ${n === 1 ? 'assunto' : 'assuntos'}`;

/** Quebra só entre palavras. Palavra sozinha mais larga que a linha fica inteira (quem desenha corta com "…"). */
function quebrarEntrePalavras(medir: Medir, texto: string, largura: number): string[] {
  const linhas: string[] = [];
  let atual = '';
  for (const palavra of texto.split(' ')) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (!atual || medir(teste) <= largura) atual = teste;
    else {
      linhas.push(atual);
      atual = palavra;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/** Tira palavras do fim até a linha com "…" caber. Nunca corta no meio de uma palavra (salvo palavra única maior que a linha). */
function fecharComReticencias(medir: Medir, linha: string, largura: number): string {
  const palavras = linha.split(' ');
  while (palavras.length > 1 && medir(`${palavras.join(' ')}…`) > largura) palavras.pop();
  const texto = palavras.join(' ').replace(/[\s,;:.\-–—]+$/, '');
  return medir(`${texto}…`) <= largura ? `${texto}…` : cortarTexto(medir, texto, largura);
}

/** As linhas de um item já numerado ("1. Limpeza do córrego"): até 2; o que passa disso termina em "…". */
export function linhasDoItem(medir: Medir, numero: number, texto: string, largura: number): string[] {
  const limpo = normalizarEspacos(texto).replace(/\n/g, ' ');
  const linhas = quebrarEntrePalavras(medir, `${numero}. ${limpo}`, largura);
  if (linhas.length <= LINHAS_POR_ITEM) return linhas.map((l) => (medir(l) <= largura ? l : cortarTexto(medir, l, largura)));
  const primeira = linhas[0]!;
  const resto = linhas.slice(1).join(' ');
  return [medir(primeira) <= largura ? primeira : cortarTexto(medir, primeira, largura), fecharComReticencias(medir, resto, largura)];
}

export interface PautaNoCard {
  linhas: string[];
  /** Quantos itens ficaram de fora (a última linha diz "e mais N assuntos"). */
  fora: number;
}

/**
 * Monta as linhas da pauta com no máximo `maxLinhas`. Só itens inteiros; se nem todos cabem, termina com
 * "e mais N assuntos". Sempre mostra ao menos o primeiro item.
 */
export function linhasDaPauta(medir: Medir, itens: readonly string[], largura: number, maxLinhas: number): PautaNoCard {
  const lista = itens.map((t) => t.trim()).filter((t) => t !== '');
  const porItem = lista.map((t, i) => linhasDoItem(medir, i + 1, t, largura));
  const total = porItem.reduce((s, l) => s + l.length, 0);
  if (total <= maxLinhas) return { linhas: porItem.flat(), fora: 0 };
  let mostrados = 0;
  let usadas = 0;
  for (const l of porItem) {
    if (usadas + l.length + 1 > maxLinhas) break;
    usadas += l.length;
    mostrados++;
  }
  if (mostrados === 0) mostrados = 1;
  const fora = lista.length - mostrados;
  return { linhas: [...porItem.slice(0, mostrados).flat(), eMais(fora)], fora };
}
