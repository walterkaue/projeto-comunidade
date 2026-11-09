// C2 Dona Neide, 74, baixa visão e mão trêmula (personagem fictícia). Aviso do início ao Pronto, letra a 200% e 400%.
import type { Page } from '@playwright/test';
import { APARELHOS, anotar, condicoes, expect, foto, medirAlvos, medirCortes, rolagemLateral, test, textoEm200, titulo, ORGANIZACAO } from './apoio-sim';

const N = 'c2';
const TITULO = 'Entrega de cestas no sábado';
const TEXTO = 'Quem puder, traga um quilo de alimento. Obrigada.';

async function medir(page: Page, tela: string, nota = '') {
  await page.waitForTimeout(300);
  const a = await medirAlvos(page);
  const cortes = await medirCortes(page);
  const lat = await rolagemLateral(page);
  const faixas = await page.evaluate(() => {
    const r = (s: string) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const b = e.getBoundingClientRect();
      return { pos: getComputedStyle(e).position, top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) };
    };
    return { mini: r('.fluxo-mini'), barra: r('.fluxo-barra'), vh: innerHeight, soltas: document.documentElement.classList.contains('fluxo-faixas-soltas') };
  });
  anotar(N, `\n### ${tela} ${nota}\n- pequenos(<48): ${JSON.stringify(a.pequenos)}\n- colados(<8px): ${JSON.stringify(a.colados)}\n- cortes: ${JSON.stringify(cortes)}\n- rolagem lateral: ${lat}px\n- faixas: ${JSON.stringify(faixas)}`);
  return { a, cortes, lat, faixas };
}

/** Cada campo, ao receber foco (como ao tocar), fica visível fora das faixas fixas? */
async function camposTapados(page: Page, tela: string) {
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('form input:not([type=radio]):not([type=checkbox]):not([type=file]), form textarea')].map((e) => e.id).filter(Boolean),
  );
  const res: string[] = [];
  for (const id of ids) {
    await page.evaluate((i) => (document.getElementById(i) as HTMLElement).focus(), id);
    await page.waitForTimeout(150);
    const r = await page.evaluate((i) => {
      const c = document.getElementById(i)!.getBoundingClientRect();
      const f = (s: string) => {
        const e = document.querySelector(s);
        return e && getComputedStyle(e).position !== 'static' ? e.getBoundingClientRect() : null;
      };
      const m = f('.fluxo-mini'), b = f('.fluxo-barra');
      const sobre = (x: DOMRect | null) => !!x && c.bottom > x.top && c.top < x.bottom;
      return { id: i, topo: Math.round(c.top), base: Math.round(c.bottom), tapaMini: sobre(m) && m!.top < 10, tapaBarra: sobre(b) && b!.top > 100, vh: innerHeight };
    }, id);
    if (r.tapaMini || r.tapaBarra) res.push(JSON.stringify(r));
  }
  anotar(N, `- campos tapados por faixa fixa em ${tela}: ${res.length ? res.join(' | ') : 'nenhum'}`);
  return res;
}

async function aoPasso(page: Page, nome: string, clicar: () => Promise<void>, esperado: string) {
  const t0 = Date.now();
  await clicar();
  await expect(titulo(page)).toContainText(esperado, { timeout: 60_000 });
  const ms = Date.now() - t0;
  anotar(N, `- TEMPO ${nome}: ${ms} ms`);
  return ms;
}

