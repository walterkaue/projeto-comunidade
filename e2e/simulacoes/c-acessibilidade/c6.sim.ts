// Simulação C6: Edu, 26, time de várzea. Celular fraco, modo escuro, reduzir movimento, economia de dados,
// e a rede cai no meio do passo 2 ("Divulgar um evento"). Só observa e anota; não muda nada do site.

import type { CDPSession, Page } from '@playwright/test';
import {
  anotar, APARELHOS, condicoes, conferirTela, escutarAnuncios, expect, foto, guardar, lerAnuncios, ORGANIZACAO, REDE, test, titulo,
} from './apoio-sim';

void ORGANIZACAO;
void expect;

const TEXTO_INICIAL = 'Peladeira de domingo. Traga uma garrafa de água.';

interface Cfg {
  /** rótulo do arquivo de saída */
  nome: string;
  sw: boolean;
  /** a rede cai no meio do passo 2? */
  cair: boolean;
  saveData: boolean;
  cpu: number;
  rede: keyof typeof REDE;
}

const t0 = () => Date.now();

/** Mídia emulada: o Playwright manda color-scheme e reduced-motion pelo mesmo comando, então repetimos tudo junto. */
async function emularMidia(page: Page, reduzirDados: boolean): Promise<{ aceitou: boolean; resultado: Record<string, boolean>; erro?: string }> {
  const cdp = await page.context().newCDPSession(page);
  let erro: string | undefined;
  try {
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-color-scheme', value: 'dark' },
        { name: 'prefers-reduced-motion', value: 'reduce' },
        ...(reduzirDados ? [{ name: 'prefers-reduced-data', value: 'reduce' }] : []),
      ],
    });
  } catch (e) {
    erro = String(e);
  }
  const resultado = await page.evaluate(() => ({
    escuro: matchMedia('(prefers-color-scheme: dark)').matches,
    semMovimento: matchMedia('(prefers-reduced-motion: reduce)').matches,
    menosDados: matchMedia('(prefers-reduced-data: reduce)').matches,
  }));
  return { aceitou: resultado.menosDados, resultado, erro };
}

/** Mede o que ainda se mexe: animações ativas, transições e animações com duração, rolagem suave. */
async function movimento(page: Page) {
  return page.evaluate(() => {
    const el = [...document.querySelectorAll<HTMLElement>('body, body *')];
    const comTransicao: string[] = [];
    const comAnimacao: string[] = [];
    for (const e of el) {
      const s = getComputedStyle(e);
      const dur = s.transitionDuration.split(',').some((v) => parseFloat(v) > 0 && !/^0(\.0+)?m?s$/.test(v.trim()));
      if (dur && s.transitionProperty !== 'none') comTransicao.push(`${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${String(e.className).split(' ')[0]} ${s.transitionDuration} ${s.transitionProperty}`);
      if (s.animationName !== 'none' && parseFloat(s.animationDuration) > 0) comAnimacao.push(`${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''} ${s.animationName} ${s.animationDuration}`);
    }
    return {
      getAnimations: document.getAnimations().map((a) => `${(a as CSSTransition).transitionProperty ?? (a as CSSAnimation).animationName ?? '?'}:${a.playState}`),
      comTransicao: comTransicao.slice(0, 8),
      comAnimacao: comAnimacao.slice(0, 8),
      rolagem: getComputedStyle(document.documentElement).scrollBehavior,
    };
  });
}

async function medirTudoDeMovimento(page: Page, quando: string, achados: string[]) {
  // amostra logo depois da ação e 400 ms depois
  const a = await movimento(page);
  await page.waitForTimeout(400);
  const b = await movimento(page);
  const linha = `${quando}: animações logo depois=${a.getAnimations.length} (${a.getAnimations.join(',')}) depois de 400ms=${b.getAnimations.length}; transições com duração=${b.comTransicao.length} ${JSON.stringify(b.comTransicao)}; animações CSS=${JSON.stringify(b.comAnimacao)}; scroll-behavior=${b.rolagem}`;
  achados.push(linha);
}

async function dark(page: Page, nome: string, achados: string[]) {
  try {
    await conferirTela(page, nome);
    achados.push(`axe ok (escuro) em "${nome}"`);
  } catch (e) {
    achados.push(`axe FALHOU (escuro) em "${nome}": ${String((e as Error).message).slice(0, 700)}`);
  }
}

