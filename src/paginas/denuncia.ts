// E-mail de denúncia (puro). O link denunciado vai no corpo; a pessoa escreve o motivo depois.

import { EMAIL_CONTATO } from '../comum/marca';

export const ASSUNTO_DA_DENUNCIA = 'Denúncia de conteúdo';

/** "mailto:" com assunto e corpo codificados. Sem link, o corpo traz só o espaço para o motivo. */
export function mailtoDeDenuncia(link: string, email: string = EMAIL_CONTATO): string {
  const corpo = link
    ? `Link denunciado:\n${link}\n\nMotivo (escreva aqui):\n`
    : 'Onde está o conteúdo (link ou descrição):\n\nMotivo (escreva aqui):\n';
  return `mailto:${email}?subject=${encodeURIComponent(ASSUNTO_DA_DENUNCIA)}&body=${encodeURIComponent(corpo)}`;
}
