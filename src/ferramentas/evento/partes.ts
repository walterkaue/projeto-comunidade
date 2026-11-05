// Partes de tela que a criação e a página do evento dividem: texto de compartilhar e QR do link.
// Mexem no DOM e ficam finas de propósito; a conta está nos módulos puros e em src/comum.

import { avisar } from '../../comum/aviso';
import { compartilhar, mensagemDoResultado } from '../../comum/compartilhar';
import { MARGEM_QR, desenharQr, matrizDoQr } from '../../comum/qr';
import { dataPorExtenso, horarioPorExtenso } from './agenda';
import type { Evento } from './validar';

/** Texto que acompanha o link ao compartilhar: título, quando e onde. */
export function textoParaCompartilhar(e: Evento): string {
  return [e.titulo, `${dataPorExtenso(e.data)}, ${horarioPorExtenso(e.inicio, e.fim)}`, e.local].join('\n');
}

const MODULO_DO_QR = 4;

/** Desenha o QR do link numa área. A biblioteca só é baixada aqui, quando a pessoa pede. */
async function desenharNaArea(area: HTMLElement, link: string): Promise<void> {
  const matriz = await matrizDoQr(link);
  const lado = (matriz.length + MARGEM_QR * 2) * MODULO_DO_QR;
  const canvas = document.createElement('canvas');
  canvas.width = lado;
  canvas.height = lado;
  canvas.className = 'evento-qr';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'QR do link do evento. Aponte a câmera de outro celular para abrir.');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('sem canvas');
  desenharQr(ctx, matriz, 0, 0, lado);
  area.replaceChildren(canvas);
}

/**
 * Liga o botão que mostra e esconde o QR. `vivo` diz se a tela ainda está aberta (a leitura é assíncrona).
 * Devolve a função que volta ao começo (para quando o link muda e o QR antigo não vale mais).
 */
export function ligarQr(botao: HTMLButtonElement, area: HTMLElement, obterLink: () => string, vivo: () => boolean): () => void {
  let pronto = false;
  botao.addEventListener('click', async () => {
    const abrir = area.hidden;
    if (abrir && !pronto) {
      botao.disabled = true;
      try {
        await desenharNaArea(area, obterLink());
        pronto = true;
      } catch {
        if (vivo()) avisar('Não deu para gerar o QR neste aparelho.');
        return;
      } finally {
        if (vivo()) botao.disabled = false;
      }
    }
    if (!vivo()) return;
    area.hidden = !abrir;
    botao.setAttribute('aria-expanded', String(abrir));
    botao.textContent = abrir ? 'Esconder o QR do link' : 'Mostrar o QR do link';
  });
  return () => {
    pronto = false;
    area.hidden = true;
    area.replaceChildren();
    botao.setAttribute('aria-expanded', 'false');
    botao.textContent = 'Mostrar o QR do link';
  };
}

/** Liga o botão de compartilhar o link (menu do celular; sem ele, copia). */
export function ligarCompartilhar(botao: HTMLButtonElement, obter: () => { link: string; evento: Evento }): void {
  botao.addEventListener('click', async () => {
    const { link, evento } = obter();
    const r = await compartilhar({ texto: textoParaCompartilhar(evento), url: link, titulo: evento.titulo });
    avisar(mensagemDoResultado(r));
  });
}
