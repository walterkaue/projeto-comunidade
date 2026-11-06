// Aparelhos da simulação B e as medições de cada tela. Só desenvolvimento.
// Cada aparelho é uma aproximação: o que a emulação não reproduz está em `observacao`.

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { devices, type Browser, type BrowserContext, type Page } from '@playwright/test';

export const PASTA = fileURLToPath(new URL('.', import.meta.url));
export const FOTOS = `${PASTA}.fotos`;
export const SAIDAS = `${PASTA}.saidas`;
mkdirSync(FOTOS, { recursive: true });
mkdirSync(SAIDAS, { recursive: true });

export type Motor = 'chromium' | 'webkit' | 'firefox';
/** Como o menu de compartilhar se comporta. */
export type Compartilhar = 'compartilha' | 'ausente' | 'cancela' | 'recusa-arquivo';

export interface Aparelho {
  motor: Motor;
  largura: number;
  altura: number;
  dpr: number;
  toque: boolean;
  mobile: boolean;
  userAgent?: string;
  /** CPU N vezes mais lenta (só Chromium, pelo CDP). */
  cpu?: number;
  /** Rede pelo CDP (só Chromium): kbit/s e ida e volta em ms. */
  rede?: { kbps: number; rttMs: number };
  escuro?: boolean;
  compartilhar: Compartilhar;
  /** O download (<a download> com blob:) não acontece, como em navegador dentro de app. */
  semDownload?: boolean;
  observacao: string;
}

const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 11; moto e20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const UA_SAMSUNG = 'Mozilla/5.0 (Linux; Android 13; SM-A135M) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36';
const UA_WEBVIEW = 'Mozilla/5.0 (Linux; Android 12; SM-A125M Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.102 Mobile Safari/537.36 Instagram 350.0.0.38.95 Android';
const UA_TABLET = 'Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

export const APARELHOS = {
  'AND-FRACO': { motor: 'chromium', largura: 360, altura: 640, dpr: 2, toque: true, mobile: true, userAgent: UA_ANDROID, cpu: 6, rede: { kbps: 400, rttMs: 2000 }, compartilhar: 'compartilha', observacao: 'CPU e rede pelo CDP; memória fraca e GPU não são emuladas.' },
  'AND-PEQUENO': { motor: 'chromium', largura: 320, altura: 568, dpr: 2, toque: true, mobile: true, userAgent: UA_ANDROID, cpu: 4, compartilhar: 'compartilha', observacao: 'CPU pelo CDP.' },
  'AND-GRANDE': { motor: 'chromium', largura: 412, altura: 915, dpr: 2.625, toque: true, mobile: true, userAgent: UA_ANDROID, rede: { kbps: 9000, rttMs: 150 }, compartilhar: 'compartilha', observacao: 'Rede 4G pelo CDP.' },
  'AND-DEITADO': { motor: 'chromium', largura: 640, altura: 360, dpr: 2, toque: true, mobile: true, userAgent: UA_ANDROID, compartilhar: 'compartilha', observacao: 'Celular deitado.' },
  'AND-TECLADO': { motor: 'chromium', largura: 360, altura: 330, dpr: 2, toque: true, mobile: true, userAgent: UA_ANDROID, compartilhar: 'compartilha', observacao: 'Aproximação do teclado aberto: só a altura menor; o teclado de verdade não muda o visualViewport assim.' },
  SAMSUNG: { motor: 'chromium', largura: 360, altura: 740, dpr: 3, toque: true, mobile: true, userAgent: UA_SAMSUNG, escuro: true, compartilhar: 'compartilha', observacao: 'Aproximação: Chromium com o user agent do Samsung Internet e prefers-color-scheme escuro. O modo escuro forçado do Samsung Internet (que reescreve as cores) não é reproduzido.' },
  WEBVIEW: { motor: 'chromium', largura: 360, altura: 640, dpr: 2, toque: true, mobile: true, userAgent: UA_WEBVIEW, compartilhar: 'ausente', semDownload: true, observacao: 'Aproximação de navegador dentro de app: user agent com "wv", sem navigator.share e com o <a download> de blob sem efeito. O que o app faz com target=_blank e com o link de mapa não é reproduzido.' },
  'IPHONE-SE': { motor: 'webkit', largura: 375, altura: 667, dpr: 2, toque: true, mobile: true, userAgent: devices['iPhone SE'].userAgent, compartilhar: 'compartilha', observacao: 'WebKit do Playwright, não o Safari do iPhone: sem barra de endereço que encolhe, sem menu de compartilhar de verdade.' },
  'IPHONE-GRANDE': { motor: 'webkit', largura: 430, altura: 932, dpr: 3, toque: true, mobile: true, userAgent: devices['iPhone 15 Pro Max'].userAgent, compartilhar: 'compartilha', observacao: 'WebKit do Playwright, não o Safari do iPhone.' },
  TABLET: { motor: 'chromium', largura: 800, altura: 1280, dpr: 2, toque: true, mobile: true, userAgent: UA_TABLET, compartilhar: 'compartilha', observacao: 'Tablet Android aproximado.' },
  'PC-FIREFOX': { motor: 'firefox', largura: 1366, altura: 768, dpr: 1, toque: false, mobile: false, compartilhar: 'ausente', observacao: 'Firefox de computador, sem navigator.share.' },
  'PC-GRANDE': { motor: 'chromium', largura: 1920, altura: 1080, dpr: 1, toque: false, mobile: false, compartilhar: 'ausente', observacao: 'Chromium de computador; navigator.share retirado para imitar o Windows/Linux sem menu.' },
} as const satisfies Record<string, Aparelho>;

