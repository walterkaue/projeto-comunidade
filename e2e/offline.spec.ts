// Cenário 6: depois da primeira visita, sem rede, o início, o fluxo e a ata abrem (service worker).

import { abrirPorta, conferirTela, expect, irAteOPronto, PORTAS, test, titulo } from './apoio';

test.use({ serviceWorkers: 'allow' });

test('sem rede depois da primeira visita: início, fluxo e ata abrem', async ({ page, context }) => {
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  // A instalação do service worker só termina depois de guardar o app inteiro.
  await page.evaluate(async () => {
    const r = await navigator.serviceWorker.ready;
    if (!r.active) throw new Error('service worker sem ativar');
  });

  await context.setOffline(true);

  await page.reload();
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  await conferirTela(page, 'início sem rede');

  const aviso = PORTAS[2];
  await abrirPorta(page, aviso);
  await irAteOPronto(page, aviso);

  await page.goto('./#/ata');
  await expect(titulo(page)).toHaveText('Depois da reunião: a ata');
  await conferirTela(page, 'ata sem rede');
});
