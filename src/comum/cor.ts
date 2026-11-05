// Contraste de cor pela conta da WCAG 2.x (luminância relativa sRGB). Puro, sem DOM.
// Serve para escolher a cor do texto sobre um fundo e para corrigir a cor que a pessoa escolheu no card.

/** Texto normal, nível AA. */
export const CONTRASTE_MINIMO = 4.5;
/** Texto grande (a partir de ~24 px, ou 19 px em negrito), nível AA. */
export const CONTRASTE_TEXTO_GRANDE = 3;

type Rgb = [number, number, number];

/** Lê "#rgb" ou "#rrggbb" (com ou sem "#"). Valor inválido vira preto. */
function lerHex(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, (c) => c + c);
  if (!/^[0-9a-f]{6}$/i.test(h)) return [0, 0, 0];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function paraHex([r, g, b]: Rgb): string {
  const p = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${p(r)}${p(g)}${p(b)}`;
}

function linear(c8: number): number {
  const c = c8 / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminância relativa, de 0 (preto) a 1 (branco). */
export function luminancia(hex: string): number {
  const [r, g, b] = lerHex(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Razão de contraste entre duas cores, de 1 a 21. */
export function razaoDeContraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** A opção de maior contraste sobre o fundo (em empate, a primeira). */
export function corDeTexto(fundo: string, opcoes: readonly string[] = ['#111111', '#ffffff']): string {
  let melhor = opcoes[0] ?? '#111111';
  let maior = -1;
  for (const o of opcoes) {
    const r = razaoDeContraste(o, fundo);
    if (r > maior) {
      maior = r;
      melhor = o;
    }
  }
  return melhor;
}

export function passaContraste(texto: string, fundo: string, minimo = CONTRASTE_MINIMO): boolean {
  return razaoDeContraste(texto, fundo) >= minimo;
}

function misturar(cor: Rgb, alvo: number, t: number): Rgb {
  return [cor[0] + (alvo - cor[0]) * t, cor[1] + (alvo - cor[1]) * t, cor[2] + (alvo - cor[2]) * t];
}

function aproximar(cor: string, fundo: string, minimo: number, alvo: number): string | null {
  const base = lerHex(cor);
  for (let i = 1; i <= 100; i++) {
    const hex = paraHex(misturar(base, alvo, i / 100));
    if (passaContraste(hex, fundo, minimo)) return hex;
  }
  return null;
}

/**
 * Devolve a cor com contraste suficiente sobre o fundo. Se já passa, devolve igual (normalizada).
 * Senão mistura com preto (fundo claro) ou branco (fundo escuro), mudando o mínimo possível,
 * e só tenta o outro lado se o primeiro não resolver.
 */
export function ajustarParaContraste(cor: string, fundo: string, minimo = CONTRASTE_MINIMO): string {
  if (passaContraste(cor, fundo, minimo)) return paraHex(lerHex(cor));
  const fundoClaro = luminancia(fundo) > 0.179;
  const alvos = fundoClaro ? [0, 255] : [255, 0];
  for (const alvo of alvos) {
    const r = aproximar(cor, fundo, minimo, alvo);
    if (r) return r;
  }
  return corDeTexto(fundo);
}
