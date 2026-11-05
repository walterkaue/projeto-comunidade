// Cadeia de compartilhar: imagem + texto pelo menu do celular; se não der, só a imagem; se não der, só o texto;
// se não houver menu de compartilhar, copia o texto. A lógica fica separada do navegador (recebe o `nav`),
// para ser testada. Nada sai do aparelho por conta própria: quem envia é o menu do sistema, quando a pessoa escolhe.

export type Resultado = 'arquivo' | 'arquivo-sozinho' | 'texto' | 'copiado' | 'cancelado' | 'falhou';

export interface Conteudo {
  arquivo?: File;
  texto?: string;
  url?: string;
  titulo?: string;
}

/** O pedaço do `navigator` que usamos (facilita o teste com um falso). */
export interface NavegadorCompartilhavel {
  share?: (dados: ShareData) => Promise<void>;
  canShare?: (dados?: ShareData) => boolean;
  clipboard?: { writeText: (texto: string) => Promise<void> };
}

const foiCancelado = (e: unknown): boolean => (e as { name?: string } | null)?.name === 'AbortError';

function semVazios(dados: ShareData): ShareData {
  const r: ShareData = {};
  if (dados.files) r.files = dados.files;
  if (dados.text) r.text = dados.text;
  if (dados.url) r.url = dados.url;
  if (dados.title) r.title = dados.title;
  return r;
}

export async function compartilhar(c: Conteudo, nav: NavegadorCompartilhavel = navigator): Promise<Resultado> {
  const { arquivo, texto, url, titulo } = c;

  // (a) imagem, com texto junto; o iOS às vezes recusa os dois juntos, então tenta só a imagem.
  if (arquivo && nav.share && nav.canShare?.({ files: [arquivo] })) {
    try {
      await nav.share(semVazios({ files: [arquivo], text: texto, title: titulo }));
      return 'arquivo';
    } catch (e) {
      if (foiCancelado(e)) return 'cancelado';
      try {
        await nav.share({ files: [arquivo] });
        return 'arquivo-sozinho';
      } catch (e2) {
        if (foiCancelado(e2)) return 'cancelado';
      }
    }
  }

  // (b) só texto e link.
  if (nav.share && (texto || url)) {
    try {
      await nav.share(semVazios({ text: texto, url, title: titulo }));
      return 'texto';
    } catch (e) {
      if (foiCancelado(e)) return 'cancelado';
    }
  }

  // (c) sem menu de compartilhar: copia.
  const copia = [texto, url].filter(Boolean).join('\n');
  if (nav.clipboard && copia) {
    try {
      await nav.clipboard.writeText(copia);
      return 'copiado';
    } catch {
      // sem permissão para copiar
    }
  }

  // (d)
  return 'falhou';
}

/** Baixa a imagem no aparelho. Sempre fica ao lado do compartilhar, porque nem todo navegador compartilha arquivo. */
export function baixarImagem(imagem: Blob | File, nomeDoArquivo: string, doc: Document = document): void {
  const endereco = URL.createObjectURL(imagem);
  const a = doc.createElement('a');
  a.href = endereco;
  a.download = nomeDoArquivo;
  a.rel = 'noopener';
  a.style.display = 'none';
  doc.body.append(a);
  a.click();
  a.remove();
  // Revoga depois: alguns navegadores ainda estão lendo o endereço logo após o clique.
  setTimeout(() => URL.revokeObjectURL(endereco), 10_000);
}

/** Canvas vira arquivo PNG. Rejeita se o navegador não conseguir gerar a imagem (memória, canvas grande demais). */
export function canvasParaArquivo(canvas: Pick<HTMLCanvasElement, 'toBlob'>, nome: string): Promise<File> {
  return new Promise((ok, erro) => {
    canvas.toBlob((blob) => {
      if (blob) ok(new File([blob], nome, { type: 'image/png' }));
      else erro(new Error('Não foi possível gerar a imagem.'));
    }, 'image/png');
  });
}

/** Texto para a região de aviso. Vazio = não avisar (a pessoa cancelou). */
export function mensagemDoResultado(r: Resultado): string {
  switch (r) {
    case 'arquivo':
      return 'Pronto, imagem enviada para compartilhar.';
    case 'arquivo-sozinho':
      return 'Pronto, imagem enviada. O texto não foi junto: copie e cole na conversa.';
    case 'texto':
      return 'Pronto, texto enviado para compartilhar.';
    case 'copiado':
      return 'Texto copiado. Cole na conversa.';
    case 'cancelado':
      return '';
    case 'falhou':
      return 'Não deu para compartilhar. Use Baixar imagem.';
  }
}
