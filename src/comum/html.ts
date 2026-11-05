// Escape de texto para HTML. Todo texto que a pessoa digita (ou que chega num link) passa por aqui
// antes de ir para innerHTML. Puro, sem DOM.

const TROCAS: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => TROCAS[c] ?? c);
}

/**
 * Endereço que pode ir num href. `esc` não basta: "javascript:…" não tem nada para escapar e rodaria
 * ao tocar. Só passam http, https, mailto e tel; o resto (javascript:, data:, vbscript:, relativo
 * estranho) vira "#". Use em todo href com dado variável (ex.: o link que veio nos dados do evento),
 * sempre junto com esc: href="${esc(urlSegura(link))}".
 */
export function urlSegura(endereco: string): string {
  const limpo = endereco.trim();
  try {
    const url = new URL(limpo);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : '#';
  } catch {
    return '#';
  }
}