function resumoDoTexto(t: string) {
  const link = /Mais detalhes: (\S+)/.exec(t)?.[1] ?? '';
  return { caracteres: t.length, linhas: t.split('\n').length, link, caracteresDoLink: link.length, temLink: !!link };
}

async function acoesDoPronto(page: Page, fase: string, log: (s: string) => void) {
  const anunciosIniciais = await lerAnuncios(page);
  log(`[${fase}] anúncios antes: ${JSON.stringify(anunciosIniciais)}`);
  const estado = async () => ({
    link: (await page.locator('#fluxo-link-estado').textContent())?.trim(),
    geral: (await page.locator('#fluxo-estado').textContent())?.trim(),
    aviso: (await page.locator('#aviso-vivo').textContent())?.trim(),
    copiarLinkVisivel: await page.locator('#fluxo-copiar-link').isVisible(),
    paginaVisivel: await page.locator('#fluxo-pagina').isVisible(),
    regras: await page.locator('#fluxo-regras').isVisible(),
  });
  log(`[${fase}] estado do Pronto: ${JSON.stringify(await estado())}`);

  // Mandar no WhatsApp
  let ini = t0();
  const antes = await page.evaluate(() => window.__partilhas.length);
  await page.locator('#fluxo-mandar').click();
  if (await page.locator('#fluxo-confirma').isVisible()) {
    log(`[${fase}] painel de confirmação apareceu: ${await page.locator('#fluxo-confirma-texto').textContent()}`);
    await page.locator('#fluxo-confirma-seguir').click();
  }
  let ok = true;
  try {
    await page.waitForFunction((n) => window.__partilhas.length > n, antes, { timeout: 20_000 });
  } catch {
    ok = false;
  }
  const mv = await movimento(page);
  log(`[${fase}] movimento com o aviso na tela: animações=${JSON.stringify(mv.getAnimations)} transições=${JSON.stringify(mv.comTransicao)}`);
  const partilhas = await page.evaluate(() => window.__partilhas);
  const ultima = partilhas.at(-1);
  log(`[${fase}] Mandar: ${ok ? 'mandou' : 'NÃO MANDOU em 20 s'} em ${t0() - ini} ms; anúncios=${JSON.stringify(await lerAnuncios(page))}; ${ultima && ok ? JSON.stringify({ ...resumoDoTexto(ultima.texto), arquivos: ultima.arquivos }) : ''}`);
  if (ultima && ok) guardar(`c6-texto-${fase}.txt`, ultima.texto);

  // Baixar a imagem
  ini = t0();
  try {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20_000 }), page.locator('#fluxo-baixar').click()]);
    log(`[${fase}] Baixar: baixou ${dl.suggestedFilename()} em ${t0() - ini} ms; anúncios=${JSON.stringify(await lerAnuncios(page))}`);
  } catch {
    log(`[${fase}] Baixar: NÃO BAIXOU em 20 s; anúncios=${JSON.stringify(await lerAnuncios(page))}; estado=${JSON.stringify(await estado())}`);
  }

  // Copiar o link
  if (await page.locator('#fluxo-copiar-link').isVisible()) {
    await page.locator('#fluxo-copiar-link').click();
    await page.waitForTimeout(500);
    log(`[${fase}] Copiar o link: copiou=${JSON.stringify(await page.evaluate(() => window.__copias.at(-1)))}; anúncios=${JSON.stringify(await lerAnuncios(page))}`);
  } else {
    log(`[${fase}] Copiar o link: botão ESCONDIDO (sem link). Aviso: ${JSON.stringify(await estado())}`);
  }

  // Copiar só o texto
  await page.locator('#fluxo-copiar-texto').click();
  await page.waitForTimeout(500);
  const copiado = await page.evaluate(() => window.__copias.at(-1) ?? '');
  log(`[${fase}] Copiar só o texto: ${copiado.length} caracteres; tem link=${/Mais detalhes: \S+/.test(copiado)}; anúncios=${JSON.stringify(await lerAnuncios(page))}`);

  // Imprimir
  const imp0 = await page.evaluate(() => window.__impressoes);
  ini = t0();
  await page.locator('#fluxo-imprimir').click();
  let imprimiu = true;
  try {
    await page.waitForFunction((n) => window.__impressoes > n, imp0, { timeout: 25_000 });
  } catch {
    imprimiu = false;
  }
  log(`[${fase}] Imprimir: ${imprimiu ? 'abriu a impressão' : 'NÃO ABRIU em 25 s'} em ${t0() - ini} ms; anúncios=${JSON.stringify(await lerAnuncios(page))}`);
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));

  // Ver a página do evento
  const pag = page.locator('#fluxo-pagina');
  if (await pag.isVisible()) {
    ini = t0();
    await pag.click();
    try {
      await expect(page.locator('h1')).not.toContainText('Pronto', { timeout: 30_000 });
      await page.waitForFunction(() => !/Abrindo|Carregando/.test(document.querySelector('h1')?.textContent ?? ''), null, { timeout: 60_000 });
    } catch {
      /* segue */
    }
    const h1 = (await page.locator('h1').first().textContent())?.trim();
    const corpo = ((await page.locator('main').first().textContent()) ?? '').replace(/\s+/g, ' ').slice(0, 300);
    log(`[${fase}] Ver a página: h1="${h1}" em ${t0() - ini} ms; corpo="${corpo}"`);
    await foto(page, `c6-${fase}-pagina-do-evento`);
    await page.goBack();
    await page.waitForTimeout(800);
    log(`[${fase}] depois do Voltar do navegador: h1="${(await page.locator('h1').first().textContent())?.trim()}" url=${page.url().replace(/#.*$/, '#...')}`);
  } else {
    log(`[${fase}] Ver a página: link ESCONDIDO (sem link)`);
  }
}

