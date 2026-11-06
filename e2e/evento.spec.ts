// Cenários 3 e 4: o link do evento (página, "Fazer o card", "Criar outro", link removido) e a denúncia.

import { createHash } from 'node:crypto';
import type { Page } from '@playwright/test';
import { textoDaRegra } from '../src/comum/regras';
import { abrirPorta, conferirTela, esperarOPronto, expect, irAteOPronto, linkNoTexto, mandar, ORGANIZACAO, PORTAS, test, titulo } from './apoio';

const EVENTO = PORTAS[1];

/** Cria um evento pelo fluxo, com a organização trocada, e devolve o link e o título. */
async function criarEvento(page: Page): Promise<{ link: string; tituloDoEvento: string }> {
  await abrirPorta(page, EVENTO);
  const tituloDoEvento = await page.locator('#fluxo-titulo').inputValue();
  await page.locator('#fluxo-organizacao').fill(ORGANIZACAO);
  await irAteOPronto(page, EVENTO);
  const link = linkNoTexto(await mandar(page));
  expect(link).toMatch(/^http:\/\/localhost:\d+\/#\/evento\/[A-Za-z0-9_-]+$/);
  return { link, tituloDoEvento };
}

/** Abre o link numa aba nova, como quem recebe pelo WhatsApp (sem nada na memória da aba). */
async function abrirComoQuemRecebe(page: Page, link: string): Promise<Page> {
  const outra = await page.context().newPage();
  await outra.goto(link);
  return outra;
}

test('página do evento: "Fazer o card" e "Criar outro" sem mudança devolvem o mesmo link', async ({ page }) => {
  const { link, tituloDoEvento } = await criarEvento(page);

  const recebida = await abrirComoQuemRecebe(page, link);
  await expect(titulo(recebida)).toHaveText(tituloDoEvento);
  await expect(recebida.getByText(`Quem chama, segundo quem criou o link: ${ORGANIZACAO}`)).toBeVisible();
  await expect(recebida.getByText('Nunca faça pagamento pedido por um evento.', { exact: false })).toBeVisible();
  await conferirTela(recebida, 'página do evento');

  // "Fazer o card deste evento": cai no passo 3, com os dados do link.
  await recebida.getByRole('link', { name: 'Fazer o card deste evento' }).click();
  await expect(titulo(recebida)).toContainText('Passo 3 de 3');
  await recebida.getByRole('button', { name: 'Ficou bom' }).click();
  await esperarOPronto(recebida, EVENTO);
  await expect(recebida.locator('#fluxo-aviso-link')).toHaveText(
    'O link é o mesmo do evento que você recebeu e leva tudo o que está nele. Quem receber pode repassar.',
  );
  await conferirTela(recebida, 'Pronto vindo de "Fazer o card"');
  expect(linkNoTexto(await mandar(recebida))).toBe(link);

  // "Criar outro evento a partir deste": passo 1 com a nota, sem mudar nada.
  await recebida.goto(link);
  await expect(titulo(recebida)).toHaveText(tituloDoEvento);
  await recebida.getByRole('link', { name: 'Criar outro evento a partir deste' }).click();
  await expect(titulo(recebida)).toContainText('Passo 1 de 3');
  await expect(recebida.getByText('Estes dados vieram de um link de evento.', { exact: false })).toBeVisible();
  await irAteOPronto(recebida, EVENTO);
  expect(linkNoTexto(await mandar(recebida))).toBe(link);
});

test('link da lista de bloqueio mostra "removido" com o motivo', async ({ page }) => {
  const { link } = await criarEvento(page);
  const dados = link.slice(link.indexOf('#/evento/') + '#/evento/'.length);
  const impressao = createHash('sha256').update(dados).digest('hex');

  // A lista do site trocada só neste teste, com o motivo "regra-5" (golpe).
  const outra = await page.context().newPage();
  await outra.route('**/bloqueados.json', (rota) =>
    rota.fulfill({ contentType: 'application/json', body: JSON.stringify({ bloqueados: [{ h: impressao, motivo: 'regra-5' }] }) }),
  );
  await outra.goto(link);
  await expect(titulo(outra)).toHaveText('Este link foi removido após denúncia');
  await expect(outra.getByText(`fere esta regra de uso: ${textoDaRegra(5)}`, { exact: false })).toBeVisible();
  await expect(outra.getByText('peça revisão', { exact: false })).toBeVisible();
  await expect(outra.getByRole('link', { name: 'Ver as Regras de uso' })).toBeVisible();
  await conferirTela(outra, 'link removido');
});

test('denúncia a partir da página do evento: a revisão mostra o link e a descrição', async ({ page }) => {
  const { link } = await criarEvento(page);
  const recebida = await abrirComoQuemRecebe(page, link);
  await expect(titulo(recebida)).not.toHaveText('Abrindo o evento…');

  await recebida.getByRole('link', { name: 'Denunciar este evento' }).click();
  await expect(recebida).toHaveURL(/#\/denunciar\//);
  await expect(recebida.locator('.link-denunciado')).toContainText(link.slice(0, 40));
  await conferirTela(recebida, 'denúncia: formulário');

  const descricao = 'O evento pede um pagamento adiantado para garantir a vaga.';
  await recebida.getByLabel('Tipo de problema').selectOption('golpe');
  await recebida.getByLabel('O que há de errado').fill(descricao);
  await recebida.getByRole('button', { name: 'Revisar a denúncia' }).click();

  await expect(recebida.getByRole('heading', { name: 'Confira antes de enviar' })).toBeVisible();
  const texto = recebida.getByLabel('Texto da denúncia');
  await expect(texto).toHaveValue(new RegExp(link.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')));
  await expect(texto).toHaveValue(new RegExp(descricao.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await conferirTela(recebida, 'denúncia: revisão');
});
