// A7 Bia, 16, grêmio estudantil. Conquista, no tablet e no celular deitado (com a altura que imita o teclado).
import { caminho, depois, medirFoco, medirMini, nota } from './a3a7-apoio';
import { cronometro, expect, foto, inspecionar, salvarPartilhado, test, titulo, tocar } from './sim';

const TITULO = 'Conseguimos a quadra coberta!';
const TEXTO = 'Depois de dois anos de pedidos, a obra vai começar. Obrigada a quem assinou o abaixo-assinado.';
const ORG = 'Grêmio Estudantil da escola estadual';

async function tudo(page: import('@playwright/test').Page, prefixo: string) {
  const cron = cronometro(`A7 Bia ${prefixo}`);
  const r = await caminho(page, { personagem: 'A7 Bia', prefixo, porta: 'Contar uma conquista', tituloDigitado: TITULO, textoDigitado: TEXTO, organizacao: ORG, medirFaixas: true, formato: 'Status' }, cron);
  nota('texto-whatsapp-conta', { prefixo, chars: [...r.texto].length, texto: r.texto });
  await salvarPartilhado(page, `${prefixo}-card.png`);
  await depois(page, prefixo, { titulo: TITULO, org: ORG });
}

test('A7 Bia: conquista no tablet @TABLET', async ({ page }) => {
  test.setTimeout(900_000);
  await tudo(page, 'a7tab');
});

test('A7 Bia: conquista deitada @AND-DEITADO', async ({ page }) => {
  test.setTimeout(900_000);
  await tudo(page, 'a7dei');
});

test('A7 Bia: teclado aberto (360x330) @AND-DEITADO', async ({ page }) => {
  test.setTimeout(900_000);
  await page.goto('./');
  await tocar(page.getByRole('link', { name: /Contar uma conquista/ }));
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  await page.setViewportSize({ width: 360, height: 330 }); // aproximação do teclado aberto
  await page.waitForTimeout(500);
  await foto(page, 'a7tec passo1 sem foco');
  await medirMini(page, 'a7tec passo 1');
  for (const id of ['fluxo-titulo', 'fluxo-organizacao', 'fluxo-texto']) {
    await medirFoco(page, page.locator('#' + id), `a7tec passo 1: ${id}`);
    await foto(page, `a7tec foco ${id}`);
  }
  await inspecionar(page, 'a7tec passo 1 teclado');
  await page.locator('#fluxo-titulo').fill('Conseguimos a quadra'); // o título começa vazio e é obrigatório
  await page.locator('#fluxo-texto').blur();
  await tocar(page.getByRole('button', { name: 'Continuar' }));
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await medirFoco(page, page.locator('#fluxo-data'), 'a7tec passo 2: dia');
  await medirMini(page, 'a7tec passo 2');
  await foto(page, 'a7tec passo2 foco dia');
  nota('a7tec-pular', { temPular: (await page.locator('#fluxo-pular').count()) > 0 });
  await tocar(page.getByRole('button', { name: 'Hoje' }));
  await page.locator('#fluxo-data').blur();
  await tocar(page.getByRole('button', { name: 'Continuar' }));
  await expect(titulo(page)).toContainText('Passo 3 de 3');
  await medirMini(page, 'a7tec passo 3');
  await foto(page, 'a7tec passo3');
  await inspecionar(page, 'a7tec passo 3 teclado');
});
