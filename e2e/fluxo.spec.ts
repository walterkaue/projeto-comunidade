// Cenários 1 e 2: as cinco portas com o exemplo, e a reunião com a organização trocada.

import { abrirPorta, conferirTela, esperarOPronto, expect, irAteOPronto, linkNoTexto, mandar, ORGANIZACAO, partilhas, PORTAS, test, titulo } from './apoio';

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

// ---------- C-01: o link sai mesmo se a rede cair depois do passo 2 ----------

test('C-01: o passo 2 já baixa as partes do evento; sem rede no Pronto, o link sai', async ({ page, context }) => {
  const evento = PORTAS[1];
  await abrirPorta(page, evento);
  await page.locator('#fluxo-organizacao').fill(ORGANIZACAO);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  // Dá tempo de as partes (partes, formato, bloqueio) chegarem; o passo 2 não mostra nada disso.
  await page.waitForLoadState('networkidle');
  await context.setOffline(true);

  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 3 de 3');
  await page.getByRole('button', { name: 'Ficou bom' }).click();
  await esperarOPronto(page, evento);

  await expect(page.locator('#fluxo-link-estado')).toHaveText('');
  await expect(page.getByRole('button', { name: 'Copiar o link' })).toBeVisible();
  await expect(page.locator('#fluxo-tentar-link')).toBeHidden();
  const texto = await mandar(page);
  expect(linkNoTexto(texto)).toMatch(/^http:\/\/localhost:\d+\/#\/evento\/[A-Za-z0-9_-]+$/);
});

test('C-01: sem as partes do evento, avisa, mandar sem link pergunta e "Tentar de novo" cria o link', async ({ page }) => {
  const evento = PORTAS[1];
  const partes = '**/assets/{partes,formato,bloqueio}-*.js';
  await page.route(partes, (rota) => rota.abort());
  await abrirPorta(page, evento);
  await page.locator('#fluxo-organizacao').fill(ORGANIZACAO);
  await irAteOPronto(page, evento);

  const aviso = 'Sem internet: o link do evento não foi criado. Toque em Tentar de novo quando a rede voltar.';
  await expect(page.locator('#fluxo-link-estado')).toHaveText(aviso);
  const tentar = page.locator('#fluxo-tentar-link');
  await expect(tentar).toBeVisible();
  await expect(tentar).toHaveText('Tentar de novo');
  await expect(page.getByRole('button', { name: 'Copiar o link' })).toBeHidden();
  await conferirTela(page, 'evento: Pronto sem as partes do evento');

  // O primeiro toque em Mandar só abre o painel, que avisa que vai sem link.
  await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
  const painel = page.locator('#fluxo-confirma');
  await expect(painel).toBeVisible();
  await expect(painel).toContainText('A mensagem vai sem o link do evento.');
  expect(await partilhas(page)).toEqual([]);

  // A rede volta: o toque em "Tentar de novo" cria o link.
  await page.unroute(partes);
  await tentar.click();
  await expect(page.locator('#fluxo-link-estado')).toHaveText('');
  await expect(page.getByRole('button', { name: 'Copiar o link' })).toBeVisible();
  await expect(tentar).toBeHidden();
  const texto = await mandar(page);
  expect(linkNoTexto(texto)).toMatch(/^http:\/\/localhost:\d+\/#\/evento\/[A-Za-z0-9_-]+$/);
});

// ---------- D1: título que fala em nome de órgão público ----------

test('D1: órgão público no título abre a pergunta; "Seguir" avança e o mesmo texto não pergunta de novo', async ({ page }) => {
  const evento = PORTAS[1];
  await abrirPorta(page, evento);
  await page.locator('#fluxo-titulo').fill('Defesa Civil: evacuação');
  await page.getByRole('button', { name: 'Continuar' }).click();

  const orgao = page.locator('#fluxo-orgao');
  await expect(orgao).toBeVisible();
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  await expect(orgao.getByRole('button', { name: 'Mudar' })).toBeFocused();
  await conferirTela(page, 'passo 1: pergunta do órgão público');

  await orgao.getByRole('button', { name: 'Seguir' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');

  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  await expect(page.locator('#fluxo-titulo')).toHaveValue('Defesa Civil: evacuação');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await expect(page.locator('#fluxo-orgao')).toBeHidden();
});

// ---------- D7: apagar e Desfazer ----------

test('D7: "Apagar o exemplo" vira "Desfazer" e devolve o título', async ({ page }) => {
  const aviso = PORTAS[2];
  await abrirPorta(page, aviso);
  const campo = page.locator('#fluxo-titulo');
  const antes = await campo.inputValue();
  expect(antes.length).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Apagar o exemplo' }).click();
  await expect(campo).toHaveValue('');
  await expect(campo).toBeFocused();
  const desfazer = page.getByRole('button', { name: 'Desfazer' });
  await expect(desfazer).toBeVisible();

  await desfazer.click();
  await expect(campo).toHaveValue(antes);
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeHidden();
});

// ---------- A-01: o texto de "Conseguimos" não se perde na imagem ----------

test('A-01: no Pronto de "Contar uma conquista", a descrição da imagem tem "Conseguimos" inteiro', async ({ page }) => {
  const conquista = PORTAS[3];
  await abrirPorta(page, conquista);
  // O exemplo é sorteado: o título é o que prova o caso (palavra comprida, a que a imagem encolhe para caber).
  await page.locator('#fluxo-titulo').fill('Conseguimos');
  await irAteOPronto(page, conquista);
  const canvas = page.locator('#fluxo-canvas');
  // A descrição é refeita quando a imagem termina de desenhar.
  await expect(canvas).toHaveAttribute('aria-label', /^Imagem de .*formato Grupo./);
  expect(await canvas.getAttribute('aria-label')).toContain('Título: Conseguimos.');
});
