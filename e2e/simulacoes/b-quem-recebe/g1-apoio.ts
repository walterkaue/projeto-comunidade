// Ajudante do grupo G1 (quem recebe o link do evento). Só desenvolvimento.
import { readFileSync, writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { SAIDAS, cronometro, foto, linkDoEvento, medirEGuardar, salvarSaida, type Sessao } from './aparelhos';

export const LINKS = JSON.parse(readFileSync(new URL('./links.json', import.meta.url), 'utf8')) as Record<string, { dados: string }>;

export interface Registro {
  id: string;
  aparelho: string;
  timezone: string;
  passos: Record<string, unknown>;
}

type Blobs = { tipo: string; texto: string }[];

const texto = (page: Page, sel: string) => page.locator(sel).first().innerText().catch(() => '(não achei)');

/** Guarda o conteúdo de todo blob criado (o .ics) em window.__blobs, mesmo quando o download não acontece. */
export async function espiarBlobs(s: Sessao): Promise<void> {
  await s.context.addInitScript(() => {
    const w = window as unknown as { __blobs: Blobs };
    w.__blobs = [];
    const cria = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (o: Blob | MediaSource) => {
      if (o instanceof Blob) void o.text().then((t) => w.__blobs.push({ tipo: o.type, texto: t }));
      return cria(o);
    };
  });
}

export async function abrirLink(s: Sessao, baseURL: string, chave: string, id: string, reg: Registro): Promise<void> {
  const t = cronometro();
  await s.page.goto(linkDoEvento(baseURL, LINKS[chave]!.dados));
  await s.page.locator('[data-ics]').waitFor({ timeout: 90_000 });
  reg.passos['abrir-s'] = t();
  reg.passos['pagina-texto'] = await s.page.locator('main').innerText();
  reg.passos['agenda-href'] = await s.page.locator('a[aria-label^="Abrir no Google Agenda"]').getAttribute('href');
  reg.passos['mapa-href'] = await s.page.locator('[data-mapa]').getAttribute('href');
  reg.passos['medida-abrir'] = await medirEGuardar(s.page, 'g1', `${id}-pagina`);
  await foto(s.page, `g1-${id}-pagina`);
  await foto(s.page, `g1-${id}-pagina-inteira`, true);
}

export async function tentarIcs(s: Sessao, id: string, reg: Registro, esperaDownload: boolean): Promise<void> {
  const t = cronometro();
  const botao = s.page.locator('[data-ics]');
  await botao.scrollIntoViewIfNeeded();
  const baixou = esperaDownload ? s.page.waitForEvent('download', { timeout: 8_000 }).catch(() => null) : Promise.resolve(null);
  await botao.click();
  const dl = await baixou;
  await s.page.waitForTimeout(600);
  reg.passos['ics-clique-s'] = t();
  reg.passos['ics-aviso'] = await texto(s.page, '#aviso-vivo');
  reg.passos['ics-downloadsTentados'] = await s.page.evaluate(() => window.__downloadsTentados);
  reg.passos['ics-download-aconteceu'] = !!dl;
  if (dl) {
    const caminho = await dl.path();
    reg.passos['ics-nome-arquivo'] = dl.suggestedFilename();
    const conteudo = readFileSync(caminho, 'utf8');
    salvarSaida(`g1-${id}.ics`, conteudo);
    reg.passos['ics-conteudo'] = conteudo;
  }
  const blobs = await s.page.evaluate(() => (window as unknown as { __blobs: Blobs }).__blobs);
  reg.passos['ics-blob'] = blobs[0] ?? null;
  if (!dl && blobs[0]) salvarSaida(`g1-${id}-blob-nao-baixado.ics`, blobs[0].texto);
  await foto(s.page, `g1-${id}-ics`);
  await medirEGuardar(s.page, 'g1', `${id}-apos-ics`);
}

/** Toca um link externo: lê a folha de saída, toca "Ir para o site" e anota o endereço barrado. */
export async function tocarExterno(s: Sessao, id: string, reg: Registro, rotulo: string, seletor: string): Promise<void> {
  const t = cronometro();
  const antes = s.externos.length;
  const link = s.page.locator(seletor);
  await link.scrollIntoViewIfNeeded();
  await link.click();
  const folha = s.page.locator('.folha');
  const apareceu = await folha.waitFor({ timeout: 4_000 }).then(() => true, () => false);
  reg.passos[`${rotulo}-folha`] = apareceu ? await folha.innerText() : '(sem folha de saída)';
  if (apareceu) {
    await foto(s.page, `g1-${id}-${rotulo}-folha`);
    await medirEGuardar(s.page, 'g1', `${id}-${rotulo}-folha`);
    await folha.locator('a').click();
    await s.page.waitForTimeout(1200);
  }
  reg.passos[`${rotulo}-s`] = t();
  reg.passos[`${rotulo}-externos`] = s.externos.slice(antes);
  reg.passos[`${rotulo}-aberturas`] = await s.page.evaluate(() => window.__aberturas);
  for (const p of s.context.pages()) if (p !== s.page) await p.close().catch(() => undefined);
  await s.page.bringToFront();
}

export async function tocarCompartilharEQr(s: Sessao, id: string, reg: Registro): Promise<void> {
  let t = cronometro();
  const comp = s.page.locator('[data-compartilhar]');
  await comp.scrollIntoViewIfNeeded();
  await comp.click();
  await s.page.waitForTimeout(700);
  reg.passos['compartilhar-s'] = t();
  reg.passos['compartilhar-aviso'] = await texto(s.page, '#aviso-vivo');
  reg.passos['compartilhar-partilhas'] = await s.page.evaluate(() => window.__partilhas);
  reg.passos['compartilhar-clipboard'] = await s.page.evaluate(async () => {
    try {
      return await navigator.clipboard.readText();
    } catch (e) {
      return `erro: ${(e as Error).message}`;
    }
  });
  await foto(s.page, `g1-${id}-compartilhar`);
  await medirEGuardar(s.page, 'g1', `${id}-apos-compartilhar`);
  t = cronometro();
  const qr = s.page.locator('[data-qr]');
  await qr.scrollIntoViewIfNeeded();
  await qr.click();
  await s.page.locator('.evento-qr').waitFor({ timeout: 30_000 }).catch(() => undefined);
  reg.passos['qr-s'] = t();
  reg.passos['qr-aviso'] = await texto(s.page, '#aviso-vivo');
  reg.passos['qr-visivel'] = await s.page.locator('.evento-qr').isVisible();
  reg.passos['qr-tamanho'] = await s.page.locator('.evento-qr').boundingBox();
  await foto(s.page, `g1-${id}-qr`);
  await medirEGuardar(s.page, 'g1', `${id}-apos-qr`);
}

export function guardar(id: string, reg: Registro, s: Sessao): void {
  reg.passos['erros'] = s.erros;
  reg.passos['externos-total'] = s.externos;
  writeFileSync(`${SAIDAS}/g1-${id}.json`, JSON.stringify(reg, null, 2));
}
