// Escape de texto para HTML. Todo texto que a pessoa digita (ou que chega num link) passa por aqui
// antes de ir para innerHTML. Puro, sem DOM.

const TROCAS: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => TROCAS[c] ?? c);
}