async function percurso(page: Page, cfg: Cfg) {
  const context = page.context();
  const log = (s: string) => anotar(cfg.nome, s);
  const achados: string[] = [];
  const tempos: Record<string, number> = {};
  const bytes: { url: string; tipo: string; bytes: number; fase: string }[] = [];
  let fase = 'inicio';
  guardar(`${cfg.nome}-inicio.txt`, new Date().toISOString());

  await escutarAnuncios(page);
  await context.setExtraHTTPHeaders(cfg.saveData ? { 'Save-Data': 'on' } : {});
  await context.addInitScript((sd: boolean) => {
    const w = window as unknown as Record<string, unknown>;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
    w.__nativo = { saveData: nav.connection?.saveData, tipo: nav.connection?.effectiveType, nucleos: navigator.hardwareConcurrency, memoria: (navigator as unknown as { deviceMemory?: number }).deviceMemory };
    if (sd) Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true, effectiveType: '3g' } });
  }, cfg.saveData);
  // Uma sessão CDP só para CPU, rede e queda (com sessões separadas o setOffline do Playwright não valeu: ver relatório).
  const cdp: CDPSession = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cfg.cpu });
  await cdp.send('Network.enable');
  const rede = async (offline: boolean) => {
    await cdp.send('Network.emulateNetworkConditions', { offline, ...REDE[cfg.rede] });
    await context.setOffline(offline);
    if (!offline) await cdp.send('Network.emulateNetworkConditions', { offline: false, ...REDE[cfg.rede] });
  };
  await rede(false);
  void condicoes;
  const midia = await emularMidia(page, cfg.saveData);
  const urls = new Map<string, { url: string; tipo: string }>();
  cdp.on('Network.requestWillBeSent', (e) => urls.set(e.requestId, { url: e.request.url, tipo: e.type ?? '?' }));
  cdp.on('Network.loadingFinished', (e) => {
    const u = urls.get(e.requestId);
    if (u) bytes.push({ url: u.url.replace(/^https?:\/\/localhost:\d+\//, '/'), tipo: u.tipo, bytes: e.encodedDataLength, fase });
  });
  const somar = (f: string) => bytes.filter((b) => b.fase === f).reduce((s, b) => s + b.bytes, 0);

  // ---- início
  let t = t0();
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?', { timeout: 120_000 });
  tempos['início aparece'] = t0() - t;
  const nativo = await page.evaluate(() => (window as unknown as Record<string, unknown>).__nativo);
  const sinais = await page.evaluate(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
    return { saveData: nav.connection?.saveData, tipo: nav.connection?.effectiveType, nucleos: navigator.hardwareConcurrency };
  });
  log(`## ${cfg.nome}\nmídia emulada: ${JSON.stringify(midia)}\nsinais nativos (antes do override): ${JSON.stringify(nativo)}; sinais vistos pelo site: ${JSON.stringify(sinais)}`);
  await dark(page, 'início', achados);
  await foto(page, `${cfg.nome}-1-inicio`);
  const swPronto = await page.evaluate(async () => !!navigator.serviceWorker?.controller || !!(await navigator.serviceWorker?.getRegistration()));
  log(`service worker registrado após o início: ${swPronto}`);

  if (cfg.sw) {
    t = t0();
    const r = await page.evaluate(async () => {
      const reg = await Promise.race([navigator.serviceWorker.ready, new Promise<null>((ok) => setTimeout(() => ok(null), 170_000))]);
      const chaves = await caches.keys();
      let itens = 0;
      for (const c of chaves) itens += (await (await caches.open(c)).keys()).length;
      return { ativo: !!reg?.active, caches: chaves, itens };
    });
    tempos['service worker pronto'] = t0() - t;
    log(`service worker: ${JSON.stringify(r)} em ${tempos['service worker pronto']} ms`);
  }
  tempos['bytes início'] = somar('inicio');

  // ---- porta
  fase = 'porta';
  t = t0();
  await page.getByRole('link', { name: /Divulgar um evento/ }).click();
  await expect(titulo(page)).toContainText('Passo 1 de 3', { timeout: 120_000 });
  tempos['passo 1 aparece'] = t0() - t;
  await medirTudoDeMovimento(page, 'depois de abrir o passo 1', achados);
  await dark(page, 'passo 1', achados);

  const titulo0 = (await page.locator('#fluxo-titulo').getAttribute('placeholder')) ?? ''; // os campos começam vazios: o exemplo é o cinza de dentro
  await page.locator('#fluxo-titulo').fill('Jogo da Várzea do Bairro Novo');
  await page.locator('#fluxo-organizacao').fill('Associação Amigos da Várzea');
  await page.locator('#fluxo-texto').fill(TEXTO_INICIAL);
  log(`exemplo em cinza do título era: "${titulo0}"`);
  await foto(page, `${cfg.nome}-2-passo1`);
  if (await page.locator('#fluxo-ver-maior').isVisible()) {
    await page.locator('#fluxo-ver-maior').click();
    await page.waitForTimeout(50);
    await medirTudoDeMovimento(page, 'com o painel "Ver a prévia maior" aberto', achados);
    await dark(page, 'diálogo da prévia maior', achados);
    await foto(page, `${cfg.nome}-2b-dialogo`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // ---- passo 2
  fase = 'passo2';
  t = t0();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3', { timeout: 120_000 });
  tempos['passo 2 aparece'] = t0() - t;
  await medirTudoDeMovimento(page, 'depois de trocar para o passo 2', achados);
  await dark(page, 'passo 2', achados);
  await page.locator('.fluxo-atalho').first().click();
  const diaEscolhido = await page.locator('#fluxo-data').inputValue();
  const extenso = await page.locator('#fluxo-data-extenso').textContent();

  if (cfg.cair) {
    await rede(true);
    const sonda = await page.evaluate(async () => {
      const t = Date.now();
      try { const r = await fetch('./og.png?x=' + Math.random(), { cache: 'no-store' }); return `ok ${r.status} em ${Date.now() - t} ms (A REDE NÃO CAIU)`; } catch { return `falhou em ${Date.now() - t} ms (rede caída, certo); navigator.onLine=${navigator.onLine}`; }
    });
    log(`sonda da rede caída: ${sonda}`);
    log(`>>> REDE CAIU (setOffline) no meio do passo 2, dia escolhido="${diaEscolhido}" (${extenso})`);
  }
  await page.locator('#fluxo-hora').fill('16:00');
  await page.locator('#fluxo-local').fill('Campo do Bairro Novo, Rua das Acácias 120');
  await foto(page, `${cfg.nome}-3-passo2-${cfg.cair ? 'sem-rede' : 'com-rede'}`);

  fase = 'passo3';
  t = t0();
  await page.getByRole('button', { name: 'Continuar' }).click();
  try {
    await expect(titulo(page)).toContainText('Passo 3 de 3', { timeout: 90_000 });
    tempos['passo 3 aparece'] = t0() - t;
  } catch {
    log(`PASSO 3 NÃO ABRIU em 90 s. h1="${await titulo(page).textContent()}" aviso="${await page.locator('#aviso-vivo').textContent()}"`);
    await foto(page, `${cfg.nome}-travou-passo3`);
    guardar(`${cfg.nome}.json`, JSON.stringify({ tempos, achados }, null, 1));
    return;
  }
  await medirTudoDeMovimento(page, 'depois de trocar para o passo 3', achados);
  await dark(page, 'passo 3', achados);
  await foto(page, `${cfg.nome}-4-passo3`);
  const canvasP3 = await page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('canvas');
    return c ? { w: c.width, h: c.height } : null;
  });

  fase = 'pronto';
  t = t0();
  await page.getByRole('button', { name: 'Ficou bom' }).click();
  try {
    await expect(titulo(page)).toContainText('Pronto!', { timeout: 90_000 });
    tempos['Pronto aparece'] = t0() - t;
    await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…', { timeout: 90_000 });
    tempos['link pronto'] = t0() - t;
  } catch {
    log(`PRONTO/LINK demorou mais de 90 s. link-estado="${await page.locator('#fluxo-link-estado').textContent()}"`);
  }
  await medirTudoDeMovimento(page, 'depois de abrir o Pronto', achados);
  await dark(page, 'Pronto', achados);
  const canvasPronto = await page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('#fluxo-canvas');
    return c ? { w: c.width, h: c.height } : null;
  });
  log(`canvas passo 3=${JSON.stringify(canvasP3)} Pronto=${JSON.stringify(canvasPronto)}`);
  await foto(page, `${cfg.nome}-5-pronto`, true);

  // ---- ações do Pronto
  await acoesDoPronto(page, cfg.cair ? 'sem-rede' : 'com-rede', log);
  tempos['ações sem rede (ou com rede)'] = t0() - t;
  await medirTudoDeMovimento(page, 'depois das ações', achados);

  if (cfg.cair) {
    // A rede volta
    await rede(false);
    await emularMidia(page, cfg.saveData);
    log('>>> REDE VOLTOU');
    await page.waitForTimeout(1500);
    const h1 = (await page.locator('h1').first().textContent())?.trim();
    log(`depois de voltar a rede: h1="${h1}"; estado=${await page.locator('#fluxo-link-estado').textContent()}`);
    if (/Pronto/.test(h1 ?? '')) {
      await acoesDoPronto(page, 'rede-voltou', log);
      // Tentar de novo: Mudar algo -> Continuar -> Continuar -> Ficou bom
      t = t0();
      await page.locator('#fluxo-mudar').click();
      await expect(titulo(page)).toContainText('Passo', { timeout: 60_000 });
      const dadosVivos = await page.evaluate(() => ({
        titulo: (document.querySelector('#fluxo-titulo') as HTMLInputElement | null)?.value,
        org: (document.querySelector('#fluxo-organizacao') as HTMLInputElement | null)?.value,
        texto: (document.querySelector('#fluxo-texto') as HTMLTextAreaElement | null)?.value,
        h1: document.querySelector('h1')?.textContent,
      }));
      log(`Mudar algo -> ${JSON.stringify(dadosVivos)}`);
      const h = (dadosVivos.h1 ?? '');
      if (/Passo 1/.test(h)) await page.getByRole('button', { name: 'Continuar' }).click();
      const dp2 = await page.evaluate(() => ({ dia: (document.querySelector('#fluxo-data') as HTMLInputElement | null)?.value, hora: (document.querySelector('#fluxo-hora') as HTMLInputElement | null)?.value, local: (document.querySelector('#fluxo-local') as HTMLInputElement | null)?.value }));
      log(`passo 2 depois de voltar: ${JSON.stringify(dp2)}`);
      // Tentar de novo com a rede de volta: passo 2 -> passo 3 -> Pronto
      t = t0();
      try {
        await page.getByRole('button', { name: 'Continuar' }).click();
        await expect(titulo(page)).toContainText('Passo 3 de 3', { timeout: 60_000 });
        await page.getByRole('button', { name: 'Ficou bom' }).click();
        await expect(titulo(page)).toContainText('Pronto!', { timeout: 60_000 });
        await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…', { timeout: 60_000 });
        await page.waitForTimeout(500);
        const est = await page.locator('#fluxo-link-estado').textContent();
        log(`TENTAR DE NOVO (Mudar algo > Continuar > Continuar > Ficou bom) em ${t0() - t} ms: link-estado="${est?.trim()}"; copiar link visível=${await page.locator('#fluxo-copiar-link').isVisible()}; ver página visível=${await page.locator('#fluxo-pagina').isVisible()}`);
        await foto(page, `${cfg.nome}-6-de-novo`);
      } catch (e) {
        log(`TENTAR DE NOVO falhou: ${String(e).slice(0, 200)}`);
      }
    }
  }

  tempos['bytes passo+pronto'] = bytes.filter((b) => b.fase !== 'inicio').reduce((s, b) => s + b.bytes, 0);
  tempos['bytes total'] = bytes.reduce((s, b) => s + b.bytes, 0);
  const porTipo: Record<string, number> = {};
  for (const b of bytes) porTipo[b.tipo] = (porTipo[b.tipo] ?? 0) + b.bytes;
  log(`bytes por tipo: ${JSON.stringify(porTipo)}\ntempos(ms): ${JSON.stringify(tempos)}`);
  log(`achados de modo escuro e movimento:\n${achados.map((a) => '- ' + a).join('\n')}`);
  guardar(`${cfg.nome}.json`, JSON.stringify({ cfg, midia, tempos, porTipo, bytes, achados }, null, 1));
}

