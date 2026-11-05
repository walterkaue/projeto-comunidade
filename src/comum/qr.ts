// QR sob demanda, desenhado direto no canvas (para o card). A biblioteca (uqr) só é baixada quando alguém
// pede um QR; a conta dos retângulos é pura e testada. Tudo roda no aparelho.

export type Matriz = readonly (readonly boolean[])[];

export const MARGEM_QR = 4;

export interface Retangulo {
  x: number;
  y: number;
  l: number;
  a: number;
}

/** Gera a matriz do QR (true = módulo escuro). Correção de erro M: aguenta impressão e foto ruim. */
export async function matrizDoQr(texto: string): Promise<boolean[][]> {
  const { encode } = await import('uqr');
  return encode(texto, { ecc: 'M', border: 0 }).data;
}

/**
 * Retângulos dos módulos escuros, em pixels inteiros dentro de um quadrado de `lado` px (origem 0,0).
 * O módulo tem tamanho inteiro (arredondado para baixo, mínimo 1) e o conjunto fica centralizado:
 * borda nítida e leitura boa pela câmera. Módulos escuros seguidos na linha viram um retângulo só.
 */
export function retangulosDoQr(matriz: Matriz, lado: number, margem = MARGEM_QR): Retangulo[] {
  const n = matriz.length;
  if (n === 0) return [];
  const modulo = Math.max(1, Math.floor(lado / (n + margem * 2)));
  const total = modulo * (n + margem * 2);
  const desloc = Math.max(0, Math.floor((lado - total) / 2)) + modulo * margem;
  const r: Retangulo[] = [];
  matriz.forEach((linha, y) => {
    let x = 0;
    while (x < n) {
      if (!linha[x]) {
        x++;
        continue;
      }
      const ini = x;
      while (x < n && linha[x]) x++;
      r.push({ x: desloc + ini * modulo, y: desloc + y * modulo, l: (x - ini) * modulo, a: modulo });
    }
  });
  return r;
}

export interface OpcoesQr {
  margem?: number;
  escuro?: string;
  claro?: string;
}

/** Pinta o QR no canvas: fundo claro (com a margem) e módulos escuros, no quadrado de `lado` px em (x, y). */
export function desenharQr(ctx: CanvasRenderingContext2D, matriz: Matriz, x: number, y: number, lado: number, opcoes: OpcoesQr = {}): void {
  const { margem = MARGEM_QR, escuro = '#111111', claro = '#ffffff' } = opcoes;
  ctx.save();
  ctx.fillStyle = claro;
  ctx.fillRect(x, y, lado, lado);
  ctx.fillStyle = escuro;
  for (const r of retangulosDoQr(matriz, lado, margem)) ctx.fillRect(x + r.x, y + r.y, r.l, r.a);
  ctx.restore();
}