export type NomeDoAparelho = keyof typeof APARELHOS;

declare global {
  interface Window {
    __partilhas: { texto: string; arquivos: number; url?: string; titulo?: string }[];
    __impressoes: number;
    __downloadsTentados: string[];
    __aberturas: string[];
  }
}

export interface OpcoesDoAparelho {
  timezoneId?: string;
  escuro?: boolean;
  /** Texto a 200% (tudo no site é em rem, como a letra grande do aparelho). */
  texto200?: boolean;
  compartilhar?: Compartilhar;
  serviceWorkers?: 'allow' | 'block';
  /** Rede trocada (ex.: sem limite para gerar dados mais rápido). `null` tira o limite. */
  rede?: { kbps: number; rttMs: number } | null;
  cpu?: number | null;
}

export interface Sessao {
  nome: NomeDoAparelho;
  aparelho: Aparelho;
  context: BrowserContext;
  page: Page;
  /** Abre outra aba no mesmo aparelho, já com CPU e rede limitadas. */
  nova(): Promise<Page>;
  /** Erros de JavaScript não tratados e erros do console. */
  erros: string[];
  /** Pedidos para fora do localhost (barrados). */
  externos: string[];
  fechar(): Promise<void>;
}

async function limitar(page: Page, ap: Aparelho, op: OpcoesDoAparelho): Promise<void> {
  if (ap.motor !== 'chromium') return;
  const cpu = op.cpu === null ? undefined : (op.cpu ?? ap.cpu);
  const rede = op.rede === null ? undefined : (op.rede ?? ap.rede);
  if (!cpu && !rede) return;
  const cdp = await page.context().newCDPSession(page);
  if (cpu) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  if (rede) {
    await cdp.send('Network.enable');
    const bytes = (rede.kbps * 1000) / 8;
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: rede.rttMs, downloadThroughput: bytes, uploadThroughput: bytes });
  }
}

