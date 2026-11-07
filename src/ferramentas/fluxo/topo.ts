// O alto e o pé das telas do fluxo: título (h1), miniatura, nota e dica dos passos, o título do Pronto e a barra
// fixa de baixo. Só monta HTML; texto digitado nunca entra aqui sem esc.

import { esc } from '../../comum/html';
import { notaEDicaDoPasso, NOTA_DO_LINK, PORTAS, tituloDoPasso2, type DadosDoFluxo } from './estado';

export type PassoNumerado = 1 | 2 | 3;

const NOME_DO_PASSO = (d: DadosDoFluxo, passo: PassoNumerado): string =>
  passo === 1 ? 'O quê' : passo === 2 ? tituloDoPasso2(d.tipo) : 'Como fica';

export interface ExtrasDoTopo {
  /** HTML que divide a linha com a dica (passo 1: "Apagar tudo"). */
  aoLadoDaDica?: string;
  /** HTML da miniatura (passos 1 e 2): vem logo depois do título. */
  miniatura?: string;
}

/**
 * Título da tela: o verbo da porta, "Passo N de 3" e o nome do passo, tudo dentro do h1 (o leitor de tela lê
 * "Chamar para uma reunião. Passo 1 de 3: O quê"). Os separadores só aparecem para o leitor de tela.
 */
export function topoDoPasso(d: DadosDoFluxo, passo: PassoNumerado, extras: ExtrasDoTopo = {}): string {
  const { aoLadoDaDica = '', miniatura = '' } = extras;
  const { nota, dica } = notaEDicaDoPasso(d, passo);
  const htmlDaDica = dica ? `<p class="fluxo-dica">${esc(dica)}</p>` : '';
  // Passo 1: a dica e "Apagar tudo" dividem a mesma linha (o primeiro campo cabe na primeira tela).
  const linha = aoLadoDaDica ? `<div class="fluxo-dica-linha">${htmlDaDica}${aoLadoDaDica}</div>` : htmlDaDica;
  const aviso = `${nota ? `<p class="fluxo-nota">${esc(nota)}</p>` : ''}${linha}`;
  // A miniatura (se houver) vem logo depois do título: o Tab passa por "Ver a prévia maior" e "Apagar" antes do
  // primeiro campo. O CSS a põe no topo da tela.
  return `<h1 tabindex="-1"><span class="fluxo-verbo">${esc(PORTAS[d.tipo].verbo)}</span><span class="fluxo-so-leitor">. </span><span class="fluxo-passo">Passo ${passo} de 3</span><span class="fluxo-so-leitor">: </span><span class="fluxo-nome">${esc(NOME_DO_PASSO(d, passo))}</span></h1>
    ${miniatura}
    ${aviso}`;
}

/** Título do Pronto ("Chamar para uma reunião: Pronto!") e, em dados de link, a nota "Confira tudo antes de mandar". */
export function topoDoPronto(d: DadosDoFluxo): string {
  return `<h1 tabindex="-1"><span class="fluxo-verbo">${esc(PORTAS[d.tipo].verbo)}</span><span class="fluxo-so-leitor">: </span><span class="fluxo-pronto-titulo">Pronto!</span></h1>
    ${d.origem === 'link' ? `<p class="fluxo-nota">${esc(NOTA_DO_LINK)}</p>` : ''}`;
}

/** Barra fixa de baixo: "Voltar" e o botão que envia o formulário do passo (`rotulo`, "Continuar" por padrão). */
export const barra = (rotulo = 'Continuar'): string => `<div class="fluxo-barra">
      <button type="button" class="botao botao-sec" id="fluxo-voltar">Voltar</button>
      <button type="submit" form="fluxo-form" class="botao" id="fluxo-continuar">${esc(rotulo)}</button>
    </div>`;
