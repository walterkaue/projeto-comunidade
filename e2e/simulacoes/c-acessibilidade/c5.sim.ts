// C5 Renan, 22, só teclado (sem mouse), associação de pessoas com deficiência. PC grande.
// Evento e aviso até o Pronto, "Ver maior", "Mais opções", página do evento; alto contraste; compartilhar em 4 modos; barra fixa em zoom.
// Registra em .saida/c5-*.md e fotos em .fotos/c5-*. Personagem fictício.
import type { Page } from '@playwright/test';
import { APARELHOS, anotar, cronometro, escutarAnuncios, expect, focado, foto, lerAnuncios, ORGANIZACAO, regioesVivas, test, titulo, type Compartilhar } from './apoio-sim';
import { digitar, lerTela, medirFoco, ordemVisual, tabAte, type Parada } from './teclado-sim';

test.use({ ...APARELHOS['PC-GRANDE'] });

function resumoFoco(D: string, trilha: Parada[], rotulo: string) {
  const sem = trilha.filter((p) => !p.medida.visivel && p.medida.quem !== 'body');
  const cob = trilha.filter((p) => p.medida.cobertoPor);
  anotar(D, `\n### Resumo do foco — ${rotulo}\nParadas: ${trilha.length}\nSem indicador (computado): ${sem.map((p) => p.leitura).join(' ; ') || 'nenhuma'}\nCobertas por algo fixo: ${cob.map((p) => `${p.leitura} por ${p.medida.cobertoPor}`).join(' ; ') || 'nenhuma'}`);
}

