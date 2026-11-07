// Cenários 1 e 2: as cinco portas (os campos começam vazios, com o exemplo em cinza) e a reunião e o evento sem
// organização e sem texto.

import { abrirPorta, conferirTela, esperarOPronto, expect, irAteOPronto, linkNoTexto, mandar, ORGANIZACAO, partilhas, PORTAS, test, titulo, type Porta } from './apoio';
import type { Page } from '@playwright/test';
import { camposDoPasso1, DADOS, exemplosDosCampos, preencherPasso1, preencherPasso2 } from './fluxo-apoio';

const LINK_DO_EVENTO = /^http:\/\/localhost:\d+\/#\/evento\/[A-Za-z0-9_-]+$/;

test.describe('as cinco portas começam vazias, com o exemplo só em cinza', () => {
  for (const porta of PORTAS) {
    test(`${porta.verbo}: preenche, e o que sai não leva nada do exemplo`, async ({ page }) => {
      await abrirPorta(page, porta, true);

      // Passo 1: campos vazios com "Ex.: …" em cinza; a miniatura avisa que usa o exemplo no que falta.
      const campos = camposDoPasso1(porta);
      for (const id of campos) {
        await expect(page.locator(id)).toHaveValue('');
        await expect(page.locator(id)).toHaveAttribute('placeholder', /^Ex\.: ./);
      }
      const exemplos = await exemplosDosCampos(page, campos);
      expect(exemplos.length).toBeGreaterThan(2);
      const linhaDoExemplo = page.locator('#fluxo-mini-exemplo');
      await expect(linhaDoExemplo).toBeVisible();
      await expect(linhaDoExemplo).toHaveText('(com exemplo no que falta)');
      // "Apagar tudo" só aparece quando há texto.
      await expect(page.locator('#fluxo-apagar')).toBeHidden();

      await preencherPasso1(page, porta);
      // Reunião e evento ainda não têm dia, hora e local: a miniatura segue com o exemplo. Os outros já estão completos.
      if (porta.agenda) await expect(linhaDoExemplo).toBeVisible();
      else await expect(linhaDoExemplo).toBeHidden();
      await expect(page.getByRole('button', { name: 'Apagar tudo' })).toBeVisible();
      await conferirTela(page, `${porta.tipo}: passo 1 preenchido`);
      await page.getByRole('button', { name: 'Continuar' }).click();
      await expect(titulo(page)).toContainText('Passo 2 de 3');

      // Passo 2: só o local tem exemplo em cinza (dia e hora, não).
      if (porta.agenda) {
        await expect(page.locator('#fluxo-local')).toHaveAttribute('placeholder', /^Ex\.: ./);
        exemplos.push(...(await exemplosDosCampos(page, ['#fluxo-local'])));
        await expect(page.locator('#fluxo-data')).not.toHaveAttribute('placeholder', /./);
        await expect(page.locator('#fluxo-hora')).not.toHaveAttribute('placeholder', /./);
        await expect(linhaDoExemplo).toBeVisible();
        await preencherPasso2(page, porta);
      }
      await expect(linhaDoExemplo).toBeHidden();
      await page.getByRole('button', { name: 'Continuar' }).click();
      await expect(titulo(page)).toContainText('Passo 3 de 3');
      await page.getByRole('button', { name: 'Ficou bom' }).click();
      await esperarOPronto(page, porta);

      // Pronto: sem aviso de exemplo; o texto mandado leva o que a pessoa escreveu e nada do exemplo.
      await expect(page.locator('#fluxo-aviso-exemplo')).toHaveCount(0);
      const texto = await mandar(page);
      expect(texto).toContain(DADOS.titulo);
      expect(texto).toContain(DADOS.organizacao);
      for (const e of exemplos) expect(texto, `o exemplo "${e}" não vai no texto`).not.toContain(e);
      if (porta.agenda) {
        expect(linkNoTexto(texto)).toMatch(LINK_DO_EVENTO);
        await expect(page.getByRole('button', { name: 'Copiar o link' })).toBeVisible();
      } else {
        expect(texto).not.toContain('#/evento/');
      }
      // A descrição da imagem do Pronto também não leva o exemplo.
      const alt = (await page.locator('#fluxo-canvas').getAttribute('aria-label')) ?? '';
      for (const e of exemplos) expect(alt, `o exemplo "${e}" não vai na descrição da imagem`).not.toContain(e);
      await conferirTela(page, `${porta.tipo}: Pronto`);
    });
  }
});