async function percurso(page: Page, rotulo: string) {
  await condicoes(page, { cpu: 6, rede: '3G-LENTO' });
  const t0 = Date.now();
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  anotar(N, `\n## ${rotulo}\n- TEMPO início: ${Date.now() - t0} ms`);
  await medir(page, `${rotulo} início`);
  await foto(page, `${N}-${rotulo}-0-inicio`);
  await aoPasso(page, 'abrir Dar um aviso', () => page.getByRole('link', { name: /Dar um aviso/ }).click(), 'Passo 1 de 3');
  await medir(page, `${rotulo} passo 1 (vazio)`);
  await camposTapados(page, `${rotulo} passo 1`);
  await page.evaluate(() => scrollTo(0, 0));
  await foto(page, `${N}-${rotulo}-1-passo1-vazio`);
  await page.locator('#fluxo-titulo').fill(TITULO);
  await page.locator('#fluxo-organizacao').fill(ORGANIZACAO);
  await page.locator('#fluxo-texto').fill(TEXTO);
  await medir(page, `${rotulo} passo 1 (preenchido)`);
  await foto(page, `${N}-${rotulo}-1-passo1-preenchido`);
  await aoPasso(page, 'passo 1 -> 2', () => page.getByRole('button', { name: 'Continuar' }).click(), 'Passo 2 de 3');
  await medir(page, `${rotulo} passo 2`);
  await camposTapados(page, `${rotulo} passo 2`);
  await foto(page, `${N}-${rotulo}-2-passo2`);
  await aoPasso(page, 'passo 2 -> 3', () => page.getByRole('button', { name: 'Continuar' }).click(), 'Passo 3 de 3');
  await page.waitForTimeout(500);
  await medir(page, `${rotulo} passo 3`);
  await foto(page, `${N}-${rotulo}-3-passo3`);
  await page.locator('details.fluxo-mais summary').click();
  await medir(page, `${rotulo} passo 3 (Mais opções aberto)`);
  await foto(page, `${N}-${rotulo}-3-passo3-mais`, true);
  await page.locator('details.fluxo-mais summary').click();
  await aoPasso(page, 'passo 3 -> Pronto', () => page.getByRole('button', { name: 'Ficou bom' }).click(), 'Pronto!');
  await page.waitForTimeout(600);
  await medir(page, `${rotulo} Pronto`);
  await foto(page, `${N}-${rotulo}-4-pronto`);
  await foto(page, `${N}-${rotulo}-4-pronto-inteira`, true);
  const aviso = await page.locator('#fluxo-aviso-exemplo').count();
  anotar(N, `- aviso do exemplo no Pronto (não existe mais): ${aviso}`);
  const t1 = Date.now();
  await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
  if (await page.locator('#fluxo-confirma').isVisible()) {
    anotar(N, `- painel apareceu: ${await page.locator('#fluxo-confirma-texto').textContent()}`);
    await page.getByRole('button', { name: 'Mandar mesmo assim' }).click();
  }
  await expect.poll(() => page.evaluate(() => window.__partilhas.length), { timeout: 60_000 }).toBe(1);
  anotar(N, `- TEMPO mandar: ${Date.now() - t1} ms`);
  const env = await page.evaluate(() => window.__partilhas[0]);
  anotar(N, `- texto mandado: ${JSON.stringify(env)}`);
  expect(env!.texto).toContain(TITULO);
  expect(env!.texto).toContain(TEXTO);
  expect(env!.texto).toContain(ORGANIZACAO);
}

test.describe('C2 AND-FRACO 200%', () => {
  test.use({ ...APARELHOS['AND-FRACO'] });
  test('percurso completo, letra a 200%', async ({ page, erros }) => {
    await textoEm200(page);
    await percurso(page, 'a200');
    expect(erros).toEqual([]);
  });
  test('percurso completo, letra normal (base de comparação)', async ({ page, erros }) => {
    await percurso(page, 'a100');
    expect(erros).toEqual([]);
  });
});

