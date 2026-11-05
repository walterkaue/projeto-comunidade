// Convocação da reunião (puro, sem DOM): o modelo e a pauta. O fluxo único (src/ferramentas/fluxo) monta a
// convocação e o texto para o WhatsApp; a ata usa a pauta daqui ("Usar a pauta da reunião").

import { umaLinha } from './data';

export interface Convocacao {
  organizacao: string;
  /** AAAA-MM-DD */
  data: string;
  /** HH:MM */
  hora: string;
  local: string;
  pauta: string[];
  /** Link de um evento feito neste site (opcional). */
  link: string;
}

export function convocacaoVazia(): Convocacao {
  return { organizacao: '', data: '', hora: '', local: '', pauta: [''], link: '' };
}

/** Itens preenchidos da pauta, sem espaços sobrando. */
export function pautaPreenchida(pauta: readonly string[]): string[] {
  return pauta.map(umaLinha).filter(Boolean);
}

/** Troca o item `i` com o vizinho (-1 sobe, +1 desce). Devolve uma lista nova; fora dos limites, a mesma ordem. */
export function moverItem<T>(lista: readonly T[], i: number, passo: -1 | 1): T[] {
  const j = i + passo;
  const nova = [...lista];
  if (i < 0 || i >= lista.length || j < 0 || j >= lista.length) return nova;
  [nova[i], nova[j]] = [nova[j]!, nova[i]!];
  return nova;
}

/** Tira o item `i`. Devolve uma lista nova. */
export function tirarItem<T>(lista: readonly T[], i: number): T[] {
  return lista.filter((_, k) => k !== i);
}
