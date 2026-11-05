// Tela provisória das partes que ainda vão ser construídas.

import { esc } from '../comum/html';
import { linkPara } from '../comum/rotas';

export function telaEmConstrucao(raiz: HTMLElement, titulo: string): void {
  raiz.innerHTML = `<main class="tela">
    <h1 tabindex="-1">${esc(titulo)}</h1>
    <p>Esta parte ainda está sendo construída.</p>
    <a class="botao botao-sec" href="${linkPara('inicio')}">Voltar ao início</a>
  </main>`;
}
