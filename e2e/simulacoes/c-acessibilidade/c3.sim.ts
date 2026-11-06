// C3 Paulo, 39, daltônico, coletivo de hip-hop (personagem fictício). Filtros de daltonismo por SVG/CSS (aproximação).
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { APARELHOS, anotar, expect, FOTOS, foto, guardar, test, titulo } from './apoio-sim';

const N = 'c3';
const TITULO = 'Batalha de rima na praça';
const ORG = 'Coletivo Cultural Ritmo da Rua';
const TEXTO = 'Sábado, a partir das 16h. Traga sua rima e sua turma.';
const PALETAS = ['papel', 'grafite', 'mar', 'areia', 'ameixa', 'nevoa'];

// Matrizes de Machado, Oliveira e Fernandes (2009), severidade 1,0 (dicromacia completa). Aproximação.
const MATRIZES: Record<string, string> = {
  deuteranopia: '0.367322 0.860646 -0.227968 0 0  0.280085 0.672501 0.047413 0 0  -0.011820 0.042940 0.968881 0 0  0 0 0 1 0',
  protanopia: '0.152286 1.052583 -0.204868 0 0  0.114503 0.786281 0.099216 0 0  -0.003882 -0.048116 1.051998 0 0  0 0 0 1 0',
  tritanopia: '1.255528 -0.076749 -0.178779 0 0  -0.078411 0.930809 0.147602 0 0  0.004733 0.691367 0.303900 0 0  0 0 0 1 0',
};
const FILTROS = Object.keys(MATRIZES);

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">${FILTROS.map(
  (f) => `<filter id="f-${f}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${MATRIZES[f]}"/></filter>`,
).join('')}</svg>`;

async function filtrar(page: Page, filtro: string | null) {
  await page.evaluate(
    ({ svg, filtro }) => {
      if (!document.getElementById('sim-filtros')) {
        const d = document.createElement('div');
        d.id = 'sim-filtros';
        d.innerHTML = svg;
        document.body.append(d);
      }
      document.documentElement.style.filter = filtro ? `url(#f-${filtro})` : '';
    },
    { svg: SVG, filtro },
  );
  await page.waitForTimeout(150);
}

async function aoPasso3(page: Page) {
  await page.goto('./');
  await page.getByRole('link', { name: /Dar um aviso/ }).click();
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  await page.locator('#fluxo-titulo').fill(TITULO);
  await page.locator('#fluxo-organizacao').fill(ORG);
  await page.locator('#fluxo-texto').fill(TEXTO);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 3 de 3');
  await page.waitForTimeout(500);
}

test.use({ ...APARELHOS['AND-GRANDE'] });

test('C3 passo 3 sob três filtros e informação só por cor', async ({ page, erros }) => {
  await aoPasso3(page);
  await page.locator("#fluxo-paleta-mar").click();
  await page.waitForTimeout(300);
  for (const f of [null, ...FILTROS]) {
    await filtrar(page, f);
    await foto(page, `${N}-passo3-${f ?? 'normal'}`);
  }
  await filtrar(page, null);
  // Estado escolhido: o ✓ e o anel existem?
  const marca = await page.evaluate(() => {
    const out: Record<string, unknown> = {};
    const radios = [...document.querySelectorAll<HTMLInputElement>('input[name="fluxo-paleta"]')];
    const esc = radios.find((r) => r.checked)!;
    const lab = esc.nextElementSibling as HTMLElement;
    const a = getComputedStyle(lab, '::after');
    const l = getComputedStyle(lab);
    out.escolhida = esc.value;
    out.depoisConteudo = a.content;
    out.selo = { w: a.width, fundo: a.backgroundColor, cor: a.color, fonte: a.fontSize };
    out.anel = { outline: l.outlineStyle + ' ' + l.outlineWidth, cor: l.outlineColor };
    out.naoEscolhidasComSelo = radios.filter((r) => !r.checked).some((r) => getComputedStyle(r.nextElementSibling as HTMLElement, '::after').content !== 'none');
    out.rotulosVisiveis = radios.map((r) => ({ id: r.value, texto: (r.nextElementSibling as HTMLElement).innerText.trim(), nomeSoLeitor: !!r.nextElementSibling!.querySelector('.fluxo-so-leitor') }));
    return out;
  });
  anotar(N, `\n## marca do estado escolhido (bolinhas)\n${JSON.stringify(marca, null, 1)}`);
  // As bolinhas lado a lado, cada uma recortada, sob cada filtro (para comparar)
  const caixa = await page.locator('.fluxo-bolas').boundingBox();
  anotar(N, `- caixa das bolinhas: ${JSON.stringify(caixa)}`);
  for (const f of [null, ...FILTROS]) {
    await filtrar(page, f);
    await page.screenshot({ path: join(FOTOS, `${N}-bolinhas-${f ?? 'normal'}.png`), clip: { x: caixa!.x - 8, y: caixa!.y - 8, width: caixa!.width + 16, height: caixa!.height + 16 } });
  }
  await filtrar(page, null);
  // Formato escolhido
  for (const f of [null, 'deuteranopia']) {
    await filtrar(page, f);
    const c = await page.locator('#fluxo-formato').boundingBox();
    await page.screenshot({ path: join(FOTOS, `${N}-formato-${f ?? 'normal'}.png`), clip: { x: c!.x, y: c!.y, width: c!.width, height: c!.height } });
  }
  await filtrar(page, null);
  expect(erros).toEqual([]);
});

