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
      // O foco vai para o grupo (o leitor lê a pergunta); o Tab leva ao primeiro botão.
      await expect(painel).toBeFocused();
      await page.keyboard.press('Tab');
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
  // O botão que sumiu tinha o foco: ele vai para "Mandar no WhatsApp", e o link novo é anunciado.
  await expect(page.getByRole('button', { name: 'Mandar no WhatsApp' })).toBeFocused();
  const texto = await mandar(page);
  expect(linkNoTexto(texto)).toMatch(/^http:\/\/localhost:\d+\/#\/evento\/[A-Za-z0-9_-]+$/);
});

test('C-01: sem link, só Mandar e Copiar o texto perguntam; Baixar não; falta só a rede: o primeiro botão é "Tentar de novo"', async ({ page }) => {
  const evento = PORTAS[1];
  const partes = '**/assets/{partes,formato,bloqueio}-*.js';
  await page.route(partes, (rota) => rota.abort());
  await abrirPorta(page, evento);
  await page.locator('#fluxo-titulo').fill('Mutirão da horta');
  await page.locator('#fluxo-organizacao').fill(ORGANIZACAO);
  await page.locator('#fluxo-texto').fill('Traga uma cadeira e um prato');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await page.locator('#fluxo-local').fill('Salão da associação, Rua dos Ipês, 12');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Ficou bom' }).click();
  await esperarOPronto(page, evento);
  await expect(page.locator('#fluxo-tentar-link')).toBeVisible();
  await expect(page.locator('#fluxo-aviso-exemplo')).toHaveCount(0);
  const painel = page.locator('#fluxo-confirma');

  // Baixar a imagem não pergunta pela falta do link.
  const baixou = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar a imagem' }).click();
  await baixou;
  await expect(painel).toBeHidden();

  // Copiar só o texto pergunta; a rede é o único motivo, então o primeiro botão tenta de novo.
  await page.getByRole('button', { name: 'Copiar só o texto' }).click();
  await expect(painel).toBeVisible();
  await expect(painel).toContainText('A mensagem vai sem o link do evento.');
  await expect(painel.locator('#fluxo-confirma-mudar')).toHaveText('Tentar de novo');
});

test('C-01: sem rede E com partes do exemplo, o primeiro botão do painel é "Mudar algo"', async ({ page }) => {
  const evento = PORTAS[1];
  await page.route('**/assets/{partes,formato,bloqueio}-*.js', (rota) => rota.abort());
  await abrirPorta(page, evento);
  await page.locator('#fluxo-titulo').fill('Mutirão da horta');
  await page.locator('#fluxo-organizacao').fill(ORGANIZACAO);
  await irAteOPronto(page, evento);
  await expect(page.locator('#fluxo-tentar-link')).toBeVisible();
  await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
  const painel = page.locator('#fluxo-confirma');
  await expect(painel).toContainText('A mensagem vai sem o link do evento.');
  await expect(painel).toContainText('Isto ainda tem partes do exemplo');
  await expect(painel.locator('#fluxo-confirma-mudar')).toHaveText('Mudar algo');
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
  await expect(orgao).toBeFocused();
  await page.keyboard.press('Tab');
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

test('D1: com letra a 200%, depois de abrir a pergunta do órgão, o começo dela está à vista e o foco está no grupo', async ({ page }) => {
  await page.addInitScript(() => {
    const aplicar = () => document.documentElement.style.setProperty('font-size', '200%');
    if (document.documentElement) aplicar();
    else document.addEventListener('DOMContentLoaded', aplicar);
  });
  const evento = PORTAS[1];
  await abrirPorta(page, evento);
  await page.locator('#fluxo-titulo').fill('Defesa Civil: evacuação');
  await page.getByRole('button', { name: 'Continuar' }).click();

  const orgao = page.locator('#fluxo-orgao');
  await expect(orgao).toBeVisible();
  await expect(orgao).toBeFocused();
  await page.waitForTimeout(150);
  const noAlto = await page.evaluate(() => {
    const texto = document.querySelector('#fluxo-orgao-texto')!;
    const r = texto.getBoundingClientRect();
    // O ponto no começo da pergunta tem de cair na própria pergunta (nenhuma faixa fixa por cima).
    const naFrente = document.elementFromPoint(r.left + 8, Math.max(0, r.top) + 4);
    return { top: r.top, altura: window.innerHeight, dela: naFrente === texto || !!texto.contains(naFrente) };
  });
  expect(noAlto.top, 'a pergunta começa dentro da tela').toBeGreaterThanOrEqual(0);
  expect(noAlto.top, 'a pergunta começa dentro da tela').toBeLessThan(noAlto.altura * 0.5);
  expect(noAlto.dela, 'nada cobre o começo da pergunta').toBe(true);

  // Esc fecha e devolve o foco.
  await page.keyboard.press('Escape');
  await expect(orgao).toBeHidden();
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeFocused();
});

test('passo 1: o Tab passa por "Ver a prévia maior" e "Apagar o exemplo" antes do Título, mas a leitura começa no h1', async ({ page }) => {
  await abrirPorta(page, PORTAS[2]);
  await page.locator('h1').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Ver a prévia maior' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Apagar o exemplo' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#fluxo-titulo')).toBeFocused();
  // No código, o h1 vem primeiro e a miniatura logo depois dele.
  const ordem = await page.evaluate(() => {
    const todos = [...document.querySelectorAll('h1, .fluxo-mini, .fluxo-dica-linha')];
    return todos.map((el) => el.tagName === 'H1' ? 'h1' : el.className);
  });
  expect(ordem).toEqual(['h1', 'fluxo-mini', 'fluxo-dica-linha']);
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
