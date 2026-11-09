// A4 Mãe Iara, 58, terreiro. Aparelho pequeno (320×568). Evento em casa, depois "Agradecer". E um passeio pelos exemplos.
import { preencherObrigatoriosVazios } from '../obrigatorios';
import { expect, test, cronometro, partilhas, registrar, salvarPartilhado, salvarTexto, titulo, baixarPor } from './sim';
import {
  analisarTexto,
  avisos,
  digitar,
  esperarPasso,
  esperarPronto,
  exemplosEmCinza,
  estadoDoFluxo,
  medirFormatos,
  tela,
  toque,
  valores,
  vigiarAvisos,
} from './a1a4-apoio';

const LOCAL = 'Rua das Palmeiras, 120, fundos, Vila Nova';
const LOCAL_COM_NOME = 'Casa da Mãe Iara, Rua das Palmeiras, 120, fundos, Vila Nova';

test('A4 Mãe Iara: festa de caruru e depois agradecer @AND-PEQUENO', async ({ page }) => {
  test.setTimeout(600_000);
  const cron = cronometro('A4 Mãe Iara (evento)');
  await vigiarAvisos(page);
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  cron.marca('inicio');
  await tela(page, 'inicio', true);
  await toque(page.getByRole('link', { name: /Divulgar um evento/ }), 'porta evento');

  // ---- passo 1 ----
  await esperarPasso(page, 1);
  registrar('exemplo-visto', await exemplosEmCinza(page, ['fluxo-titulo', 'fluxo-organizacao', 'fluxo-texto']));
  registrar('valores-ao-abrir', await valores(page, ['fluxo-titulo', 'fluxo-organizacao', 'fluxo-texto']));
  await tela(page, 'passo1-vazio');
  // Os campos vêm vazios: o "Apagar tudo" ainda está escondido e só aparece depois de escrever.
  const apagarAntes = await page.locator('#fluxo-apagar').isVisible();
  await digitar(page.locator('#fluxo-titulo'), 'Festa de caruru para Cosme e Damião');
  registrar('apagar-tudo', { visivelAntes: apagarAntes, visivelDepois: await page.locator('#fluxo-apagar').isVisible(), rotulo: await page.locator('#fluxo-apagar').innerText() });
  await digitar(page.locator('#fluxo-organizacao'), 'Ilê Axé Flor do Dendê');
  await digitar(page.locator('#fluxo-texto'), 'Caruru, samba de roda e muito axé');
  await tela(page, 'passo1-digitado');
  await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 1');
  await esperarPasso(page, 2);
  cron.marca('passo1');

  // ---- passo 2: a dica do local; o nome de quem mora ----
  const dicas = await page.locator('.campo-dica, .fluxo-dica, .fluxo-nota, .fluxo-quadro').allInnerTexts();
  registrar('dicas-passo2-evento', { dicas, temDicaNomeDeQuemMora: dicas.some((d) => /nome de quem mora/i.test(d)) });
  await toque(page.getByRole('button', { name: 'Próximo sábado' }), 'Próximo sábado');
  await page.locator('#fluxo-hora').fill('19:00');
  await digitar(page.locator('#fluxo-local'), LOCAL_COM_NOME);
  await tela(page, 'passo2-com-nome-na-casa');
  // Voltar do navegador no meio dos passos.
  await page.goBack();
  await esperarPasso(page, 1);
  registrar('goBack-passo2', { ...(await estadoDoFluxo(page)), campos: await valores(page, ['fluxo-titulo', 'fluxo-organizacao', 'fluxo-texto']) });
  await tela(page, 'goBack-no-passo2');
  await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 1 (depois do goBack)');
  await esperarPasso(page, 2);
  registrar('passo2-depois-do-goBack', await valores(page, ['fluxo-data', 'fluxo-hora', 'fluxo-local']));
  await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 2 com nome na casa');
  await page.waitForTimeout(500);
  registrar('local-com-nome', {
    passou: (await estadoDoFluxo(page)).hash.endsWith('/3'),
    erros: await page.locator('.campo-erro:not([hidden])').allInnerTexts(),
    avisos: await avisos(page),
  });
  await esperarPasso(page, 3);
  await tela(page, 'passo3-com-nome-na-casa');
  // Ela percebe e volta para tirar o nome (botão Voltar do site).
  await toque(page.locator('#fluxo-voltar'), 'Voltar (site)');
  await esperarPasso(page, 2);
  await digitar(page.locator('#fluxo-local'), LOCAL);
  registrar('passo2-valores', await valores(page, ['fluxo-data', 'fluxo-hora', 'fluxo-local']));
  await tela(page, 'passo2-corrigido');
  await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 2');
  await esperarPasso(page, 3);
  cron.marca('passo2');

  // ---- passo 3 ----
  registrar('formatos-passo3', { botoes: await medirFormatos(page) });
  await page.waitForTimeout(1500);
  await toque(page.locator('#fluxo-formato-status'), 'Status');
  await tela(page, 'passo3-status');
  for (const f of ['conversa', 'cartaz', 'status']) {
    await toque(page.locator(`#fluxo-formato-${f}`), `formato ${f}`);
    await page.waitForTimeout(600);
    await tela(page, `passo3-${f}`);
  }
  await toque(page.getByRole('button', { name: 'Ficou bom' }), 'Ficou bom');
  await esperarPronto(page, true);
  cron.marca('pronto');
  await tela(page, 'pronto', true);
  registrar('painel-no-evento', { aberto: await page.locator('#fluxo-confirma').isVisible(), avisoDoExemplo: await page.locator('#fluxo-aviso-exemplo').count() });

  // ---- mandar ----
  const antes = Date.now();
  await toque(page.locator('#fluxo-mandar'), 'Mandar no WhatsApp');
  if (await page.locator('#fluxo-confirma').isVisible()) await toque(page.locator('#fluxo-confirma-seguir'), 'Mandar mesmo assim');
  await expect.poll(async () => (await partilhas(page)).length, { timeout: 90_000 }).toBeGreaterThan(0);
  registrar('toque-mandar', { ms: Date.now() - antes });
  cron.marca('mandar-no-whatsapp');
  await page.waitForTimeout(400);
  await tela(page, 'depois-de-mandar');
  const p = (await partilhas(page)).at(-1)!;
  salvarTexto('whatsapp.txt', p.texto);
  registrar('texto-whatsapp', { ...analisarTexto(p.texto), arquivos: p.arquivos, nomes: p.nomes, texto: p.texto });
  registrar('png', { caminho: await salvarPartilhado(page, 'card-evento.png') });
  registrar('avisos-ao-mandar', { avisos: await avisos(page) });

  // Baixar de verdade.
  registrar('baixou', { caminho: await baixarPor(page.locator('#fluxo-baixar'), 'baixada-evento.png') });

  // ---- Mudar algo (de baixo) e voltar ----
  await toque(page.locator('#fluxo-mudar'), 'Mudar algo');
  await esperarPasso(page, 1);
  registrar('mudar-algo', await valores(page, ['fluxo-titulo', 'fluxo-organizacao', 'fluxo-texto']));
  await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 1');
  await esperarPasso(page, 2);
  registrar('mudar-algo-passo2', await valores(page, ['fluxo-data', 'fluxo-hora', 'fluxo-local']));
  await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 2');
  await esperarPasso(page, 3);
  registrar('mudar-algo-passo3', { formato: await page.locator('input[name=fluxo-formato]:checked').getAttribute('value') });
  await toque(page.getByRole('button', { name: 'Ficou bom' }), 'Ficou bom');
  await esperarPronto(page, true);

  // Voltar do navegador no Pronto.
  await page.goBack();
  await page.waitForTimeout(800);
  registrar('goBack-pronto-evento', await estadoDoFluxo(page));
  await tela(page, 'goBack-no-pronto-evento');
  if (!page.url().includes('/pronto')) {
    await page.goForward();
    await page.waitForTimeout(800);
    registrar('goForward-pronto-evento', await estadoDoFluxo(page));
  }
  await esperarPronto(page, true);

  // ---- Fazer outro ----
  await toque(page.locator('#fluxo-outro'), 'Fazer outro');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  cron.marca('fazer-outro');
  await tela(page, 'inicio-depois-de-fazer-outro');

  // ---- Agradecer ----
  const cron2 = cronometro('A4 Mãe Iara (agradecer)');
  await toque(page.getByRole('link', { name: /Agradecer/ }), 'porta Agradecer');
  await esperarPasso(page, 1);
  cron2.marca('passo1-abriu');
  registrar('exemplo-visto-agradecer', await exemplosEmCinza(page, ['fluxo-titulo', 'fluxo-organizacao', 'fluxo-texto']));
  await tela(page, 'agradecer-passo1-vazio');
  await digitar(page.locator('#fluxo-titulo'), 'Axé e gratidão a quem ajudou');
  await digitar(page.locator('#fluxo-organizacao'), 'Ilê Axé Flor do Dendê');
  await digitar(page.locator('#fluxo-texto'), 'Obrigada a quem cozinhou, cantou e arrumou a casa. A festa foi linda.');
  await tela(page, 'agradecer-passo1-digitado');
  await toque(page.getByRole('button', { name: 'Continuar' }), 'Continuar 1');
  await esperarPasso(page, 2);
  cron2.marca('passo1');
  registrar('passo2-agradecer', { dicas: await page.locator('.campo-dica, .fluxo-dica, .fluxo-nota').allInnerTexts(), campos: await valores(page, ['fluxo-data']) });
  await tela(page, 'agradecer-passo2');
  const pular = page.locator('#fluxo-pular');
  registrar('pular-existe', { existe: await pular.count(), rotulo: await pular.innerText().catch(() => '') });
  await toque(pular, 'Pular este passo');
  await esperarPasso(page, 3);
  cron2.marca('passo2-pulado');
  registrar('formatos-passo3-agradecer', { botoes: await medirFormatos(page) });
  await tela(page, 'agradecer-passo3');
  await toque(page.getByRole('button', { name: 'Ficou bom' }), 'Ficou bom');
  await esperarPronto(page, false);
  cron2.marca('pronto');
  await tela(page, 'agradecer-pronto', true);
  registrar('painel-no-agradecimento', { aberto: await page.locator('#fluxo-confirma').isVisible(), avisoDoExemplo: await page.locator('#fluxo-aviso-exemplo').count() });
  const n0 = (await partilhas(page)).length;
  await toque(page.locator('#fluxo-mandar'), 'Mandar no WhatsApp (agradecimento)');
  if (await page.locator('#fluxo-confirma').isVisible()) await toque(page.locator('#fluxo-confirma-seguir'), 'Mandar mesmo assim');
  await expect.poll(async () => (await partilhas(page)).length, { timeout: 90_000 }).toBeGreaterThan(n0);
  cron2.marca('mandar-no-whatsapp');
  const p2 = (await partilhas(page)).at(-1)!;
  salvarTexto('whatsapp-agradecimento.txt', p2.texto);
  registrar('texto-whatsapp-agradecimento', { ...analisarTexto(p2.texto), texto: p2.texto });
  registrar('png-agradecimento', { caminho: await salvarPartilhado(page, 'card-agradecimento.png') });
  await page.waitForTimeout(300);
  await tela(page, 'agradecer-depois-de-mandar');

  // Voltar do navegador no Pronto do agradecimento.
  await page.goBack();
  await page.waitForTimeout(800);
  registrar('goBack-pronto-agradecimento', await estadoDoFluxo(page));
  await tela(page, 'goBack-no-pronto-agradecimento');
});

