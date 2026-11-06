// Site aberto dentro de outro site (iframe). O GitHub Pages não manda frame-ancestors nem X-Frame-Options, e a CSP
// por <meta> não aceita frame-ancestors (auditoria de segurança, B3). Então, dentro de uma moldura, o site não
// mostra nada além de um link para abrir direto no navegador: outro site não consegue pôr o nosso por baixo
// do dele para enganar o toque. Puro, sem DOM.

import { esc, urlSegura } from './html';
import { NOME } from './marca';

/** A página está dentro de uma moldura? Na dúvida (o navegador recusou olhar), conta como dentro. */
export function estaEmMoldura(janela: { top: unknown; self: unknown }): boolean {
  try {
    return janela.top !== janela.self;
  } catch {
    return true;
  }
}

/** A única tela que o site mostra dentro de uma moldura. `endereco` é o deste site. */
export function telaDaMoldura(endereco: string): string {
  return `<main class="tela">
    <h1 tabindex="-1">${esc(NOME)}</h1>
    <p>Este site só abre direto no navegador.</p>
    <a class="botao" href="${esc(urlSegura(endereco))}" target="_blank" rel="noopener noreferrer">Abrir o site</a>
  </main>`;
}
