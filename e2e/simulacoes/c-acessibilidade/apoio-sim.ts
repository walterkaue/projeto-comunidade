// Apoio da simulação C (acessibilidade): aparelhos, condições de rede e CPU, compartilhar em quatro jeitos,
// fotos, árvore de acessibilidade, medidas de alvo de toque e de texto cortado, e um diário de achados.
// Os personagens são fictícios.

import { expect, test as base, type BrowserContextOptions, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export { expect };
export { conferirTela, PORTAS, ORGANIZACAO } from '../../apoio';

export const PASTA = dirname(fileURLToPath(import.meta.url));
export const FOTOS = join(PASTA, '.fotos');
export const SAIDA = join(PASTA, '.saida');
mkdirSync(FOTOS, { recursive: true });
mkdirSync(SAIDA, { recursive: true });

const UA_ANDROID =
  'Mozilla/5.0 (Linux; Android 13; SM-A135M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';

/** Aparelhos (nomes iguais aos do relatório). Rede e CPU entram por `condicoes`, que usa o CDP. */
export const APARELHOS = {
  'AND-FRACO': { viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA_ANDROID },
  'AND-PEQUENO': { viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA_ANDROID },
  'AND-GRANDE': { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, userAgent: UA_ANDROID },
  'PC-GRANDE': { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  'PC-1280': { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
} satisfies Record<string, BrowserContextOptions>;

export const REDE = {
  '3G-LENTO': { latency: 2000, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 },
  '4G': { latency: 70, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8 },
} as const;

/** CPU mais lenta e rede limitada pelo CDP (só Chromium). Chame logo depois de abrir a página, antes do goto. */
export async function condicoes(page: Page, o: { cpu?: number; rede?: keyof typeof REDE }): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  if (o.cpu) await cdp.send('Emulation.setCPUThrottlingRate', { rate: o.cpu });
  if (o.rede) {
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, ...REDE[o.rede] });
  }
}

/**
 * Como o aparelho compartilha:
 * - aceita: o menu abre e a pessoa escolhe o WhatsApp (guarda o que seria mandado);
 * - ausente: navegador sem menu de compartilhar (computador, Firefox, navegador dentro de app);
 * - cancela: o menu abre e a pessoa fecha sem escolher (AbortError);
 * - recusa-arquivo: o menu existe, mas não aceita arquivo (canShare falso para files).
 */
export type Compartilhar = 'aceita' | 'ausente' | 'cancela' | 'recusa-arquivo';

declare global {
  interface Window {
    __copias: string[];
  }
}

export const test = base.extend<{ compartilhar: Compartilhar; erros: string[]; consoleErros: string[]; foraDoSite: string[] }>({
  compartilhar: ['aceita', { option: true }],
  erros: async ({}, usar) => usar([]),
  consoleErros: async ({}, usar) => usar([]),
  foraDoSite: async ({}, usar) => usar([]),
  page: async ({ page, context, compartilhar, erros, consoleErros, foraDoSite }, usar) => {
    // Nenhum pedido sai do localhost (nem para o site publicado nem para as métricas).
    await context.route(
      (url) => url.hostname !== 'localhost' && url.hostname !== '127.0.0.1',
      (rota) => {
        foraDoSite.push(rota.request().url());
        return rota.abort();
      },
    );
    await context.addInitScript((modo: Compartilhar) => {
      window.__partilhas = [];
      window.__impressoes = 0;
      window.__copias = [];
      const nav = navigator as Navigator & Record<string, unknown>;
      if (modo === 'ausente') {
        Object.defineProperty(Navigator.prototype, 'share', { configurable: true, value: undefined });
        Object.defineProperty(Navigator.prototype, 'canShare', { configurable: true, value: undefined });
        Reflect.deleteProperty(nav, 'share');
        Reflect.deleteProperty(nav, 'canShare');
      } else {
        Object.defineProperty(navigator, 'canShare', {
          configurable: true,
          value: (d?: ShareData) => !(modo === 'recusa-arquivo' && d?.files?.length),
        });
        Object.defineProperty(navigator, 'share', {
          configurable: true,
          value: async (d: ShareData) => {
            if (modo === 'cancela') throw new DOMException('Share canceled', 'AbortError');
            if (modo === 'recusa-arquivo' && d.files?.length) throw new TypeError('files not supported');
            window.__partilhas.push({ texto: d.text ?? '', arquivos: d.files?.length ?? 0 });
          },
        });
      }
      // Área de transferência de mentira: guarda o que seria copiado (o navegador sem tela pode negar a de verdade).
      try {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: async (t: string) => void window.__copias.push(t), readText: async () => window.__copias.at(-1) ?? '' },
        });
      } catch {
        /* sem área de transferência de mentira */
      }
      window.print = () => {
        window.__impressoes++;
      };
    }, compartilhar);
    page.on('dialog', (d) => void d.accept());
    page.on('pageerror', (e) => erros.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErros.push(m.text());
    });
    await usar(page);
  },
});