/** Abre um aparelho no navegador do projeto. O motor do aparelho precisa ser o do projeto. */
export async function abrirAparelho(browser: Browser, nome: NomeDoAparelho, op: OpcoesDoAparelho = {}): Promise<Sessao> {
  const ap: Aparelho = APARELHOS[nome];
  const motor = browser.browserType().name();
  if (motor !== ap.motor) throw new Error(`${nome} é ${ap.motor}, mas o projeto é ${motor}. Use @webkit/@firefox no nome do teste.`);
  const context = await browser.newContext({
    viewport: { width: ap.largura, height: ap.altura },
    deviceScaleFactor: ap.dpr,
    hasTouch: ap.toque,
    ...(ap.motor === 'firefox' ? {} : { isMobile: ap.mobile }),
    ...(ap.userAgent ? { userAgent: ap.userAgent } : {}),
    colorScheme: (op.escuro ?? ap.escuro) ? 'dark' : 'light',
    locale: 'pt-BR',
    timezoneId: op.timezoneId ?? 'America/Sao_Paulo',
    serviceWorkers: op.serviceWorkers ?? 'block',
    acceptDownloads: true,
  });
  const externos: string[] = [];
  const erros: string[] = [];
  await context.route(
    (url) => url.hostname !== 'localhost' && url.hostname !== '127.0.0.1',
    (rota) => {
      externos.push(rota.request().url());
      return rota.abort();
    },
  );
  const modo = op.compartilhar ?? ap.compartilhar;
  await context.addInitScript(
    ({ modo, semDownload, texto200 }) => {
      window.__partilhas = [];
      window.__impressoes = 0;
      window.__downloadsTentados = [];
      window.__aberturas = [];
      const def = (o: object, k: string, v: unknown) => Object.defineProperty(o, k, { configurable: true, writable: true, value: v });
      if (modo === 'ausente') {
        def(navigator, 'share', undefined);
        def(navigator, 'canShare', undefined);
        try {
          delete (Navigator.prototype as unknown as Record<string, unknown>).share;
          delete (Navigator.prototype as unknown as Record<string, unknown>).canShare;
        } catch {
          /* nada */
        }
      } else {
        def(navigator, 'canShare', (d?: ShareData) => !(modo === 'recusa-arquivo' && d?.files?.length));
        def(navigator, 'share', async (d: ShareData) => {
          if (modo === 'recusa-arquivo' && d.files?.length) throw new DOMException('Não dá para mandar arquivo', 'NotAllowedError');
          window.__partilhas.push({ texto: d.text ?? '', arquivos: d.files?.length ?? 0, url: d.url, titulo: d.title });
          if (modo === 'cancela') throw new DOMException('A pessoa fechou o menu', 'AbortError');
        });
      }
      window.print = () => {
        window.__impressoes++;
      };
      const abrir = window.open.bind(window);
      window.open = (url?: string | URL, ...resto: unknown[]) => {
        window.__aberturas.push(String(url ?? ''));
        return abrir(url as string, ...(resto as [string?, string?]));
      };
      // Anota todo <a download> clicado; no aparelho "sem download", o clique não faz nada.
      const clicar = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        if (this.hasAttribute('download')) {
          window.__downloadsTentados.push(this.getAttribute('download') ?? '');
          if (semDownload) return;
        }
        return clicar.call(this);
      };
      if (texto200) {
        const aplicar = () => document.documentElement.style.setProperty('font-size', '200%');
        if (document.documentElement) aplicar();
        else document.addEventListener('DOMContentLoaded', aplicar);
      }
    },
    { modo, semDownload: !!ap.semDownload, texto200: !!op.texto200 },
  );
  const ouvir = (p: Page) => {
    p.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
    p.on('console', (m) => {
      if (m.type() === 'error') erros.push(`console: ${m.text()}`);
    });
  };
  context.on('page', ouvir);
  const nova = async () => {
    const p = await context.newPage();
    await limitar(p, ap, op);
    return p;
  };
  const page = await nova();
  return { nome, aparelho: ap, context, page, nova, erros, externos, fechar: () => context.close() };
}

/** Foto da tela em .fotos/<nome>.png. `inteira` tira a página toda. */
export async function foto(page: Page, nome: string, inteira = false): Promise<string> {
  const caminho = `${FOTOS}/${nome}.png`;
  await page.screenshot({ path: caminho, fullPage: inteira });
  return caminho;
}

/** Grava um arquivo de saída (texto, .ics, PDF) em .saidas/. */
export function salvarSaida(nome: string, conteudo: string | Buffer): string {
  const caminho = `${SAIDAS}/${nome}`;
  writeFileSync(caminho, conteudo);
  return caminho;
}

export interface Medida {
  tela: string;
  axe: string[];
  rolagemLateral: boolean;
  /** Alvos de toque visíveis menores que 48 px (largura ou altura). Link dentro de frase vem marcado "em texto". */
  alvosPequenos: string[];
  /** Alvos a menos de 4 px um do outro (ou sobrepostos). */
  alvosColados: string[];
  /** Texto cortado: scrollWidth maior que clientWidth com overflow escondido, ou reticências. */
  textoCortado: string[];
  /** Alvos visíveis tapados por um elemento fixo ou grudado (fixed/sticky). */
  cobertos: string[];
}

