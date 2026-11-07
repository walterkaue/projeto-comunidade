// Modelos, formatos e limites dos cards (puro, sem DOM).

import { MODELOS_DE_CARD, TAMANHO_MAXIMO, type ModeloDeCard } from '../../comum/entreTelas';
import { letras } from '../../comum/texto';

export { MODELOS_DE_CARD, TAMANHO_MAXIMO };
export type { ModeloDeCard };

export const FORMATOS = ['status', 'conversa', 'cartaz'] as const;
export type Formato = (typeof FORMATOS)[number];

export interface DefFormato {
  id: Formato;
  nome: string;
  explicacao: string;
  /** Tamanho lógico do desenho (o canvas real é este tamanho vezes a escala). */
  largura: number;
  altura: number;
}

export const DEF_FORMATOS: Record<Formato, DefFormato> = {
  status: { id: 'status', nome: 'Status', explicacao: 'Tela cheia, para o Status do WhatsApp', largura: 1080, altura: 1920 },
  conversa: { id: 'conversa', nome: 'Grupo', explicacao: 'Quadrado, para mandar no grupo', largura: 1080, altura: 1080 },
  cartaz: { id: 'cartaz', nome: 'Cartaz A4', explicacao: 'Para imprimir ou salvar em PDF', largura: 1080, altura: 1527 },
};

/** Escala do canvas: 1 desenha no tamanho lógico; aparelho leve desenha menor (o cartaz precisa de mais para imprimir). */
export function escalaDoFormato(formato: Formato, nivel: 'leve' | 'normal'): number {
  if (formato === 'cartaz') return nivel === 'leve' ? 1 : 1.5;
  return nivel === 'leve' ? 0.6 : 1;
}

export interface DefModelo {
  id: ModeloDeCard;
  nome: string;
  /** Texto da faixa do card (a informação nunca depende só de cor ou forma). */
  faixa: string;
  /** Quais campos de agenda o modelo usa. */
  usaHora: boolean;
  usaLocal: boolean;
  dicaTexto: string;
}

export const DEF_MODELOS: Record<ModeloDeCard, DefModelo> = {
  reuniao: { id: 'reuniao', nome: 'Reunião ou assembleia', faixa: 'REUNIÃO', usaHora: true, usaLocal: true, dicaTexto: 'Pauta ou recado curto.' },
  evento: { id: 'evento', nome: 'Evento ou atividade', faixa: 'EVENTO', usaHora: true, usaLocal: true, dicaTexto: 'O que vai acontecer, em poucas palavras.' },
  aviso: { id: 'aviso', nome: 'Aviso', faixa: 'AVISO', usaHora: false, usaLocal: false, dicaTexto: 'O que as pessoas precisam saber.' },
  resultado: { id: 'resultado', nome: 'Resultado ou conquista', faixa: 'CONQUISTA', usaHora: false, usaLocal: false, dicaTexto: 'O que o grupo conseguiu.' },
  agradecimento: { id: 'agradecimento', nome: 'Agradecimento', faixa: 'OBRIGADO', usaHora: false, usaLocal: false, dicaTexto: 'A quem o grupo agradece e pelo quê. Prefira o nome do grupo. Nome de criança ou adolescente nunca.' },
};

/** Campos que a pessoa preenche. `link` não aparece no formulário: só vem de outra ferramenta, já validado. */
export interface CamposDoCard {
  modelo: ModeloDeCard;
  titulo: string;
  data: string;
  hora: string;
  local: string;
  texto: string;
  organizacao: string;
  link: string;
  /**
   * Pauta da reunião, um item por posição (sem "Pauta:" nem numeração). Com pauta, o card desenha um item por
   * linha, corta num item inteiro e termina com "e mais N assuntos"; o `texto` fica vazio.
   */
  pauta?: readonly string[];
}

/**
 * Corta cada campo no limite (por letra). O que passa do limite (dados de link antigos ou montados à mão) corta
 * na última palavra inteira, com "…": nunca no meio da palavra (B-04). Palavra única maior que o limite corta nela.
 */
export function aplicarLimites(c: CamposDoCard): CamposDoCard {
  const cortar = (s: string, n: number): string => {
    const l = letras(s);
    if (l.length <= n) return s;
    const cabe = l.slice(0, n - 1);
    const espaco = cabe.lastIndexOf(' ');
    return `${(espaco > 0 ? cabe.slice(0, espaco) : cabe).join('').trimEnd()}…`;
  };
  return {
    ...c,
    titulo: cortar(c.titulo, TAMANHO_MAXIMO.titulo),
    local: cortar(c.local, TAMANHO_MAXIMO.local),
    texto: cortar(c.texto, TAMANHO_MAXIMO.texto),
    organizacao: cortar(c.organizacao, TAMANHO_MAXIMO.organizacao),
  };
}

export const nomeDoArquivo = (modelo: ModeloDeCard, formato: Formato) => `card-${modelo}-${formato}.png`;