test.describe('C2 toques errados, 200%', () => {
  test.use({ ...APARELHOS['AND-FRACO'] });
  test.beforeEach(async ({ page }) => {
    await textoEm200(page);
    await condicoes(page, { cpu: 6, rede: '3G-LENTO' });
  });

  async function abrir(page: Page) {
    await page.goto('./');
    await page.getByRole('link', { name: /Dar um aviso/ }).click();
    await expect(titulo(page)).toContainText('Passo 1 de 3');
  }

  test('Voltar em vez de Continuar, e o botão voltar do navegador', async ({ page }) => {
    await abrir(page);
    await page.locator('#fluxo-titulo').fill(TITULO);
    await page.locator('#fluxo-texto').fill(TEXTO);
    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(titulo(page)).toHaveText('O que você quer fazer?');
    await page.getByRole('link', { name: /Dar um aviso/ }).click();
    const t = await page.locator('#fluxo-titulo').inputValue();
    const x = await page.locator('#fluxo-texto').inputValue();
    anotar(N, `\n## toques errados\n- Voltar no passo 1 e reentrar: título="${t}" texto="${x}" -> ${t === TITULO && x === TEXTO ? 'GUARDOU' : 'PERDEU'}`);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(titulo(page)).toContainText('Passo 2 de 3');
    await page.goBack();
    await page.waitForTimeout(500);
    const h1 = await titulo(page).textContent();
    const t2 = await page.locator('#fluxo-titulo').inputValue().catch(() => '(sem campo)');
    anotar(N, `- page.goBack no passo 2: tela="${h1}" título="${t2}" -> ${t2 === TITULO ? 'GUARDOU' : 'PERDEU'}`);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Voltar' }).click();
    anotar(N, `- Voltar da barra no passo 2: tela="${await titulo(page).textContent()}" título="${await page.locator('#fluxo-titulo').inputValue()}"`);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(titulo(page)).toContainText('Passo 2 de 3');
    await page.reload();
    await page.waitForTimeout(800);
    const h2 = await titulo(page).textContent();
    const t3 = await page.locator('#fluxo-titulo').inputValue().catch(() => '(sem campo)');
    anotar(N, `- recarregar no passo 2: tela="${h2}" título="${t3}" url=${page.url().split('#')[1]} -> ${t3 === TITULO ? 'GUARDOU' : 'PERDEU'}`);
    await foto(page, `${N}-recarregar-passo2`);
  });

  test('Apagar tudo sem querer: dá para desfazer?', async ({ page }) => {
    await abrir(page);
    const ler = async () => ({ t: await page.locator('#fluxo-titulo').inputValue(), o: await page.locator('#fluxo-organizacao').inputValue(), x: await page.locator('#fluxo-texto').inputValue() });
    const apagar = page.locator('#fluxo-apagar');
    // Os campos começam vazios e o "Apagar tudo" fica escondido; ele só aparece quando há texto escrito.
    const vazio = await ler();
    const visivelVazio = await apagar.isVisible();
    await page.locator('#fluxo-titulo').fill(TITULO);
    await page.locator('#fluxo-organizacao').fill(ORGANIZACAO);
    await page.locator('#fluxo-texto').fill(TEXTO);
    const antes = await ler();
    const visivelComTexto = await apagar.isVisible();
    const rotuloComTexto = (await apagar.textContent())?.trim();
    let perguntou = false;
    page.removeAllListeners('dialog');
    page.on('dialog', (d) => {
      perguntou = true;
      void d.dismiss();
    });
    // Apaga tudo (um toque, sem pergunta) e vê se o botão vira "Desfazer".
    await apagar.click();
    const depois = await ler();
    const rotuloDepois = (await apagar.textContent())?.trim();
    const botoes = await page.getByRole('button').allTextContents();
    const desfazer = botoes.some((b) => /desfaz/i.test(b));
    const relogio = await apagar.locator('svg').count();
    const foco = await page.evaluate(() => document.activeElement?.id ?? document.activeElement?.tagName);
    await foto(page, `${N}-apagou`);
    // Desfazer devolve o que estava escrito?
    await apagar.click();
    const volta = await ler();
    const igual = JSON.stringify(volta) === JSON.stringify(antes);
    anotar(N, `\n## Apagar tudo\n- ao abrir (vazio): ${JSON.stringify(vazio)}, "Apagar tudo" visível? ${visivelVazio}\n- com texto: ${JSON.stringify(antes)}, botão visível? ${visivelComTexto} rótulo="${rotuloComTexto}"\n- depois de Apagar tudo: ${JSON.stringify(depois)}, perguntou antes? ${perguntou}, rótulo agora="${rotuloDepois}", ícone de relógio no botão: ${relogio}, foco em "${foco}"\n- botão Desfazer: ${desfazer}\n- depois de Desfazer: ${JSON.stringify(volta)} -> ${igual ? 'VOLTOU TUDO' : 'NÃO VOLTOU'}\n- botões: ${JSON.stringify(botoes)}`);
    const m = await medirAlvos(page);
    anotar(N, `- colados no passo 1 (200%): ${JSON.stringify(m.colados)}`);
  });

  test('Fazer outro em vez de Mudar algo no Pronto', async ({ page }) => {
    await abrir(page);
    await page.locator('#fluxo-titulo').fill(TITULO);
    await page.locator('#fluxo-texto').fill(TEXTO);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Ficou bom' }).click();
    await expect(titulo(page)).toContainText('Pronto!', { timeout: 60_000 });
    const dica = await page.locator('#fluxo-outro-dica').textContent();
    let perguntou = false;
    page.removeAllListeners('dialog');
    page.on('dialog', (d) => {
      perguntou = true;
      void d.dismiss();
    });
    await page.locator('#fluxo-outro').scrollIntoViewIfNeeded();
    const mudar = await page.locator('#fluxo-mudar').boundingBox();
    const outro = await page.locator('#fluxo-outro').boundingBox();
    await foto(page, `${N}-pronto-mudar-outro`);
    await page.locator('#fluxo-outro').click();
    await page.waitForTimeout(500);
    const naTela = await titulo(page).textContent();
    await page.getByRole('link', { name: /Dar um aviso/ }).click();
    const t = await page.locator('#fluxo-titulo').inputValue();
    anotar(N, `\n## Fazer outro\n- dica ao lado: "${dica}"\n- caixas Mudar/Outro: ${JSON.stringify({ mudar, outro })}\n- perguntou antes de apagar? ${perguntou}\n- depois: tela="${naTela}"; reabrindo aviso, título="${t}" -> ${t === TITULO ? 'GUARDOU' : 'PERDEU'}`);
    await page.goBack();
    await page.waitForTimeout(400);
    anotar(N, `- goBack depois de Fazer outro: tela="${await titulo(page).textContent()}"`);
  });

  test('miniatura e barra fixa em 200%', async ({ page }) => {
    await abrir(page);
    const info = await page.evaluate(() => ({ soltas: document.documentElement.classList.contains('fluxo-faixas-soltas'), vh: innerHeight }));
    anotar(N, `\n## faixas em 200%: ${JSON.stringify(info)}`);
    await camposTapados(page, 'toques errados passo 1 200%');
  });
});

