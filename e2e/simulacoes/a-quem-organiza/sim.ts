// Apoio da simulação "a quem organiza". Diferente do e2e/apoio.ts, quase nada aqui faz o teste falhar:
// o objetivo é registrar o que a pessoa veria (fotos, tempos, axe, alvos de toque, texto cortado, o que sai).
// Os achados vão para .saidas/*.jsonl e viram o relatório. Falha só quando o roteiro não consegue seguir.

import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Locator, type Page } from '@playwright/test';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ModoCompartilhar, Opcoes } from './aparelhos';

export const PASTA = fileURLToPath(new URL('.', import.meta.url));
export const SAIDAS = join(PASTA, '.saidas');
export const FOTOS = join(PASTA, '.fotos');
/** SIM_SO_TEMPO=1: só mede o tempo (sem axe nem fotos, que pesam), em .saidas/tempos-limpos.jsonl. */
const SO_TEMPO = !!process.env.SIM_SO_TEMPO;

declare global {
  interface Window {
    __simPartilhas: { texto: string; arquivos: number; nomes: string[]; titulo: string; url: string; recusado?: string }[];
    __arquivos: string[];
    __copias: string[];
    __impressoes: number;
    __downloadsBarrados: string[];
  }
}

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/@[\w-]+/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

/** Pasta do teste atual (personagem + aparelho). */
export function pastaDoTeste(raiz: string): string {
  const i = test.info();
  const p = join(raiz, `${slug(i.title)}--${i.project.name}`);
  mkdirSync(p, { recursive: true });
  return p;
}

/** Linha num dos registros .saidas/<nome>.jsonl, com personagem e aparelho. */
export function registrar(nome: string, dados: Record<string, unknown>): void {
  mkdirSync(SAIDAS, { recursive: true });
  const i = test.info();
  appendFileSync(
    join(SAIDAS, `${nome}.jsonl`),
    JSON.stringify({ teste: i.title, aparelho: i.project.name, quando: new Date().toISOString(), ...dados }) + '\n',
  );
}

