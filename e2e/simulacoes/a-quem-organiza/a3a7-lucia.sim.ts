// A3 Pastora Lúcia, 52, igreja de bairro, iPhone SE. Evento com título em caixa alta, emoji e quebra de linha, para um Grupo.
import { caminho, depois, digitar, nota } from './a3a7-apoio';
import { cronometro, expect, foto, salvarPartilhado, test, titulo, tocar } from './sim';

const TITULO = 'CULTO DE ACAO DE GRACAS E BAZAR BENEFICENTE 🙏🎉';
const TEXTO = 'Venha com sua família 🙏\nTeremos roupas, livros e bolo 🎉😊';
const ORG = 'Igreja do bairro';

test.describe('sim, menu de compartilhar com arquivo', () => {
  test('A3 Lúcia: caminho inteiro com emoji @IPHONE-SE', async ({ page }) => {
  test.setTimeout(900_000);
    const cron = cronometro('A3 Lúcia');
    const r = await caminho(page, { personagem: 'A3 Lúcia', prefixo: 'a3', porta: 'Divulgar um evento', tituloDigitado: TITULO, textoDigitado: TEXTO, organizacao: ORG, formato: 'Grupo' }, cron);
    nota('texto-whatsapp-conta', { chars: [...r.texto].length, utf16: r.texto.length, quebras: (r.texto.match(/\n/g) ?? []).length, temEmojiDoTexto: r.texto.includes('🎉😊'), temQuebraDoTexto: r.texto.includes('\n') });
    const png = await salvarPartilhado(page, 'a3-card-grupo.png');
    nota('png', { png });
    await depois(page, 'a3', { titulo: TITULO, org: ORG });
  });
});

test.describe('sem arquivo (iOS recusa arquivo com texto)', () => {
  test.use({ compartilhar: 'sem-arquivo' });
  test('A3 Lúcia: menu sem arquivo @IPHONE-SE', async ({ page }) => {
  test.setTimeout(900_000);
    const cron = cronometro('A3 Lúcia sem-arquivo');
    const r = await caminho(page, { personagem: 'A3 Lúcia', prefixo: 'a3sa', porta: 'Divulgar um evento', tituloDigitado: TITULO, textoDigitado: TEXTO, organizacao: ORG, formato: 'Grupo' }, cron);
    const falado = await page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((e) => e.textContent));
    nota('sem-arquivo-resultado', { texto: r.texto, falado, linkEstado: await page.locator('#fluxo-link-estado').textContent(), baixarVisivel: await page.locator('#fluxo-baixar').isVisible() });
    await foto(page, 'a3sa depois de mandar sem arquivo');
    await expect(titulo(page)).toContainText('Pronto!');
  });
});

test('A3 Lúcia: limite com emoji no título @IPHONE-SE', async ({ page }) => {
  test.setTimeout(900_000);
  await page.goto('./');
  await tocar(page.getByRole('link', { name: /Divulgar um evento/ }));
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  const campo = page.locator('#fluxo-titulo');
  // 45 emojis: o limite é 80 "letras"; o campo (maxlength) conta em unidades de 2 bytes
  await digitar(campo, '🙏'.repeat(45));
  const v = await campo.inputValue();
  nota('limite-emoji', { digitados: 45, ficaram: [...v].length, utf16: v.length, maxlengthAttr: await campo.getAttribute('maxlength') });
  // 45 letras + 20 emojis = 85 letras, 105 unidades
  await digitar(campo, 'A'.repeat(70) + '🙏'.repeat(8));
  const v2 = await campo.inputValue();
  nota('limite-misto', { esperado: 78, ficaram: [...v2].length, utf16: v2.length });
  await digitar(campo, 'A'.repeat(60) + '🙏'.repeat(15));
  const v3 = await campo.inputValue();
  nota('limite-misto-2', { digitados: 75, ficaram: [...v3].length, utf16: v3.length });
  await foto(page, 'a3 limite emoji');
  await tocar(page.getByRole('button', { name: 'Continuar' }));
  nota('limite-continuar', { titulo: (await titulo(page).textContent())?.replace(/\s+/g, ' '), erro: await page.locator('#fluxo-titulo-erro').textContent().catch(() => null) });
  // contador de letras? procura texto "letras" na tela
  const dica = await page.locator('main').innerText();
  nota('contador-visivel', { temContador: /\d+\s*(\/|de)\s*\d+|restam|letras/i.test(dica) });
});
