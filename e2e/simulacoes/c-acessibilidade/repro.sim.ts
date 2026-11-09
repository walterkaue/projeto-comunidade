// Reprodução, pela conversa principal, dos achados TRAVA e ATRAPALHA dos roteiros C1 a C6, no ritmo de uma pessoa
// (esperas de alguns segundos entre as ações, para não ver como erro o que é só pressa do robô).
// Rodar com --repeat-each 2. Cada teste anota o que viu em .saida/repro.md.

import { preencherObrigatoriosVazios } from '../obrigatorios';
import { APARELHOS, anotar, expect, foto, ORGANIZACAO, test, titulo } from './apoio-sim';
import type { Page } from '@playwright/test';

test.use({ ...APARELHOS['AND-FRACO'] });

const pausa = (page: Page, s: number) => page.waitForTimeout(s * 1000);
const visivel = (page: Page) =>
  page.evaluate(() => {
    const el = document.getElementById('aviso-vivo');
    return { texto: el?.textContent ?? '', visivel: !!el?.classList.contains('aviso-vivo-visivel') };
  });

async function porta(page: Page, verbo: string) {
  await page.goto('./');
  await page.getByRole('link', { name: new RegExp(verbo) }).click();
  await expect(titulo(page)).toContainText('Passo 1 de 3');
}
const continuar = (page: Page) => page.getByRole('button', { name: /^(Continuar|Ficou bom)$/ }).click();