for (const [variante, sw] of [['sw', 'allow'], ['semsw', 'block']] as const) {
  test.describe(`C6 ${variante}`, () => {
    test.use({ ...APARELHOS['AND-FRACO'], colorScheme: 'dark', reducedMotion: 'reduce', serviceWorkers: sw });
    for (const rodada of [1, 2]) {
      test(`Edu cai a rede, ${variante}, rodada ${rodada}`, async ({ page, erros, consoleErros, foraDoSite }) => {
        test.setTimeout(900_000);
        const nome = `c6-${variante}-r${rodada}`;
        await percurso(page, { nome, sw: variante === 'sw', cair: true, saveData: true, cpu: 6, rede: '3G-LENTO' });
        anotar(nome, `erros de página: ${JSON.stringify(erros)}; erros de console: ${JSON.stringify(consoleErros)}; pedidos barrados fora do site: ${JSON.stringify(foraDoSite)}`);
      });
    }
  });
}

// Compartilhar ausente (computador, navegador dentro de app), uma rodada cada.
for (const [variante, sw] of [['sw', 'allow'], ['semsw', 'block']] as const) {
  test.describe(`C6 ausente ${variante}`, () => {
    test.use({ ...APARELHOS['AND-FRACO'], colorScheme: 'dark', reducedMotion: 'reduce', serviceWorkers: sw, compartilhar: 'ausente' });
    test(`Edu sem menu de compartilhar, ${variante}`, async ({ page }) => {
      test.setTimeout(900_000);
      const nome = `c6-ausente-${variante}`;
      await percurso(page, { nome, sw: variante === 'sw', cair: true, saveData: true, cpu: 6, rede: '3G-LENTO' });
    });
  });
}

// Peso: com e sem economia de dados, com rede (referência para comparar). Sem a rede cair.
for (const [modo, sd] of [['normal', false], ['economia', true]] as const) {
  test.describe(`C6 peso ${modo}`, () => {
    test.use({ ...APARELHOS['AND-FRACO'], colorScheme: 'dark', reducedMotion: 'reduce', serviceWorkers: 'block' });
    test(`peso ${modo}`, async ({ page }) => {
      test.setTimeout(900_000);
      await percurso(page, { nome: `c6-peso-${modo}`, sw: false, cair: false, saveData: sd, cpu: sd ? 6 : 1, rede: sd ? '3G-LENTO' : '4G' });
    });
  });
}