export const test = base.extend<Opcoes & { erros: string[] }>({
  cpu: [0, { option: true }],
  rede: ['', { option: true }],
  compartilhar: ['sim' as ModoCompartilhar, { option: true }],
  semDownload: [false, { option: true }],
  letra200: [false, { option: true }],
  erros: async ({}, usar) => {
    await usar([]);
  },
  page: async ({ page, context, browserName, cpu, rede, compartilhar, semDownload, letra200, erros }, usar) => {
    // Nada sai do localhost (nem para o site publicado nem para as métricas).
    await context.route(
      (url) => url.hostname !== 'localhost' && url.hostname !== '127.0.0.1',
      (rota) => rota.abort(),
    );
    await context.addInitScript(
      ([modo, semBaixar, letra]) => {
        window.__simPartilhas = [];
        window.__arquivos = [];
        window.__copias = [];
        window.__impressoes = 0;
        window.__downloadsBarrados = [];
        const guardarArquivos = (fs: readonly File[]) => {
          for (const f of fs) {
            const r = new FileReader();
            r.onload = () => window.__arquivos.push(String(r.result));
            r.readAsDataURL(f);
          }
        };
        const anotar = (d: ShareData, recusado?: string) =>
          window.__simPartilhas.push({
            texto: d.text ?? '',
            arquivos: d.files?.length ?? 0,
            nomes: (d.files ?? []).map((f) => f.name),
            titulo: d.title ?? '',
            url: d.url ?? '',
            ...(recusado ? { recusado } : {}),
          });
        if (modo === 'ausente') {
          Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
          Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
        } else {
          Object.defineProperty(navigator, 'canShare', {
            configurable: true,
            value: (d?: ShareData) => !(modo === 'sem-arquivo' && d?.files?.length),
          });
          Object.defineProperty(navigator, 'share', {
            configurable: true,
            value: async (d: ShareData) => {
              if (modo === 'cancela') {
                anotar(d, 'AbortError');
                throw new DOMException('A pessoa fechou o menu', 'AbortError');
              }
              if (modo === 'sem-arquivo' && d.files?.length) {
                anotar(d, 'NotAllowedError');
                throw new DOMException('Arquivo recusado', 'NotAllowedError');
              }
              anotar(d);
              if (d.files) guardarArquivos(d.files);
            },
          });
        }
        // Área de transferência: guarda o que seria copiado (no teste sem tela, a de verdade pede permissão).
        const area = { writeText: async (t: string) => void window.__copias.push(t), readText: async () => window.__copias.at(-1) ?? '' };
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: area });
        // A janela de impressão travaria o navegador sem tela: só conta. A área de impressão fica montada até o
        // afterprint, então o teste pode tirar o PDF (page.pdf) depois do toque.
        window.print = () => {
          window.__impressoes++;
        };
        if (semBaixar) {
          const clicar = HTMLAnchorElement.prototype.click;
          HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
            if (this.hasAttribute('download')) {
              window.__downloadsBarrados.push(this.download);
              return;
            }
            clicar.call(this);
          };
        }
        if (letra) {
          const aplicar = () => document.documentElement.style.setProperty('font-size', '200%');
          if (document.documentElement) aplicar();
          else document.addEventListener('DOMContentLoaded', aplicar);
        }
      },
      [compartilhar, semDownload, letra200] as const,
    );
    if (browserName === 'chromium' && (cpu || rede)) {
      const cdp = await context.newCDPSession(page);
      if (cpu) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
      if (rede) {
        await cdp.send('Network.enable');
        await cdp.send(
          'Network.emulateNetworkConditions',
          rede === '3g-lento'
            ? { offline: false, latency: 2000, downloadThroughput: 400_000 / 8, uploadThroughput: 400_000 / 8 }
            : { offline: false, latency: 60, downloadThroughput: 9_000_000 / 8, uploadThroughput: 1_500_000 / 8 },
        );
      }
    }
    page.on('dialog', (d) => {
      registrar('dialogos', { tipo: d.type(), mensagem: d.message() });
      void d.accept();
    });
    page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') erros.push(`console: ${m.text()}`);
    });
    await usar(page);
    // Erros de console não fazem o teste falhar: viram registro (pedidos abortados para fora são esperados).
    const reais = erros.filter((e) => !/ERR_FAILED|net::ERR_|Failed to load resource/.test(e));
    if (erros.length) registrar('erros-console', { erros, reais: reais.length });
  },
});

export { expect };

