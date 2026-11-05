// Logo opcional: lido e reduzido no próprio aparelho. O arquivo nunca é enviado nem guardado.

export const LADO_MAXIMO_DO_LOGO = 400;
export const TAMANHO_MAXIMO_DO_ARQUIVO = 10 * 1024 * 1024;

export interface Logo {
  fonte: CanvasImageSource;
  largura: number;
  altura: number;
}

/** Tamanho reduzido para caber num quadrado de `max` px, sem ampliar e sem deformar. */
export function tamanhoReduzido(largura: number, altura: number, max = LADO_MAXIMO_DO_LOGO): { largura: number; altura: number } {
  if (!(largura > 0) || !(altura > 0)) return { largura: 0, altura: 0 };
  const f = Math.min(1, max / Math.max(largura, altura));
  return { largura: Math.max(1, Math.round(largura * f)), altura: Math.max(1, Math.round(altura * f)) };
}

/** Mensagem de recusa em texto simples, ou vazio se o arquivo serve. */
export function recusaDoArquivo(tipo: string, tamanho: number): string {
  if (!tipo.startsWith('image/')) return 'Esse arquivo não é uma imagem. Escolha uma foto ou um desenho (PNG, JPG ou SVG).';
  if (tamanho > TAMANHO_MAXIMO_DO_ARQUIVO) return 'A imagem é grande demais (mais de 10 MB). Escolha uma menor.';
  return '';
}

function carregarImagem(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((ok, erro) => {
    const endereco = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(endereco);
      ok(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(endereco);
      erro(new Error('Não deu para ler essa imagem.'));
    };
    img.src = endereco;
  });
}

/** Lê o arquivo e devolve o logo já reduzido num canvas. Rejeita com mensagem simples. */
export async function lerLogo(arquivo: File): Promise<Logo> {
  const recusa = recusaDoArquivo(arquivo.type, arquivo.size);
  if (recusa) throw new Error(recusa);
  const img = await carregarImagem(arquivo);
  const larguraOriginal = img.naturalWidth || img.width || LADO_MAXIMO_DO_LOGO;
  const alturaOriginal = img.naturalHeight || img.height || LADO_MAXIMO_DO_LOGO;
  const { largura, altura } = tamanhoReduzido(larguraOriginal, alturaOriginal);
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Este aparelho não conseguiu preparar a imagem.');
  ctx.drawImage(img, 0, 0, largura, altura);
  return { fonte: canvas, largura, altura };
}
