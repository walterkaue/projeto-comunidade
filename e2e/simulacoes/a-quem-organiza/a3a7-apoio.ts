// Apoio dos grupos a3 (Pastora Lúcia) e a7 (Bia). Só para a simulação; nada daqui entra no site.
import type { Locator, Page } from '@playwright/test';
import { preencherObrigatoriosVazios } from '../obrigatorios';
import { cobertoPorFaixa, expect, foto, inspecionar, registrar, salvarTexto, titulo, tocar } from './sim';

export const nota = (chave: string, dados: Record<string, unknown> = {}): void => registrar('achados-a3a7', { chave, ...dados });

/** Digita como pessoa (tecla por tecla), limpando antes. */
export async function digitar(campo: Locator, texto: string): Promise<void> {
  await campo.click();
  await campo.fill('');
  await campo.pressSequentially(texto, { delay: 15 });
}

/** O campo focado fica atrás da barra ou da miniatura? Rola até ele como o navegador faria ao focar. */
export async function medirFoco(page: Page, campo: Locator, rotulo: string): Promise<{ coberto: boolean; detalhe: string }> {
  await campo.focus();
  await page.waitForTimeout(700); // a barra solta com o teclado depois de ~300 ms (previa.ts)
  const r = await cobertoPorFaixa(campo);
  const vp = page.viewportSize();
  const mini = await page.locator('.fluxo-mini').first().boundingBox().catch(() => null);
  const barra = await page.locator('.fluxo-barra').first().boundingBox().catch(() => null);
  const caixa = await campo.boundingBox();
  const posicoes = await page.evaluate(() => ({
    mini: document.querySelector('.fluxo-mini') ? getComputedStyle(document.querySelector('.fluxo-mini')!).position : null,
    barra: document.querySelector('.fluxo-barra') ? getComputedStyle(document.querySelector('.fluxo-barra')!).position : null,
    soltas: document.documentElement.classList.contains('fluxo-faixas-soltas'),
    teclado: document.documentElement.classList.contains('fluxo-teclado'),
  }));
  nota('foco-coberto', { rotulo, viewport: vp, ...r, miniCaixa: mini, barraCaixa: barra, campo: caixa, ...posicoes });
  return r;
}

export async function medirMini(page: Page, rotulo: string): Promise<void> {
  const vp = page.viewportSize()!;
  const dados = await page.evaluate(() => {
    const m = document.querySelector<HTMLElement>('.fluxo-mini');
    const b = document.querySelector<HTMLElement>('.fluxo-barra');
    const main = document.querySelector<HTMLElement>('main.fluxo');
    const f = (e: HTMLElement | null) => (e ? { alt: Math.round(e.getBoundingClientRect().height), larg: Math.round(e.getBoundingClientRect().width), pos: getComputedStyle(e).position } : null);
    return {
      mini: f(m),
      barra: f(b),
      main: f(main),
      docAltura: document.documentElement.scrollHeight,
      soltas: document.documentElement.classList.contains('fluxo-faixas-soltas'),
    };
  });
  const fixo = (dados.mini?.pos === 'sticky' || dados.mini?.pos === 'fixed' ? dados.mini.alt : 0) + (dados.barra?.pos === 'fixed' || dados.barra?.pos === 'sticky' ? dados.barra.alt : 0);
  nota('faixas', { rotulo, viewport: vp, ...dados, fixoPct: Math.round((fixo / vp.height) * 100), miniPct: dados.mini ? Math.round((dados.mini.alt / vp.height) * 100) : null });
}

export interface Roteiro {
  personagem: string;
  porta: 'Divulgar um evento' | 'Contar uma conquista';
  tituloDigitado: string;
  textoDigitado: string;
  organizacao: string;
  local?: string;
  formato?: 'Grupo' | 'Status' | 'Cartaz';
  /** Tira medidas de faixa/foco em cada passo (A7). */
  medirFaixas?: boolean;
  prefixo: string;
}

export const passoDe = (page: Page) => titulo(page).textContent();

