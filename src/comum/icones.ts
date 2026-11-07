// Ícones de traço (24x24) desenhados aqui, sem biblioteca (docs/visual.md, seção 6).
// O ícone é sempre enfeite (aria-hidden): quem informa é o texto ao lado, nunca o desenho.

import { esc } from './html';

export const CAMINHOS = {
  // As cinco portas (iguais aos de src/paginas/inicio.ts)
  reuniao:
    '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 14.5c3 0 7 1.5 7 5.5"/>',
  evento: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  aviso: '<path d="M3 10v4h4l8 5V5l-8 5H3zM18 9a4 4 0 0 1 0 6"/>',
  resultado: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8"/>',
  agradecimento: '<path d="M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20z"/>',
  // Novos
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  atencao: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4.5M12 17.5v.5"/>',
  erro: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
  ata: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  direita: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  esquerda: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  abrir: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  local: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  enviar: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
  baixar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  copiar: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  imprimir: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><path d="M7 14h10v7H7z"/>',
  lapis: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  celular: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  conversa: '<path d="M4 5h16v11H9l-5 4z"/>',
  compartilhar:
    '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
  denunciar: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  predio: '<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>',
  cadeado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  livro: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  lupa: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8.5v5M8.5 11h5"/>',
  // Apelidos
  pessoas:
    '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 14.5c3 0 7 1.5 7 5.5"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
} as const;

export type NomeDoIcone = keyof typeof CAMINHOS;

const positivo = (n: number | undefined, padrao: number): number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : padrao;

/** SVG inline do ícone, sempre `aria-hidden`. Tamanho padrão 24, traço padrão 2. */
export function icone(nome: NomeDoIcone, opcoes: { tamanho?: number; traco?: number; classe?: string } = {}): string {
  const t = positivo(opcoes.tamanho, 24);
  const s = positivo(opcoes.traco, 2);
  const classe = opcoes.classe ? `icone ${esc(opcoes.classe)}` : 'icone';
  return `<svg class="${classe}" viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="${s}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${CAMINHOS[nome]}</svg>`;
}
