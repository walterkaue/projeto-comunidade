// Desenho do card nas telas do fluxo: o motor é o de sempre (cards/desenho.ts). Aqui ficam a espera pelas fontes,
// o QR do cartaz, a miniatura fixa dos passos 1 e 2 e o diálogo "Ver a prévia maior" (passos 1, 2 e 3).

import { matrizDoQr, type Matriz } from '../../comum/qr';
import { nivelDoAparelho } from '../../comum/nivel';
import { desenharCard, FAMILIA, tamanhoDoCanvas } from '../cards/desenho';
import { escalaDoFormato, type Formato } from '../cards/modelos';
import { camposDoCard, type DadosDoFluxo } from './estado';
import { criarAgendador, descricaoDaImagem, escalaDaMiniatura, esperaDoRedesenho, paletaDoFluxo } from './apoio';
import { logoAtual } from './memoria';
import { abreTeclado, rolagemParaOCampo, tecladoAberto } from './teclado';

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

/** Botão "Ver a prévia maior" (abre o diálogo de htmlDoDialogo). */
export const BOTAO_VER_MAIOR = '<button type="button" class="botao botao-sec fluxo-ver" id="fluxo-ver-maior">Ver a prévia maior</button>';

/** HTML da faixa fixa do topo e do diálogo "Ver a prévia maior". Textos fixos, nada digitado. */
export function htmlDaMiniatura(): string {
  return `<div class="fluxo-mini">
      <canvas id="fluxo-mini-canvas" class="fluxo-mini-canvas" role="img" aria-label="Prévia do card"></canvas>
      ${BOTAO_VER_MAIOR}
    </div>
    ${htmlDoDialogo()}`;
}