/** O personagem faz o caminho inteiro e devolve o texto mandado. Registra o que vê. */
export async function caminho(page: Page, r: Roteiro, cron: { marca(e: string): number }): Promise<{ texto: string; link: string; pronto: boolean }> {
  const { prefixo } = r;
  page.setDefaultTimeout(30_000);
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  await inspecionar(page, `${prefixo} início`);
  await foto(page, `${prefixo} inicio`);
  cron.marca('inicio');
  await tocar(page.getByRole('link', { name: new RegExp(r.porta) }));
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  // Os campos começam vazios; o exemplo é só o cinza de dentro (placeholder) e a miniatura.
  const exemplo = {
    titulo: await page.locator('#fluxo-titulo').getAttribute('placeholder'),
    org: await page.locator('#fluxo-organizacao').getAttribute('placeholder'),
    texto: await page.locator('#fluxo-texto').getAttribute('placeholder'),
    valoresAoAbrir: [await page.locator('#fluxo-titulo').inputValue(), await page.locator('#fluxo-organizacao').inputValue(), await page.locator('#fluxo-texto').inputValue()],
    apagarVisivel: await page.locator('#fluxo-apagar').isVisible(),
  };
  nota('exemplo-passo1', { prefixo, ...exemplo });
  await foto(page, `${prefixo} passo1 vazio`);
  await inspecionar(page, `${prefixo} passo 1 (vazio)`);
  if (r.medirFaixas) await medirMini(page, `${prefixo} passo 1`);

  // Passo 1
  await digitar(page.locator('#fluxo-titulo'), r.tituloDigitado);
  if (r.medirFaixas) await medirFoco(page, page.locator('#fluxo-titulo'), `${prefixo} passo 1: título em foco`);
  await digitar(page.locator('#fluxo-organizacao'), r.organizacao);
  if (r.medirFaixas) await medirFoco(page, page.locator('#fluxo-organizacao'), `${prefixo} passo 1: organização em foco`);
  await digitar(page.locator('#fluxo-texto'), r.textoDigitado);
  if (r.medirFaixas) await medirFoco(page, page.locator('#fluxo-texto'), `${prefixo} passo 1: texto em foco`);
  nota('apos-digitar-passo1', {
    prefixo,
    titulo: await page.locator('#fluxo-titulo').inputValue(),
    texto: await page.locator('#fluxo-texto').inputValue(),
    botao: await page.locator('#fluxo-apagar').textContent(),
  });
  await page.locator('#fluxo-texto').blur();
  await page.waitForTimeout(400);
  await foto(page, `${prefixo} passo1 preenchido`);
  await inspecionar(page, `${prefixo} passo 1 (preenchido)`);
  if (r.medirFaixas) await medirMini(page, `${prefixo} passo 1 preenchido`);
  cron.marca('passo1');
  await tocar(page.getByRole('button', { name: 'Continuar' }));

  // Passo 2
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await foto(page, `${prefixo} passo2 inicial`);
  const pula = await page.locator('#fluxo-pular').count();
  nota('passo2-pular', { prefixo, temPular: pula > 0 });
  if (r.porta === 'Divulgar um evento') {
    await tocar(page.getByRole('button', { name: 'Próximo sábado' }));
    if (!(await page.locator('#fluxo-data-extenso').count())) {
      await foto(page, `${prefixo} TRAVA depois do atalho`);
      nota('TRAVA-depois-do-atalho', { prefixo, url: page.url(), h1: await passoDe(page), html: (await page.locator('body').innerText()).slice(0, 600) });
    }
    nota('passo2-dia', { prefixo, dia: await page.locator('#fluxo-data').inputValue(), extenso: await page.locator('#fluxo-data-extenso').textContent(), hora: await page.locator('#fluxo-hora').inputValue(), local: await page.locator('#fluxo-local').inputValue() });
    await page.locator('#fluxo-hora').fill('19:30');
    if (r.local) await digitar(page.locator('#fluxo-local'), r.local);
    else await preencherObrigatoriosVazios(page, { tipo: 'evento', agenda: true }, 2); // o local começa vazio e é obrigatório
  } else {
    await tocar(page.getByRole('button', { name: 'Hoje' }));
    nota('passo2-dia', { prefixo, dia: await page.locator('#fluxo-data').inputValue(), extenso: await page.locator('#fluxo-data-extenso').textContent() });
    if (r.medirFaixas) await medirFoco(page, page.locator('#fluxo-data'), `${prefixo} passo 2: dia em foco`);
  }
  await page.waitForTimeout(300);
  await foto(page, `${prefixo} passo2 preenchido`);
  await inspecionar(page, `${prefixo} passo 2`);
  if (r.medirFaixas) await medirMini(page, `${prefixo} passo 2`);
  cron.marca('passo2');
  await tocar(page.getByRole('button', { name: 'Continuar' }));

  // Passo 3
  await expect(titulo(page)).toContainText('Passo 3 de 3');
  await page.waitForTimeout(600);
  await foto(page, `${prefixo} passo3 inicial`);
  if (r.formato) {
    const valor = { Grupo: 'conversa', Status: 'status', Cartaz: 'cartaz' }[r.formato];
    const jaMarcado = await page.locator(`#fluxo-formato-${valor}`).isChecked();
    nota('passo3-formato-padrao', { prefixo, padrao: await page.locator('input[name=fluxo-formato]:checked').getAttribute('value'), jaMarcado });
    if (!jaMarcado) await page.locator(`#fluxo-formato-${valor}`).tap({ force: true });
    await page.waitForTimeout(800);
  }
  nota('passo3-formato', { prefixo, expl: await page.locator('#fluxo-formato-expl').textContent() });
  await foto(page, `${prefixo} passo3 formato`);
  await inspecionar(page, `${prefixo} passo 3`);
  if (r.medirFaixas) await medirMini(page, `${prefixo} passo 3`);
  cron.marca('passo3');
  await tocar(page.getByRole('button', { name: 'Ficou bom' }));

  // Pronto
  await expect(titulo(page)).toContainText('Pronto!');
  const agenda = r.porta === 'Divulgar um evento';
  if (agenda) await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…');
  await page.waitForTimeout(800);
  await foto(page, `${prefixo} pronto`);
  await inspecionar(page, `${prefixo} pronto`);
  if (r.medirFaixas) await medirMini(page, `${prefixo} pronto`);
  nota('pronto', {
    prefixo,
    avisoDoExemplo: await page.locator('#fluxo-aviso-exemplo').count(), // 0: o aviso do exemplo não existe mais
    linkEstado: await page.locator('#fluxo-link-estado').textContent(),
    avisoLink: await page.locator('#fluxo-aviso-link').textContent(),
    dicaOutro: await page.locator('#fluxo-outro-dica').textContent(),
  });
  cron.marca('pronto');

  // Mandar
  const antes = (await page.evaluate(() => window.__simPartilhas)).length;
  await tocar(page.locator('#fluxo-mandar'));
  const painel = page.locator('#fluxo-confirma');
  if (await painel.isVisible()) {
    nota('painel-exemplo', { prefixo, texto: await page.locator('#fluxo-confirma-texto').textContent(), botoes: await painel.locator('button').allTextContents() });
    await foto(page, `${prefixo} painel exemplo`);
    await inspecionar(page, `${prefixo} painel do exemplo`);
    await tocar(page.getByRole('button', { name: 'Mandar mesmo assim' }));
  } else nota('painel-exemplo', { prefixo, texto: null });
  await expect.poll(async () => (await page.evaluate(() => window.__simPartilhas)).length).toBeGreaterThan(antes);
  cron.marca('mandar-no-whatsapp');
  const todas = await page.evaluate(() => window.__simPartilhas);
  const p = todas[antes]!;
  nota('partilha', { prefixo, ...p, letrasDoTexto: [...new Intl.Segmenter('pt', { granularity: 'grapheme' }).segment(p.texto)].length, unidadesUtf16: p.texto.length, todasAsTentativas: todas.slice(antes).map((t) => ({ arquivos: t.arquivos, recusado: t.recusado ?? null })) });
  salvarTexto(`${prefixo}-whatsapp.txt`, p.texto);
  const avisoFalado = await page.evaluate(() => document.querySelector('[role=status][aria-live], #aviso, [aria-live]')?.textContent ?? '');
  nota('aviso-falado', { prefixo, avisoFalado });
  await page.waitForTimeout(500);
  await foto(page, `${prefixo} depois de mandar`);
  const link = /Mais detalhes: (\S+)/.exec(p.texto)?.[1] ?? '';
  return { texto: p.texto, link, pronto: true };
}