test('R-rede: rede cai no passo 2 (sem service worker) e o convite vai sem link', async ({ page, context }) => {
  await porta(page, 'Divulgar um evento');
  await page.locator('#fluxo-titulo').fill('Final do campeonato de várzea');
  await page.locator('#fluxo-organizacao').fill('Time de Várzea Unidos do Morro');
  await continuar(page);
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await context.setOffline(true);
  const caiu = await page.evaluate(async () => {
    try {
      await fetch('./?sonda=' + Date.now(), { cache: 'no-store' });
      return false;
    } catch {
      return true;
    }
  });
  expect(caiu, 'a rede caiu de verdade').toBe(true);
  await preencherObrigatoriosVazios(page, { tipo: 'evento', agenda: true }, 2); // dia, hora e local começam vazios
  await continuar(page);
  await expect(titulo(page)).toContainText('Passo 3 de 3');
  await continuar(page);
  await expect(titulo(page)).toContainText('Pronto!');
  const estado = page.locator('#fluxo-link-estado');
  await expect(estado).not.toHaveText('Preparando o link…', { timeout: 60_000 });
  const msg = (await estado.textContent())?.trim();
  await foto(page, 'repro-rede-pronto');
  await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
  if (await page.locator('#fluxo-confirma').isVisible()) await page.getByRole('button', { name: 'Mandar mesmo assim' }).click();
  await expect.poll(() => page.evaluate(() => window.__partilhas.length)).toBe(1);
  const texto = await page.evaluate(() => window.__partilhas[0]!.texto);
  const avisoMandar = (await page.locator('#fluxo-confirma-texto').textContent().catch(() => ''))?.trim();
  anotar('repro', `R-rede: painel antes de mandar falou de link? ${/link/i.test(avisoMandar ?? '')} ("${avisoMandar}")`);
  await pausa(page, 0.5);
  const aviso = await visivel(page);
  anotar('repro', `R-rede: estado do link="${msg}"; texto mandado tem link? ${/#\/evento\//.test(texto)}; aviso="${aviso.texto}"`);
  await context.setOffline(false);
  await pausa(page, 3);
  anotar('repro', `R-rede: com a rede de volta, estado="${(await estado.textContent())?.trim()}"; Copiar o link à vista? ${await page.getByRole('button', { name: 'Copiar o link' }).isVisible()}`);
  // Antes da correção do C-01 (06/11/2026) o convite saía sem o link. Agora as partes do link são baixadas no
  // passo 2, com rede, e o texto leva o link mesmo com a rede caída no Pronto.
  expect(/#\/evento\//.test(texto)).toBe(true);
});

test('R-apagar: "Apagar tudo" no passo 1 apaga o que a pessoa escreveu, sem perguntar, e o botão vira "Desfazer"', async ({ page }) => {
  await porta(page, 'Dar um aviso');
  await page.locator('#fluxo-titulo').fill('Reunião mudou para quinta');
  await page.locator('#fluxo-organizacao').fill('Pastoral da comunidade');
  await pausa(page, 1);
  const botao = page.locator('#fluxo-apagar');
  const nome = (await botao.textContent())?.trim();
  await botao.click();
  await pausa(page, 1);
  const depois = [await page.locator('#fluxo-titulo').inputValue(), await page.locator('#fluxo-organizacao').inputValue()];
  const rotuloDepois = (await botao.textContent())?.trim();
  const desfazer = await page.getByRole('button', { name: /desfazer|voltar o que/i }).count();
  await foto(page, 'repro-apagar');
  // Desfazer devolve o que estava escrito.
  await botao.click();
  await pausa(page, 1);
  const volta = [await page.locator('#fluxo-titulo').inputValue(), await page.locator('#fluxo-organizacao').inputValue()];
  anotar('repro', `R-apagar: botão="${nome}"; depois do toque título="${depois[0]}", organização="${depois[1]}"; botão agora="${rotuloDepois}" (desfazer: ${desfazer}); depois de Desfazer: ${JSON.stringify(volta)}`);
  expect(nome).toBe('Apagar tudo');
  expect(depois).toEqual(['', '']);
  expect(rotuloDepois).toBe('Desfazer');
  expect(volta).toEqual(['Reunião mudou para quinta', 'Pastoral da comunidade']);
});

test('R-outro: "Fazer outro" no Pronto apaga tudo sem perguntar', async ({ page }) => {
  await porta(page, 'Dar um aviso');
  await page.locator('#fluxo-titulo').fill('Reunião mudou para quinta');
  await page.locator('#fluxo-organizacao').fill('Pastoral da comunidade');
  await continuar(page);
  await expect(titulo(page)).toContainText(/Passo [23] de 3/);
  if (await titulo(page).textContent().then((t) => t?.includes('Passo 2'))) await continuar(page);
  await continuar(page);
  await expect(titulo(page)).toContainText('Pronto!');
  const caixas = await page.evaluate(() => {
    const r = (id: string) => document.getElementById(id)!.getBoundingClientRect();
    const a = r('fluxo-mudar'), b = r('fluxo-outro');
    return { distancia: Math.round(b.top - a.bottom), mudar: [Math.round(a.width), Math.round(a.height)], outro: [Math.round(b.width), Math.round(b.height)] };
  });
  await page.locator('#fluxo-outro').click();
  await pausa(page, 1);
  const onde = page.url();
  await page.goBack();
  await pausa(page, 1);
  const voltou = page.url();
  await porta(page, 'Dar um aviso');
  const tit = await page.locator('#fluxo-titulo').inputValue();
  anotar('repro', `R-outro: ${JSON.stringify(caixas)}; depois do toque: ${onde}; voltar do navegador: ${voltou}; ao reabrir, título="${tit}"`);
  expect(tit).not.toBe('Reunião mudou para quinta');
});

test('R-aviso-velho: o aviso "Confira 1 campo." no ritmo de uma pessoa', async ({ page }) => {
  await porta(page, 'Dar um aviso');
  await page.locator('#fluxo-titulo').fill('');
  await continuar(page);
  await pausa(page, 0.3);
  const logo = await visivel(page);
  await foto(page, 'repro-aviso-erro');
  await pausa(page, 3); // lê a mensagem e acha o campo
  await page.locator('#fluxo-titulo').fill('Reunião mudou para quinta');
  await pausa(page, 2);
  await continuar(page);
  await expect(titulo(page)).toContainText(/Passo [23] de 3/);
  await pausa(page, 1);
  const noPasso = await visivel(page);
  const arvore = await page.locator('body').ariaSnapshot();
  const naArvore = arvore.split('\n').filter((l) => l.includes('Confira 1 campo')).length;
  anotar('repro', `R-aviso-velho: logo depois do erro ${JSON.stringify(logo)}; ~6 s depois, no passo seguinte ${JSON.stringify(noPasso)}; linhas da árvore com "Confira 1 campo": ${naArvore}`);
  expect(noPasso.visivel, 'no ritmo de uma pessoa o aviso já sumiu da tela').toBe(false);
});

test('R-corte: título longo é cortado sem aviso', async ({ page }) => {
  await porta(page, 'Dar um aviso');
  const longo = 'Mutirão de limpeza da praça e da quadra com as famílias de todas as ruas do bairro, das associações do entorno e da escola';
  await page.locator('#fluxo-titulo').fill(longo);
  await pausa(page, 1);
  const guardado = await page.locator('#fluxo-titulo').inputValue();
  const info = await page.locator('#fluxo-titulo').evaluate((el) => ({
    maxlength: el.getAttribute('maxlength'),
    descricao: (el.getAttribute('aria-describedby') ?? '').split(' ').map((id) => document.getElementById(id)?.textContent?.trim()).filter(Boolean),
  }));
  await foto(page, 'repro-corte');
  anotar('repro', `R-corte: digitou ${longo.length} letras, ficou ${guardado.length} ("…${guardado.slice(-20)}"); ${JSON.stringify(info)}`);
  expect(guardado.length).toBeLessThan(longo.length);
});

test('R-dia: na reunião o dia começa vazio e o Pronto não tem mais o aviso do exemplo', async ({ page }) => {
  await porta(page, 'Chamar para uma reunião');
  await page.locator('#fluxo-organizacao').fill(ORGANIZACAO);
  await preencherObrigatoriosVazios(page, { tipo: 'reuniao', agenda: true }, 1);
  await continuar(page);
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  const dia = await page.locator('#fluxo-data').inputValue();
  await preencherObrigatoriosVazios(page, { tipo: 'reuniao', agenda: true }, 2);
  await continuar(page);
  await continuar(page);
  await expect(titulo(page)).toContainText('Pronto!');
  await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…', { timeout: 60_000 });
  const aviso = await page.locator('#fluxo-aviso-exemplo').count();
  await foto(page, 'repro-dia-pronto');
  anotar('repro', `R-dia: dia ao abrir o passo 2="${dia}"; avisos do exemplo no Pronto: ${aviso}`);
  expect(dia).toBe('');
  expect(aviso).toBe(0);
});

test('R-passado: dia no passado é aceito', async ({ page }) => {
  await porta(page, 'Divulgar um evento');
  await preencherObrigatoriosVazios(page, { tipo: 'evento', agenda: true }, 1);
  await continuar(page);
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await preencherObrigatoriosVazios(page, { tipo: 'evento', agenda: true }, 2);
  const campoDia = page.locator('#fluxo-data');
  await campoDia.fill((await campoDia.getAttribute('type')) === 'date' ? '2020-01-01' : '01/01/2020');
  await pausa(page, 1);
  await continuar(page);
  await pausa(page, 1);
  const t = (await titulo(page).textContent())?.trim();
  const previa = await page.locator('#fluxo-canvas').getAttribute('aria-label').catch(() => '');
  anotar('repro', `R-passado: depois de Continuar, título="${t}"; prévia="${previa}"`);
  expect(t).toContain('Passo 3 de 3');
});

test('R-denuncia: o aviso de erro da denúncia, no ritmo de uma pessoa, ainda aparece na revisão?', async ({ page }) => {
  await page.goto('./#/denunciar');
  await page.getByRole('button', { name: 'Revisar a denúncia' }).click();
  await pausa(page, 0.3);
  const logo = await visivel(page);
  await pausa(page, 3);
  await page.getByLabel('Onde está o conteúdo').fill('Grupo do bairro, mensagem de ontem à noite.');
  await pausa(page, 1);
  await page.getByLabel('Tipo de problema').selectOption({ index: 1 });
  await pausa(page, 2);
  await page.getByLabel('O que há de errado').fill('Pede dinheiro adiantado para garantir a vaga.');
  await pausa(page, 2);
  await page.getByRole('button', { name: 'Revisar a denúncia' }).click();
  await expect(page.getByRole('heading', { name: 'Confira antes de enviar' })).toBeVisible();
  await pausa(page, 0.5);
  const naRevisao = await visivel(page);
  anotar('repro', `R-denuncia: logo depois do erro ${JSON.stringify(logo)}; na revisão, ~8 s depois ${JSON.stringify(naRevisao)}`);
});

test.describe('sem menu de compartilhar', () => {
  test.use({ compartilhar: 'ausente' });
  test('R-sem-menu: a dica "Abre o menu do celular" fica na tela e nada abre', async ({ page }) => {
    await porta(page, 'Dar um aviso');
    await page.locator('#fluxo-titulo').fill('Reunião mudou para quinta'); // o título começa vazio e é obrigatório
    await continuar(page);
    await expect(titulo(page)).toContainText(/Passo [23] de 3/); // espera o passo trocar antes de olhar qual é
    if (await titulo(page).textContent().then((t) => t?.includes('Passo 2'))) await continuar(page);
    await continuar(page);
    await expect(titulo(page)).toContainText('Pronto!');
    const dica = (await page.locator('#fluxo-mandar-dica').textContent())?.trim();
    await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
    const seguir = page.getByRole('button', { name: 'Mandar mesmo assim' });
    if (await page.locator('#fluxo-confirma').isVisible()) await seguir.click();
    await pausa(page, 1);
    const aviso = await visivel(page);
    await foto(page, 'repro-sem-menu');
    anotar('repro', `R-sem-menu: dica="${dica}"; depois do toque, aviso=${JSON.stringify(aviso)}`);
  });
});
