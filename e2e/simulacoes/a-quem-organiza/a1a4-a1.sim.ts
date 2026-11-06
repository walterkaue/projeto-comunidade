// A1 Dona Cida, 66, associação de moradores. Letra a 200%. Porta "Divulgar um evento", manda no Status.
import { expect, test, cronometro, copias, partilhas, registrar, salvarPartilhado, salvarTexto, tocar, titulo } from './sim';
import {
  analisarTexto,
  avisos,
  digitarComErro,
  digitar,
  esperarPasso,
  esperarPronto,
  estadoDoFluxo,
  medirFormatos,
  naTela,
  tela,
  toque,
  valores,
  vigiarAvisos,
} from './a1a4-apoio';

const TITULO_CERTO = 'Mutirao de limpeza da praca e do corrego do conjunto habitacional';
const TITULO_ERRADO = 'Mutirao de limpesa da praca e do corrego do conjunto habitacinal'; // "inal" apagado e refeito
const ORG = 'Associacao dos Moradores e Amigos do Conjunto Habitacional Jardim Esperanca II';

type Acao = 'normal' | 'webview' | 'cancela';

async function caminhoDaCida(page: import('@playwright/test').Page, acao: Acao, completo: boolean): Promise<void> {
  const cron = cronometro(`A1 Dona Cida (${acao})`);
  await vigiarAvisos(page);
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  cron.marca('inicio');
  await tela(page, 'inicio');

  const porta = page.getByRole('link', { name: /Divulgar um evento/ });
  registrar('alvo-porta', { caixa: await porta.boundingBox() });
  await toque(porta, 'porta Divulgar um evento');

  // ---- 1ª tentativa: só o exemplo ----
  await esperarPasso(page, 1);
  const ex = await valores(page, ['fluxo-titulo', 'fluxo-organizacao', 'fluxo-texto']);
  registrar('exemplo-visto', ex);
  cron.marca('passo1-abriu');
  await tela(page, 'passo1-exemplo');
  await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 1');
  await esperarPasso(page, 2);
  cron.marca('passo1-feito-sem-trocar');
  await toque(page.getByRole('button', { name: 'Próximo sábado' }), 'atalho Próximo sábado');
  registrar('dia-atalho', await valores(page, ['fluxo-data', 'fluxo-hora', 'fluxo-local']));
  await tela(page, 'passo2-exemplo');
  await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 2');
  await esperarPasso(page, 3);
  cron.marca('passo2-feito');
  registrar('formatos-passo3', { botoes: await medirFormatos(page) });
  await page.waitForTimeout(1500);
  await toque(page.locator('#fluxo-formato-status'), 'Status');
  await tela(page, 'passo3-status');
  await toque(page.getByRole('button', { name: 'Ficou bom' }), 'Ficou bom');
  await esperarPronto(page, true);
  cron.marca('pronto-1');
  await tela(page, 'pronto-com-exemplo');
  registrar('aviso-exemplo-pronto', { texto: await page.locator('#fluxo-aviso-exemplo').innerText().catch(() => '(sem)') });

  // O toque que ela faz achando que está tudo certo.
  const mandar = page.locator('#fluxo-mandar');
  await toque(mandar, 'Mandar no WhatsApp (1ª)');
  await expect(page.locator('#fluxo-confirma')).toBeVisible();
  registrar('painel-exemplo', {
    texto: await page.locator('#fluxo-confirma-texto').innerText(),
    botoes: await page.locator('#fluxo-confirma button').allInnerTexts(),
    posicao: await naTela(page.locator('#fluxo-confirma')),
    compartilhou: (await partilhas(page)).length,
  });
  await tela(page, 'painel-do-exemplo');

  // Mudar algo, pelo painel.
  await toque(page.locator('#fluxo-confirma-mudar'), 'Mudar algo (painel)');
  await esperarPasso(page, 1);
  cron.marca('mudar-algo-pelo-painel');
  registrar('apos-mudar-algo', await valores(page, ['fluxo-titulo', 'fluxo-organizacao', 'fluxo-texto']));
  await tela(page, 'passo1-depois-de-mudar-algo');

  // ---- 2ª tentativa: o dela, sem acento e com erro ----
  const t = await digitarComErro(page.locator('#fluxo-titulo'), TITULO_ERRADO, 4, 'ional');
  const o = await digitarComErro(page.locator('#fluxo-organizacao'), ORG, 2, 'II');
  await digitar(page.locator('#fluxo-texto'), 'Traga luvas e sacos. Havera lanche para todos.');
  registrar('digitado-passo1', { titulo: t, tituloOk: t === TITULO_CERTO, organizacao: o, orgLetras: [...o].length, orgDigitadaLetras: [...ORG].length });
  await tela(page, 'passo1-digitado');
  await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 1 (2ª)');
  await esperarPasso(page, 2);
  cron.marca('passo1-2a');
  registrar('erros-passo1', { erros: await page.locator('.campo-erro:not([hidden])').allInnerTexts() });

  await digitar(page.locator('#fluxo-local'), 'Praca central, em frente a escola');
  await page.locator('#fluxo-hora').fill('08:00');
  registrar('passo2-valores', await valores(page, ['fluxo-data', 'fluxo-hora', 'fluxo-local']));
  await tela(page, 'passo2-digitado');

  if (completo) {
    // Voltar do navegador no meio dos passos: o que se perde?
    await page.goBack();
    await esperarPasso(page, 1);
    registrar('goBack-passo2', { ...(await estadoDoFluxo(page)), campos: await valores(page, ['fluxo-titulo', 'fluxo-organizacao', 'fluxo-texto']) });
    await tela(page, 'goBack-no-passo2-cai-no-passo1');
    await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 1 (depois do goBack)');
    await esperarPasso(page, 2);
    registrar('passo2-depois-do-goBack', await valores(page, ['fluxo-data', 'fluxo-hora', 'fluxo-local']));
  }
  await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 2 (2ª)');
  await esperarPasso(page, 3);
  cron.marca('passo2-2a');
  registrar('passo3-marcado', { formato: await page.locator('input[name=fluxo-formato]:checked').getAttribute('value') });
  await tela(page, 'passo3-depois');
  await toque(page.getByRole('button', { name: 'Ficou bom' }), 'Ficou bom (2ª)');
  await esperarPronto(page, true);
  cron.marca('pronto-2');
  await tela(page, 'pronto-final');
  registrar('painel-na-2a', { aberto: await page.locator('#fluxo-confirma').isVisible(), aviso: await page.locator('#fluxo-aviso-exemplo').count() });
  registrar('estado-link', {
    estado: await page.locator('#fluxo-link-estado').innerText(),
    frase: await page.locator('#fluxo-aviso-link').innerText().catch(() => ''),
    linkVisivel: await page.locator('#fluxo-aviso-link').isVisible(),
  });

  // ---- o toque que manda de verdade ----
  const antes = Date.now();
  await toque(mandar, 'Mandar no WhatsApp (final)');
  if (await page.locator('#fluxo-confirma').isVisible()) await toque(page.locator('#fluxo-confirma-seguir'), 'Mandar mesmo assim');
  if (acao === 'normal' || acao === 'cancela') {
    await expect.poll(async () => (await partilhas(page)).length, { timeout: 90_000 }).toBeGreaterThan(0);
  } else {
    await expect.poll(async () => (await copias(page)).length, { timeout: 90_000 }).toBeGreaterThan(0);
  }
  registrar('toque-mandar', { ms: Date.now() - antes });
  cron.marca('mandar-no-whatsapp');
  await page.waitForTimeout(400);
  await tela(page, `depois-de-mandar-${acao}`);
  registrar('avisos-ao-mandar', { avisos: await avisos(page), partilhas: await partilhas(page), copias: await copias(page) });

  if (acao === 'normal') {
    const p = (await partilhas(page)).at(-1)!;
    salvarTexto('whatsapp.txt', p.texto);
    registrar('texto-whatsapp', { ...analisarTexto(p.texto), arquivos: p.arquivos, nomes: p.nomes, titulo: p.titulo, texto: p.texto });
    registrar('png', { caminho: await salvarPartilhado(page, 'card.png') });
  }

  if (acao === 'webview') {
    const copiado = (await copias(page)).at(-1) ?? '';
    salvarTexto('whatsapp-webview.txt', copiado);
    registrar('texto-webview', analisarTexto(copiado));
    // Baixar a imagem: o download não acontece neste navegador.
    const n = (await avisos(page)).length;
    await toque(page.locator('#fluxo-baixar'), 'Baixar a imagem');
    await page.waitForTimeout(1500);
    const novos = (await avisos(page)).slice(n);
    registrar('baixar-webview', { avisos: novos, downloadsBarrados: await page.evaluate(() => window.__downloadsBarrados) });
    await tela(page, 'depois-de-baixar-webview');
    const m = (await avisos(page)).length;
    await toque(page.locator('#fluxo-copiar-texto'), 'Copiar só o texto');
    await page.waitForTimeout(800);
    registrar('copiar-texto-webview', { avisos: (await avisos(page)).slice(m) });
  }

  if (acao === 'cancela') {
    registrar('apos-cancelar', { avisos: await avisos(page), visivel: await page.locator('#aviso-vivo').innerText(), partilhas: await partilhas(page) });
    await tela(page, 'depois-de-cancelar');
    // Tenta de novo.
    await toque(mandar, 'Mandar no WhatsApp (de novo)');
    await expect.poll(async () => (await partilhas(page)).length, { timeout: 60_000 }).toBeGreaterThan(1);
    registrar('apos-tentar-de-novo', { partilhas: (await partilhas(page)).length, avisos: await avisos(page) });
  }

  if (!completo) return;

  // ---- Voltar do navegador no Pronto ----
  await page.goBack();
  await page.waitForTimeout(800);
  registrar('goBack-pronto', { ...(await estadoDoFluxo(page)) });
  await tela(page, 'goBack-no-pronto');
  if (!(await page.url()).includes('/pronto')) {
    // Se caiu num passo, volta ao Pronto pelos botões (mesmos dados?).
    registrar('goBack-pronto-campos', await valores(page, ['fluxo-titulo', 'fluxo-organizacao', 'fluxo-local']));
    await page.goForward();
    await page.waitForTimeout(800);
    registrar('goForward-pronto', { ...(await estadoDoFluxo(page)) });
    await tela(page, 'goForward-no-pronto');
  }

  // ---- Mudar algo (o de baixo): o que fica? ----
  if (await page.locator('#fluxo-mudar').count()) {
    await toque(page.locator('#fluxo-mudar'), 'Mudar algo (de baixo)');
    await esperarPasso(page, 1);
    registrar('mudar-algo-final', await valores(page, ['fluxo-titulo', 'fluxo-organizacao', 'fluxo-texto']));
    await tela(page, 'passo1-depois-do-mudar-algo-final');
    await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 1 (3ª)');
    await esperarPasso(page, 2);
    registrar('mudar-algo-final-passo2', await valores(page, ['fluxo-data', 'fluxo-hora', 'fluxo-local']));
    await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 2 (3ª)');
    await esperarPasso(page, 3);
    registrar('mudar-algo-final-passo3', { formato: await page.locator('input[name=fluxo-formato]:checked').getAttribute('value') });
    await toque(page.getByRole('button', { name: 'Ficou bom' }), 'Ficou bom (3ª)');
    await esperarPronto(page, true);
  }

  // ---- Fazer outro ----
  await toque(page.locator('#fluxo-outro'), 'Fazer outro');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  cron.marca('fazer-outro');
  await tela(page, 'inicio-depois-de-fazer-outro');
  await toque(page.getByRole('link', { name: /Divulgar um evento/ }), 'porta evento (2ª vez)');
  await esperarPasso(page, 1);
  const novoEx = await valores(page, ['fluxo-titulo', 'fluxo-organizacao', 'fluxo-texto']);
  registrar('depois-de-fazer-outro', { ...novoEx, apagouTudo: novoEx['fluxo-titulo'] !== TITULO_CERTO });
  await tela(page, 'passo1-depois-de-fazer-outro');
}

test.describe('Dona Cida, letra 200%', () => {
  test.use({ letra200: true });
  test('A1 Dona Cida: caminho inteiro @AND-FRACO', async ({ page }) => {
    test.setTimeout(600_000);
    await caminhoDaCida(page, 'normal', true);
  });
});

test.describe('Dona Cida, navegador de dentro do WhatsApp', () => {
  test.use({ letra200: true });
  test('A1 Dona Cida: dentro do WhatsApp sem menu e sem download @WEBVIEW', async ({ page }) => {
    test.setTimeout(600_000);
    await caminhoDaCida(page, 'webview', false);
  });
});

test.describe('Dona Cida fecha o menu de compartilhar', () => {
  test.use({ letra200: true, compartilhar: 'cancela' });
  test('A1 Dona Cida: fecha o menu sem escolher @AND-FRACO', async ({ page }) => {
    test.setTimeout(600_000);
    await caminhoDaCida(page, 'cancela', false);
  });
});

// tocar só para não deixar o import sem uso em caso de ajuste.
void tocar;