test.describe('C2 zoom 400% numa tela de 1280', () => {
  // Aproximação: janela de 320 x 200 px CSS com deviceScaleFactor 4 (equivale ao zoom 400% de uma janela 1280 x 800).
  test.use({ ...APARELHOS['PC-1280'], viewport: { width: 320, height: 200 }, deviceScaleFactor: 4 });
  test('percurso a 400%', async ({ page, erros }) => {
    await condicoes(page, { cpu: 6, rede: '3G-LENTO' });
    await page.goto('./');
    await expect(titulo(page)).toHaveText('O que você quer fazer?');
    await medir(page, 'z400 início');
    await foto(page, 'c2-z400-0-inicio');
    await page.getByRole('link', { name: /Dar um aviso/ }).click();
    await expect(titulo(page)).toContainText('Passo 1 de 3');
    await medir(page, 'z400 passo 1');
    await camposTapados(page, 'z400 passo 1');
    await page.evaluate(() => scrollTo(0, 0));
    await foto(page, 'c2-z400-1-passo1');
    await page.locator('#fluxo-titulo').fill(TITULO);
    await page.locator('#fluxo-texto').fill(TEXTO);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(titulo(page)).toContainText('Passo 2 de 3');
    await medir(page, 'z400 passo 2');
    await foto(page, 'c2-z400-2-passo2');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(titulo(page)).toContainText('Passo 3 de 3');
    await page.waitForTimeout(500);
    await medir(page, 'z400 passo 3');
    await foto(page, 'c2-z400-3-passo3');
    await page.getByRole('button', { name: 'Ficou bom' }).click();
    await expect(titulo(page)).toContainText('Pronto!', { timeout: 60_000 });
    await page.waitForTimeout(500);
    await medir(page, 'z400 Pronto');
    await foto(page, 'c2-z400-4-pronto', true);
    const b = await page.getByRole('button', { name: 'Mandar no WhatsApp' }).boundingBox();
    anotar(N, `- z400 Mandar no WhatsApp caixa: ${JSON.stringify(b)}`);
    expect(erros).toEqual([]);
  });
});