/** Mede a tela sem falhar o teste: o achado vai para o relatório, não para o vermelho. */
export async function medirTela(page: Page, tela: string): Promise<Medida> {
  await page.waitForTimeout(200);
  let axe: string[] = [];
  try {
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    axe = r.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  } catch (e) {
    axe = [`axe não rodou: ${(e as Error).message}`];
  }
  const resto = await page.evaluate(() => {
    const desc = (el: Element) => {
      const t = (el.getAttribute('aria-label') || (el as HTMLElement).innerText || el.getAttribute('id') || el.tagName).trim().replace(/\s+/g, ' ');
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${t.slice(0, 50)}"`;
    };
    const visivel = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const alvos = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button]')].filter(visivel);
    const alvosPequenos: string[] = [];
    for (const el of alvos) {
      const r = el.getBoundingClientRect();
      if (r.width < 48 || r.height < 48) {
        const emTexto = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && (el.parentElement?.innerText.length ?? 0) > ((el as HTMLElement).innerText.length + 10);
        alvosPequenos.push(`${desc(el)} ${Math.round(r.width)}×${Math.round(r.height)}${emTexto ? ' (em texto)' : ''}`);
      }
    }
    const alvosColados: string[] = [];
    const rs = alvos.map((el) => ({ el, r: el.getBoundingClientRect() }));
    for (let i = 0; i < rs.length; i++)
      for (let j = i + 1; j < rs.length; j++) {
        const a = rs[i]!, b = rs[j]!;
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const dx = Math.max(0, Math.max(a.r.left, b.r.left) - Math.min(a.r.right, b.r.right));
        const dy = Math.max(0, Math.max(a.r.top, b.r.top) - Math.min(a.r.bottom, b.r.bottom));
        if (dx < 4 && dy < 4) alvosColados.push(`${desc(a.el)} ↔ ${desc(b.el)} (${Math.round(Math.max(dx, dy))} px)`);
      }
    const textoCortado: string[] = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!visivel(el) || !(el as HTMLElement).innerText?.trim()) continue;
      const s = getComputedStyle(el);
      const esconde = s.overflowX === 'hidden' || s.overflowX === 'clip' || s.overflow === 'hidden';
      if (s.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) textoCortado.push(`${desc(el)} (reticências)`);
      else if (esconde && el.scrollWidth > el.clientWidth + 1 && el.tagName !== 'BODY' && el.tagName !== 'HTML') textoCortado.push(`${desc(el)} ${el.scrollWidth}>${el.clientWidth}`);
    }
    const fixos = [...document.querySelectorAll('body *')].filter((el) => {
      const p = getComputedStyle(el).position;
      return (p === 'fixed' || p === 'sticky') && visivel(el);
    });
    const cobertos: string[] = [];
    for (const { el, r } of rs) {
      if (r.bottom <= 0 || r.top >= innerHeight) continue;
      const cx = r.left + r.width / 2, cy = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
      const topo = document.elementFromPoint(cx, cy);
      if (!topo || el.contains(topo) || topo.contains(el)) continue;
      const fixo = fixos.find((f) => f.contains(topo) && !f.contains(el));
      if (fixo) cobertos.push(`${desc(el)} sob ${desc(fixo)}`);
    }
    return {
      rolagemLateral: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      alvosPequenos,
      alvosColados,
      textoCortado,
      cobertos,
    };
  });
  return { tela, axe, ...resto };
}

/** Mede e grava a medida em .saidas/medidas-<prefixo>.jsonl (uma linha por tela). */
export async function medirEGuardar(page: Page, prefixo: string, tela: string): Promise<Medida> {
  const m = await medirTela(page, tela);
  const { appendFileSync } = await import('node:fs');
  appendFileSync(`${SAIDAS}/medidas-${prefixo}.jsonl`, JSON.stringify(m) + '\n');
  return m;
}

/** Cronômetro simples, em segundos com uma casa. */
export function cronometro(): () => number {
  const t0 = Date.now();
  return () => Math.round((Date.now() - t0) / 100) / 10;
}

/** Endereço do evento neste servidor, a partir dos dados (o que vem depois de "#/evento/"). */
export const linkDoEvento = (baseURL: string, dados: string): string => `${baseURL.replace(/\/?$/, '/')}#/evento/${dados}`;
