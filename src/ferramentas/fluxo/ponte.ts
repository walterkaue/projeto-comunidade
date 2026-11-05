// Ponte "Fazer a ata" (puro): a pauta da reunião vira os pontos da ata. Vai só para a memória da aba
// (reuniao/rascunho.ts), nunca para link nem armazenamento.

import { pontosDaPauta, type Ata } from '../reuniao/ata';
import { itensDaPauta, type DadosDoFluxo } from './estado';

/** A ata já tem pontos com texto (o que a pessoa escreveu se perderia ao trocar pela pauta)? */
export const haPontosComTexto = (ata: Ata): boolean =>
  ata.pontos.some((p) => p.titulo.trim() || p.discutido.trim() || p.decidido.trim());

export const PERGUNTA_DA_TROCA = 'Trocar os pontos da ata pela pauta desta reunião?';

/**
 * A ata começando pela pauta: os pontos viram os itens da pauta e, se estiverem vazios, organização, data, local e
 * início (a hora da reunião) vêm da convocação. Devolve uma ata nova; a de entrada não muda.
 */
export function ataComAPauta(ata: Ata, d: DadosDoFluxo): Ata {
  const pontos = pontosDaPauta(itensDaPauta(d.pauta));
  const se = (atual: string, novo: string) => (atual.trim() ? atual : novo);
  return {
    ...ata,
    organizacao: se(ata.organizacao, d.organizacao.trim()),
    data: se(ata.data, d.data),
    local: se(ata.local, d.local.trim()),
    inicio: se(ata.inicio, d.hora),
    pontos: pontos.length ? pontos : ata.pontos,
  };
}
