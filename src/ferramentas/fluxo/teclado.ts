// Decisão pura: o teclado do celular está aberto? (previa.ts usa isto para soltar a barra e a miniatura.)
// O iPhone ignora interactive-widget=resizes-content: a janela não encolhe, só a área visível (visualViewport).

/** Perda de altura visível, em px, a partir da qual contamos teclado aberto. */
export const PERDA_DO_TECLADO = 150;
/** Altura visível, em px, abaixo da qual um campo de texto com foco já conta como teclado aberto. */
export const ALTURA_BAIXA = 500;

export interface MedidasDaTela {
  /** visualViewport.height (ou a altura da janela, se não houver visualViewport). */
  alturaVisivel: number;
  /** window.innerHeight. */
  alturaDaJanela: number;
  /** Há um campo de texto (input de texto, textarea) com foco. */
  campoDeTextoEmFoco: boolean;
}

export function tecladoAberto(m: MedidasDaTela): boolean {
  if (m.alturaDaJanela - m.alturaVisivel > PERDA_DO_TECLADO) return true;
  return m.campoDeTextoEmFoco && m.alturaVisivel < ALTURA_BAIXA;
}

/** Tipos de input em que o teclado de tela abre (os outros, como radio e caixa, não). */
const SEM_TECLADO = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'color', 'range', 'image', 'hidden']);

export function abreTeclado(tag: string, tipo = ''): boolean {
  const t = tag.toLowerCase();
  if (t === 'textarea') return true;
  return t === 'input' && !SEM_TECLADO.has(tipo.toLowerCase());
}
