// E-mail de denúncia (puro). O link denunciado vai no corpo; a pessoa escreve o motivo depois.
// Três caminhos, porque nem todo aparelho tem aplicativo de e-mail configurado (no computador, o "mailto:"
// muitas vezes não abre nada): aplicativo de e-mail, Gmail no navegador, ou copiar e colar onde quiser.

import { EMAIL_CONTATO } from '../comum/marca';

export const ASSUNTO_DA_DENUNCIA = 'Denúncia de conteúdo';

/** Corpo do e-mail. Sem link, traz só o espaço para dizer onde está o conteúdo e o motivo. */
export function corpoDaDenuncia(link: string): string {
  return link
    ? `Link denunciado:\n${link}\n\nMotivo (escreva aqui):\n`
    : 'Onde está o conteúdo (link ou descrição):\n\nMotivo (escreva aqui):\n';
}

/** "mailto:" com assunto e corpo codificados. */
export function mailtoDeDenuncia(link: string, email: string = EMAIL_CONTATO): string {
  return `mailto:${email}?subject=${encodeURIComponent(ASSUNTO_DA_DENUNCIA)}&body=${encodeURIComponent(corpoDaDenuncia(link))}`;
}

/** Gmail no navegador, já com destinatário, assunto e corpo (para quem não tem aplicativo de e-mail). */
export function gmailDeDenuncia(link: string, email: string = EMAIL_CONTATO): string {
  const p = new URLSearchParams({ view: 'cm', fs: '1', to: email, su: ASSUNTO_DA_DENUNCIA, body: corpoDaDenuncia(link) });
  return `https://mail.google.com/mail/?${p.toString()}`;
}

/** Texto para copiar e colar em qualquer e-mail: destinatário, assunto e corpo. */
export function textoParaCopiar(link: string, email: string = EMAIL_CONTATO): string {
  return `Para: ${email}\nAssunto: ${ASSUNTO_DA_DENUNCIA}\n\n${corpoDaDenuncia(link)}`;
}
