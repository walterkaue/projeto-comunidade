// Aviso de saída em todo link para outro site. Um só lugar: o toque em qualquer link externo passa por aqui,
// inclusive nos criados depois. Ficam de fora os links com `data-sem-aviso` (ex.: compartilhar no WhatsApp);
// mailto: e tel: não são sites, então também não contam.

import { esc } from './html';
import { NOME } from './marca';

/** Site de outro domínio (http ou https). E-mail, telefone e links internos não contam. */
export function ehLinkExterno(href: string, host: string): boolean {
  try {
    const url = new URL(href);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.host !== host;
  } catch {
    return false;
  }
}

/** Domínio para mostrar no aviso, sem o "www.". */
export function dominioDoLink(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** HTML da folha (puro, testável). */
export function htmlDaFolha(href: string): string {
  const dominio = dominioDoLink(href);
  return `<div class="folha-caixa">
    <p>Você vai sair do ${esc(NOME)} e abrir ${dominio ? `<strong>${esc(dominio)}</strong>` : 'outro site'}.</p>
    <a class="botao" data-sem-aviso href="${esc(href)}" target="_blank" rel="noopener noreferrer">Ir para o site</a>
    <button class="botao botao-sec" type="button" data-ficar>Ficar aqui</button>
  </div>`;
}

function abrirFolha(href: string, doc: Document): void {
  const folha = doc.createElement('div');
  folha.className = 'folha';
  folha.setAttribute('role', 'dialog');
  folha.setAttribute('aria-modal', 'true');
  folha.setAttribute('aria-label', 'Saída do site');
  folha.innerHTML = htmlDaFolha(href);
  const anterior = doc.activeElement as HTMLElement | null;
  const fechar = () => {
    doc.removeEventListener('keydown', aoTeclar, true);
    folha.remove();
    anterior?.focus?.();
  };
  function aoTeclar(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      fechar();
    } else if (e.key === 'Tab') {
      // Foco preso na folha: só há dois alvos.
      const alvos = Array.from(folha.querySelectorAll<HTMLElement>('a, button'));
      const primeiro = alvos[0];
      const ultimo = alvos[alvos.length - 1];
      if (!primeiro || !ultimo) return;
      if (e.shiftKey && doc.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && doc.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
  }
  folha.addEventListener('click', (e) => {
    const alvo = e.target as HTMLElement;
    // Toque fora da caixa, em "Ficar aqui" ou em "Ir para o site" (o link abre sozinho): fecha.
    if (alvo === folha || alvo.closest('[data-ficar]') || alvo.closest('a')) fechar();
  });
  doc.addEventListener('keydown', aoTeclar, true);
  doc.body.append(folha);
  folha.querySelector<HTMLElement>('a')?.focus();
}

/** Liga o aviso em todo o documento. Devolve a função que desliga. */
export function ligarAvisoDeSaida(doc: Document = document): () => void {
  const aoClicar = (e: MouseEvent) => {
    const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]');
    if (!link || link.hasAttribute('data-sem-aviso') || !ehLinkExterno(link.href, doc.location.host)) return;
    e.preventDefault();
    abrirFolha(link.href, doc);
  };
  // auxclick: clique do meio ("abrir em nova aba") também passa pelo aviso.
  doc.addEventListener('click', aoClicar, true);
  doc.addEventListener('auxclick', aoClicar, true);
  return () => {
    doc.removeEventListener('click', aoClicar, true);
    doc.removeEventListener('auxclick', aoClicar, true);
  };
}
