// Partes de tela que a criação e a página do evento dividem: texto de compartilhar, endereço do site e QR do link.
// Mexem no DOM e ficam finas de propósito; a conta está nos módulos puros e em src/comum.

import { avisar } from '../../comum/aviso';
import { compartilhar, mensagemDoResultado } from '../../comum/compartilhar';
import { MARGEM_QR, desenharQr, matrizDoQr } from '../../comum/qr';
import { dataPorExtenso, horarioPorExtenso } from './agenda';
import type { Evento } from './validar';

/**
 * Endereço do site sem "?…" nem "#…": o que sobra de quem abriu o site por um link com parâmetro de rastreio
 * (ex.: "?fbclid=…") não vai junto no link do evento, no QR nem na denúncia.
 */
export const enderecoDoSite = (): string => `${location.origin}${location.pathname}`;

/** Texto que acompanha o link ao compartilhar: título, quando e onde. */
export function textoParaCompartilhar(e: Evento): string {
  return [e.titulo, `${dataPorExtenso(e.data)}, ${horarioPorExtenso(e.inicio, e.fim)}`, e.local].join('\n');
}

const MODULO_DO_QR = 4;

/** Desenha o QR do link numa área. A biblioteca só é baixada aqui, quando a pessoa pede. */
async function desenharNaArea(area: HTMLElement, link: string): Promise<boolean> {
  const matriz = await matrizDoQr(link);
  const lado = (matriz.length + MARGEM_QR * 2) * MODULO_DO_QR;
  const canvas = document.createElement('canvas');
  canvas.width = lado;
  canvas.height = lado;
  canvas.className = 'evento-qr';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute(
    'aria-label',
    'QR do link do evento. Aponte a câmera de outro celular para abrir. Para mandar o link, use o botão Compartilhar.',
  );
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  desenharQr(ctx, matriz, 0, 0, lado);
  area.replaceChildren(canvas);
  return true;
}

/**
 * Liga o botão que mostra e esconde o QR. `vivo` diz se a tela ainda está aberta (a leitura é assíncrona).
 * O botão nunca fica desabilitado (o foco não se perde): enquanto gera, aria-busy e os toques são ignorados.
 * Devolve a função que volta ao começo (quando o link muda, o QR antigo não vale mais e, se ainda estiver
 * sendo gerado, é descartado).
 */
export function ligarQr(botao: HTMLButtonElement, area: HTMLElement, obterLink: () => string, vivo: () => boolean): () => void {
  let pronto = false;
  let geracao = 0;
  let gerando = false;
  botao.addEventListener('click', async () => {
    if (gerando) return;
    const abrir = area.hidden;
    if (abrir && !pronto) {
      const minha = geracao;
      gerando = true;
      botao.setAttribute('aria-busy', 'true');
      let feito = false;
      try {
        feito = await desenharNaArea(area, obterLink());
      } catch {
        feito = false;
      } finally {
        gerando = false;
        botao.removeAttribute('aria-busy');
      }
      if (!vivo() || minha !== geracao) {
        // O link mudou (ou a tela fechou) enquanto o QR era gerado: o desenho velho não vale.
        if (minha !== geracao) area.replaceChildren();
        return;
      }
      if (!feito) {
        avisar('Não deu para gerar o QR neste aparelho.');
        return;
      }
      pronto = true;
      avisar('QR do link pronto.');
    }
    area.hidden = !abrir;
    botao.setAttribute('aria-expanded', String(abrir));
  });
  return () => {
    geracao++;
    pronto = false;
    area.hidden = true;
    area.replaceChildren();
    botao.setAttribute('aria-expanded', 'false');
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
