// Fumaça: a base da simulação funciona em cada aparelho (abre o início, inspeciona, tira foto).
import { APARELHOS } from './aparelhos';
import { expect, foto, inspecionar, test, titulo } from './sim';

for (const nome of Object.keys(APARELHOS)) {
  test(`fumaça @${nome}`, async ({ page }) => {
    await page.goto('./');
    await expect(titulo(page)).toHaveText('O que você quer fazer?');
    await inspecionar(page, 'início');
    await foto(page, 'início');
  });
}
