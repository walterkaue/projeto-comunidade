// Contador de letras da pauta (A-02/B-19): a linha na tela muda a cada letra; o leitor de tela só ouve quando a
// contagem cruza uma faixa nova (50, 20, 10, 0 e o limite passado), nunca a cada letra.

/** Faixa em que a pauta está, segundo quantas letras ainda cabem: 0 longe do fim, 1 até 50, 2 até 20, 3 até 10, 4 no limite, 5 passou. */
export function faixaDoContador(falta: number): number {
  if (falta > 50) return 0;
  if (falta > 20) return 1;
  if (falta > 10) return 2;
  if (falta > 0) return 3;
  return falta === 0 ? 4 : 5;
}

/** Fala só quando a pauta entra numa faixa mais perto do fim do que a de antes. */
export const deveAnunciarOContador = (faixaAntes: number, faixaAgora: number): boolean => faixaAgora > faixaAntes;