test('o endereço e a volta ao passo 1 não levam o exemplo: o que a pessoa escreveu fica e o resto continua em cinza', async ({ page }) => {
  const evento = PORTAS[1];
  await abrirPorta(page, evento);
  await page.locator('#fluxo-titulo').fill(DADOS.titulo);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  expect(page.url()).not.toContain('horta');
  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(page.locator('#fluxo-titulo')).toHaveValue(DADOS.titulo);
  await expect(page.locator('#fluxo-organizacao')).toHaveValue('');
  await expect(page.locator('#fluxo-organizacao')).toHaveAttribute('placeholder', /^Ex\.: ./);
});

for (const porta of [PORTAS[0], PORTAS[1]]) {
  test(`${porta.verbo}: sem organização e sem texto o link sai, e quem recebe vê a página do evento`, async ({ page }) => {
    await abrirPorta(page, porta);
    await preencherPasso1(page, porta, { organizacao: false, texto: false });
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(titulo(page)).toContainText('Passo 2 de 3');
    await preencherPasso2(page, porta);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Ficou bom' }).click();
    await esperarOPronto(page, porta);

    await expect(page.locator('#fluxo-link-estado')).toHaveText('');
    await expect(page.getByRole('button', { name: 'Copiar o link' })).toBeVisible();
    const texto = await mandar(page);
    const link = linkNoTexto(texto);
    expect(link).toMatch(LINK_DO_EVENTO);
    // Sem organização não sobra linha vazia nem nome de organização do exemplo.
    expect(texto).not.toMatch(/^_/m);
    expect(texto).toContain(DADOS.titulo);

    // Quem recebe: aba nova, sem nada na memória.
    const recebida = await page.context().newPage();
    await recebida.goto(link);
    await expect(titulo(recebida)).toHaveText(DADOS.titulo);
    await expect(recebida.getByText('Quem chama', { exact: false })).toHaveCount(0);
    await expect(recebida.getByText('Não deu para abrir este evento')).toHaveCount(0);
    await expect(recebida.getByText(DADOS.local, { exact: false }).first()).toBeVisible();
    if (porta.tipo === 'reuniao') await expect(recebida.getByText('Contas do ano')).toBeVisible();
    await conferirTela(recebida, `${porta.tipo}: página do evento sem organização`);
    await recebida.close();
  });
}

