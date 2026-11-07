// Cenário 7: o que precisa aparecer sem rolar em 360 × 640, nas cinco portas (docs/produto.md 7.6 e seção 3,
// 06/11/2026): o primeiro campo do passo 1, as escolhas do passo 3 e o "Mandar no WhatsApp" do Pronto, que é o
// único botão escuro ("Fazer a ata" é secundário). Com texto a 200% nada disso cabe numa tela só; ali o teste
// confere que cada item, ao rolar até ele, fica inteiro à vista, sem nenhuma faixa fixa por cima.

import type { Locator, Page } from '@playwright/test';
import { abrirPorta, conferirTela, esperarOPronto, expect, PORTAS, test, titulo } from './apoio';
import { DADOS, preencherObrigatoriosVazios } from './fluxo-apoio';

interface Caixa {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const caixa = (l: Locator): Promise<Caixa> =>
  l.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
  });

/** A parte da tela que as faixas fixas (miniatura em cima, barra embaixo) deixam livre, e a rolagem. */
const areaLivre = (page: Page) =>
  page.evaluate(() => {
    const fixa = (sel: string): DOMRect | undefined => {
      const el = document.querySelector(sel);
      return el && getComputedStyle(el).position === 'sticky' ? el.getBoundingClientRect() : undefined;
    };
    return {
      topo: fixa('.fluxo-mini')?.bottom ?? 0,
      base: fixa('.fluxo-barra')?.top ?? window.innerHeight,
      largura: document.documentElement.clientWidth,
      rolagem: window.scrollY,
    };
  });

/**
 * O item está inteiro na parte livre da tela. `semRolar`: e na primeira tela, sem a pessoa ter rolado nada.
 * Sem `semRolar`, rola até ele antes (como a pessoa faria).
 */
async function inteiroATela(page: Page, item: Locator, nome: string, semRolar: boolean): Promise<void> {
  await expect(item, nome).toBeVisible();
  if (!semRolar) {
    await item.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(50);
  }
  const area = await areaLivre(page);
  const c = await caixa(item);
  if (semRolar) expect(area.rolagem, `${nome}: a tela não devia estar rolada`).toBe(0);
  expect(c.top, `${nome}: começa embaixo da faixa de cima`).toBeGreaterThanOrEqual(area.topo - 0.5);
  expect(c.bottom, `${nome}: termina acima da barra (ou do fim da tela)`).toBeLessThanOrEqual(area.base + 0.5);
  expect(c.left).toBeGreaterThanOrEqual(-0.5);
  expect(c.right).toBeLessThanOrEqual(area.largura + 0.5);
}

/** Texto a 200%: tudo no site é medido em rem, como no aparelho com a letra grande. */
async function textoEm200(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const aplicar = () => document.documentElement.style.setProperty('font-size', '200%');
    if (document.documentElement) aplicar();
    else document.addEventListener('DOMContentLoaded', aplicar);
  });
}

// Nos dois modos (claro e escuro) a 100%; a 200%, no claro (o escuro só troca cores, não tamanhos).
const CASOS = [
  { escala: 100, esquema: 'light' },
  { escala: 100, esquema: 'dark' },
  { escala: 200, esquema: 'light' },
] as const;

