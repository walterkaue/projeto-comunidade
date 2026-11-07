// O alto e o pé das telas do fluxo (docs/visual.md, seções 5 e 7): o topo do passo (nome da porta, "Passo N de 3" com
// as barrinhas e o título), a linha da prévia, a dica, o título do Pronto e a barra fixa de baixo.
// Só monta HTML; texto digitado nunca entra aqui sem esc.

import { esc } from '../../comum/html';
import { icone } from '../../comum/icones';
import { notaEDicaDoPasso, NOTA_DO_LINK, PORTAS, tituloDoPasso2, type DadosDoFluxo, type Tipo } from './estado';

export type PassoNumerado = 1 | 2 | 3;

const NOME_DO_PASSO = (d: DadosDoFluxo, passo: PassoNumerado): string =>
  passo === 1 ? 'O quê' : passo === 2 ? tituloDoPasso2(d.tipo) : 'Como fica';

export interface ExtrasDoTopo {
  /** HTML que divide a linha com a dica (passo 1: "Apagar tudo"). */
  aoLadoDaDica?: string;
  /** HTML da linha da prévia (passos 1 e 2): vem logo depois do título no código e sobe para o alto da tela no CSS. */
  miniatura?: string;
}

/** As três barrinhas do progresso: enfeite (o "Passo N de 3" escrito é que informa). Cheias até o passo atual. */
export function barrinhasDoPasso(passo: PassoNumerado): string {
  const barras = ([1, 2, 3] as const).map((n) => `<span class="fluxo-barrinha${n <= passo ? ' fluxo-barrinha-cheia' : ''}"></span>`).join('');
  return `<span class="fluxo-barrinhas" aria-hidden="true">${barras}</span>`;
}

/** O nome da porta com o quadradinho do ícone (enfeite) de 30 px. */
const nomeDaPorta = (tipo: Tipo): string =>
  `<span class="fluxo-verbo"><span class="icone-quadro icone-quadro-p">${icone(tipo, { tamanho: 18 })}</span><span class="fluxo-verbo-texto">${esc(PORTAS[tipo].verbo)}</span></span>`;

/** Nota fixa dos dados que vieram de um link: aviso de informação, a primeira frase em negrito. */
export function avisoDaNota(nota: string): string {
  if (!nota) return '';
  const negrito = nota.startsWith(NOTA_DO_LINK);
  const corpo = negrito ? `<strong>${esc(NOTA_DO_LINK)}</strong>${esc(nota.slice(NOTA_DO_LINK.length))}` : esc(nota);
  return `<div class="aviso-info fluxo-nota">${icone('info', { classe: 'aviso-icone' })}<div class="aviso-corpo"><p>${corpo}</p></div></div>`;
}

/**
 * Topo do passo: bloco na cor clara da porta com o nome da porta, "Passo N de 3" (com as barrinhas) e o título, tudo
 * dentro do h1 (o leitor de tela lê "Chamar para uma reunião. Passo 1 de 3: O quê"; os separadores só aparecem para
 * o leitor). Depois dele vêm a linha da prévia (passos 1 e 2), a nota e a dica.
 */
export function topoDoPasso(d: DadosDoFluxo, passo: PassoNumerado, extras: ExtrasDoTopo = {}): string {
  const { aoLadoDaDica = '', miniatura = '' } = extras;
  const { nota, dica } = notaEDicaDoPasso(d, passo);
  const htmlDaDica = dica ? `<p class="fluxo-dica">${esc(dica)}</p>` : '';
  // Passo 1: a dica e "Apagar tudo" dividem a mesma linha (o primeiro campo cabe na primeira tela).
  const linha = aoLadoDaDica ? `<div class="fluxo-dica-linha">${htmlDaDica}${aoLadoDaDica}</div>` : htmlDaDica;
  // A linha da prévia vem depois do título no código: o Tab passa por "Ver maior" e "Apagar" antes do primeiro campo.
  // O CSS a põe no alto da tela, fixa.
  return `<div class="fluxo-topo">
    <div class="fluxo-topo-corpo"><h1 tabindex="-1">${nomeDaPorta(d.tipo)}<span class="fluxo-so-leitor">. </span><span class="fluxo-passo"><span>Passo ${passo} de 3</span>${barrinhasDoPasso(passo)}</span><span class="fluxo-so-leitor">: </span><span class="fluxo-nome">${esc(NOME_DO_PASSO(d, passo))}</span></h1></div>
    ${miniatura}
  </div>
  ${avisoDaNota(nota)}${linha}`;
}

/**
 * Título do Pronto: o mesmo bloco, com o nome da porta e "Pronto!" com um ✓ num círculo cheio, sem barrinhas.
 * Em dados de link, a nota "Confira tudo antes de mandar" vem logo abaixo como aviso de informação.
 */
export function topoDoPronto(d: DadosDoFluxo): string {
  const check = `<span class="fluxo-check" aria-hidden="true">${icone('check', { tamanho: 20, traco: 2.5 })}</span>`;
  return `<div class="fluxo-topo">
    <div class="fluxo-topo-corpo"><h1 tabindex="-1">${nomeDaPorta(d.tipo)}<span class="fluxo-so-leitor">: </span><span class="fluxo-pronto-titulo">${check}<span>Pronto!</span></span></h1></div>
  </div>
  ${d.origem === 'link' ? avisoDaNota(NOTA_DO_LINK) : ''}`;
}

/**
 * Barra fixa de baixo: "Voltar" (2/5, seta para a esquerda antes) e o botão que envia o formulário do passo
 * (`rotulo`, "Continuar" por padrão, 3/5; só o "Continuar" leva a seta para a direita depois).
 */
export const barra = (rotulo = 'Continuar'): string => `<div class="fluxo-barra">
      <button type="button" class="botao botao-sec fluxo-barra-voltar" id="fluxo-voltar">${icone('esquerda', { tamanho: 20 })}Voltar</button>
      <button type="submit" form="fluxo-form" class="botao fluxo-barra-seguir" id="fluxo-continuar">${esc(rotulo)}${rotulo === 'Continuar' ? icone('direita', { tamanho: 20 }) : ''}</button>
    </div>`;