test('reunião com organização: aviso, link, QR e ponte para a ata', async ({ page }) => {
  const reuniao = PORTAS[0];
  await abrirPorta(page, reuniao);

  await expect(page.getByText('Título, local e pauta vão no link.')).toBeVisible();
  await preencherPasso1(page, reuniao);
  const pauta = DADOS.pauta.split('\n');

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
  expect(link).toMatch(LINK_DO_EVENTO);
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
  await preencherPasso1(page, evento);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await preencherPasso2(page, evento);
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
  await preencherPasso1(page, evento);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await preencherPasso2(page, evento);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Ficou bom' }).click();
  await esperarOPronto(page, evento);
  await expect(page.locator('#fluxo-tentar-link')).toBeVisible();
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

// ---------- D1: título que fala em nome de órgão público ----------

test('D1: órgão público no título abre o painel modal; "Seguir assim" avança e o mesmo texto não pergunta de novo', async ({ page }) => {
  const evento = PORTAS[1];
  await abrirPorta(page, evento);
  await page.locator('#fluxo-titulo').fill('Defesa Civil: evacuação');
  await page.getByRole('button', { name: 'Continuar' }).click();

  const orgao = page.locator('dialog#fluxo-orgao');
  await expect(orgao).toBeVisible();
  expect(await orgao.evaluate((el: HTMLDialogElement) => el.matches(':modal'))).toBe(true);
  await expect(orgao).toHaveAccessibleName('Este convite fala em nome de um órgão público?');
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  await expect(orgao.getByRole('button', { name: 'Mudar o texto' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(orgao.getByRole('button', { name: 'Seguir assim' })).toBeFocused();
  await conferirTela(page, 'passo 1: painel do órgão público');

  await orgao.getByRole('button', { name: 'Seguir assim' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');

  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  await expect(page.locator('#fluxo-titulo')).toHaveValue('Defesa Civil: evacuação');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await expect(page.locator('dialog#fluxo-orgao')).toBeHidden();
});

test('D1: Esc no painel do órgão é "Mudar o texto": fecha e o foco volta ao campo; tocar no fundo não fecha', async ({ page }) => {
  const evento = PORTAS[1];
  await abrirPorta(page, evento);
  await page.locator('#fluxo-titulo').fill('Defesa Civil: evacuação');
  await page.getByRole('button', { name: 'Continuar' }).click();
  const orgao = page.locator('dialog#fluxo-orgao');
  await expect(orgao).toBeVisible();

  await page.mouse.click(180, 20);
  await expect(orgao).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(orgao).toBeHidden();
  await expect(page.locator('#fluxo-titulo')).toBeFocused();
  await expect(titulo(page)).toContainText('Passo 1 de 3');
});

test('D1: com letra a 200%, o painel do órgão mostra a pergunta inteira ao alcance', async ({ page }) => {
  await page.addInitScript(() => {
    const aplicar = () => document.documentElement.style.setProperty('font-size', '200%');
    if (document.documentElement) aplicar();
    else document.addEventListener('DOMContentLoaded', aplicar);
  });
  const evento = PORTAS[1];
  await abrirPorta(page, evento);
  await page.locator('#fluxo-titulo').fill('Defesa Civil: evacuação');
  await page.getByRole('button', { name: 'Continuar' }).click();
  const orgao = page.locator('dialog#fluxo-orgao');
  await expect(orgao).toBeVisible();
  await expect(orgao.getByRole('button', { name: 'Mudar o texto' })).toBeFocused();
  await page.waitForTimeout(400); // a folha sobe com uma animação curta
  const caixa = await orgao.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, altura: window.innerHeight, rolavel: el.scrollHeight > el.clientHeight };
  });
  expect(caixa.top).toBeGreaterThanOrEqual(0);
  expect(caixa.bottom).toBeLessThanOrEqual(caixa.altura + 1);
  await page.keyboard.press('Escape');
  await expect(orgao).toBeHidden();
});

// ---------- passo 2: atalhos do dia e calendário ----------

test('passo 2: os atalhos ficam acima do campo Dia e tocar num deles preenche o dia e marca aria-pressed', async ({ page }) => {
  const evento = PORTAS[1];
  await abrirPorta(page, evento);
  await preencherPasso1(page, evento);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');

  const grupo = page.getByRole('group', { name: 'Atalhos do dia' });
  const dia = page.locator('#fluxo-data');
  await expect(dia).toHaveAttribute('type', 'date');
  await expect(dia).toHaveValue('');
  const fimDoGrupo = (await grupo.boundingBox())!;
  const campo = (await dia.boundingBox())!;
  expect(fimDoGrupo.y + fimDoGrupo.height, 'o grupo termina antes do topo do campo').toBeLessThanOrEqual(campo.y);

  const amanha = grupo.getByRole('button', { name: 'Amanhã' });
  await expect(amanha).toHaveAttribute('aria-pressed', 'false');
  await amanha.click();
  await expect(amanha).toHaveAttribute('aria-pressed', 'true');
  await expect(grupo.getByRole('button', { name: 'Hoje' })).toHaveAttribute('aria-pressed', 'false');
  await expect(dia).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
  await expect(page.locator('#fluxo-data-extenso')).not.toHaveText('');

  // Escolher no calendário o dia de outro atalho: ele passa a ficar marcado.
  const hoje = await grupo.getByRole('button', { name: 'Hoje' }).getAttribute('data-dia');
  await dia.fill(hoje!);
  await expect(grupo.getByRole('button', { name: 'Hoje' })).toHaveAttribute('aria-pressed', 'true');
  await expect(amanha).toHaveAttribute('aria-pressed', 'false');
  await conferirTela(page, 'passo 2: atalhos do dia');
});

test('passo 1: o Tab passa por "Ver maior a prévia" e "Apagar tudo" antes do Título, mas a leitura começa no h1', async ({ page }) => {
  await abrirPorta(page, PORTAS[2]);
  await page.locator('#fluxo-titulo').fill(DADOS.titulo);
  await page.locator('h1').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Ver maior a prévia' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Apagar tudo' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#fluxo-titulo')).toBeFocused();
  // No código, o h1 vem primeiro e a miniatura logo depois dele.
  const ordem = await page.evaluate(() => {
    const todos = [...document.querySelectorAll('h1, .fluxo-mini, .fluxo-dica-linha')];
    return todos.map((el) => el.tagName === 'H1' ? 'h1' : el.className);
  });
  expect(ordem).toEqual(['h1', 'fluxo-mini', 'fluxo-dica-linha']);
});

// ---------- D7: apagar tudo e Desfazer, sem relógio ----------

test('D7: "Apagar tudo" vira "Desfazer" (sem relógio) e devolve o que estava escrito', async ({ page }) => {
  const aviso = PORTAS[2];
  await abrirPorta(page, aviso);
  const titulo1 = page.locator('#fluxo-titulo');
  const texto = page.locator('#fluxo-texto');
  // Com tudo vazio, não há o que apagar.
  await expect(page.getByRole('button', { name: 'Apagar tudo' })).toBeHidden();
  await titulo1.fill(DADOS.titulo);
  await texto.fill(DADOS.texto);
  await page.locator('#fluxo-organizacao').fill(DADOS.organizacao);

  await page.getByRole('button', { name: 'Apagar tudo' }).click();
  await expect(titulo1).toHaveValue('');
  await expect(texto).toHaveValue('');
  await expect(page.locator('#fluxo-organizacao')).toHaveValue('');
  await expect(titulo1).toBeFocused();
  await expect(page.locator('.aviso-vivo, [role="status"]').filter({ hasText: 'Tudo apagado. Para trazer de volta, toque em Desfazer.' }).first()).toBeAttached();
  const desfazer = page.getByRole('button', { name: 'Desfazer' });
  await expect(desfazer).toBeVisible();

  // Sem prazo: passados mais de 10 segundos, o botão ainda é "Desfazer".
  await page.waitForTimeout(11_000);
  await expect(desfazer).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apagar tudo' })).toBeHidden();

  await desfazer.click();
  await expect(titulo1).toHaveValue(DADOS.titulo);
  await expect(texto).toHaveValue(DADOS.texto);
  await expect(page.locator('#fluxo-organizacao')).toHaveValue(DADOS.organizacao);
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Apagar tudo' })).toBeVisible();
});

test('D7: escrever de novo depois de apagar tira o "Desfazer"; sair do passo também', async ({ page }) => {
  const aviso = PORTAS[2];
  await abrirPorta(page, aviso);
  await page.locator('#fluxo-titulo').fill(DADOS.titulo);
  await page.getByRole('button', { name: 'Apagar tudo' }).click();
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeVisible();

  // Escrever de novo num campo do passo 1: a cópia some e o botão volta a "Apagar tudo".
  await page.locator('#fluxo-titulo').fill('Outro título');
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Apagar tudo' })).toBeVisible();

  // Apagar tudo de novo, sair do passo e voltar: não há mais o que desfazer, e o botão some (tudo vazio).
  await page.getByRole('button', { name: 'Apagar tudo' }).click();
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeVisible();
  await page.locator('#fluxo-titulo').fill(DADOS.titulo);
  await page.locator('#fluxo-titulo').fill('');
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Apagar tudo' })).toBeHidden();

  // Sair do passo: a cópia se perde (fica só na variável da tela).
  await page.locator('#fluxo-titulo').fill(DADOS.titulo);
  await page.getByRole('button', { name: 'Apagar tudo' }).click();
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  await page.getByRole('link', { name: new RegExp(aviso.verbo) }).click();
  await expect(titulo(page)).toContainText('Passo 1 de 3');
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

// ---------- nova cara: passo 3 e Pronto ----------

async function irAteOPassoTres(page: Page, porta: Porta): Promise<void> {
  await preencherPasso1(page, porta);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await preencherPasso2(page, porta);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 3 de 3');
  await page.waitForTimeout(300);
}

for (const esquema of ['light', 'dark'] as const) {
  test(`passo 3 (${esquema}): formato e cor aparecem sem rolar; a escolhida leva ✓; a lupa abre a prévia`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: esquema });
    const evento = PORTAS[1];
    await abrirPorta(page, evento);
    await irAteOPassoTres(page, evento);

    await expect(page.locator('main')).toHaveAttribute('data-porta', 'evento');
    const medidas = await page.evaluate(() => {
      const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      return { formato: r('#fluxo-formato').bottom, cor: r('#fluxo-cor').bottom, barra: r('.fluxo-barra').top, canvas: r('#fluxo-canvas').height / innerHeight };
    });
    expect(medidas.formato).toBeLessThan(medidas.barra);
    expect(medidas.cor, 'as bolinhas cabem acima da barra').toBeLessThanOrEqual(medidas.barra);
    expect(medidas.canvas).toBeLessThanOrEqual(0.4);

    // Opções empilhadas de 54 px, radios de verdade; a escolhida mostra o ✓ e a explicação muda.
    await expect(page.getByRole('radio', { name: /^Grupo/ })).toBeChecked();
    const alturas = await page.locator('.fluxo-seg-item label').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    expect(Math.min(...alturas)).toBeGreaterThanOrEqual(54);
    await page.getByRole('radio', { name: /^Cartaz/ }).check();
    await expect(page.locator('#fluxo-formato-expl')).toHaveText('Folha A4, para imprimir e pôr no mural');
    await expect(page.locator('.fluxo-seg-item input:checked + label .fluxo-seg-check')).toBeVisible();
    await expect(page.locator('#fluxo-canvas')).toHaveAttribute('aria-label', /^Cartaz de evento/);

    // Bolinhas: a escolhida leva ✓ por dentro, e o radio diz qual é.
    await page.getByRole('radio', { name: 'Mar' }).check();
    await expect(page.locator('.fluxo-bola-item input:checked + label .fluxo-bola-check')).toBeVisible();
    await expect(page.locator('#fluxo-cor-nome')).toHaveText('Mar');

    const lupa = page.getByRole('button', { name: 'Ver a prévia maior' });
    const caixa = await lupa.boundingBox();
    expect(caixa!.width).toBeGreaterThanOrEqual(48);
    await lupa.click();
    await expect(page.getByRole('dialog', { name: 'Como está ficando' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(lupa).toBeFocused();
    await conferirTela(page, `passo 3 ${esquema}`);
  });
}

test('Pronto da reunião: Mandar logo abaixo do topo, "Outros jeitos de usar" e o quadro da ata', async ({ page }) => {
  const reuniao = PORTAS[0];
  await abrirPorta(page, reuniao);
  await preencherPasso1(page, reuniao);
  await irAteOPronto(page, reuniao);
  await expect(page.locator('main')).toHaveAttribute('data-porta', 'reuniao');

  const alto = await page.getByRole('button', { name: 'Mandar no WhatsApp' }).boundingBox();
  expect(alto!.height).toBeGreaterThanOrEqual(60);
  expect(alto!.y + alto!.height).toBeLessThanOrEqual(640);
  await expect(page.getByRole('heading', { level: 2, name: 'Outros jeitos de usar' })).toBeVisible();
  for (const nome of ['Baixar a imagem', 'Copiar só o texto', 'Copiar o link', 'Imprimir cartaz para o mural']) {
    await expect(page.getByRole('button', { name: nome })).toHaveClass(/botao-ter/);
  }
  const ata = page.getByRole('region', { name: 'E depois da reunião?' });
  await expect(ata).toContainText('A ata já abre com a pauta.');
  await expect(ata.getByRole('button', { name: 'Fazer a ata' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fazer outro' })).toBeVisible();
});
