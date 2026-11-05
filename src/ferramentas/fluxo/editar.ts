// "Criar outro a partir deste" (#/evento/editar/<dados>): abre os dados de um evento já existente e leva ao passo 1.
// Os dados passam por abrirEvento (lista de bloqueio e validação). Fica à parte do index.ts para ser testada com
// dependências falsas.

import { avisar } from '../../comum/aviso';
import { esc } from '../../comum/html';
import type { Aberto } from '../evento/abrir';
import { dadosDoEvento, enderecoDoPasso, type DadosDoFluxo } from './estado';
import { trocarPorDadosDeLink } from './memoria';
import { zerarPassos } from './navegacao';

export interface DependenciasDeEditar {
  abrirEvento: (dados: string) => Promise<Aberto>;
  /** Link completo deste site para os dados (formato.linkCompleto com o endereço do site). */
  linkCompleto: (dados: string) => string;
  /** Endereço desta página: base para conferir que o link é deste site. */
  base: () => string;
  /** Guarda os dados (perguntando antes se a pessoa já tinha escrito algo). Devolve se trocou. */
  guardar: (d: DadosDoFluxo) => boolean;
  ir: (endereco: string) => void;
  avisar: (mensagem: string) => void;
}

async function padrao(): Promise<DependenciasDeEditar> {
  const [{ abrirEvento }, { linkCompleto }, { enderecoDoSite }] = await Promise.all([
    import('../evento/abrir'),
    import('../evento/formato'),
    import('../evento/partes'),
  ]);
  return {
    abrirEvento: (dados) => abrirEvento(dados),
    linkCompleto: (dados) => linkCompleto(dados, enderecoDoSite()),
    base: () => location.href,
    guardar: (d) => trocarPorDadosDeLink(d),
    ir: (endereco) => location.replace(endereco),
    avisar,
  };
}

/** Tela de aviso com botão para começar um evento novo. Os textos são fixos, nada digitado. */
export function telaSemModelo(raiz: HTMLElement, titulo: string): void {
  raiz.innerHTML = `<main class="tela fluxo">
    <h1 tabindex="-1">${esc(titulo)}</h1>
    <a class="botao" href="${esc(enderecoDoPasso('evento', 1))}">Começar um evento novo</a>
  </main>`;
  raiz.querySelector<HTMLElement>('h1')?.focus();
}

/** Devolve a promessa para os testes esperarem; a tela não precisa dela. */
export async function abrirParaEditar(
  raiz: HTMLElement,
  dados: string,
  vivo: () => boolean,
  deps?: DependenciasDeEditar,
): Promise<void> {
  raiz.innerHTML = `<main class="tela fluxo"><h1 tabindex="-1">Abrindo os dados do evento…</h1></main>`;
  try {
    const dp = deps ?? (await padrao());
    const r = await dp.abrirEvento(dados);
    if (!vivo()) return;
    if (r.estado === 'ok') {
      zerarPassos();
      const trocou = dp.guardar(dadosDoEvento(r.evento, dp.linkCompleto(dados), dp.base()));
      dp.ir(enderecoDoPasso('evento', 1));
      dp.avisar(trocou ? 'Dados do evento carregados. Mude o que quiser.' : 'Você ficou com o que estava fazendo.');
    } else if (r.estado === 'bloqueado') {
      telaSemModelo(raiz, 'Este link foi removido e não pode ser usado como modelo.');
    } else {
      telaSemModelo(raiz, 'Não deu para abrir os dados desse link.');
    }
  } catch {
    if (vivo()) telaSemModelo(raiz, 'Não deu para abrir os dados desse link.');
  }
}