// Quais exemplos aparecem para a porta (rodízio): algum puxa um lado? Aparelho com 4G, só para ser rápido.
test('A4 Exemplos das portas evento e agradecimento (neutralidade) @AND-GRANDE', async ({ page }) => {
  test.setTimeout(600_000);
  await page.goto('./');
  const vistos: Record<string, Record<string, string>[]> = { evento: [], agradecimento: [] };
  for (let i = 0; i < 7; i++) {
    for (const [tipo, nome] of [['evento', /Divulgar um evento/], ['agradecimento', /Agradecer/]] as const) {
      await page.getByRole('link', { name: nome }).tap();
      await esperarPasso(page, 1);
      // Os campos vêm vazios: o exemplo é o cinza de dentro (placeholder). Escreve só o título, que é obrigatório.
      const v = await exemplosEmCinza(page, ['fluxo-titulo', 'fluxo-organizacao', 'fluxo-texto']);
      await preencherObrigatoriosVazios(page, { tipo, agenda: tipo === 'evento' }, 1);
      await page.getByRole('button', { name: 'Continuar' }).tap();
      await esperarPasso(page, 2);
      if (tipo === 'evento') Object.assign(v, await exemplosEmCinza(page, ['fluxo-local']));
      vistos[tipo]!.push(v);
      if (tipo === 'agradecimento') await page.locator('#fluxo-pular').tap();
      else {
        await preencherObrigatoriosVazios(page, { tipo, agenda: true }, 2);
        await page.getByRole('button', { name: 'Continuar' }).tap();
      }
      await esperarPasso(page, 3);
      await page.getByRole('button', { name: 'Ficou bom' }).tap();
      await esperarPronto(page, tipo === 'evento');
      await page.locator('#fluxo-outro').tap();
      await expect(titulo(page)).toHaveText('O que você quer fazer?');
    }
  }
  registrar('exemplos-rodizio', vistos);
});
