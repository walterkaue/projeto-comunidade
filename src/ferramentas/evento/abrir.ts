// Abrir os dados de um link de evento: confere a lista de bloqueio e lê o evento. Usado pela página e
// pela rota de edição ("criar outro a partir deste"): as duas só mostram um evento depois desta conferência.
//
// A lista é conferida com o texto do link como veio E com a forma canônica do evento (formato.ts), para que
// trocar um caractere do link, o espaço no JSON ou a marca de compressão não faça um link removido voltar.

import type { MotivoDaRemocao } from '../../comum/entreTelas';
import { motivoDoLinkBloqueado } from './bloqueio';
import { dadosCanonicos, decodificar, type ProblemaDoLink } from './formato';
import type { Evento } from './validar';

export type Aberto =
  | { estado: 'bloqueado'; motivo: MotivoDaRemocao }
  | { estado: 'ok'; evento: Evento }
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
  const leitura = await deps.ler(dados);
  const canonico = leitura.ok ? dadosCanonicos(leitura.evento) : '';
  const conferir = canonico && canonico !== dados ? [dados, canonico] : [dados];
  const motivo = await deps.bloqueado(conferir);
  if (motivo) return { estado: 'bloqueado', motivo };
  if (!leitura.ok) return { estado: 'problema', problema: leitura.problema };
  return { estado: 'ok', evento: leitura.evento };
}
