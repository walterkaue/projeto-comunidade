// Apoio dos testes de ponta a ponta: a página com o compartilhar e o imprimir de mentira, a conferência de
// acessibilidade (axe) e de rolagem lateral, e os passos do fluxo que vários testes repetem.

import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';

declare global {
  interface Window {
    __partilhas: { texto: string; arquivos: number }[];
    __impressoes: number;
  }
}

/**
 * Página com:
 * - navigator.share falso, que guarda o que seria mandado (o menu de verdade não abre em teste);
 * - window.print falso, que só conta (a janela de impressão travaria o navegador sem tela);
 * - nenhum pedido para fora do próprio site (o teste nunca fala com outro domínio);
 * - todo window.confirm aceito;
 * - falha se a página tiver erro de JavaScript não tratado.
 */
export const test = base.extend<{ erros: string[] }>({
  erros: async ({}, usar) => {
    await usar([]);
  },
  page: async ({ page, context, erros }, usar) => {
    await context.route(
      (url) => url.hostname !== 'localhost' && url.hostname !== '127.0.0.1',
      (rota) => rota.abort(),
    );
    await context.addInitScript(() => {
      window.__partilhas = [];
      window.__impressoes = 0;
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (d: ShareData) => {
          window.__partilhas.push({ texto: d.text ?? '', arquivos: d.files?.length ?? 0 });
        },
      });
      window.print = () => {
        window.__impressoes++;
      };
    });
    page.on('dialog', (d) => void d.accept());
    page.on('pageerror', (e) => erros.push(e.message));
    await usar(page);
    expect(erros, 'erro de JavaScript na página').toEqual([]);
  },
});

export { expect };

/**
 * Confere a tela aberta: nenhum erro grave ou crítico do axe (WCAG 2.2 A e AA) e nada de rolagem lateral em
 * 360 px. `nome` só aparece na mensagem de falha.
 */
export async function conferirTela(page: Page, nome: string): Promise<void> {
  // Espera o fim das animações de troca de tela (o axe mede a cor de verdade).
  await page.waitForTimeout(150);
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const graves = r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(graves, `acessibilidade em "${nome}"`).toEqual([]);

  const largura = await page.evaluate(() => ({
    pagina: document.documentElement.scrollWidth,
    tela: document.documentElement.clientWidth,
  }));
  expect(largura.pagina, `rolagem lateral em "${nome}"`).toBeLessThanOrEqual(largura.tela);
}

export const PORTAS = [
  { tipo: 'reuniao', verbo: 'Chamar para uma reunião', agenda: true },
  { tipo: 'evento', verbo: 'Divulgar um evento', agenda: true },
  { tipo: 'aviso', verbo: 'Dar um aviso', agenda: false },
  { tipo: 'resultado', verbo: 'Contar uma conquista', agenda: false },
  { tipo: 'agradecimento', verbo: 'Agradecer', agenda: false },
] as const;

export type Porta = (typeof PORTAS)[number];

export const titulo = (page: Page) => page.getByRole('heading', { level: 1 });

/** Abre o início e toca na porta. Termina no passo 1. */
export async function abrirPorta(page: Page, porta: Porta, conferir = false): Promise<void> {
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  if (conferir) await conferirTela(page, 'início');
  await page.getByRole('link', { name: new RegExp(porta.verbo) }).click();
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  await expect(page).toHaveURL(new RegExp(`#/fazer/${porta.tipo}$`));
}

/** Do passo 1 (já preenchido) até o Pronto, com o que já está nos campos. */
export async function irAteOPronto(page: Page, porta: Porta, conferir = false): Promise<void> {
  if (conferir) await conferirTela(page, `${porta.tipo}: passo 1`);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  if (conferir) await conferirTela(page, `${porta.tipo}: passo 2`);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 3 de 3');
  if (conferir) await conferirTela(page, `${porta.tipo}: passo 3`);
  await page.getByRole('button', { name: 'Ficou bom' }).click();
  await esperarOPronto(page, porta);
  if (conferir) await conferirTela(page, `${porta.tipo}: Pronto`);
}

/** Espera o Pronto e, em reunião e evento, o fim do preparo do link. */
export async function esperarOPronto(page: Page, porta: Pick<Porta, 'agenda'>): Promise<void> {
  await expect(titulo(page)).toContainText('Pronto!');
  if (porta.agenda) await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…');
}

/** O que o falso navigator.share recebeu até agora. */
export const partilhas = (page: Page) => page.evaluate(() => window.__partilhas);

/** Toca em "Mandar no WhatsApp"; se o painel do exemplo abrir, confirma. Devolve o texto mandado. */
export async function mandar(page: Page): Promise<string> {
  const antes = (await partilhas(page)).length;
  await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
  const seguir = page.getByRole('button', { name: 'Mandar mesmo assim' });
  if (await page.locator('#fluxo-confirma').isVisible()) await seguir.click();
  await expect.poll(async () => (await partilhas(page)).length).toBe(antes + 1);
  return (await partilhas(page))[antes]!.texto;
}

/** O link do evento dentro do texto mandado ("Mais detalhes: <link>"), ou vazio. */
export function linkNoTexto(texto: string): string {
  return /Mais detalhes: (\S+)/.exec(texto)?.[1] ?? '';
}

/** Organização fictícia e neutra, para trocar a do exemplo. */
export const ORGANIZACAO = 'Associação de Moradores Jardim das Acácias';
