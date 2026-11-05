// Quebra e corte de texto por largura, para desenhar em canvas. Puro: quem mede é a tela,
// passando `(s) => ctx.measureText(s).width`.

export type Medir = (s: string) => number;

/** Tira espaços das pontas e junta espaços repetidos (inclui tabulação e espaço sem quebra). Mantém "\n". */
export function normalizarEspacos(texto: string): string {
  return texto
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t ]+/g, ' ').trim())
    .join('\n')
    .trim();
}

/** Parte uma palavra mais larga que a linha em pedaços que cabem (sempre ao menos 1 caractere por pedaço). */
function partirPalavra(medir: Medir, palavra: string, largura: number): string[] {
  const pedacos: string[] = [];
  let atual = '';
  for (const ch of Array.from(palavra)) {
    if (atual && medir(atual + ch) > largura) {
      pedacos.push(atual);
      atual = ch;
    } else atual += ch;
  }
  if (atual) pedacos.push(atual);
  return pedacos;
}

/** Corta com reticências no fim, até caber na largura. */
// Busca binária no tamanho: texto longo (descrição de 10 mil letras) não trava aparelho fraco.
export function cortarTexto(medir: Medir, texto: string, largura: number): string {
  if (medir(texto) <= largura) return texto;
  const letras = Array.from(texto);
  const cabe = (n: number) => medir(letras.slice(0, n).join('').trimEnd() + '…') <= largura;
  let min = 0;
  let max = letras.length - 1;
  while (min < max) {
    const meio = Math.ceil((min + max) / 2);
    if (cabe(meio)) min = meio;
    else max = meio - 1;
  }
  return letras.slice(0, min).join('').trimEnd() + '…';
}

/**
 * Quebra em linhas que cabem na largura. Respeita "\n", ignora espaços repetidos, parte palavra longa
 * (URL) em pedaços. Com `maxLinhas`, a última linha termina em reticências se sobrou texto.
 * Linha em branco digitada ("\n\n") vira uma linha vazia (separa parágrafos).
 */
export function quebrarTexto(medir: Medir, texto: string, largura: number, maxLinhas?: number): string[] {
  const linhas: string[] = [];
  for (const paragrafo of normalizarEspacos(texto).split('\n')) {
    if (paragrafo === '') {
      linhas.push('');
      continue;
    }
    let atual = '';
    for (const palavra of paragrafo.split(' ')) {
      const teste = atual ? `${atual} ${palavra}` : palavra;
      if (medir(teste) <= largura) {
        atual = teste;
        continue;
      }
      if (atual) linhas.push(atual);
      if (medir(palavra) <= largura) {
        atual = palavra;
      } else {
        const pedacos = partirPalavra(medir, palavra, largura);
        atual = pedacos.pop() ?? '';
        linhas.push(...pedacos);
      }
    }
    if (atual) linhas.push(atual);
  }
  if (maxLinhas === undefined || maxLinhas < 1 || linhas.length <= maxLinhas) return linhas;
  const ficam = linhas.slice(0, maxLinhas);
  // Tudo que não coube vai para a última linha, que é cortada com reticências.
  const resto = linhas.slice(maxLinhas - 1).filter((l) => l !== '').join(' ');
  ficam[maxLinhas - 1] = cortarTexto(medir, resto, largura);
  return ficam;
}
