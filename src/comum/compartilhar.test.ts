import { afterEach, describe, expect, it, vi } from 'vitest';
import { baixarImagem, canvasParaArquivo, compartilhar, mensagemDoResultado, type NavegadorCompartilhavel, type Resultado } from './compartilhar';

const arquivo = new File([new Uint8Array([1, 2, 3])], 'card.png', { type: 'image/png' });
const erro = (name: string) => Object.assign(new Error(name), { name });

function navFalso(o: Partial<NavegadorCompartilhavel> = {}) {
  return o as NavegadorCompartilhavel;
}

describe('compartilhar', () => {
  it('imagem + texto pelo menu', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const nav = navFalso({ share, canShare: () => true });
    expect(await compartilhar({ arquivo, texto: 'oi', url: 'https://x.org', titulo: 'T' }, nav)).toBe('arquivo');
    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith({ files: [arquivo], text: 'oi', title: 'T' });
  });

  it('cancelar na imagem não tenta mais nada', async () => {
    const share = vi.fn().mockRejectedValue(erro('AbortError'));
    const writeText = vi.fn();
    const nav = navFalso({ share, canShare: () => true, clipboard: { writeText } });
    expect(await compartilhar({ arquivo, texto: 'oi' }, nav)).toBe('cancelado');
    expect(share).toHaveBeenCalledTimes(1);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('iOS recusa texto + arquivo juntos: manda só o arquivo', async () => {
    const share = vi
      .fn()
      .mockRejectedValueOnce(erro('NotAllowedError'))
      .mockResolvedValueOnce(undefined);
    const nav = navFalso({ share, canShare: () => true });
    expect(await compartilhar({ arquivo, texto: 'oi' }, nav)).toBe('arquivo-sozinho');
    expect(share).toHaveBeenNthCalledWith(2, { files: [arquivo] });
  });

  it('TypeError também cai no só-arquivo', async () => {
    const share = vi.fn().mockRejectedValueOnce(new TypeError('x')).mockResolvedValueOnce(undefined);
    expect(await compartilhar({ arquivo, texto: 'oi' }, navFalso({ share, canShare: () => true }))).toBe('arquivo-sozinho');
  });

  it('cancelar no só-arquivo também é cancelado', async () => {
    const share = vi.fn().mockRejectedValueOnce(erro('NotAllowedError')).mockRejectedValueOnce(erro('AbortError'));
    expect(await compartilhar({ arquivo, texto: 'oi' }, navFalso({ share, canShare: () => true }))).toBe('cancelado');
  });

  it('arquivo falhou de vez: cai no texto', async () => {
    const share = vi
      .fn()
      .mockRejectedValueOnce(erro('NotAllowedError'))
      .mockRejectedValueOnce(erro('NotAllowedError'))
      .mockResolvedValueOnce(undefined);
    const nav = navFalso({ share, canShare: () => true });
    expect(await compartilhar({ arquivo, texto: 'oi', url: 'https://x.org' }, nav)).toBe('texto');
    expect(share).toHaveBeenNthCalledWith(3, { text: 'oi', url: 'https://x.org' });
  });

  it('navegador não compartilha arquivo: manda o texto', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const nav = navFalso({ share, canShare: () => false });
    expect(await compartilhar({ arquivo, texto: 'oi', titulo: 'T' }, nav)).toBe('texto');
    expect(share).toHaveBeenCalledWith({ text: 'oi', title: 'T' });
  });

  it('sem canShare e sem arquivo: texto', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    expect(await compartilhar({ texto: 'oi' }, navFalso({ share }))).toBe('texto');
  });

  it('cancelar o texto', async () => {
    const share = vi.fn().mockRejectedValue(erro('AbortError'));
    const writeText = vi.fn();
    const nav = navFalso({ share, clipboard: { writeText } });
    expect(await compartilhar({ texto: 'oi' }, nav)).toBe('cancelado');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('sem Web Share: copia texto + link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await compartilhar({ arquivo, texto: 'oi', url: 'https://x.org' }, navFalso({ clipboard: { writeText } }))).toBe('copiado');
    expect(writeText).toHaveBeenCalledWith('oi\nhttps://x.org');
  });

  it('texto falhou e copiar funciona', async () => {
    const share = vi.fn().mockRejectedValue(erro('NotAllowedError'));
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await compartilhar({ texto: 'oi' }, navFalso({ share, clipboard: { writeText } }))).toBe('copiado');
  });

  it('nada funciona: falhou', async () => {
    expect(await compartilhar({ texto: 'oi' }, navFalso())).toBe('falhou');
    const writeText = vi.fn().mockRejectedValue(erro('NotAllowedError'));
    expect(await compartilhar({ texto: 'oi' }, navFalso({ clipboard: { writeText } }))).toBe('falhou');
  });

  it('sem nada para compartilhar: falhou', async () => {
    const writeText = vi.fn();
    expect(await compartilhar({}, navFalso({ share: vi.fn(), clipboard: { writeText } }))).toBe('falhou');
    expect(writeText).not.toHaveBeenCalled();
  });
});

describe('mensagemDoResultado', () => {
  it('cancelado não avisa; os outros têm texto', () => {
    expect(mensagemDoResultado('cancelado')).toBe('');
    const outros: Resultado[] = ['arquivo', 'arquivo-sozinho', 'texto', 'copiado', 'falhou'];
    for (const r of outros) expect(mensagemDoResultado(r).length).toBeGreaterThan(5);
    expect(mensagemDoResultado('copiado')).toBe('Texto copiado. Cole na conversa.');
    expect(mensagemDoResultado('falhou')).toContain('Baixar imagem');
  });
});

describe('canvasParaArquivo', () => {
  it('vira File png', async () => {
    const canvas = { toBlob: (cb: BlobCallback) => cb(new Blob(['x'], { type: 'image/png' })) };
    const f = await canvasParaArquivo(canvas, 'a.png');
    expect(f.name).toBe('a.png');
    expect(f.type).toBe('image/png');
  });
  it('rejeita quando o navegador devolve null', async () => {
    const canvas = { toBlob: (cb: BlobCallback) => cb(null) };
    await expect(canvasParaArquivo(canvas, 'a.png')).rejects.toThrow();
  });
});

describe('baixarImagem', () => {
  afterEach(() => vi.restoreAllMocks());

  it('cria o link, clica, remove e revoga depois', () => {
    vi.useFakeTimers();
    const criar = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:falso');
    const revogar = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const a = { href: '', download: '', rel: '', style: { display: '' }, click: vi.fn(), remove: vi.fn() };
    const append = vi.fn();
    const doc = { createElement: vi.fn().mockReturnValue(a), body: { append } } as unknown as Document;
    baixarImagem(arquivo, 'card.png', doc);
    expect(criar).toHaveBeenCalledWith(arquivo);
    expect(a.href).toBe('blob:falso');
    expect(a.download).toBe('card.png');
    expect(append).toHaveBeenCalledWith(a);
    expect(a.click).toHaveBeenCalledTimes(1);
    expect(a.remove).toHaveBeenCalledTimes(1);
    expect(revogar).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revogar).toHaveBeenCalledWith('blob:falso');
    vi.useRealTimers();
  });
});
