// C1 Sérgio, 48, cego, conselho de saúde. Android grande, 4G, "TalkBack" simulado: só Tab, Shift+Tab, Enter, Espaço e setas.
// Reunião inteira + ata. Registra em .saida/c1-*.md. Personagem fictício.
import { APARELHOS, anotar, condicoes, cronometro, escutarAnuncios, expect, focado, foto, guardar, lerAnuncios, medirAlvos, ORGANIZACAO, regioesVivas, test, titulo } from './apoio-sim';
import { digitar, digitarDia, lerTela, ordemVisual, tabAte, type Parada } from './teclado-sim';

test.use({ ...APARELHOS['AND-GRANDE'], compartilhar: 'aceita' });

const D = 'c1-reuniao';

async function enter(page: import('@playwright/test').Page) {
  await page.keyboard.press('Enter');
}

test('C1: reunião inteira e ata, só por foco', async ({ page, erros, consoleErros, foraDoSite }) => {
  const fim = cronometro();
  let toques = 0;
  const conta = page.keyboard.press.bind(page.keyboard);
  page.keyboard.press = async (k: string, o?: { delay?: number }) => { toques++; return conta(k, o); };
  const trilha: Parada[] = [];

  await condicoes(page, { rede: '4G' });
  await escutarAnuncios(page);
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  anotar(D, `# C1 Sérgio — reunião e ata (AND-GRANDE, 4G, só teclado)\n`);
  await lerTela(page, 'c1-00-inicio', D);
  anotar(D, `Ordem visual x foco no início: ${JSON.stringify(await ordemVisual(page))}`);

  // ---- início: foco chega à porta pelo Tab
  const r0 = await tabAte(page, 'a[href="#/fazer/reuniao"]', { arquivo: D, trilha, max: 15 });
  expect.soft(r0.achou, 'achou a porta da reunião por Tab').toBe(true);
  anotar(D, `Tabs até a porta da reunião: ${r0.paradas.length}`);
  await enter(page);
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  await page.waitForTimeout(500);

  // ---- passo 1
  anotar(D, `\n## Passo 1`);
  anotar(D, `h1 lido: "${(await titulo(page).innerText()).replace(/\s+/g, ' ')}" | textContent: "${(await titulo(page).textContent())?.replace(/\s+/g, ' ')}"`);
  await lerTela(page, 'c1-01-passo1', D);
  const foco1 = await page.evaluate(() => document.activeElement?.tagName + '#' + document.activeElement?.id);
  anotar(D, `Foco ao entrar no passo 1: ${foco1}`);
  expect.soft(foco1.startsWith('H1'), 'foco vai ao h1 ao entrar no passo 1').toBe(true);
  anotar(D, `Ordem visual x foco no passo 1: ${JSON.stringify(await ordemVisual(page))}`);
  anotar(D, `Alvos pequenos: ${JSON.stringify((await medirAlvos(page)).pequenos)}`);
  // Percorre sem digitar para registrar o que o leitor diria em cada parada.
  const lista = await tabAte(page, '#fluxo-continuar', { arquivo: D, trilha, max: 20 });
  anotar(D, `Paradas até Continuar no passo 1: ${lista.paradas.length}`);
  // volta e preenche
  await digitar(page, '#fluxo-titulo', 'Reunião do conselho: pauta de novembro', { arquivo: D, trilha });
  await digitar(page, '#fluxo-organizacao', ORGANIZACAO, { arquivo: D, trilha });
  await digitar(page, '#fluxo-pauta', 'Verba da farmácia\nHorário da unidade\nMutirão de vacinação', { arquivo: D, trilha });
  expect.soft(await lerAnuncios(page), 'digitar em campos não gera aviso').toEqual([]);
  // Prévia: descrição do canvas
  const desc = await page.locator('#fluxo-mini-canvas').getAttribute('aria-label');
  anotar(D, `Descrição da miniatura (canvas role=img) no passo 1: "${desc}"`);
  await tabAte(page, '#fluxo-ver-maior', { arquivo: D, trilha, voltar: true, max: 20 });
  await enter(page);
  await page.waitForTimeout(400);
  anotar(D, `\n### "Ver a prévia maior" aberto`);
  anotar(D, `Foco após abrir: ${await focado(page)}`);
  anotar(D, `Descrição do canvas grande: "${await page.locator('#fluxo-dialogo-canvas').getAttribute('aria-label')}"`);
  await lerTela(page, 'c1-01b-dialogo', D);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  anotar(D, `Foco após Esc: ${await focado(page)}`);
  await foto(page, 'c1-passo1');

  // continuar
  await tabAte(page, '#fluxo-continuar', { trilha, max: 30 });
  await enter(page);
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await page.waitForTimeout(400);

  // ---- passo 2
  anotar(D, `\n## Passo 2`);
  anotar(D, `h1: "${(await titulo(page).innerText()).replace(/\s+/g, ' ')}"`);
  await lerTela(page, 'c1-02-passo2', D);
  anotar(D, `Foco ao entrar: ${await focado(page)}`);
  // atalhos do dia (grupo)
  await tabAte(page, '.fluxo-atalho', { arquivo: D, trilha });
  anotar(D, `Atalho do dia: ${await focado(page)}`);
  const dia = await digitarDia(page, '21/11/2026', { arquivo: D, trilha });
  anotar(D, `Dia escrito só pelo teclado: valor "${dia.valor}" (${dia.porTeclas ? 'as teclas bastaram' : 'PRECISOU preencher pelo valor'}); tipo do campo: ${await page.locator('#fluxo-data').getAttribute('type')}`);
  await page.keyboard.press('Tab'); // sai do campo: dispara o aviso do dia
  await page.waitForTimeout(500);
  anotar(D, `Avisos ao sair do campo Dia (extenso): ${JSON.stringify(await lerAnuncios(page))} | regiões: ${JSON.stringify(await regioesVivas(page))}`);
  await digitar(page, '#fluxo-hora', '1930', { arquivo: D, trilha });
  anotar(D, `Hora depois de digitar: ${await page.locator('#fluxo-hora').inputValue()}`);
  await digitar(page, '#fluxo-local', 'Salão da Associação, Rua das Acácias 120', { arquivo: D, trilha });
  // erro: apaga a hora e tenta continuar para ouvir o erro
  await page.locator('#fluxo-hora').fill('');
  await tabAte(page, '#fluxo-continuar', { trilha });
  await enter(page);
  await page.waitForTimeout(500);
  anotar(D, `\n### Erro (hora vazia)`);
  anotar(D, `Foco depois do erro: ${await focado(page)}`);
  anotar(D, `Avisos: ${JSON.stringify(await lerAnuncios(page))}`);
  anotar(D, `Mensagem de erro visível: ${await page.locator('.campo-erro:not([hidden])').allInnerTexts().then((x) => JSON.stringify(x))}`);
  anotar(D, `aria-invalid/describedby do campo com foco: ${await page.evaluate(() => { const e = document.activeElement as HTMLElement; return `${e.getAttribute('aria-invalid')} | ${e.getAttribute('aria-describedby')} | ${(e.getAttribute('aria-describedby') ?? '').split(' ').map((i) => document.getElementById(i)?.textContent?.trim()).filter(Boolean).join(' / ')}`; })}`);
  await foto(page, 'c1-erro-hora');
  await page.keyboard.type('1930');
  await tabAte(page, '#fluxo-continuar', { trilha });
  await enter(page);
  await expect(titulo(page)).toContainText('Passo 3 de 3');
  await page.waitForTimeout(600);

  // ---- passo 3
  anotar(D, `\n## Passo 3`);
  anotar(D, `h1: "${(await titulo(page).innerText()).replace(/\s+/g, ' ')}"`);
  await lerTela(page, 'c1-03-passo3', D);
  anotar(D, `Foco ao entrar: ${await focado(page)}`);
  anotar(D, `Descrição do canvas da prévia: "${await page.locator('#fluxo-canvas').getAttribute('aria-label')}"`);
  anotar(D, `Ordem visual x foco no passo 3: ${JSON.stringify(await ordemVisual(page))}`);
  // formato: radiogroup
  await tabAte(page, 'input[name=fluxo-formato]', { arquivo: D, trilha });
  anotar(D, `Formato, ao chegar: ${await focado(page)} | legend: ${await page.locator('#fluxo-formato legend').innerText()}`);
  await page.keyboard.press('ArrowRight');
  anotar(D, `Formato, seta direita: ${await focado(page)} | avisos: ${JSON.stringify(await lerAnuncios(page))} | explicação: ${await page.locator('#fluxo-formato-expl').innerText()}`);
  await page.keyboard.press('ArrowLeft');
  // cor
  await tabAte(page, 'input[name=fluxo-paleta]', { arquivo: D, trilha });
  anotar(D, `Cor, ao chegar: ${await focado(page)} | legend: "${(await page.locator('#fluxo-cor legend').innerText()).replace(/\s+/g, ' ')}"`);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('ArrowRight');
    anotar(D, `Cor, seta ${i + 1}: ${await focado(page)} | legend agora: "${await page.locator('#fluxo-cor legend').innerText()}" | avisos: ${JSON.stringify(await lerAnuncios(page))}`);
  }
  await foto(page, 'c1-passo3');
  // mais opções (summary)
  await tabAte(page, 'summary', { arquivo: D, trilha });
  anotar(D, `Mais opções: ${await focado(page)} | expandido? ${await page.locator('details.fluxo-mais').evaluate((d: HTMLDetailsElement) => d.open)}`);
  await page.keyboard.press('Space');
  anotar(D, `Depois de Espaço: expandido? ${await page.locator('details.fluxo-mais').evaluate((d: HTMLDetailsElement) => d.open)}`);
  await tabAte(page, '#fluxo-continuar', { arquivo: D, trilha, max: 15 });
  await enter(page);

  // ---- Pronto
  await expect(titulo(page)).toContainText('Pronto!');
  await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…', { timeout: 20_000 });
  await page.waitForTimeout(700);
  anotar(D, `\n## Pronto`);
  anotar(D, `h1: "${(await titulo(page).innerText()).replace(/\s+/g, ' ')}"`);
  await lerTela(page, 'c1-04-pronto', D);
  anotar(D, `Foco ao entrar: ${await focado(page)}`);
  anotar(D, `Regiões vivas: ${JSON.stringify(await regioesVivas(page))}`);
  anotar(D, `Ordem visual x foco no Pronto: ${JSON.stringify(await ordemVisual(page))}`);
  anotar(D, `Alvos pequenos: ${JSON.stringify((await medirAlvos(page)).pequenos)}`);
  const todos = await page.getByRole('button').evaluateAll((bs) => bs.map((b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim().replace(/\s+/g, ' ')));
  anotar(D, `Todos os botões do Pronto: ${JSON.stringify(todos)}`);
  await foto(page, 'c1-pronto');
  // percorre o Pronto
  await tabAte(page, '#fluxo-mandar', { arquivo: D, trilha, max: 20 });
  anotar(D, `Mandar: descrição lida (aria-describedby): ${await page.evaluate(() => (document.activeElement!.getAttribute('aria-describedby') ?? '').split(' ').map((i) => document.getElementById(i)?.textContent?.trim()).filter(Boolean).join(' / '))}`);
  await enter(page);
  await page.waitForTimeout(500);
  anotar(D, `\n### Depois de "Mandar no WhatsApp"`);
  const painel = await page.locator('#fluxo-confirma').isVisible();
  anotar(D, `Painel de confirmação do Pronto visível (só abre sem link ou com órgão público): ${painel} | foco: ${await focado(page)} | avisos: ${JSON.stringify(await lerAnuncios(page))}`);
  const partilhas = await page.evaluate(() => window.__partilhas);
  anotar(D, `Compartilhado (${partilhas.length}): ${JSON.stringify(partilhas).slice(0, 600)}`);
  if (partilhas[0]) guardar('c1-texto-mandado.txt', partilhas[0].texto);
  expect.soft(partilhas.length, 'o texto foi mandado uma vez').toBe(1);
  // copiar o link
  await tabAte(page, '#fluxo-copiar-link', { arquivo: D, trilha, max: 20 });
  await lerAnuncios(page);
  await enter(page);
  await page.waitForTimeout(500);
  const anunc = await lerAnuncios(page);
  anotar(D, `Copiar o link: foco ${await focado(page)} | avisos (${anunc.length}): ${JSON.stringify(anunc)}`);
  anotar(D, `Cópias: ${JSON.stringify(await page.evaluate(() => window.__copias)).slice(0, 300)}`);
  // copiar texto
  await tabAte(page, '#fluxo-copiar-texto', { arquivo: D, trilha, voltar: true, max: 20 });
  await enter(page);
  await page.waitForTimeout(400);
  anotar(D, `Copiar só o texto: avisos ${JSON.stringify(await lerAnuncios(page))}`);
  anotar(D, `Tempo até aqui (reunião): ${fim()} ms; teclas: ${toques}`);
  const tempoReuniao = fim();

  // ---- ponte para a ata
  await tabAte(page, '#fluxo-ata', { arquivo: D, trilha, max: 30 });
  anotar(D, `Fazer a ata: ${await focado(page)}`);
  await enter(page);
  await expect(titulo(page)).toHaveText('Depois da reunião: a ata');
  await page.waitForTimeout(600);
  anotar(D, `\n## Ata`);
  await lerTela(page, 'c1-05-ata', D);
  anotar(D, `Foco ao entrar na ata: ${await focado(page)}`);
  anotar(D, `Ordem visual x foco na ata: ${JSON.stringify(await ordemVisual(page))}`);
  anotar(D, `Alvos pequenos: ${JSON.stringify((await medirAlvos(page)).pequenos)}`);
  await foto(page, 'c1-ata', true);
  await digitar(page, '#ata-presentes', 'Pessoa Um\nPessoa Dois\nPessoa Três', { arquivo: D, trilha });
  await digitar(page, '[id="ata-pontos-0-decidido"]', 'Comprar os medicamentos em falta.', { arquivo: D, trilha });
  // acrescentar encaminhamento
  await tabAte(page, '#acrescentar-encaminhamentos', { arquivo: D, trilha, max: 40 });
  await lerAnuncios(page);
  await enter(page);
  await page.waitForTimeout(400);
  anotar(D, `Acrescentar encaminhamento: foco ${await focado(page)} | avisos ${JSON.stringify(await lerAnuncios(page))}`);
  const e0 = page.locator('[id="ata-encaminhamentos-0-o-que"], [id^="ata-encaminhamentos-0-"]').first();
  anotar(D, `Primeiro campo do encaminhamento: ${await e0.getAttribute('id')}`);
  // botão de reordenar: nomes
  const nomesAta = await page.getByRole('button').evaluateAll((bs) => bs.map((b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim().replace(/\s+/g, ' ')));
  anotar(D, `Botões da ata: ${JSON.stringify(nomesAta)}`);
  // ver ata pronta
  await tabAte(page, '[data-acao="ver-ata"]', { arquivo: D, trilha, max: 60 });
  await lerAnuncios(page);
  await enter(page);
  await page.waitForTimeout(500);
  anotar(D, `Ver a ata pronta: foco ${await focado(page)} | avisos ${JSON.stringify(await lerAnuncios(page))}`);
  await lerTela(page, 'c1-06-ata-pronta', D);
  // copiar texto da ata
  await tabAte(page, '[data-acao="copiar-ata"]', { arquivo: D, trilha, voltar: true, max: 60 });
  anotar(D, `Copiar o texto da ata: descrição lida: ${await page.evaluate(() => (document.activeElement!.getAttribute('aria-describedby') ?? '').split(' ').map((i) => document.getElementById(i)?.textContent?.trim()).filter(Boolean).join(' / '))}`);
  await enter(page);
  await page.waitForTimeout(500);
  anotar(D, `Copiar a ata: foco ${await focado(page)} | avisos ${JSON.stringify(await lerAnuncios(page))} | cópias: ${(await page.evaluate(() => window.__copias)).length}`);
  await tabAte(page, '[data-acao="imprimir-ata"]', { arquivo: D, trilha, voltar: true, max: 60 });
  await enter(page);
  await page.waitForTimeout(400);
  anotar(D, `Imprimir: impressões ${await page.evaluate(() => window.__impressoes)} | avisos ${JSON.stringify(await lerAnuncios(page))} | foco ${await focado(page)}`);
  const total = fim();
  anotar(D, `\n## Resumo\nTempo total: ${total} ms (${Math.round(total / 1000)} s) | reunião até a ata: ${tempoReuniao} ms | teclas: ${toques} | erros JS: ${JSON.stringify(erros)} | erros console: ${JSON.stringify(consoleErros)} | fora do site: ${JSON.stringify(foraDoSite)}`);
  anotar(D, `Foco trilha: ${trilha.length} paradas; sem indicador: ${trilha.filter((p) => !p.medida.visivel).map((p) => p.leitura).join(' ; ') || 'nenhuma'}; cobertas: ${trilha.filter((p) => p.medida.cobertoPor).map((p) => p.leitura + ' por ' + p.medida.cobertoPor).join(' ; ') || 'nenhuma'}`);
  expect(erros).toEqual([]);
  expect(foraDoSite).toEqual([]);
});

test('C1: painel do órgão público (diálogo) com o foco', async ({ page }) => {
  // O painel "Isto ainda tem partes do exemplo" não existe mais (o exemplo é só ilustrativo). O painel que sobra no
  // passo 1 é o do órgão público: <dialog id="fluxo-orgao"> com "Mudar o texto" e "Seguir assim".
  const D2 = 'c1-painel';
  await condicoes(page, { rede: '4G' });
  await escutarAnuncios(page);
  await page.goto('./#/fazer/aviso');
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  await digitar(page, '#fluxo-titulo', 'Defesa Civil: aviso de chuva forte', { arquivo: D2 });
  await lerAnuncios(page);
  await tabAte(page, '#fluxo-continuar', { max: 25 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const orgao = page.locator('dialog#fluxo-orgao');
  anotar(D2, `Após Continuar (órgão público): painel ${await orgao.isVisible()} | modal ${await orgao.evaluate((el: HTMLDialogElement) => el.matches(':modal')).catch(() => false)} | foco ${await focado(page)} | h1 ${(await titulo(page).innerText()).replace(/\s+/g, ' ')}`);
  anotar(D2, `Avisos vivos: ${JSON.stringify(await lerAnuncios(page))}`);
  anotar(D2, `Painel texto: ${(await orgao.innerText().catch(() => '')).replace(/\s+/g, ' ')}`);
  anotar(D2, `Nome acessível: ${await orgao.getAttribute('aria-labelledby')} | descrição: ${await orgao.getAttribute('aria-describedby')}`);
  await foto(page, 'c1-painel-orgao');
  // Tab dentro do painel
  const a = await tabAte(page, '#fluxo-orgao-seguir', { arquivo: D2, max: 6 });
  anotar(D2, `Tab dentro do painel chegou ao 'Seguir assim' em ${a.paradas.length} toques: ${await focado(page)}`);
  await tabAte(page, '#fluxo-nada', { arquivo: D2, max: 4 });
  anotar(D2, `Tab além do painel: ${await focado(page)}`);
  // Esc = "Mudar o texto"
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  anotar(D2, `Depois de Esc: painel visível ${await orgao.isVisible()} | foco ${await focado(page)} | h1 ${(await titulo(page).innerText()).replace(/\s+/g, ' ')}`);
});

test('C1: a descrição da prévia acompanha o que ele digita?', async ({ page }) => {
  // A miniatura (canvas role=img) só leva um nome curto ("Prévia da imagem, com exemplo no que falta"); a descrição
  // completa do que está escrito fica na prévia grande, que abre em "Ver maior".
  const D3 = 'c1-previa';
  await condicoes(page, { rede: '4G' });
  await page.goto('./#/fazer/aviso');
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  const antes = await page.locator('#fluxo-mini-canvas').getAttribute('aria-label');
  await digitar(page, '#fluxo-titulo', 'Mutirão de limpeza do córrego');
  const logo = await page.locator('#fluxo-mini-canvas').getAttribute('aria-label');
  await page.waitForTimeout(1500);
  const depois = await page.locator('#fluxo-mini-canvas').getAttribute('aria-label');
  anotar(D3, `Nome da miniatura antes: ${antes}
Logo depois de digitar: ${logo}
1,5 s depois: ${depois}`);
  await page.keyboard.press('Tab');
  const ao_sair = await page.locator('#fluxo-mini-canvas').getAttribute('aria-label');
  anotar(D3, `Nome da miniatura ao sair do campo: ${ao_sair}`);
  // A descrição completa: "Ver maior" abre a prévia grande.
  await page.locator('#fluxo-ver-maior').click();
  await page.waitForTimeout(800);
  const grande = await page.locator('#fluxo-dialogo-canvas').getAttribute('aria-label');
  anotar(D3, `Descrição da prévia grande: ${grande}`);
  anotar(D3, `A prévia grande cita o título digitado: ${grande?.includes('Mutirão de limpeza')}`);
  expect.soft(grande).toContain('Mutirão de limpeza');
});

test('C1: onde fica o foco depois de "Seguir assim" no painel do órgão?', async ({ page }) => {
  const D4 = 'c1-painel-foco';
  await escutarAnuncios(page);
  await page.goto('./#/fazer/aviso');
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  await digitar(page, '#fluxo-titulo', 'Defesa Civil: aviso de chuva forte', { arquivo: D4 });
  await tabAte(page, '#fluxo-continuar', { max: 25 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  anotar(D4, `Painel do órgão aberto, foco: ${await focado(page)} | avisos: ${JSON.stringify(await lerAnuncios(page))}`);
  await page.keyboard.press('Tab');
  anotar(D4, `Tab: ${await focado(page)}`);
  await page.keyboard.press('Enter'); // "Seguir assim"
  await page.waitForTimeout(800);
  anotar(D4, `Depois de "Seguir assim": painel visível ${await page.locator('dialog#fluxo-orgao').isVisible()} | h1 ${(await titulo(page).innerText()).replace(/\s+/g, ' ')} | foco: ${await focado(page)} | avisos: ${JSON.stringify(await lerAnuncios(page))}`);
  for (let i = 0; i < 2; i++) {
    await tabAte(page, '#fluxo-continuar', { max: 25 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await expect(titulo(page)).toContainText('Pronto!');
  await lerAnuncios(page);
  await tabAte(page, '#fluxo-mandar', { max: 25 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  anotar(D4, `Mandar no Pronto (órgão já conferido no passo 1): painel do Pronto visível ${await page.locator('#fluxo-confirma').isVisible()} | partilhas ${(await page.evaluate(() => window.__partilhas)).length} | foco ${await focado(page)} | avisos ${JSON.stringify(await lerAnuncios(page))}`);
});
