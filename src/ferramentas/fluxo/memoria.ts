// O que a pessoa está fazendo no fluxo, SÓ na memória desta aba (variável do módulo): sobrevive a andar entre
// os passos e a voltar ao início, e some ao fechar ou recarregar a aba. Proibido guardar em localStorage,
// sessionStorage, IndexedDB, cookie ou no endereço (pasta.test.ts confere a pasta toda).

import { VOLTA_DO_RODIZIO } from '../cards/exemplos';
import type { Logo } from '../cards/logo';
import { convocacaoVazia } from '../reuniao/convocacao';
import { rascunho } from '../reuniao/rascunho';
import { exemploDoFluxo, PERGUNTA_DA_TROCA_DO_RASCUNHO, type DadosDoFluxo, type Tipo } from './estado';

const porTipo = new Map<Tipo, DadosDoFluxo>();
let logo: Logo | undefined;

// Rodízio dos exemplos: começa num ponto ao acaso da volta (0 … VOLTA_DO_RODIZIO − 1) e anda um a cada exemplo novo.
let proximo = Math.floor(Math.random() * VOLTA_DO_RODIZIO);

/** Há dados deste tipo na memória desta aba (quem abre /3 ou /pronto direto, depois de recarregar, não tem)? */
export const existe = (tipo: Tipo): boolean => porTipo.has(tipo);

/** Os dados do tipo. Na primeira vez (ou depois de "Fazer outro"), começa com um exemplo pronto. */
export function dadosDo(tipo: Tipo, hoje: Date = new Date()): DadosDoFluxo {
  let d = porTipo.get(tipo);
  if (!d) {
    d = exemploDoFluxo(tipo, proximo++, hoje);
    porTipo.set(tipo, d);
  }
  return d;
}

/** Troca os dados do tipo (vindos de outra tela ou de "criar outro a partir deste"). */
export function guardar(d: DadosDoFluxo): void {
  porTipo.set(d.tipo, d);
}

/**
 * Troca o rascunho pelos dados de um link (editar ou #/cards). Se a pessoa já tinha escrito algo (origem
 * 'pessoa'), pergunta antes. Devolve se trocou; se recusou, o rascunho dela fica como estava.
 */
export function trocarPorDadosDeLink(novo: DadosDoFluxo, confirmar: (pergunta: string) => boolean = (t) => window.confirm(t)): boolean {
  if (porTipo.get(novo.tipo)?.origem === 'pessoa' && !confirmar(PERGUNTA_DA_TROCA_DO_RASCUNHO)) return false;
  guardar(novo);
  return true;
}

/** "Fazer outro": esquece tudo (o próximo começa com outro exemplo), inclusive a convocação que foi para a ata. */
export function esquecerTudo(): void {
  porTipo.clear();
  logo = undefined;
  rascunho.convocacao = convocacaoVazia();
}

/** O logo escolhido em "Mais opções" (já reduzido no aparelho; nunca enviado nem guardado). */
export const logoAtual = (): Logo | undefined => logo;
export function trocarLogo(novo: Logo | undefined): void {
  logo = novo;
}