export const titulo = (page: Page) => page.getByRole('heading', { level: 1 });

/** Foto da tela em .fotos/ (fora do git). */
export async function foto(page: Page, nome: string, inteira = false): Promise<string> {
  const arquivo = join(FOTOS, `${nome}.png`);
  await page.screenshot({ path: arquivo, fullPage: inteira });
  return arquivo;
}

/** Árvore de acessibilidade da página, como o leitor de tela a percorre (salva em .saida/). */
export async function arvore(page: Page, nome: string): Promise<string> {
  const a = await page.locator('body').ariaSnapshot();
  writeFileSync(join(SAIDA, `arvore-${nome}.yml`), a);
  return a;
}

/** Diário: uma linha por observação, em .saida/<arquivo>.md. */
export function anotar(arquivo: string, texto: string): void {
  appendFileSync(join(SAIDA, `${arquivo}.md`), `${texto}\n`);
}

export interface Alvo {
  nome: string;
  largura: number;
  altura: number;
  x: number;
  y: number;
}

/** Alvos visíveis (botão, link, campo, rótulo de escolha) com menos de 48 px de lado, e pares a menos de `folga` px. */
export async function medirAlvos(page: Page, folga = 8) {
  return page.evaluate((folga) => {
    const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=radio], label:has(input[type=radio]), summary, [tabindex]:not([tabindex="-1"])';
    const els = [...document.querySelectorAll<HTMLElement>(sel)].filter((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0' && !el.closest('[hidden],[inert]');
    });
    // Rádio escondido atrás do rótulo: conta o rótulo.
    const usados = els.filter((el) => !(el instanceof HTMLInputElement && el.type === 'radio' && el.closest('label')));
    const nome = (el: HTMLElement) =>
      (el.getAttribute('aria-label') || el.textContent || (el as HTMLInputElement).name || el.id || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 50);
    const caixas = usados.map((el) => {
      const r = el.getBoundingClientRect();
      return { nome: nome(el), largura: Math.round(r.width), altura: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top + scrollY), r: { l: r.left, t: r.top + scrollY, d: r.right, b: r.bottom + scrollY }, el };
    });
    const pequenos = caixas.filter((c) => c.largura < 48 || c.altura < 48).map(({ nome, largura, altura, x, y }) => ({ nome, largura, altura, x, y }));
    const colados: { a: string; b: string; distancia: number }[] = [];
    for (let i = 0; i < caixas.length; i++)
      for (let j = i + 1; j < caixas.length; j++) {
        const a = caixas[i]!, b = caixas[j]!;
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const dx = Math.max(0, Math.max(a.r.l, b.r.l) - Math.min(a.r.d, b.r.d));
        const dy = Math.max(0, Math.max(a.r.t, b.r.t) - Math.min(a.r.b, b.r.b));
        const d = Math.hypot(dx, dy);
        if (d < folga) colados.push({ a: a.nome, b: b.nome, distancia: Math.round(d * 10) / 10 });
      }
    return { pequenos, colados };
  }, folga);
}

