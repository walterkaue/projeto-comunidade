// Convocação da reunião (puro, sem DOM): modelo, pauta e texto para o WhatsApp.

import { TAMANHO_MAXIMO, type DadosDoCard } from '../../comum/entreTelas';
import { letras } from '../../comum/texto';
import { dataPorExtenso, horaEmTexto, umaLinha } from './data';

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

export const MAXIMO_PAUTA = 20;

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

export interface Faltas {
  campo: 'organizacao' | 'data' | 'hora' | 'local' | 'pauta';
  mensagem: string;
}

/** O que falta para gerar a convocação (na ordem da tela). Vazio = pode gerar. */
export function faltasDaConvocacao(c: Convocacao): Faltas[] {
  const f: Faltas[] = [];
  if (!umaLinha(c.organizacao)) f.push({ campo: 'organizacao', mensagem: 'escreva o nome da organização.' });
  if (!dataPorExtenso(c.data)) f.push({ campo: 'data', mensagem: 'escolha a data da reunião.' });
  if (!horaEmTexto(c.hora)) f.push({ campo: 'hora', mensagem: 'escolha a hora da reunião.' });
  if (!umaLinha(c.local)) f.push({ campo: 'local', mensagem: 'escreva o local da reunião.' });
  if (pautaPreenchida(c.pauta).length === 0) f.push({ campo: 'pauta', mensagem: 'acrescente pelo menos um item na pauta.' });
  return f;
}

/** Texto para colar no WhatsApp (*negrito* do WhatsApp). */
export function textoDaConvocacao(c: Convocacao, linkDoEvento = ''): string {
  const linhas = [
    '*Convocação para reunião*',
    `*${umaLinha(c.organizacao)}*`,
    '',
    `📅 *Data:* ${dataPorExtenso(c.data)}`,
    `🕒 *Hora:* ${horaEmTexto(c.hora)}`,
    `📍 *Local:* ${umaLinha(c.local)}`,
    '',
    '*Pauta*',
    ...pautaPreenchida(c.pauta).map((item, i) => `${i + 1}. ${item}`),
  ];
  if (linkDoEvento) linhas.push('', `Mais informações: ${linkDoEvento}`);
  linhas.push('', 'Sua presença é importante. Confirme com quem convocou.');
  return linhas.join('\n');
}

/** Pauta em uma linha para o card (cabe até TAMANHO_MAXIMO.texto; passando disso, termina em "…"). */
export function textoDoCard(c: Convocacao): string {
  const t = `Pauta: ${pautaPreenchida(c.pauta).join('; ')}`;
  const partes = letras(t);
  return partes.length <= TAMANHO_MAXIMO.texto ? t : `${partes.slice(0, TAMANHO_MAXIMO.texto - 1).join('')}…`;
}

/** O card vai mostrar a pauta ou o nome da organização mais curtos que no texto do WhatsApp? */
export function cardEncurtado(c: Convocacao): boolean {
  const t = `Pauta: ${pautaPreenchida(c.pauta).join('; ')}`;
  return letras(t).length > TAMANHO_MAXIMO.texto || letras(umaLinha(c.organizacao)).length > TAMANHO_MAXIMO.organizacao;
}

/** Dados do card da convocação (o Cards recebe pela memória da aba: prepararCard em src/comum/entreTelas.ts). */
export function dadosDoCardDaConvocacao(c: Convocacao, linkDoEvento = ''): DadosDoCard {
  return {
    modelo: 'reuniao',
    titulo: 'Convocação para reunião',
    data: c.data,
    hora: c.hora,
    local: c.local,
    texto: textoDoCard(c),
    organizacao: c.organizacao,
    link: linkDoEvento || undefined,
  };
}
