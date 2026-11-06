// Confere que o apoio da simulação funciona (aparelho, CDP, compartilhar ausente, árvore, medidas).

import { APARELHOS, arvore, condicoes, expect, foto, medirAlvos, rolagemLateral, test, titulo } from './apoio-sim';

test.use({ ...APARELHOS['AND-FRACO'], compartilhar: 'ausente' });

test('fumaça: início no AND-FRACO', async ({ page, erros, foraDoSite }) => {
  await condicoes(page, { cpu: 6, rede: '3G-LENTO' });
  const t0 = Date.now();
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  console.log('início em', Date.now() - t0, 'ms');
  expect(await page.evaluate(() => 'share' in navigator && typeof navigator.share)).not.toBe('function');
  const a = await arvore(page, 'fumaca-inicio');
  expect(a).toContain('heading');
  const m = await medirAlvos(page);
  console.log(JSON.stringify(m).slice(0, 600));
  expect(await rolagemLateral(page)).toBeLessThanOrEqual(0);
  await foto(page, 'fumaca-inicio');
  expect(erros).toEqual([]);
  console.log('fora do site:', foraDoSite);
});