/** Texto cortado: scrollWidth maior que clientWidth, ou reticências. */
export async function medirCortes(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((el) => {
        if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return false;
        const s = getComputedStyle(el);
        const corta = el.scrollWidth > el.clientWidth + 1 && s.overflowX !== 'visible' && el.clientWidth > 0;
        return corta || s.textOverflow === 'ellipsis';
      })
      .map((el) => ({ tag: el.tagName, id: el.id, classe: el.className.toString().slice(0, 40), texto: (el.textContent ?? '').trim().slice(0, 60), sw: el.scrollWidth, cw: el.clientWidth })),
  );
}

/** Rolagem lateral da página. */
export const rolagemLateral = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** Cronômetro simples em ms. */
export function cronometro() {
  const t0 = Date.now();
  return () => Date.now() - t0;
}

/** O elemento com foco, descrito como o leitor de tela diria (papel, nome, estado). */
export const focado = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return 'body';
    const papel = el.getAttribute('role') || el.tagName.toLowerCase() + (el instanceof HTMLInputElement ? `[${el.type}]` : '');
    const rotulo =
      el.getAttribute('aria-label') ||
      (el.getAttribute('aria-labelledby') ?? '').split(' ').map((id) => document.getElementById(id)?.textContent?.trim()).filter(Boolean).join(' ') ||
      (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim()) ||
      el.closest('label')?.textContent?.trim() ||
      el.textContent?.trim() ||
      '';
    const marcado = el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox') ? (el.checked ? ' (marcado)' : ' (não marcado)') : '';
    return `${papel}: ${rotulo.replace(/\s+/g, ' ').slice(0, 80)}${marcado}`;
  });

/** Conteúdo das regiões aria-live no momento (para ver o que foi anunciado). */
export const regioesVivas = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[aria-live], [role=status], [role=alert]')].map((el) => ({
      id: el.id,
      live: el.getAttribute('aria-live') ?? el.getAttribute('role'),
      texto: (el.textContent ?? '').trim(),
    })),
  );

/**
 * Grava cada mudança nas regiões aria-live (o que o leitor de tela anunciaria e quantas vezes).
 * Leia com `lerAnuncios`.
 */
export async function escutarAnuncios(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __anuncios: string[] }).__anuncios = [];
    const olhar = () => {
      const obs = new MutationObserver((ms) => {
        for (const m of ms) {
          const alvo = (m.target.nodeType === 1 ? m.target : m.target.parentElement) as HTMLElement | null;
          const viva = alvo?.closest('[aria-live], [role=status], [role=alert]') as HTMLElement | null;
          if (!viva || viva.getAttribute('aria-live') === 'off') continue;
          const t = (viva.textContent ?? '').trim();
          if (t) (window as unknown as { __anuncios: string[] }).__anuncios.push(`[${viva.id || viva.className}] ${t}`);
        }
      });
      obs.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
    };
    if (document.documentElement) olhar();
    else document.addEventListener('DOMContentLoaded', olhar);
  });
}

export const lerAnuncios = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __anuncios: string[] };
    const a = w.__anuncios ?? [];
    w.__anuncios = [];
    return a;
  });

/** Texto a 200% (como a letra grande do Android), do jeito do e2e/primeira-tela.spec.ts. */
export async function textoEm200(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const aplicar = () => document.documentElement.style.setProperty('font-size', '200%');
    if (document.documentElement) aplicar();
    else document.addEventListener('DOMContentLoaded', aplicar);
  });
}

/** Salva em arquivo dentro de .saida/ (ex.: texto mandado, .ics). */
export function guardar(nome: string, conteudo: string | Buffer): string {
  const arquivo = join(SAIDA, nome);
  mkdirSync(dirname(arquivo), { recursive: true });
  writeFileSync(arquivo, conteudo);
  return arquivo;
}
