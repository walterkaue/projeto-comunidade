// Abrir os dados de um link de evento: confere a lista de bloqueio e lê o evento. Usado pela página e
// pela rota de edição ("criar outro a partir deste"): as duas só mostram um evento depois desta conferência.
//
// A lista é conferida com o texto do link como veio E com a forma canônica do evento (formato.ts), para que
// trocar um caractere do link, o espaço no JSON ou a marca de compressão não faça um link removido voltar.

import { linkBloqueado } from './bloqueio';
import { dadosCanonicos, decodificar, type ProblemaDoLink } from './formato';
import type { Evento } from './validar';

export type Aberto =
  | { estado: 'bloqueado' }
  | { estado: 'ok'; evento: Evento }
  | { estado: 'problema'; problema: ProblemaDoLink };

export interface Dependencias {
  bloqueado: (dados: string[]) => Promise<boolean>;
  ler: typeof decodificar;
}

const padrao: Dependencias = { bloqueado: (d) => linkBloqueado(d), ler: decodificar };

export async function abrirEvento(dados: string, deps: Dependencias = padrao): Promise<Aberto> {
  // Lê o evento primeiro (rápido, no aparelho) para conferir a lista UMA vez, com o link como veio e a forma
  // canônica juntos: em internet fraca, a lista é a parte lenta.
  const leitura = await deps.ler(dados);
  const canonico = leitura.ok ? dadosCanonicos(leitura.evento) : '';
  const conferir = canonico && canonico !== dados ? [dados, canonico] : [dados];
  if (await deps.bloqueado(conferir)) return { estado: 'bloqueado' };
  if (!leitura.ok) return { estado: 'problema', problema: leitura.problema };
  return { estado: 'ok', evento: leitura.evento };
}