for (const { escala, esquema } of CASOS) {
  const semRolar = escala === 100;
  test.describe(`primeira tela, texto a ${escala}%, modo ${esquema === 'dark' ? 'escuro' : 'claro'}`, () => {
    for (const porta of PORTAS) {
      test(`${porta.verbo}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: esquema });
        if (escala === 200) await textoEm200(page);
        await abrirPorta(page, porta);
        await page.waitForTimeout(200);
        const letra = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
        expect(letra, 'tamanho do texto').toBe(escala === 200 ? '32px' : '16px');
        // Texto grande: a miniatura e a barra somam mais de 40% da tela e soltam.
        if (escala === 200) await expect(page.locator('html')).toHaveClass(/fluxo-faixas-soltas/);
        else await expect(page.locator('html')).not.toHaveClass(/fluxo-faixas-soltas/);

        // 1. Passo 1: o primeiro campo inteiro; a dica e "Apagar tudo" (só com texto escrito) na mesma linha.
        await inteiroATela(page, page.locator('.campo:has(#fluxo-titulo)'), 'passo 1: campo do título', semRolar);
        const dica = page.locator('.fluxo-dica-linha .fluxo-dica');
        const apagar = page.getByRole('button', { name: 'Apagar tudo' });
        await expect(dica).toHaveText('Escreva com as suas palavras. O que está em cinza é só exemplo.');
        await expect(apagar).toBeHidden();
        await page.locator('#fluxo-titulo').fill(DADOS.titulo);
        await expect(apagar).toBeVisible();
        if (semRolar) {
          const [cd, ca] = [await caixa(dica), await caixa(apagar)];
          expect(ca.top < cd.bottom && cd.top < ca.bottom, 'a dica e "Apagar tudo" na mesma linha').toBe(true);
        }
        if (porta.tipo === 'reuniao') {
          // O aviso do link fica num quadro logo acima da pauta, com o mesmo texto, e é lido junto com ela e com o título.
          const aviso = page.locator('#fluxo-aviso-do-link');
          await expect(aviso).toHaveText(
            /^\s*Título, local e pauta vão no link\.\s+Quem receber pode repassar\. Não escreva nome de pessoa nem assunto que só o grupo pode saber\.\s*$/,
          );
          await expect(aviso.locator('strong')).toHaveText('Título, local e pauta vão no link.');
          await expect(page.locator('#fluxo-aviso-do-link + .campo:has(#fluxo-pauta)')).toHaveCount(1);
          await expect(page.locator('#fluxo-pauta')).toHaveAttribute('aria-describedby', /^fluxo-aviso-do-link /);
          await expect(page.locator('#fluxo-titulo')).toHaveAttribute('aria-describedby', /fluxo-aviso-do-link/);
        }
        if (escala === 200 || esquema === 'dark') await conferirTela(page, `${porta.tipo}: passo 1 (${escala}%, ${esquema})`);

        await preencherObrigatoriosVazios(page, porta, 1);
        await page.getByRole('button', { name: 'Continuar' }).click();
        await expect(titulo(page)).toContainText('Passo 2 de 3');
        await preencherObrigatoriosVazios(page, porta, 2);
        await page.getByRole('button', { name: 'Continuar' }).click();
        await expect(titulo(page)).toContainText('Passo 3 de 3');
        await page.waitForTimeout(200);

        // 2. Passo 3: "Onde vai mandar?" e a cor acima da barra; prévia de no máximo 40% da tela, com "Ver maior".
        await inteiroATela(page, page.locator('#fluxo-formato'), 'passo 3: Onde vai mandar?', semRolar);
        await inteiroATela(page, page.locator('#fluxo-cor'), 'passo 3: cor', semRolar);
        const previa = await page.locator('#fluxo-canvas').evaluate((el) => el.getBoundingClientRect().height / window.innerHeight);
        expect(previa, 'a prévia ocupa no máximo 40% da altura').toBeLessThanOrEqual(0.4);
        const verMaior = page.getByRole('button', { name: 'Ver a prévia maior' });
        await verMaior.click();
        const dialogo = page.getByRole('dialog', { name: 'Como está ficando' });
        await expect(dialogo).toBeVisible();
        await page.getByRole('button', { name: 'Fechar a prévia' }).click();
        await expect(dialogo).toBeHidden();
        await expect(verMaior).toBeFocused();
        await verMaior.click();
        await expect(dialogo).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(dialogo).toBeHidden();
        await expect(verMaior).toBeFocused();
        if (escala === 200 || esquema === 'dark') await conferirTela(page, `${porta.tipo}: passo 3 (${escala}%, ${esquema})`);

        await page.getByRole('button', { name: 'Ficou bom' }).click();
        await esperarOPronto(page, porta);
        await page.waitForTimeout(200);

        // 3. Pronto: título, "Mandar no WhatsApp" e só depois a prévia.
        const mandar = page.getByRole('button', { name: 'Mandar no WhatsApp' });
        await inteiroATela(page, mandar, 'Pronto: Mandar no WhatsApp', semRolar);
        const ordem = await page.evaluate(() =>
          ['h1', '#fluxo-mandar', '#fluxo-canvas'].map((s) => {
            const el = document.querySelector(s)!;
            return [...document.querySelectorAll('h1, #fluxo-mandar, #fluxo-canvas')].indexOf(el);
          }),
        );
        expect(ordem, 'título, Mandar no WhatsApp, prévia').toEqual([0, 1, 2]);

        // 4. Só "Mandar no WhatsApp" é escuro; "Fazer a ata" (reunião) é de contorno.
        const escuros = await page.evaluate(() => {
          const fundo = getComputedStyle(document.querySelector('#fluxo-mandar')!).backgroundColor;
          return [...document.querySelectorAll<HTMLElement>('button, a')]
            .filter((el) => el.offsetParent !== null && getComputedStyle(el).backgroundColor === fundo)
            .map((el) => el.textContent?.trim());
        });
        expect(escuros, 'botões escuros no Pronto').toEqual(['Mandar no WhatsApp']);
        if (escala === 200 || esquema === 'dark') await conferirTela(page, `${porta.tipo}: Pronto (${escala}%, ${esquema})`);
      });
    }
  });
}

test('320 px: as seis cores ficam lado a lado, com o nome inteiro, e a tela não rola para o lado', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await abrirPorta(page, PORTAS[2]);
  await page.locator('#fluxo-titulo').fill(DADOS.titulo);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 3 de 3');
  const itens = await page.locator('.fluxo-bola-item').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      const nome = el.querySelector('.fluxo-bola-nome')!;
      return { top: Math.round(r.top), right: r.right, sobra: nome.scrollWidth - nome.clientWidth };
    }),
  );
  expect(itens).toHaveLength(6);
  expect(new Set(itens.map((i) => i.top)).size, 'as seis na mesma linha').toBe(1);
  expect(Math.max(...itens.map((i) => i.right))).toBeLessThanOrEqual(320);
  const largura = await page.evaluate(() => ({ p: document.documentElement.scrollWidth, t: document.documentElement.clientWidth }));
  expect(largura.p).toBeLessThanOrEqual(largura.t);
});
