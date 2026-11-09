// A6 Marcos, 35, ONG de educação: logo (arquivos problemáticos), cor livre, saídas no computador.
import type { Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { preencherObrigatoriosVazios } from '../obrigatorios';
import { gerarFixtures, type Arquivos } from './a6-apoio';
import {
  baixarPor, copias, cronometro, expect, foto, inspecionar, pastaDoTeste, partilhas, registrar, SAIDAS, salvarPdf, salvarTexto, test, titulo,
} from './sim';

const ORG = 'ONG de educação do bairro';

async function digitar(page: Page, sel: string, texto: string) {
  const c = page.locator(sel);
  await c.click();
  await c.press('Control+A');
  await c.press('Delete');
  await c.pressSequentially(texto, { delay: 25 });
}

async function dumpCanvas(page: Page, nome: string) {
  const url = await page.locator('#fluxo-canvas').evaluate((c: HTMLCanvasElement) => c.toDataURL('image/png'));
  const caminho = join(pastaDoTeste(SAIDAS), nome);
  writeFileSync(caminho, Buffer.from(url.split(',')[1]!, 'base64'));
  return caminho;
}

async function falado(page: Page) {
  return (await page.locator('[aria-live]').allTextContents()).map((t) => t.trim()).filter(Boolean);
}

async function ate3(page: Page, cron: ReturnType<typeof cronometro>) {
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  await inspecionar(page, 'início');
  await foto(page, 'inicio');
  cron.marca('inicio');
  await page.getByRole('link', { name: /Divulgar um evento/ }).click();
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  await digitar(page, '#fluxo-titulo', 'Oficina de leitura para jovens');
  await digitar(page, '#fluxo-organizacao', ORG);
  await inspecionar(page, 'passo 1');
  await foto(page, 'passo1');
  cron.marca('passo1');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await page.getByRole('button', { name: 'Próximo sábado' }).click();
  await digitar(page, '#fluxo-local', 'Rua das Flores, 120, Centro');
  await page.locator('#fluxo-hora').fill('19:00'); // a hora começa vazia e é obrigatória
  await inspecionar(page, 'passo 2');
  await foto(page, 'passo2');
  cron.marca('passo2');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 3 de 3');
  await page.locator('#fluxo-formato-cartaz').click({ timeout: 8000 });
  await expect(page.locator('#fluxo-formato-cartaz')).toBeChecked();
  await page.locator('summary', { hasText: 'Mais opções' }).click({ timeout: 8000 });
  await expect(page.locator('#fluxo-logo')).toBeVisible();
  await inspecionar(page, 'passo 3 com Mais opções');
  await foto(page, 'passo3-mais-opcoes', true);
  cron.marca('passo3');
}

async function logo(page: Page, rotulo: string, caminho: string) {
  const t0 = Date.now();
  await page.setInputFiles('#fluxo-logo', caminho);
  let resultado = 'sem resposta em 15 s';
  try {
    await page.waitForFunction(
      () => !document.querySelector<HTMLElement>('#fluxo-logo-nome')!.hidden || !document.querySelector<HTMLElement>('#fluxo-logo-erro')!.hidden,
      undefined,
      { timeout: 15_000 },
    );
    const erro = page.locator('#fluxo-logo-erro');
    resultado = (await erro.isVisible()) ? `ERRO: ${await erro.textContent()}` : `OK: ${await page.locator('#fluxo-logo-nome').textContent()}`;
  } catch {
    /* fica o texto padrão */
  }
  const ms = Date.now() - t0;
  await page.waitForTimeout(700);
  const png = await dumpCanvas(page, `previa-logo-${rotulo}.png`);
  await foto(page, `logo-${rotulo}`, true);
  registrar('a6-logo', { rotulo, resultado, ms, avisoFalado: await falado(page), png });
  return resultado;
}

async function corLivre(page: Page, hex: string, rotulo: string) {
  await page.locator('#fluxo-cor-livre').fill(hex);
  await page.waitForTimeout(1200);
  const msg = (await page.locator('#fluxo-cor-msg').textContent())?.trim() ?? '';
  const aviso = (await page.locator('#fluxo-cor-aviso').isVisible()) ? await page.locator('#fluxo-cor-aviso').textContent() : '';
  const png = await dumpCanvas(page, `previa-cor-${rotulo}.png`);
  await foto(page, `cor-${rotulo}`, true);
  registrar('a6-cor', { hex, rotulo, msg, aviso, png });
  return msg;
}

async function roteiro(page: Page, ehChromium: boolean) {
  const cron = cronometro('A6 Marcos');
  const a: Arquivos = await gerarFixtures(page);
  await ate3(page, cron);

  for (const [rot, cam] of [
    ['a-png5mb', a.png5mb],
    ['b-jpg-exif6', a.jpgExif6],
    ['c1-svg-com-tamanho', a.svgComTamanho],
    ['c2-svg-sem-tamanho', a.svgSemTamanho],
    ['d1-txt-como-png', a.txtComoPng],
    ['d2-pdf', a.pdf],
  ] as const) {
    await logo(page, rot, cam);
    cron.marca(`logo-${rot}`);
  }
  await logo(page, 'final-jpg-exif6', a.jpgExif6);

  const clara = await corLivre(page, '#fff59d', 'clara');
  const escura = await corLivre(page, '#1a237e', 'escura');
  const media = await corLivre(page, '#ff9800', 'laranja-media');
  const meio = await corLivre(page, '#7e57c2', 'roxo-meio');
  registrar('a6-cor-resumo', { clara, escura, media, meio });
  await corLivre(page, '#fff59d', 'clara-final');
  await inspecionar(page, 'passo 3 cor livre');

  // Teclado: foco visível e ordem (passo 3)
  await page.locator('#fluxo-formato input').first().focus();
  const ordem: string[] = [];
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    ordem.push(
      await page.evaluate(() => {
        const e = document.activeElement as HTMLElement;
        if (!e) return 'nada';
        const rotulo = (e.id ? '#' + e.id : e.tagName.toLowerCase()) + ' "' + (e.textContent || '').trim().slice(0, 25) + '"';
        const lab = e.id ? document.querySelector(`label[for="${e.id}"]`) : null;
        const ls = lab ? getComputedStyle(lab) : null;
        const foco = (n: Element | null) => {
          if (!n) return '';
          const c = getComputedStyle(n);
          return `outline=${c.outlineStyle} ${c.outlineWidth} sombra=${c.boxShadow !== 'none'}`;
        };
        return `${rotulo} ${foco(e)}${ls ? ' | rótulo ' + foco(lab) : ''}`;
      }),
    );
  }
  salvarTexto('tab-passo3.txt', ordem.join('\n'));
  await foto(page, 'teclado-fim');

  // Voltar do navegador no passo 3
  await page.goBack();
  await page.waitForTimeout(600);
  registrar('a6-voltar', { onde: 'passo 3 -> goBack', url: page.url(), titulo: await titulo(page).textContent() });
  await foto(page, 'voltou-do-passo3');
  await page.goForward();
  await page.waitForTimeout(600);
  registrar('a6-voltar', { onde: 'goForward ao passo 3', url: page.url(), titulo: await titulo(page).textContent(), logoMantido: await page.locator('#fluxo-logo-nome').isVisible().catch(() => null) });
  await expect(titulo(page)).toContainText('Passo 3 de 3');

  await page.getByRole('button', { name: 'Ficou bom' }).click();
  await expect(titulo(page)).toContainText('Pronto!');
  await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…');
  await page.waitForTimeout(800);
  await inspecionar(page, 'Pronto');
  await foto(page, 'pronto', true);
  cron.marca('pronto');
  registrar('a6-pronto', {
    estadoLink: await page.locator('#fluxo-link-estado').textContent(),
    avisoDoExemplo: await page.locator('#fluxo-aviso-exemplo').count(), // 0: o aviso do exemplo não existe mais
    qrNota: await page.locator('#fluxo-aviso-qr').isVisible().catch(() => false),
    dica: await page.locator('#fluxo-mandar-dica').textContent(),
    canvas: await page.locator('#fluxo-canvas').boundingBox(),
    viewport: page.viewportSize(),
  });
  await dumpCanvas(page, 'previa-pronto.png');

  // WhatsApp sem menu de compartilhar
  await page.locator('#fluxo-mandar').click();
  await page.waitForTimeout(300);
  if (await page.locator('#fluxo-confirma').isVisible()) {
    registrar('a6-painel', { texto: await page.locator('#fluxo-confirma').textContent() });
    await foto(page, 'painel-exemplo');
    await inspecionar(page, 'painel do exemplo');
    await page.locator('#fluxo-confirma-seguir').click();
  }
  await page.waitForTimeout(1500);
  registrar('a6-whatsapp', {
    url: page.url(),
    abas: page.context().pages().length,
    copias: await copias(page),
    partilhas: await partilhas(page),
    avisoFalado: await falado(page),
    estado: await page.locator('#fluxo-estado').textContent(),
  });
  const texto = (await copias(page)).at(-1);
  if (texto) salvarTexto('whatsapp.txt', `${texto}\n\n[${texto.length} caracteres]`);
  await foto(page, 'depois-de-mandar', true);
  cron.marca('mandar-no-whatsapp');

  const png = await baixarPor(page.locator('#fluxo-baixar'), 'card.png');
  registrar('a6-baixar', { png, avisoFalado: await falado(page) });

  await page.locator('#fluxo-imprimir').click();
  await page.waitForTimeout(1500);
  const imp = await page.evaluate(() => ({ n: window.__impressoes, area: !!document.querySelector('.fluxo-cartaz-impressao') }));
  registrar('a6-imprimir', { ...imp, ehChromium, avisoFalado: await falado(page) });
  if (ehChromium && imp.area) registrar('a6-pdf', { pdf: await salvarPdf(page, 'cartaz.pdf') });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));

  // Voltar no Pronto
  await page.goBack();
  await page.waitForTimeout(600);
  registrar('a6-voltar', { onde: 'Pronto -> goBack', url: page.url(), titulo: await titulo(page).textContent() });
  await foto(page, 'voltou-do-pronto');
  if (!/pronto/.test(page.url())) {
    await page.goForward();
    await page.waitForTimeout(600);
    registrar('a6-voltar', { onde: 'Pronto -> goBack -> goForward', url: page.url(), titulo: await titulo(page).textContent() });
  }
  if (!(await titulo(page).textContent())?.includes('Pronto')) {
    await page.goto(page.url().replace(/#.*/, '') + '#/fazer/evento/pronto');
    await page.waitForTimeout(600);
  }
  if (!(await titulo(page).textContent())?.includes('Pronto')) {
    registrar('a6-voltar', { aviso: 'não deu para voltar ao Pronto', titulo: await titulo(page).textContent(), url: page.url() });
    return;
  }

  // Mudar algo: o que fica?
  await page.locator('#fluxo-mudar').click();
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  registrar('a6-mudar', { passo1: { titulo: await page.locator('#fluxo-titulo').inputValue(), org: await page.locator('#fluxo-organizacao').inputValue() } });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 3 de 3');
  await page.locator('summary', { hasText: 'Mais opções' }).click();
  await page.waitForTimeout(700);
  registrar('a6-mudar', {
    passo3: {
      logoVisivel: await page.locator('#fluxo-logo-nome').isVisible(),
      corLivre: await page.locator('#fluxo-cor-livre').inputValue(),
      corNome: await page.locator('#fluxo-cor-nome').textContent(),
      formato: await page.locator('input[name=fluxo-formato]:checked').getAttribute('value'),
    },
  });
  await foto(page, 'mudar-algo-passo3', true);
  await dumpCanvas(page, 'previa-depois-de-mudar.png');
  await page.getByRole('button', { name: 'Ficou bom' }).click();
  await expect(titulo(page)).toContainText('Pronto!');

  // Fazer outro
  const dica = await page.locator('#fluxo-outro-dica').textContent();
  await page.locator('#fluxo-outro').click();
  await page.waitForTimeout(400);
  registrar('a6-fazer-outro', { dica, url: page.url(), titulo: await titulo(page).textContent() });
  await page.getByRole('link', { name: /Divulgar um evento/ }).click();
  registrar('a6-fazer-outro', { passo1Titulo: await page.locator('#fluxo-titulo').inputValue(), org: await page.locator('#fluxo-organizacao').inputValue() });
  // Depois de "Fazer outro" os campos voltam vazios: escreve o obrigatório para chegar ao passo 3.
  await preencherObrigatoriosVazios(page, { tipo: 'evento', agenda: true }, 1);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await preencherObrigatoriosVazios(page, { tipo: 'evento', agenda: true }, 2);
  await page.getByRole('button', { name: 'Continuar' }).click().catch(() => undefined);
  await page.waitForTimeout(500);
  if ((await titulo(page).textContent())?.includes('Passo 3')) {
    await page.locator('summary', { hasText: 'Mais opções' }).click();
    registrar('a6-fazer-outro', { logoVisivel: await page.locator('#fluxo-logo-nome').isVisible(), corLivre: await page.locator('#fluxo-cor-livre').inputValue(), paleta: await page.locator('#fluxo-cor-nome').textContent() });
  } else registrar('a6-fazer-outro', { aviso: 'não chegou ao passo 3', titulo: await titulo(page).textContent() });
}

test('A6 Marcos: logo, cor livre e saídas no Firefox @PC-FIREFOX', async ({ page }) => {
  await roteiro(page, false);
});

test('A6 Marcos: logo, cor livre e saídas no PC grande @PC-GRANDE', async ({ page }) => {
  await roteiro(page, true);
});

test.describe('menu de compartilhar fechado', () => {
  test.use({ compartilhar: 'cancela' });
  test('A6 Marcos: fecha o menu de compartilhar @PC-GRANDE', async ({ page }) => {
    const cron = cronometro('A6 Marcos cancela');
    await ate3(page, cron);
    await page.getByRole('button', { name: 'Ficou bom' }).click();
    await expect(titulo(page)).toContainText('Pronto!');
    await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…');
    registrar('a6-layout-1920', {
      larguraJanela: await page.evaluate(() => innerWidth),
      main: await page.evaluate(() => document.querySelector('main')!.getBoundingClientRect().width),
      canvas: await page.locator('#fluxo-canvas').boundingBox(),
    });
    await foto(page, 'pronto-1920', false);
    await page.locator('#fluxo-mandar').click();
    if (await page.locator('#fluxo-confirma').isVisible()) await page.locator('#fluxo-confirma-seguir').click();
    await page.waitForTimeout(1500);
    registrar('a6-cancela', {
      partilhas: await partilhas(page),
      copias: await copias(page),
      avisoFalado: await falado(page),
      estado: await page.locator('#fluxo-estado').textContent(),
    });
    await foto(page, 'depois-de-cancelar', true);
    cron.marca('mandar-no-whatsapp');
    await page.locator('#fluxo-mandar').click();
    await page.waitForTimeout(800);
    registrar('a6-cancela', { segundoToque: (await partilhas(page)).length });
  });
});
