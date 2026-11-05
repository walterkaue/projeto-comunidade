// Forma dos textos das páginas institucionais. Texto puro, sem HTML: fácil de revisar e de copiar para o advogado.
// Um bloco é um parágrafo (string) ou uma lista (array de strings). O render escapa tudo (esc).

export type Bloco = string | readonly string[];

export interface Secao {
  titulo: string;
  blocos: readonly Bloco[];
}

export interface Pagina {
  titulo: string;
  /** Frase curta logo abaixo do título. */
  resumo: string;
  /** Texto jurídico provisório: leva a faixa "em revisão jurídica" enquanto LANCAMENTO_PUBLICO for false. */
  juridico: boolean;
  secoes: readonly Secao[];
}

/** Data da versão dos textos. Mudou o texto, mude aqui. */
export const VERSAO_DOS_TEXTOS = '05/11/2026';
