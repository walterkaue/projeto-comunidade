// Cenário 5: a ata. Preencher, imprimir (só confere que a folha de impressão aparece) e apagar.

import { conferirTela, expect, test, titulo } from './apoio';

test('ata: preencher, imprimir e apagar', async ({ page }) => {
  await page.goto('./#/ata');
  await expect(titulo(page)).toHaveText('Depois da reunião: a ata');
  await conferirTela(page, 'ata vazia');

  await page.getByLabel('Organização').fill('Coletivo Cultural Beira-Rio');
  await page.getByLabel('Data').fill('2026-11-14');
  await page.getByLabel('Presentes').fill('Pessoa Um\nPessoa Dois');
  await page.getByLabel('Ponto 1: assunto').fill('Festa junina');
  await page.getByLabel('Ponto 1: o que foi decidido').fill('A festa será no dia 20.');

  await page.getByRole('button', { name: 'Ver a ata pronta' }).click();
  const folha = page.getByRole('article', { name: 'Ata pronta' });
  await expect(folha).toContainText('Coletivo Cultural Beira-Rio');
  await expect(folha).toContainText('Festa junina');
  await expect(folha).toContainText('A festa será no dia 20.');
  await conferirTela(page, 'ata pronta');

  await page.getByRole('button', { name: 'Imprimir ou salvar em PDF' }).click();
  await expect.poll(() => page.evaluate(() => window.__impressoes)).toBe(1);
  await page.emulateMedia({ media: 'print' });
  await expect(folha).toBeVisible();
  await expect(page.getByRole('button', { name: 'Imprimir ou salvar em PDF' })).toBeHidden();
  await page.emulateMedia({ media: 'screen' });

  await page.getByRole('button', { name: 'Apagar a ata' }).click();
  await expect(page.getByLabel('Organização')).toHaveValue('');
  await expect(page.getByLabel('Ponto 1: assunto')).toHaveValue('');
  await expect(folha).toHaveCount(0);
});
