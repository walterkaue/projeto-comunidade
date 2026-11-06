// Decisão pura: o teclado do celular está aberto? (previa.ts usa isto para soltar a barra e a miniatura.)
// O iPhone ignora interactive-widget=resizes-content: a janela não encolhe, só a área visível (visualViewport).
// No Android a janela encolhe junto; por isso também comparamos com a maior altura já vista nesta tela.

/** Perda de altura visível, em px, a partir da qual contamos teclado aberto. */
export const PERDA_DO_TECLADO = 150;
/** Altura visível, em px, abaixo da qual um campo de texto com foco já conta como teclado aberto. */
export const ALTURA_BAIXA = 500;
/** Com campo em foco, a área visível abaixo desta fração da maior altura vista conta como teclado aberto. */
export const FRACAO_DO_TECLADO = 0.75;

export interface MedidasDaTela {
  /** visualViewport.height (ou a altura da janela, se não houver visualViewport). */
  alturaVisivel: number;
  /** window.innerHeight. */
  alturaDaJanela: number;
  /** Há um campo de texto (input de texto, textarea) com foco. */
  campoDeTextoEmFoco: boolean;
  /** Maior altura visível vista nesta tela e nesta orientação (0 se não souber). */
  alturaMaxima?: number;
  /** visualViewport.scale: acima de 1, a pessoa ampliou com os dedos e a altura menor não é o teclado. */
  escala?: number;
}

export function tecladoAberto(m: MedidasDaTela): boolean {
  if ((m.escala ?? 1) > 1.01) return false;
  if (m.alturaDaJanela - m.alturaVisivel > PERDA_DO_TECLADO) return true;
  if (!m.campoDeTextoEmFoco) return false;
  return m.alturaVisivel < ALTURA_BAIXA || m.alturaVisivel < (m.alturaMaxima ?? 0) * FRACAO_DO_TECLADO;
}

/**
 * Quanto rolar para o campo aparecer inteiro acima da borda de baixo da área visível (iPhone: a janela não
 * encolhe e o scrollIntoView compara com a janela inteira). 0 se já aparece.
 */
export function rolagemParaOCampo(fimDoCampo: number, topoVisivel: number, alturaVisivel: number, folga = 16): number {
  const fimVisivel = topoVisivel + alturaVisivel;
  return fimDoCampo + folga > fimVisivel ? Math.ceil(fimDoCampo + folga - fimVisivel) : 0;
}

/** Tipos de input em que o teclado de tela abre (os outros, como radio e caixa, não). */
const SEM_TECLADO = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'color', 'range', 'image', 'hidden']);

export function abreTeclado(tag: string, tipo = ''): boolean {
  const t = tag.toLowerCase();
  if (t === 'textarea') return true;
  return t === 'input' && !SEM_TECLADO.has(tipo.toLowerCase());
}