/** HTML do diálogo "Como está ficando". Textos fixos, nada digitado. */
export function htmlDoDialogo(): string {
  return `<dialog class="fluxo-dialogo" id="fluxo-dialogo" aria-labelledby="fluxo-dialogo-titulo">
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

/**
 * Liga o botão "Ver a prévia maior" ao diálogo de `htmlDoDialogo` em `raiz`. `desenharGrande` desenha no canvas
 * do diálogo depois de abrir. Devolve a função que fecha o diálogo (para a limpeza da tela).
 */
export function ligarDialogo(raiz: HTMLElement, desenharGrande: (alvo: HTMLCanvasElement) => void): () => void {
  const q = <T extends HTMLElement>(id: string) => raiz.querySelector<T>(`[id="${id}"]`)!;
  const botao = q<HTMLButtonElement>('fluxo-ver-maior');
  const dialogo = q<HTMLDialogElement>('fluxo-dialogo');
  const grande = q<HTMLCanvasElement>('fluxo-dialogo-canvas');
  botao.addEventListener('click', () => {
    if (typeof dialogo.showModal === 'function') dialogo.showModal();
    else dialogo.setAttribute('open', '');
    desenharGrande(grande);
  });
  q<HTMLButtonElement>('fluxo-fechar').addEventListener('click', () => {
    if (typeof dialogo.close === 'function') dialogo.close();
    else dialogo.removeAttribute('open');
    botao.focus();
  });
  // Esc também fecha: o foco volta ao botão que abriu.
  dialogo.addEventListener('close', () => botao.focus());
  return () => {
    if (dialogo.open && typeof dialogo.close === 'function') dialogo.close();
  };
}

/** Liga a miniatura e o diálogo que `htmlDaMiniatura` desenhou em `raiz`. */
export function ligarMiniatura(raiz: HTMLElement, obter: () => DadosDoFluxo): Miniatura {
  const canvas = raiz.querySelector<HTMLCanvasElement>('[id="fluxo-mini-canvas"]')!;
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

  const fecharDialogo = ligarDialogo(raiz, (grande) => {
    const d = obter();
    desenharCardEm(grande, d, d.formato, escalaDoFormato(d.formato, nivel), '')
      .then(() => grande.setAttribute('aria-label', descricaoDaImagem(d, d.formato)))
      .catch(() => undefined);
  });

  void desenhar();

  return {
    redesenhar: () => agendador.agendar(),
    limpar() {
      token++;
      agendador.cancelar();
      fecharDialogo();
    },
  };
}

// ---------- altura das faixas fixas ----------

/**
 * Parte da altura da tela que a miniatura e a barra fixas podem ocupar juntas antes de soltar, e abaixo da qual
 * voltam a ficar fixas. A folga entre as duas evita o pisca-pisca quando a barra de endereço do navegador some e
 * volta (a altura da janela muda um pouco ao rolar).
 */
const LIMITE_DAS_FAIXAS = 0.4;
const VOLTA_DAS_FAIXAS = 0.35;

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
    // Texto grande: se as faixas fixas comerem mais de 40% da tela, elas soltam (rolam com a página).
    const parte = ((mini?.offsetHeight ?? 0) + (barra?.offsetHeight ?? 0)) / Math.max(1, window.innerHeight);
    const soltas = html.classList.contains('fluxo-faixas-soltas');
    html.classList.toggle('fluxo-faixas-soltas', parte > (soltas ? VOLTA_DAS_FAIXAS : LIMITE_DAS_FAIXAS));
  };
  let obs: ResizeObserver | undefined;
  if (typeof ResizeObserver === 'function') {
    obs = new ResizeObserver(medir);
    if (mini) obs.observe(mini);
    if (barra) obs.observe(barra);
  }
  medir();

  // Teclado aberto: a barra e a miniatura soltam da tela (classe fluxo-teclado, ver fluxo.css) para não cobrir o campo.
  const vv = window.visualViewport ?? null;
  let timerDoCampo: ReturnType<typeof setTimeout> | undefined;
  let timerDaSaida: ReturnType<typeof setTimeout> | undefined;
  const campoEmFoco = (): HTMLElement | null => {
    const a = document.activeElement;
    return a instanceof HTMLElement && abreTeclado(a.tagName, a instanceof HTMLInputElement ? a.type : '') ? a : null;
  };
  // Maior altura visível vista (sem zoom) nesta largura: girar o celular muda a largura e recomeça a conta.
  let alturaMaxima = 0;
  let larguraDaConta = 0;
  const escala = (): number => vv?.scale ?? 1;
  const atualizarTeclado = (): void => {
    const alturaVisivel = vv?.height ?? window.innerHeight;
    if (window.innerWidth !== larguraDaConta) {
      larguraDaConta = window.innerWidth;
      alturaMaxima = 0;
    }
    if (escala() <= 1.01) alturaMaxima = Math.max(alturaMaxima, alturaVisivel);
    html.classList.toggle(
      'fluxo-teclado',
      tecladoAberto({
        alturaVisivel,
        alturaDaJanela: window.innerHeight,
        campoDeTextoEmFoco: campoEmFoco() !== null,
        alturaMaxima,
        escala: escala(),
      }),
    );
  };
  const mostrarCampo = (): void => {
    const campo = campoEmFoco();
    // Com zoom de pinça, a pessoa está lendo outro trecho: não puxa a tela de volta para o campo.
    if (!campo?.isConnected || escala() > 1.01) return;
    campo.scrollIntoView({ block: 'nearest' });
    // iPhone: a janela não encolhe; confere com a borda de baixo da área visível de verdade.
    if (vv) {
      const falta = rolagemParaOCampo(campo.getBoundingClientRect().bottom, vv.offsetTop, vv.height);
      if (falta > 0) window.scrollBy(0, falta);
    }
  };
  const aoFocar = (e: Event): void => {
    const alvo = e.target;
    if (!(alvo instanceof HTMLElement) || !abreTeclado(alvo.tagName, alvo instanceof HTMLInputElement ? alvo.type : '')) return;
    atualizarTeclado();
    // Espera o teclado terminar de subir e a área visível se acomodar.
    clearTimeout(timerDoCampo);
    timerDoCampo = setTimeout(() => {
      atualizarTeclado();
      mostrarCampo();
    }, 300);
  };
  const aoSairDoFoco = (): void => {
    clearTimeout(timerDaSaida);
    // O foco passa por "nenhum elemento" entre dois campos: olha de novo depois.
    timerDaSaida = setTimeout(atualizarTeclado, 100);
  };
  const aoRedimensionar = (): void => {
    medir();
    atualizarTeclado();
    if (campoEmFoco()) mostrarCampo();
  };
  document.addEventListener('focusin', aoFocar);
  document.addEventListener('focusout', aoSairDoFoco);
  vv?.addEventListener('resize', aoRedimensionar);
  window.addEventListener('resize', aoRedimensionar);
  atualizarTeclado();

  return () => {
    obs?.disconnect();
    clearTimeout(timerDoCampo);
    clearTimeout(timerDaSaida);
    document.removeEventListener('focusin', aoFocar);
    document.removeEventListener('focusout', aoSairDoFoco);
    vv?.removeEventListener('resize', aoRedimensionar);
    window.removeEventListener('resize', aoRedimensionar);
    html.classList.remove('fluxo-teclado', 'fluxo-faixas-soltas');
    html.style.removeProperty('--altura-mini');
    html.style.removeProperty('--altura-barra');
  };
}