/** Toque em aparelho com toque; clique no computador. */
export async function tocar(l: Locator): Promise<void> {
  const toque = await l.page().evaluate(() => matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
  if (toque) await l.tap();
  else await l.click();
}

let contador = 0;
/** Foto da tela em .fotos/<teste--aparelho>/NN-nome.png. Devolve o caminho. */
export async function foto(page: Page, nome: string, inteira = false): Promise<string> {
  if (SO_TEMPO) return '';
  const caminho = join(pastaDoTeste(FOTOS), `${String(++contador).padStart(2, '0')}-${slug(nome)}.png`);
  await page.screenshot({ path: caminho, fullPage: inteira, animations: 'disabled' });
  return caminho;
}

/** Cronômetro do personagem. `marca` grava o tempo desde o início em .saidas/tempos.jsonl. */
export function cronometro(personagem: string) {
  const inicio = Date.now();
  let ultimo = inicio;
  return {
    marca(etapa: string): number {
      const agora = Date.now();
      registrar(SO_TEMPO ? 'tempos-limpos' : 'tempos', { personagem, etapa, total_ms: agora - inicio, passo_ms: agora - ultimo });
      ultimo = agora;
      return agora - inicio;
    },
  };
}

export interface Inspecao {
  tela: string;
  axe: string[];
  axeMenores: string[];
  rolagemLateral: { pagina: number; tela: number } | null;
  alvosPequenos: { alvo: string; largura: number; altura: number; inline: boolean }[];
  alvosColados: string[];
  cortados: { el: string; texto: string; scroll: number; visivel: number }[];
  foraDaTela: string[];
}

/**
 * Olha a tela como a pessoa veria e registra (sem falhar): axe, rolagem lateral, alvos de toque menores que 48 px
 * ou colados, texto cortado ou com reticências e o que passa da borda direita. Grava em .saidas/inspecao.jsonl.
 */
export async function inspecionar(page: Page, tela: string): Promise<Inspecao> {
  if (SO_TEMPO) return { tela, axe: [], axeMenores: [], rolagemLateral: null, alvosPequenos: [], alvosColados: [], cortados: [], foraDaTela: [] };
  await page.waitForTimeout(200);
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const fmt = (v: (typeof r.violations)[number]) =>
    `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join(', ')}`;
  const axe = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map(fmt);
  const axeMenores = r.violations.filter((v) => !(v.impact === 'serious' || v.impact === 'critical')).map(fmt);

  const medidas = await page.evaluate(() => {
    const visivel = (el: Element) => {
      const h = el as HTMLElement;
      const s = getComputedStyle(h);
      const c = h.getBoundingClientRect();
      return s.visibility !== 'hidden' && s.display !== 'none' && c.width > 0 && c.height > 0 && !h.closest('[hidden]');
    };
    const nome = (el: Element) => {
      const h = el as HTMLElement;
      const t = (h.getAttribute('aria-label') || h.textContent || (h as HTMLInputElement).value || '').trim().replace(/\s+/g, ' ');
      return `${h.tagName.toLowerCase()}${h.id ? '#' + h.id : ''} "${t.slice(0, 40)}"`;
    };
    // Rádio e caixa de marcar escondidos: o alvo é o rótulo.
    const alvos = [
      ...document.querySelectorAll(
        'button, a[href], summary, select, textarea, input:not([type=hidden]):not([type=radio]):not([type=checkbox]), [role=button], label:has(input[type=radio]), label:has(input[type=checkbox])',
      ),
    ].filter(visivel);
    const caixas = alvos.map((el) => ({ el, c: el.getBoundingClientRect() }));
    const alvosPequenos = caixas
      .filter(({ c }) => c.width < 48 || c.height < 48)
      .map(({ el, c }) => ({
        alvo: nome(el),
        largura: Math.round(c.width),
        altura: Math.round(c.height),
        inline: getComputedStyle(el).display === 'inline' && !!el.closest('p, li'),
      }));
    const alvosColados: string[] = [];
    for (let i = 0; i < caixas.length; i++)
      for (let j = i + 1; j < caixas.length; j++) {
        const a = caixas[i]!.c;
        const b = caixas[j]!.c;
        if (caixas[i]!.el.contains(caixas[j]!.el) || caixas[j]!.el.contains(caixas[i]!.el)) continue;
        const dx = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
        const dy = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
        const pequeno = a.width < 48 || a.height < 48 || b.width < 48 || b.height < 48;
        if (pequeno && Math.hypot(dx, dy) < 4) alvosColados.push(`${nome(caixas[i]!.el)} ↔ ${nome(caixas[j]!.el)}`);
      }
    const largura = document.documentElement.clientWidth;
    const cortados: { el: string; texto: string; scroll: number; visivel: number }[] = [];
    const foraDaTela: string[] = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (!visivel(el) || el.closest('svg') || el.tagName === 'CANVAS') continue;
      const h = el as HTMLElement;
      const s = getComputedStyle(h);
      const temTexto = [...h.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
      if (temTexto && (h.scrollWidth > h.clientWidth + 1 || s.textOverflow === 'ellipsis') && s.overflowX !== 'visible')
        cortados.push({ el: nome(h), texto: (h.textContent ?? '').trim().slice(0, 80), scroll: h.scrollWidth, visivel: h.clientWidth });
      const c = h.getBoundingClientRect();
      if (temTexto && c.right > largura + 1 && s.position !== 'fixed') foraDaTela.push(`${nome(h)} (direita ${Math.round(c.right)} > ${largura})`);
    }
    return {
      rolagem: { pagina: document.documentElement.scrollWidth, tela: largura },
      alvosPequenos,
      alvosColados,
      cortados,
      foraDaTela,
    };
  });
  const ins: Inspecao = {
    tela,
    axe,
    axeMenores,
    rolagemLateral: medidas.rolagem.pagina > medidas.rolagem.tela ? medidas.rolagem : null,
    alvosPequenos: medidas.alvosPequenos,
    alvosColados: medidas.alvosColados,
    cortados: medidas.cortados,
    foraDaTela: medidas.foraDaTela,
  };
  registrar('inspecao', { ...ins });
  return ins;
}

/** O elemento fica (em parte) atrás da miniatura do topo ou da barra Voltar/Continuar? */
export async function cobertoPorFaixa(l: Locator): Promise<{ coberto: boolean; detalhe: string }> {
  return l.evaluate((el) => {
    const c = el.getBoundingClientRect();
    const faixas = [...document.querySelectorAll<HTMLElement>('.fluxo-mini, .fluxo-barra')].filter((f) => {
      const p = getComputedStyle(f).position;
      return p === 'sticky' || p === 'fixed';
    });
    for (const f of faixas) {
      const r = f.getBoundingClientRect();
      const cruza = c.top < r.bottom && r.top < c.bottom && c.left < r.right && r.left < c.right;
      if (cruza) return { coberto: true, detalhe: `${f.className} [${Math.round(r.top)}–${Math.round(r.bottom)}] sobre o elemento [${Math.round(c.top)}–${Math.round(c.bottom)}]` };
    }
    return { coberto: false, detalhe: '' };
  });
}

/** O que o falso navigator.share recebeu até agora. */
export const partilhas = (page: Page) => page.evaluate(() => window.__simPartilhas);
/** O que foi para a área de transferência. */
export const copias = (page: Page) => page.evaluate(() => window.__copias);

/** Salva o arquivo N que o menu de compartilhar recebeu (PNG do card). Devolve o caminho. */
export async function salvarPartilhado(page: Page, nome: string, i = -1): Promise<string> {
  await expect.poll(() => page.evaluate(() => window.__arquivos.length)).toBeGreaterThan(0);
  const dados = await page.evaluate((n) => window.__arquivos.at(n)!, i);
  const caminho = join(pastaDoTeste(SAIDAS), nome);
  writeFileSync(caminho, Buffer.from(dados.split(',')[1]!, 'base64'));
  return caminho;
}

/** Toca no botão e espera o download (blob). Devolve o caminho salvo. */
export async function baixarPor(botao: Locator, nome: string): Promise<string> {
  const page = botao.page();
  const espera = page.waitForEvent('download', { timeout: 30_000 });
  await tocar(botao);
  const d = await espera;
  const caminho = join(pastaDoTeste(SAIDAS), nome || d.suggestedFilename());
  mkdirSync(dirname(caminho), { recursive: true });
  await d.saveAs(caminho);
  registrar('downloads', { nome: d.suggestedFilename(), salvo: caminho });
  return caminho;
}

/** PDF da página como está (Chromium). Use depois de tocar em imprimir (a área de impressão fica montada). */
export async function salvarPdf(page: Page, nome: string): Promise<string> {
  const caminho = join(pastaDoTeste(SAIDAS), nome);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: caminho, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.emulateMedia({ media: 'screen' });
  return caminho;
}

/** Salva um texto (mensagem do WhatsApp, link, .ics) para ler depois. */
export function salvarTexto(nome: string, texto: string): string {
  const caminho = join(pastaDoTeste(SAIDAS), nome);
  writeFileSync(caminho, texto);
  return caminho;
}

export const titulo = (page: Page) => page.getByRole('heading', { level: 1 });
