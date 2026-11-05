// Desenho do card nas telas do fluxo: o motor é o de sempre (cards/desenho.ts). Aqui ficam a espera pelas fontes,
// o QR do cartaz e a miniatura fixa dos passos 1 e 2 com o botão "Ver maior".

import { matrizDoQr, type Matriz } from '../../comum/qr';
import { nivelDoAparelho } from '../../comum/nivel';
import { desenharCard, FAMILIA, tamanhoDoCanvas } from '../cards/desenho';
import { escalaDoFormato, type Formato } from '../cards/modelos';
import { camposDoCard, type DadosDoFluxo } from './estado';
import { criarAgendador, descricaoDaImagem, escalaDaMiniatura, esperaDoRedesenho, paletaDoFluxo } from './apoio';
import { logoAtual } from './memoria';

let fontesProntas: Promise<unknown> | undefined;
export function esperarFontes(): Promise<unknown> {
  fontesProntas ??= Promise.all([`700 40px ${FAMILIA}`, `400 40px ${FAMILIA}`].map((f) => document.fonts.load(f))).catch(() => undefined);
  return fontesProntas;
}

let matriz: { link: string; dados: Matriz } | undefined;

export interface ResultadoDoDesenho {
  /** O cartaz devia ter QR e não deu para gerar. */
  semQr: boolean;
}

/**
 * Desenha o card no canvas. `link` só vira QR no cartaz. Devolve null se `vigente()` ficou falso no meio
 * (outro desenho mais novo vale). Lança erro se o aparelho não conseguir desenhar.
 */
export async function desenharCardEm(
  alvo: HTMLCanvasElement,
  d: DadosDoFluxo,
  formato: Formato,
  escala: number,
  link: string,
  vigente: () => boolean = () => true,
): Promise<ResultadoDoDesenho | null> {
  await esperarFontes();
  let qr: Matriz | undefined;
  let semQr = false;
  if (formato === 'cartaz' && link) {
    try {
      if (matriz?.link !== link) matriz = { link, dados: await matrizDoQr(link) };
      qr = matriz.dados;
    } catch {
      semQr = true;
    }
  }
  if (!vigente()) return null;
  const { largura, altura } = tamanhoDoCanvas(formato, escala);
  alvo.width = largura;
  alvo.height = altura;
  const ctx = alvo.getContext('2d');
  if (!ctx) throw new Error('Este aparelho não conseguiu desenhar a imagem.');
  desenharCard(ctx, camposDoCard(d, link), formato, paletaDoFluxo(d), { escala, logo: logoAtual(), qr, rodape: d.rodape });
  return { semQr };
}

// ---------- miniatura dos passos 1 e 2 ----------

/** HTML da faixa fixa do topo e do diálogo "Ver a prévia maior". Textos fixos, nada digitado. */
export function htmlDaMiniatura(): string {
  return `<div class="fluxo-mini">
      <canvas id="fluxo-mini-canvas" class="fluxo-mini-canvas" role="img" aria-label="Prévia do card"></canvas>
      <button type="button" class="botao botao-sec fluxo-ver" id="fluxo-ver-maior">Ver a prévia maior</button>
    </div>
    <dialog class="fluxo-dialogo" id="fluxo-dialogo" aria-labelledby="fluxo-dialogo-titulo">
      <h2 id="fluxo-dialogo-titulo">Como está ficando</h2>
      <canvas id="fluxo-dialogo-canvas" class="fluxo-dialogo-canvas" role="img" aria-label="Prévia grande do card"></canvas>
      <button type="button" class="botao" id="fluxo-fechar">Fechar a prévia</button>
    </dialog>`;
}

export interface Miniatura {
  /** Pede um redesenho (espera um pouco se a pessoa continuar digitando). */
  redesenhar(): void;
  limpar(): void;
}

/** Liga a miniatura e o diálogo que `htmlDaMiniatura` desenhou em `raiz`. */
export function ligarMiniatura(raiz: HTMLElement, obter: () => DadosDoFluxo): Miniatura {
  const q = <T extends HTMLElement>(id: string) => raiz.querySelector<T>(`[id="${id}"]`)!;
  const canvas = q<HTMLCanvasElement>('fluxo-mini-canvas');
  const botao = q<HTMLButtonElement>('fluxo-ver-maior');
  const dialogo = q<HTMLDialogElement>('fluxo-dialogo');
  const grande = q<HTMLCanvasElement>('fluxo-dialogo-canvas');
  const nivel = nivelDoAparelho();

  let token = 0;
  async function desenhar(): Promise<void> {
    const meu = ++token;
    const d = obter();
    try {
      const r = await desenharCardEm(canvas, d, d.formato, escalaDaMiniatura(d.formato), '', () => meu === token);
      if (r) canvas.setAttribute('aria-label', descricaoDaImagem(d, d.formato));
    } catch {
      // a miniatura é só uma ajuda: sem ela, o resto da tela segue
    }
  }
  const agendador = criarAgendador(esperaDoRedesenho(nivel), () => void desenhar());

  botao.addEventListener('click', () => {
    if (typeof dialogo.showModal === 'function') dialogo.showModal();
    else dialogo.setAttribute('open', '');
    const d = obter();
    desenharCardEm(grande, d, d.formato, escalaDoFormato(d.formato, nivel), '')
      .then(() => grande.setAttribute('aria-label', descricaoDaImagem(d, d.formato)))
      .catch(() => undefined);
  });
  q<HTMLButtonElement>('fluxo-fechar').addEventListener('click', () => {
    if (typeof dialogo.close === 'function') dialogo.close();
    else dialogo.removeAttribute('open');
    botao.focus();
  });
  // Esc também fecha: o foco volta ao botão que abriu.
  dialogo.addEventListener('close', () => botao.focus());

  void desenhar();

  return {
    redesenhar: () => agendador.agendar(),
    limpar() {
      token++;
      agendador.cancelar();
      if (dialogo.open && typeof dialogo.close === 'function') dialogo.close();
    },
  };
}

// ---------- altura das faixas fixas ----------

/**
 * Mede a miniatura e a barra fixa (a altura muda com o tamanho do texto e com a quebra dos botões) e grava em
 * --altura-mini e --altura-barra, que fluxo.css usa para o scroll-padding e para o aviso não ficar sob a barra.
 * Sem ResizeObserver, valem as estimativas do CSS. Devolve a limpeza.
 */
export function medirFaixasFixas(raiz: HTMLElement): () => void {
  const mini = raiz.querySelector<HTMLElement>('.fluxo-mini');
  const barra = raiz.querySelector<HTMLElement>('.fluxo-barra');
  const html = document.documentElement;
  const medir = (): void => {
    if (mini) html.style.setProperty('--altura-mini', `${mini.offsetHeight}px`);
    if (barra) {
      // A barra já inclui o recuo da borda do aparelho (safe-area); o CSS soma esse recuo à parte.
      const rem = parseFloat(getComputedStyle(html).fontSize) || 16;
      const recuo = Math.max(0, parseFloat(getComputedStyle(barra).paddingBottom) - 0.75 * rem) || 0;
      html.style.setProperty('--altura-barra', `${Math.max(0, barra.offsetHeight - recuo)}px`);
    }
  };
  let obs: ResizeObserver | undefined;
  if (typeof ResizeObserver === 'function') {
    obs = new ResizeObserver(medir);
    if (mini) obs.observe(mini);
    if (barra) obs.observe(barra);
  }
  medir();
  return () => {
    obs?.disconnect();
    html.style.removeProperty('--altura-mini');
    html.style.removeProperty('--altura-barra');
  };
}
