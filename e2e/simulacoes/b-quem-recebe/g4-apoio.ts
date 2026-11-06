// Apoio do grupo G4 (quem recebe o link de evento). Só desenvolvimento.
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import type { Browser, Page } from '@playwright/test';
import { abrirAparelho, PASTA, SAIDAS } from './aparelhos';

export const LINKS = JSON.parse(readFileSync(`${PASTA}links.json`, 'utf8')) as Record<string, { dados: string; titulo: string }>;

/** Anota uma linha em .saidas/g4-notas.txt (apoio ao relato). */
export function anotar(linha: string): void {
  appendFileSync(`${SAIDAS}/g4-notas.txt`, linha + '\n');
}

export const impressao = (dados: string): string => createHash('sha256').update(dados).digest('hex');

/** Troca a lista de bloqueio só nesta página/contexto. */
export async function bloquear(alvo: Page, dados: string, motivo: string): Promise<void> {
  await alvo.route('**/bloqueados.json', (rota) =>
    rota.fulfill({ contentType: 'application/json', body: JSON.stringify({ bloqueados: [{ h: impressao(dados), motivo }] }) }),
  );
}

export interface PedidoDeEvento {
  titulo: string;
  organizacao: string;
  texto: string;
  data: string; // dd/mm/aaaa
  hora: string;
  local: string;
}

/** Cria um evento pelo fluxo (aparelho rápido) e devolve os dados do link, ou os erros que o fluxo mostrou. */
export async function criarEvento(browser: Browser, baseURL: string, p: PedidoDeEvento): Promise<{ dados?: string; erros: string[] }> {
  const s = await abrirAparelho(browser, 'AND-GRANDE', { rede: null, cpu: null });
  try {
    const page = s.page;
    page.setDefaultTimeout(60_000);
    await page.goto(baseURL);
    await page.getByRole('link', { name: /Divulgar um evento/ }).click();
    await page.locator('#fluxo-titulo').fill(p.titulo);
    await page.locator('#fluxo-organizacao').fill(p.organizacao);
    await page.locator('#fluxo-texto').fill(p.texto);
    const erros: string[] = [];
    const seguir = async () => {
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.waitForTimeout(400);
      erros.push(...(await page.locator('.campo-erro:not([hidden])').allInnerTexts()));
    };
    await seguir();
    if (erros.length) return { erros };
    await page.locator('#fluxo-data').fill(p.data);
    await page.locator('#fluxo-hora').fill(p.hora);
    await page.locator('#fluxo-local').fill(p.local);
    await seguir();
    if (erros.length) return { erros };
    await page.getByRole('button', { name: 'Ficou bom' }).click();
    await page.getByRole('heading', { level: 1 }).filter({ hasText: 'Pronto!' }).waitFor();
    await page.waitForFunction(() => document.querySelector('#fluxo-link-estado')?.textContent !== 'Preparando o link…');
    await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
    if (await page.locator('#fluxo-confirma').isVisible()) await page.getByRole('button', { name: 'Mandar mesmo assim' }).click();
    await page.waitForFunction(() => window.__partilhas.length > 0);
    const texto = await page.evaluate(() => window.__partilhas[0]!.texto);
    const m = /#\/evento\/([A-Za-z0-9_-]+)/.exec(texto);
    return { dados: m?.[1], erros };
  } finally {
    await s.fechar();
  }
}