test('C3 erro de campo e exemplo sob filtros', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: /Dar um aviso/ }).click();
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  for (const f of [null, ...FILTROS]) {
    await filtrar(page, f);
    await foto(page, `${N}-passo1-exemplo-${f ?? 'normal'}`);
  }
  await filtrar(page, null);
  await page.locator('#fluxo-titulo').fill('');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForTimeout(300);
  const erro = await page.evaluate(() => {
    const e = document.getElementById('fluxo-titulo-erro')!;
    const c = document.getElementById('fluxo-titulo')!;
    const s = getComputedStyle(e);
    const sc = getComputedStyle(c);
    return { texto: e.textContent, hidden: e.hidden, corTexto: s.color, borda: sc.borderTopWidth + ' ' + sc.borderTopStyle + ' ' + sc.borderTopColor, ariaInvalid: c.getAttribute('aria-invalid'), ariaDesc: c.getAttribute('aria-describedby') };
  });
  anotar(N, `\n## erro de campo (título vazio)\n${JSON.stringify(erro)}`);
  for (const f of [null, 'deuteranopia', 'protanopia']) {
    await filtrar(page, f);
    await foto(page, `${N}-erro-${f ?? 'normal'}`);
  }
  await filtrar(page, null);
  // Pronto com exemplo: aviso
  await page.locator('#fluxo-titulo').fill(TITULO);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Ficou bom' }).click();
  await expect(titulo(page)).toContainText('Pronto!');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
  await page.waitForTimeout(300);
  for (const f of [null, 'deuteranopia', 'tritanopia']) {
    await filtrar(page, f);
    await foto(page, `${N}-pronto-exemplo-${f ?? 'normal'}`);
  }
  await filtrar(page, null);
});

test('C3 baixar as 6 paletas e aplicar os filtros no PNG', async ({ page, context, erros }) => {
  await aoPasso3(page);
  const arquivos: string[] = [];
  for (const id of PALETAS) {
    await page.locator(`#fluxo-paleta-${id}`).click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Ficou bom' }).click();
    await expect(titulo(page)).toContainText('Pronto!', { timeout: 60_000 });
    await page.waitForTimeout(600);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Baixar a imagem' }).click()]);
    const destino = join(FOTOS, `${N}-card-${id}.png`);
    await dl.saveAs(destino);
    arquivos.push(destino);
    anotar(N, `- baixou ${id}: ${dl.suggestedFilename()}`);
    await page.getByRole('button', { name: 'Mudar algo', exact: true }).click();
    await expect(titulo(page)).toContainText('Passo 1 de 3');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(titulo(page)).toContainText('Passo 3 de 3');
    await page.waitForTimeout(300);
  }
  // Folha de contato: uma linha por paleta, quatro colunas (normal e três filtros).
  const folha = await context.newPage();
  const img = (a: string, f: string) =>
    `<div style="text-align:center"><img style="width:200px;filter:${f === 'normal' ? 'none' : `url(#f-${f})`}" src="data:image/png;base64,${readFileSync(a).toString('base64')}"><div style="font:12px sans-serif">${f}</div></div>`;
  for (const [i, a] of arquivos.entries()) {
    await folha.setViewportSize({ width: 960, height: 520 });
    await folha.setContent(`<body style="margin:8px;background:#888">${SVG}<div style="font:14px sans-serif;color:#fff">${PALETAS[i]}</div><div style="display:flex;gap:8px">${['normal', ...FILTROS].map((f) => img(a, f)).join('')}</div></body>`);
    await folha.waitForTimeout(300);
    await folha.screenshot({ path: join(FOTOS, `${N}-folha-${PALETAS[i]}.png`), fullPage: true });
  }
  await folha.close();
  expect(erros).toEqual([]);
});

test('C3 cor livre com pouco contraste', async ({ page }) => {
  await aoPasso3(page);
  await page.locator('details.fluxo-mais summary').click();
  for (const cor of ['#fafad2', '#ffff66', '#808080', '#777777', '#000000', '#ffffff']) {
    await page.locator('#fluxo-cor-livre').evaluate((el, c) => {
      (el as HTMLInputElement).value = c;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, cor);
    await page.waitForTimeout(1100);
    const msg = await page.locator('#fluxo-cor-msg').textContent();
    anotar(N, `- cor livre ${cor}: mensagem="${msg}" | role/status=${await page.locator('#fluxo-cor-msg').getAttribute('role')}`);
    await foto(page, `${N}-corlivre-${cor.slice(1)}`);
  }
  // O que a mensagem dá em termos de ação?
  const aviso = await page.locator('#fluxo-cor-aviso').textContent();
  anotar(N, `- aviso "cor livre" sob as bolinhas: "${aviso}" hidden=${await page.locator('#fluxo-cor-aviso').isHidden()}`);
  guardar('c3-fim.txt', 'ok');
});
