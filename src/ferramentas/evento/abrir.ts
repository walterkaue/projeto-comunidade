// Abrir os dados de um link de evento: confere a lista de bloqueio e lê o evento. Usado pela página e
// pela rota de edição ("criar outro a partir deste"): as duas só mostram um evento depois desta conferência.
//
// Antes de tudo, corta o que colou no fim dos dados (ponto, vírgula, parêntese, "%20Obrigada!", "%0A"; B-03 da
// simulação de 06/11/2026): só o começo no alfabeto do base64url é lido e conferido, então o resto nunca vira
// conteúdo. A lista é conferida com esses dados E com a forma canônica do evento (formato.ts), para que trocar
// um caractere do link, o espaço no JSON ou a marca de compressão não faça um link removido voltar.

import type { MotivoDaRemocao } from '../../comum/entreTelas';
import { motivoDoLinkBloqueado } from './bloqueio';
import { cortarDadosDoLink, dadosCanonicos, decodificar, type ProblemaDoLink } from './formato';
import type { Evento } from './validar';

export type Aberto =
  | { estado: 'bloqueado'; motivo: MotivoDaRemocao }
  // `dados`: os dados já cortados (sem o que colou no fim). abrirEvento sempre preenche; é opcional só para
  // telas e testes que montam um 'ok' à mão.
  | { estado: 'ok'; evento: Evento; dados?: string }
  | { estado: 'problema'; problema: ProblemaDoLink };

export interface Dependencias {
  /** O motivo da remoção, ou null se nenhum destes dados está na lista. */
  bloqueado: (dados: string[]) => Promise<MotivoDaRemocao | null>;
  ler: typeof decodificar;
}

const padrao: Dependencias = { bloqueado: (d) => motivoDoLinkBloqueado(d), ler: decodificar };

export async function abrirEvento(dados: string, deps: Dependencias = padrao): Promise<Aberto> {
  // Lê o evento primeiro (rápido, no aparelho) para conferir a lista UMA vez, com o link como veio e a forma
  // canônica juntos: em internet fraca, a lista é a parte lenta.
  const limpo = cortarDadosDoLink(dados);
  const leitura = await deps.ler(limpo);
  const canonico = leitura.ok ? dadosCanonicos(leitura.evento) : '';
  const conferir = canonico && canonico !== limpo ? [limpo, canonico] : [limpo];
  const motivo = await deps.bloqueado(conferir);
  if (motivo) return { estado: 'bloqueado', motivo };
  if (!leitura.ok) return { estado: 'problema', problema: leitura.problema };
  return { estado: 'ok', evento: leitura.evento, dados: limpo };
}