/** Do início até o Pronto, só com Tab/Enter. Devolve o tempo e as teclas. */
async function fazerPorTeclado(page: Page, tipo: 'evento' | 'aviso', D: string, o: { prefixo: string; fotos?: boolean; verMaior?: boolean; maisOpcoes?: boolean; trilha: Parada[] }) {
  const { trilha, prefixo } = o;
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  if (o.fotos) await foto(page, `${prefixo}-00-inicio`);
  const r = await tabAte(page, `a[href="#/fazer/${tipo}"]`, { arquivo: D, trilha, max: 15 });
  anotar(D, `Tabs até a porta "${tipo}": ${r.paradas.length}`);
  await page.keyboard.press('Enter');
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  await page.waitForTimeout(300);
  anotar(D, `\n## ${tipo} — passo 1 | foco ao entrar: ${await focado(page)}`);
  if (o.fotos) await foto(page, `${prefixo}-01-passo1`);
  await digitar(page, '#fluxo-titulo', tipo === 'evento' ? 'Roda de conversa sobre acessibilidade' : 'Rampa de acesso fechada para obra', { arquivo: D, trilha });
  await digitar(page, '#fluxo-organizacao', ORGANIZACAO, { arquivo: D, trilha });
  await digitar(page, '#fluxo-texto', tipo === 'aviso' ? 'A rampa da entrada lateral fica fechada até sexta.' : 'Conversa aberta, com intérprete de Libras.', { arquivo: D, trilha });
  anotar(D, `Ordem visual x foco (passo 1): ${JSON.stringify(await ordemVisual(page))}`);
  await tabAte(page, '#fluxo-continuar', { arquivo: D, trilha });
  await page.keyboard.press('Enter');
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await page.waitForTimeout(300);
  anotar(D, `\n## ${tipo} — passo 2 | foco ao entrar: ${await focado(page)}`);
  if (o.fotos) await foto(page, `${prefixo}-02-passo2`);
  if (tipo === 'evento') {
    await digitar(page, '#fluxo-data', '21/11/2026', { arquivo: D, trilha });
    await digitar(page, '#fluxo-hora', '1500', { arquivo: D, trilha });
    await digitar(page, '#fluxo-local', 'Centro Comunitário, Rua das Acácias 120', { arquivo: D, trilha });
  } else {
    // aviso pode pular: usa o botão "Pular este passo" por foco
    const p = await tabAte(page, '#fluxo-pular', { arquivo: D, trilha, max: 15 });
    anotar(D, `Pular este passo achado por Tab: ${p.achou}`);
  }
  if (tipo === 'evento') {
    await tabAte(page, '#fluxo-continuar', { arquivo: D, trilha });
    await page.keyboard.press('Enter');
  } else {
    await page.keyboard.press('Enter');
  }
  await expect(titulo(page)).toContainText('Passo 3 de 3');
  await page.waitForTimeout(600);
  anotar(D, `\n## ${tipo} — passo 3 | foco ao entrar: ${await focado(page)}`);
  anotar(D, `Ordem visual x foco (passo 3): ${JSON.stringify(await ordemVisual(page))}`);
  if (o.fotos) await foto(page, `${prefixo}-03-passo3`);
  if (o.verMaior) {
    await tabAte(page, '#fluxo-ver-maior', { arquivo: D, trilha });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    anotar(D, `\n### Ver maior aberto | foco: ${await focado(page)}`);
    if (o.fotos) await foto(page, `${prefixo}-03b-ver-maior`);
    const pilha: string[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      pilha.push(await focado(page));
    }
    anotar(D, `4 Tabs dentro do Ver maior (prende o foco?): ${JSON.stringify(pilha)}`);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    anotar(D, `Esc fecha? dialog aberto: ${await page.locator('#fluxo-dialogo').evaluate((d: HTMLDialogElement) => d.open)} | foco volta: ${await focado(page)}`);
  }
  // cor: setas
  await tabAte(page, 'input[name=fluxo-paleta]', { arquivo: D, trilha });
  await page.keyboard.press('ArrowRight');
  anotar(D, `Cor com seta: ${await focado(page)}`);
  if (o.fotos) await foto(page, `${prefixo}-03c-cor-escolhida`);
  if (o.maisOpcoes) {
    await tabAte(page, 'summary', { arquivo: D, trilha });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    anotar(D, `Mais opções aberto: ${await page.locator('details.fluxo-mais').evaluate((d: HTMLDetailsElement) => d.open)}`);
    if (o.fotos) await foto(page, `${prefixo}-03d-mais-opcoes`);
    await tabAte(page, '#fluxo-rodape', { arquivo: D, trilha });
    await page.keyboard.press('Space');
    anotar(D, `Rodapé desmarcado: ${!(await page.locator('#fluxo-rodape').isChecked())}`);
    await page.keyboard.press('Space');
  }
  await tabAte(page, '#fluxo-continuar', { arquivo: D, trilha });
  await page.keyboard.press('Enter');
  await expect(titulo(page)).toContainText('Pronto!');
  if (tipo === 'evento') await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…', { timeout: 20_000 });
  await page.waitForTimeout(600);
  anotar(D, `\n## ${tipo} — Pronto | foco ao entrar: ${await focado(page)}`);
  anotar(D, `Ordem visual x foco (Pronto): ${JSON.stringify(await ordemVisual(page))}`);
  if (o.fotos) await foto(page, `${prefixo}-04-pronto`, !(await page.evaluate(() => matchMedia('(forced-colors: active)').matches))); // foto de página inteira zera a emulação de alto contraste
}

