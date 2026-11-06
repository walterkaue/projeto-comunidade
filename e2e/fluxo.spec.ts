// Cenários 1 e 2: as cinco portas com o exemplo, e a reunião com a organização trocada.

import { abrirPorta, conferirTela, expect, irAteOPronto, linkNoTexto, mandar, ORGANIZACAO, partilhas, PORTAS, test, titulo } from './apoio';

test.describe('as cinco portas com o exemplo', () => {
  for (const porta of PORTAS) {
    test(`${porta.verbo}: pede confirmação e não cria link`, async ({ page }) => {
      await abrirPorta(page, porta, true);
      await irAteOPronto(page, porta, true);

      if (porta.agenda) {
        await expect(page.locator('#fluxo-link-estado')).toHaveText('O link é criado quando você trocar o exemplo pelo seu.');
      }
      await expect(page.getByRole('button', { name: 'Copiar o link' })).toBeHidden();
      await expect(page.locator('#fluxo-aviso-exemplo')).toContainText('ainda');

      // O primeiro toque só abre o painel: nada é mandado ainda.
      await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
      const painel = page.locator('#fluxo-confirma');
      await expect(painel).toBeVisible();
      await expect(painel).toContainText('Isto ainda tem partes do exemplo');
      await expect(painel.getByRole('button', { name: 'Mudar algo' })).toBeFocused();
      expect(await partilhas(page)).toEqual([]);
      await conferirTela(page, `${porta.tipo}: painel do exemplo`);

      await page.getByRole('button', { name: 'Mandar mesmo assim' }).click();
      await expect.poll(async () => (await partilhas(page)).length).toBe(1);
      const [enviado] = await partilhas(page);
      expect(enviado!.arquivos).toBe(1);
      expect(enviado!.texto).not.toContain('#/evento/');
      expect(linkNoTexto(enviado!.texto)).toBe('');
    });
  }
});

test('reunião com a organização trocada: aviso, link, QR e ponte para a ata', async ({ page }) => {
  const reuniao = PORTAS[0];
  await abrirPorta(page, reuniao);

  await expect(page.getByText('Título, local e pauta vão no link do convite')).toBeVisible();
  const pauta = (await page.locator('#fluxo-pauta').inputValue()).split('\n').filter(Boolean);
  expect(pauta.length).toBeGreaterThan(0);
  await page.locator('#fluxo-organizacao').fill(ORGANIZACAO);

  await irAteOPronto(page, reuniao);

  await expect(page.locator('#fluxo-link-estado')).toHaveText('');
  await expect(page.getByRole('button', { name: 'Copiar o link' })).toBeVisible();
  await expect(page.locator('#fluxo-aviso-link')).toBeVisible();
  await expect(page.locator('#fluxo-aviso-qr')).toHaveText('O QR do cartaz abre a pauta inteira.');
  await expect(page.locator('#fluxo-aviso-qr')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver a página do evento' })).toBeVisible();
  await conferirTela(page, 'reunião: Pronto com link');

  const texto = await mandar(page);
  const link = linkNoTexto(texto);
  expect(link).toMatch(/^http:\/\/localhost:\d+\/#\/evento\/[A-Za-z0-9_-]+$/);
  expect(texto).toContain(ORGANIZACAO);
  for (const item of pauta) expect(texto).toContain(item);

  // Ponte para a ata: a ata começa com a pauta e com a organização.
  await page.getByRole('button', { name: 'Fazer a ata' }).click();
  await expect(page).toHaveURL(/#\/ata$/);
  await expect(titulo(page)).toHaveText('Depois da reunião: a ata');
  await expect(page.getByLabel('Organização')).toHaveValue(ORGANIZACAO);
  for (const [i, item] of pauta.entries()) {
    await expect(page.locator(`[id="ata-pontos-${i}-titulo"]`)).toHaveValue(item);
  }
  await conferirTela(page, 'ata vinda da reunião');
});