/** Voltar do navegador no meio dos passos e no Pronto, depois "Mudar algo" e "Fazer outro". */
export async function depois(page: Page, prefixo: string, esperado: { titulo: string; org: string }): Promise<void> {
  // Pronto: "Mudar algo"
  await tocar(page.locator('#fluxo-mudar'));
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  nota('mudar-algo', {
    prefixo,
    titulo: await page.locator('#fluxo-titulo').inputValue(),
    org: await page.locator('#fluxo-organizacao').inputValue(),
    texto: await page.locator('#fluxo-texto').inputValue(),
    mantemTitulo: (await page.locator('#fluxo-titulo').inputValue()) === esperado.titulo,
    mantemOrg: (await page.locator('#fluxo-organizacao').inputValue()) === esperado.org,
    botaoApagar: await page.locator('#fluxo-apagar').textContent(),
  });
  await foto(page, `${prefixo} mudar algo`);
  // Continuar até o passo 3 e ver se formato/cor ficaram
  await tocar(page.getByRole('button', { name: 'Continuar' }));
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  nota('mudar-algo-passo2', { prefixo, dia: await page.locator('#fluxo-data').inputValue() });
  // Voltar do navegador do passo 2
  await page.goBack();
  await page.waitForTimeout(500);
  nota('goback-passo2', { prefixo, titulo: (await passoDe(page))?.replace(/\s+/g, ' '), url: page.url(), campoTitulo: await page.locator('#fluxo-titulo').inputValue().catch(() => null) });
  await foto(page, `${prefixo} goback do passo 2`);
  await tocar(page.getByRole('button', { name: 'Continuar' }));
  await tocar(page.getByRole('button', { name: 'Continuar' }));
  await expect(titulo(page)).toContainText('Passo 3 de 3');
  nota('mudar-algo-passo3', {
    prefixo,
    formatoMarcado: await page.locator('input[name=fluxo-formato]:checked').getAttribute('value'),
    corMarcada: await page.locator('input[name=fluxo-paleta]:checked').getAttribute('value').catch(() => null),
  });
  await page.goBack();
  await page.waitForTimeout(500);
  nota('goback-passo3', { prefixo, titulo: (await passoDe(page))?.replace(/\s+/g, ' '), url: page.url() });
  await tocar(page.getByRole('button', { name: 'Continuar' }));
  await tocar(page.getByRole('button', { name: 'Ficou bom' }));
  await expect(titulo(page)).toContainText('Pronto!');
  await page.waitForTimeout(800);
  // Voltar do navegador no Pronto
  await page.goBack();
  await page.waitForTimeout(600);
  nota('goback-pronto', { prefixo, titulo: (await passoDe(page))?.replace(/\s+/g, ' '), url: page.url() });
  await foto(page, `${prefixo} goback do pronto`);
  // Volta ao Pronto andando para frente
  await page.goForward();
  await page.waitForTimeout(600);
  nota('goforward-pronto', { prefixo, titulo: (await passoDe(page))?.replace(/\s+/g, ' '), url: page.url() });
  if (!(await passoDe(page))?.includes('Pronto')) {
    // recarregar leva ao passo 1 (pendência conhecida); chega ao Pronto de novo pelo fluxo
    return;
  }
  // Fazer outro
  const mensagemAntes = await page.locator('#fluxo-outro-dica').textContent();
  await tocar(page.locator('#fluxo-outro'));
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  await foto(page, `${prefixo} fazer outro`);
  nota('fazer-outro', { prefixo, dicaAntes: mensagemAntes, url: page.url() });
  // O que ficou: abre a mesma porta de novo
  await tocar(page.getByRole('link', { name: /Divulgar um evento|Contar uma conquista/ }).first());
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  const t = await page.locator('#fluxo-titulo').inputValue();
  nota('fazer-outro-depois', { prefixo, titulo: t, org: await page.locator('#fluxo-organizacao').inputValue(), camposVazios: t === '' });
  await page.goBack();
  await page.waitForTimeout(400);
  nota('goback-do-passo1-ao-inicio', { prefixo, titulo: (await passoDe(page))?.replace(/\s+/g, ' '), url: page.url() });
}