test('C5: evento e aviso até o Pronto (cores normais)', async ({ page, erros, foraDoSite }) => {
  const D = 'c5-teclado';
  await escutarAnuncios(page);
  const trilha: Parada[] = [];
  anotar(D, `# C5 Renan — só teclado (PC-GRANDE 1920x1080)\n`);
  let toques = 0;
  const conta = page.keyboard.press.bind(page.keyboard);
  page.keyboard.press = async (k: string, o?: { delay?: number }) => { toques++; return conta(k, o); };

  let fim = cronometro();
  await fazerPorTeclado(page, 'evento', D, { prefixo: 'c5-evento', fotos: true, verMaior: true, maisOpcoes: true, trilha });
  const tEvento = fim();
  const tq1 = toques;
  anotar(D, `Tempo do evento: ${tEvento} ms; teclas: ${tq1}`);
  // Pronto: percorrer
  await lerAnuncios(page);
  await tabAte(page, '#fluxo-mandar', { arquivo: D, trilha });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  anotar(D, `Mandar (aceita): painel ${await page.locator('#fluxo-confirma').isVisible()} | foco ${await focado(page)} | avisos ${JSON.stringify(await lerAnuncios(page))} | partilhas ${(await page.evaluate(() => window.__partilhas)).length}`);
  // página do evento pelo link
  await tabAte(page, '#fluxo-pagina', { arquivo: D, trilha, max: 30 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  anotar(D, `\n## Página do evento | h1: "${await titulo(page).innerText()}" | foco: ${await focado(page)} | url: ${page.url().slice(0, 60)}`);
  await lerTela(page, 'c5-10-pagina-evento', D);
  await foto(page, 'c5-pagina-evento', true);
  const trilhaEv: Parada[] = [];
  const ev = await tabAte(page, '#nada-aqui', { arquivo: D, trilha: trilhaEv, max: 25 });
  anotar(D, `Paradas na página do evento: ${ev.paradas.length}`);
  anotar(D, `Ordem visual x foco (página do evento): ${JSON.stringify(await ordemVisual(page))}`);
  // QR
  const qr = await tabAte(page, '[data-qr]', { arquivo: D, trilha: trilhaEv, max: 25 });
  if (qr.achou) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    anotar(D, `QR do link: aberto ${await page.locator('[data-qr]').getAttribute('aria-expanded')} | foco ${await focado(page)} | img: ${await page.locator('[data-qr-area] [role=img], [data-qr-area] img, [data-qr-area] canvas').first().getAttribute('aria-label').catch(() => 'sem')}`);
  }
  resumoFoco(D, [...trilha, ...trilhaEv], 'evento');
  // aviso
  fim = cronometro();
  const trilhaAv: Parada[] = [];
  const antesToques = toques;
  await fazerPorTeclado(page, 'aviso', D, { prefixo: 'c5-aviso', fotos: true, verMaior: true, maisOpcoes: true, trilha: trilhaAv });
  anotar(D, `Tempo do aviso: ${fim()} ms; teclas: ${toques - antesToques}`);
  await tabAte(page, '#fluxo-mandar', { arquivo: D, trilha: trilhaAv });
  await lerAnuncios(page);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  anotar(D, `Mandar aviso (exemplo trocado): painel ${await page.locator('#fluxo-confirma').isVisible()} | avisos ${JSON.stringify(await lerAnuncios(page))} | partilhas ${(await page.evaluate(() => window.__partilhas)).length}`);
  resumoFoco(D, trilhaAv, 'aviso');
  anotar(D, `\nTempo total: evento ${tEvento} ms (${tq1} teclas); erros JS ${JSON.stringify(erros)}; fora do site ${JSON.stringify(foraDoSite)}`);
  expect(erros).toEqual([]);
  expect(foraDoSite).toEqual([]);
});

test.describe('alto contraste do Windows', () => {
  test('C5: forced-colors ativo — evento e aviso', async ({ page, erros }) => {
    const D = 'c5-altocontraste';
    await page.emulateMedia({ forcedColors: 'active' });
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
    const trilha: Parada[] = [];
    anotar(D, `# C5 alto contraste (forced-colors: active)\n`);
    await fazerPorTeclado(page, 'evento', D, { prefixo: 'c5-ac-evento', fotos: true, verMaior: true, maisOpcoes: true, trilha });
    // medidas de bolinha / ✓ / bordas dos campos nesta tela? voltar ao passo 3
    await page.getByRole('button', { name: 'Mudar algo' }).click();
    await expect(titulo(page)).toContainText('Passo 1 de 3');
    await page.locator('#fluxo-continuar').click();
    await page.locator('#fluxo-continuar').click();
    await expect(titulo(page)).toContainText('Passo 3 de 3');
    await page.waitForTimeout(500);
    const medidas = await page.evaluate(() => {
      const forcado = matchMedia('(forced-colors: active)').matches;
      const cor = (e: Element) => { const s = getComputedStyle(e); return { fundo: s.backgroundColor, borda: `${s.borderTopStyle} ${s.borderTopWidth} ${s.borderTopColor}`, cor: s.color, ajuste: s.forcedColorAdjust, sombra: s.boxShadow === 'none' ? '' : s.boxShadow, contorno: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}` }; };
      const amostras = [...document.querySelectorAll('.fluxo-amostra')].map((a) => ({ paleta: (a as HTMLElement).dataset.paleta, ...cor(a) }));
      const marcado = document.querySelector('.fluxo-bola-item input:checked + label');
      const marcadoAfter = marcado ? (() => { const s = getComputedStyle(marcado, '::after'); return { content: s.content, cor: s.color, fundo: s.backgroundColor, borda: s.borderTopColor, display: s.display }; })() : null;
      const bolaLabel = marcado ? cor(marcado) : null;
      const seg = document.querySelector('.fluxo-seg-item input:checked + label');
      const segBefore = seg ? (() => { const s = getComputedStyle(seg.querySelector('.fluxo-seg-nome')!, '::before'); return { content: s.content, cor: s.color }; })() : null;
      const naoMarcadoSeg = document.querySelector('.fluxo-seg-item input:not(:checked) + label');
      const campo = document.querySelector('.campo-entrada');
      const botao = document.querySelector('.botao');
      const botaoSec = document.querySelector('.botao-sec');
      return { forcado, amostras, marcadoAfter, bolaLabel, segBefore, seg: seg ? cor(seg) : null, segNao: naoMarcadoSeg ? cor(naoMarcadoSeg) : null, campo: campo ? cor(campo) : null, botao: botao ? cor(botao) : null, botaoSec: botaoSec ? cor(botaoSec) : null };
    });
    anotar(D, `Medidas no alto contraste (passo 3): ${JSON.stringify(medidas, null, 1)}`);
    const distintas = new Set(medidas.amostras.map((a) => a.fundo));
    anotar(D, `Cores distintas das 6 bolinhas: ${distintas.size}`);
    await foto(page, 'c5-ac-passo3-bolinhas');
    // clicar nas bolinhas não é permitido ao personagem; só foto de cada uma com setas
    await page.locator('input[name=fluxo-paleta]:checked').focus();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowRight');
      await foto(page, `c5-ac-bolinha-${i}`);
    }
    // passo 1 vazio com erro: borda do campo
    await page.goto('./#/fazer/aviso');
    await page.locator('#fluxo-titulo').focus();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await tabAte(page, '#fluxo-continuar');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await foto(page, 'c5-ac-erro-campo');
    anotar(D, `Campo com erro (alto contraste): ${JSON.stringify(await page.evaluate(() => { const e = document.activeElement as HTMLElement; const s = getComputedStyle(e); return { quem: e.id, borda: `${s.borderTopStyle} ${s.borderTopWidth} ${s.borderTopColor}`, contorno: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}` }; }))}`);
    await tabAte(page, '#nada', { max: 3 });
    await foto(page, 'c5-ac-foco-botoes');
    resumoFoco(D, trilha, 'alto contraste (evento)');
    expect(erros).toEqual([]);
  });
});

test.describe('barra fixa e foco (zoom 400%)', () => {
  test.use({ viewport: { width: 480, height: 270 } });
  test('C5: Voltar/Continuar cobre o elemento focado?', async ({ page }) => {
    const D = 'c5-barra';
    const trilha: Parada[] = [];
    anotar(D, `# C5 barra fixa com zoom 400% (viewport 480x270)\n`);
    await fazerPorTeclado(page, 'evento', D, { prefixo: 'c5-zoom', fotos: false, verMaior: false, maisOpcoes: true, trilha });
    resumoFoco(D, trilha, 'zoom 400%');
    const fora = trilha.filter((p) => p.medida.foraDaTela);
    anotar(D, `Paradas com o elemento fora da tela: ${fora.map((p) => p.leitura).join(' ; ') || 'nenhuma'}`);
    await foto(page, 'c5-zoom-pronto');
  });
  test('C5: barra no passo 1 com cada Tab', async ({ page }) => {
    const D = 'c5-barra';
    await page.goto('./#/fazer/reuniao');
    await expect(titulo(page)).toContainText('Passo 1 de 3');
    const trilha: Parada[] = [];
    await tabAte(page, '#fluxo-nada', { arquivo: D, trilha, max: 8 });
    const cob = trilha.filter((p) => p.medida.cobertoPor);
    anotar(D, `Reunião passo 1 em 480x270: cobertas ${cob.map((p) => p.leitura + ' por ' + p.medida.cobertoPor).join(' ; ') || 'nenhuma'}`);
    await foto(page, 'c5-zoom-passo1');
    // altura que a barra e a miniatura ocupam
    anotar(D, `Altura ocupada por fixos: ${JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.fluxo-barra, .fluxo-mini')].map((e) => ({ c: e.className, pos: getComputedStyle(e).position, h: Math.round(e.getBoundingClientRect().height), top: Math.round(e.getBoundingClientRect().top) }))))}`);
  });
});

for (const modo of ['ausente', 'cancela', 'recusa-arquivo'] as Compartilhar[]) {
  test.describe(`compartilhar: ${modo}`, () => {
    test.use({ compartilhar: modo });
    test(`C5: Mandar no WhatsApp com compartilhar ${modo}`, async ({ page, erros }) => {
      const D = `c5-compartilhar-${modo}`;
      await escutarAnuncios(page);
      const trilha: Parada[] = [];
      anotar(D, `# C5 compartilhar: ${modo}\n`);
      const baixados: string[] = [];
      page.on('download', (d) => baixados.push(d.suggestedFilename()));
      const popups: string[] = [];
      page.context().on('page', (p) => popups.push(p.url()));
      await fazerPorTeclado(page, 'evento', D, { prefixo: `c5-${modo}`, fotos: false, trilha });
      await lerAnuncios(page);
      await tabAte(page, '#fluxo-mandar', { trilha });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1200);
      const av = await lerAnuncios(page);
      anotar(D, `Depois de Mandar: foco ${await focado(page)} | avisos ${JSON.stringify(av)}`);
      anotar(D, `Estado (#fluxo-estado): "${await page.locator('#fluxo-estado').innerText()}" | link-estado: "${await page.locator('#fluxo-link-estado').innerText()}"`);
      anotar(D, `Painel do exemplo: ${await page.locator('#fluxo-confirma').isVisible()} | partilhas: ${JSON.stringify(await page.evaluate(() => window.__partilhas)).slice(0, 200)} | cópias: ${(await page.evaluate(() => window.__copias)).length} | downloads: ${JSON.stringify(baixados)} | abas novas: ${JSON.stringify(popups)}`);
      anotar(D, `Regiões vivas: ${JSON.stringify(await regioesVivas(page))}`);
      anotar(D, `Botões visíveis agora: ${JSON.stringify(await page.getByRole('button').evaluateAll((bs) => bs.filter((b) => (b as HTMLElement).offsetParent).map((b) => (b.textContent ?? '').trim())))}`);
      await foto(page, `c5-compartilhar-${modo}`, true);
      // um segundo toque: o que o botão faz de novo?
      await lerAnuncios(page);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      anotar(D, `Segundo toque: avisos ${JSON.stringify(await lerAnuncios(page))} | downloads ${JSON.stringify(baixados)}`);
      expect(erros).toEqual([]);
    });
  });
}

for (const forced of [false, true]) {
  test(`C5: foco no relógio do campo Hora (forced-colors ${forced})`, async ({ page }) => {
    const D = 'c5-hora';
    if (forced) await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('./#/fazer/evento');
    await expect(titulo(page)).toContainText('Passo 1 de 3');
    await tabAte(page, '#fluxo-continuar');
    await page.keyboard.press('Enter');
    await expect(titulo(page)).toContainText('Passo 2 de 3');
    await tabAte(page, '#fluxo-hora');
    for (let i = 0; i < 4; i++) {
      const m = await medirFoco(page);
      const caixa = await page.locator('#fluxo-hora').boundingBox();
      anotar(D, `forced=${forced} Tab#${i} outline=${m.outline} visivel=${m.visivel}`);
      await page.screenshot({ path: `${(await import('./apoio-sim')).FOTOS}/c5-hora-${forced ? 'ac' : 'normal'}-${i}.png`, clip: { x: Math.max(0, caixa!.x - 20), y: Math.max(0, caixa!.y - 20), width: caixa!.width + 40, height: caixa!.height + 40 } });
      await page.keyboard.press('Tab');
    }
  });
}
