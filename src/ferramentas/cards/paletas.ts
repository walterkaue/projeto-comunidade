// Paletas neutras e cor livre com checagem de contraste (puro, sem DOM).
// Nenhuma paleta lembra partido: tons suaves, sem a combinação de cores de nenhuma legenda.

import { ajustarParaContraste, corDeTexto, passaContraste } from '../../comum/cor';

export interface Paleta {
  id: string;
  nome: string;
  fundo: string;
  texto: string;
  /** Texto secundário sobre o fundo. */
  suave: string;
  /** Cor da faixa de cima. */
  destaque: string;
  /** Texto sobre a faixa. */
  sobreDestaque: string;
  /** Cor de rótulos e detalhes sobre o fundo (também com contraste de texto). */
  acento: string;
}

export const PALETAS: readonly Paleta[] = [
  { id: 'papel', nome: 'Papel', fundo: '#faf6ee', texto: '#1d232a', suave: '#4a5460', destaque: '#1d232a', sobreDestaque: '#ffffff', acento: '#5b4a2e' },
  { id: 'grafite', nome: 'Grafite', fundo: '#23272b', texto: '#f4f4f2', suave: '#c9ccd1', destaque: '#e8d9b5', sobreDestaque: '#23272b', acento: '#e8d9b5' },
  { id: 'mar', nome: 'Mar', fundo: '#0f3d3e', texto: '#ffffff', suave: '#cfe3e1', destaque: '#cfe3e1', sobreDestaque: '#0f3d3e', acento: '#9fd6cf' },
  { id: 'areia', nome: 'Areia', fundo: '#efe3cf', texto: '#2b2118', suave: '#55453a', destaque: '#6b4f2a', sobreDestaque: '#ffffff', acento: '#6b4f2a' },
  { id: 'ameixa', nome: 'Ameixa', fundo: '#3a2a4a', texto: '#ffffff', suave: '#ddd2e8', destaque: '#e9ddf3', sobreDestaque: '#3a2a4a', acento: '#d9c7ec' },
  { id: 'nevoa', nome: 'Névoa', fundo: '#e9edf1', texto: '#17202a', suave: '#44505c', destaque: '#3d4f61', sobreDestaque: '#ffffff', acento: '#3d4f61' },
];

export const PALETA_PADRAO = PALETAS[0]!;

export function paletaPorId(id: string): Paleta {
  return PALETAS.find((p) => p.id === id) ?? PALETA_PADRAO;
}

/** Pares (texto, fundo) de uma paleta que precisam de 4,5:1. */
export function paresDeContraste(p: Paleta): [string, string][] {
  return [
    [p.texto, p.fundo],
    [p.suave, p.fundo],
    [p.acento, p.fundo],
    [p.sobreDestaque, p.destaque],
  ];
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export interface ResultadoCorLivre {
  ok: boolean;
  paleta?: Paleta;
  /** Explicação em texto simples (sempre que houver ajuste ou recusa). */
  mensagem: string;
}

/**
 * Cor livre: a cor escolhida pinta a faixa de cima do card (o texto da faixa é preto ou branco, o que ler melhor).
 * Os detalhes em cor sobre o fundo (rótulos) usam a mesma cor, escurecida só se ela não for legível.
 * Cor que não é uma cor é recusada.
 */
export function aplicarCorLivre(entrada: string, base: Paleta = PALETA_PADRAO): ResultadoCorLivre {
  const m = HEX.exec(entrada.trim());
  if (!m) return { ok: false, mensagem: 'Essa cor não é válida. Escolha uma cor na caixa de cor.' };
  let hex = m[1]!.toLowerCase();
  if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c);
  const cor = `#${hex}`;
  const acento = ajustarParaContraste(cor, base.fundo);
  const paleta: Paleta = { ...base, id: 'livre', nome: 'Cor livre', destaque: cor, sobreDestaque: corDeTexto(cor, ['#000000', '#ffffff']), acento };
  const ajustou = !passaContraste(cor, base.fundo);
  return {
    ok: true,
    paleta,
    mensagem: ajustou
      ? 'Essa cor é clara e difícil de ler. Nas letras, vamos usar um tom mais escuro.'
      : '',
  };
}
