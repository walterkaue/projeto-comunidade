// Transforma um texto de página (textos/*.ts) em HTML. Puro, sem DOM. Todo texto passa por esc.

import { LANCAMENTO_PUBLICO } from '../comum/marca';
import { esc } from '../comum/html';
import { VERSAO_DOS_TEXTOS, type Bloco, type Pagina } from './textos/tipos';

// Remover junto com a faixa quando o advogado aprovar os textos (LANCAMENTO_PUBLICO = true).
// O teste faixa.test.ts falha se a constante virar true e esta faixa continuar aqui.
export const FAIXA_PROVISORIA = 'Versão provisória, em revisão jurídica';

const bloco = (b: Bloco) => (typeof b === 'string' ? `<p>${esc(b)}</p>` : `<ul>${b.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);

/** A faixa só aparece em texto jurídico, enquanto o lançamento público não foi liberado. */
export function faixaEmHtml(p: Pagina, lancamento: boolean = LANCAMENTO_PUBLICO): string {
  if (!p.juridico || lancamento) return '';
  return `<p class="faixa-provisoria" role="note"><strong>${esc(FAIXA_PROVISORIA)}.</strong> Este texto ainda será conferido por um advogado e pode mudar.</p>`;
}

export function secoesEmHtml(p: Pagina): string {
  return p.secoes.map((s) => `<section><h2>${esc(s.titulo)}</h2>${s.blocos.map(bloco).join('')}</section>`).join('');
}

/** Cabeçalho (h1, resumo, faixa) e seções. `meio` entra entre o cabeçalho e as seções. */
export function paginaEmHtml(p: Pagina, meio = '', lancamento: boolean = LANCAMENTO_PUBLICO): string {
  const versao = p.juridico ? `<p class="versao">Versão de ${esc(VERSAO_DOS_TEXTOS)}</p>` : '';
  return `<h1 tabindex="-1">${esc(p.titulo)}</h1>
    <p class="resumo">${esc(p.resumo)}</p>
    ${faixaEmHtml(p, lancamento)}${versao}${meio}${secoesEmHtml(p)}`;
}
