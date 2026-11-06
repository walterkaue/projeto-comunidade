// G4 / "em todos": a página do evento em vários aparelhos e o card feito por quem recebeu.
import { expect, test, type Page } from '@playwright/test';
import { abrirAparelho, cronometro, foto, linkDoEvento, medirEGuardar, salvarSaida, type NomeDoAparelho, type OpcoesDoAparelho } from './aparelhos';
test.describe.configure({ timeout: 420_000 });
import { anotar, LINKS } from './g4-apoio';

const CHAVES = ['evento-sp-19h', 'reuniao-sindicato', 'reuniao-longa'] as const;

async function paginaDoEvento(page: Page, base: string, chave: (typeof CHAVES)[number]): Promise<number> {
  const fim = cronometro();
  await page.goto(linkDoEvento(base, LINKS[chave]!.dados));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(LINKS[chave]!.titulo, { timeout: 120_000 });
  return fim();
}

interface Caso {
  nome: NomeDoAparelho;
  op: OpcoesDoAparelho;
  etiqueta: string;
  /** Tira também a foto da página inteira. */
  inteira: boolean;
  marca: '' | '@webkit' | '@firefox';
}

const CASOS: Caso[] = [
  { nome: 'AND-FRACO', op: { texto200: true }, etiqueta: 'texto200', inteira: true, marca: '' },
  { nome: 'IPHONE-SE', op: { texto200: true }, etiqueta: 'texto200', inteira: true, marca: '@webkit' },
  { nome: 'SAMSUNG', op: {}, etiqueta: 'escuro', inteira: true, marca: '' },
  { nome: 'AND-PEQUENO', op: {}, etiqueta: '320', inteira: true, marca: '' },
  { nome: 'AND-GRANDE', op: {}, etiqueta: 'rapida', inteira: false, marca: '' },
  { nome: 'AND-DEITADO', op: {}, etiqueta: 'rapida', inteira: false, marca: '' },
  { nome: 'AND-TECLADO', op: {}, etiqueta: 'rapida', inteira: false, marca: '' },
  { nome: 'IPHONE-GRANDE', op: {}, etiqueta: 'rapida', inteira: false, marca: '@webkit' },
  { nome: 'TABLET', op: {}, etiqueta: 'rapida', inteira: false, marca: '' },
  { nome: 'PC-FIREFOX', op: {}, etiqueta: 'rapida', inteira: false, marca: '@firefox' },
  { nome: 'PC-GRANDE', op: {}, etiqueta: 'rapida', inteira: false, marca: '' },
];

for (const c of CASOS) {
  for (const chave of CHAVES) {
    test(`G4 página ${chave} em ${c.nome} (${c.etiqueta}) ${c.marca}`, async ({ browser }, info) => {
      const s = await abrirAparelho(browser, c.nome, c.op);
      const t = await paginaDoEvento(s.page, info.project.use.baseURL!, chave);
      const tela = `${c.nome}-${chave}-${c.etiqueta}`;
      const m = await medirEGuardar(s.page, 'g4', tela);
      await foto(s.page, `g4-${tela}`);
      if (c.inteira) await foto(s.page, `g4-${tela}-inteira`, true);
      anotar(`PAGINA ${tela}: abriu em ${t} s; axe=${m.axe.length} lateral=${m.rolagemLateral} pequenos=${m.alvosPequenos.length} colados=${m.alvosColados.length} cortado=${m.textoCortado.length} cobertos=${m.cobertos.length}; erros=${s.erros.length} externos=${s.externos.length}`);
      if (s.erros.length) anotar(`ERROS ${tela}: ${s.erros.join(' || ').slice(0, 400)}`);
      expect.soft(s.erros.filter((e) => !e.includes('interactive-widget')), 'erros de JS (o aviso do WebKit sobre interactive-widget é só ruído, ver achados)').toEqual([]);
      await s.fechar();
    });
  }
}

// ---------- card, cartaz, WhatsApp, "Criar outro" ----------

const avisoAtual = (page: Page) => page.locator('#aviso-vivo').innerText();

for (const chave of ['evento-sp-19h', 'reuniao-longa'] as const) {
  test(`G4 card e cartaz de quem recebeu: ${chave} (AND-GRANDE)`, async ({ browser }, info) => {
    const base = info.project.use.baseURL!;
    const s = await abrirAparelho(browser, 'AND-GRANDE');
    const { page } = s;
    const link = linkDoEvento(base, LINKS[chave]!.dados);
    await paginaDoEvento(page, base, chave);
    await foto(page, `g4-card-${chave}-0-pagina`, true);

    // "Fazer o card deste evento"
    await page.getByRole('link', { name: 'Fazer o card deste evento' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Passo 3 de 3');
    salvarSaida(`g4-card-${chave}-passo3.txt`, await page.locator('main').innerText());
    await medirEGuardar(page, 'g4', `card-${chave}-passo3`);
    await foto(page, `g4-card-${chave}-1-passo3`, true);
    await page.getByRole('button', { name: 'Ficou bom' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Pronto!');
    await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…', { timeout: 60_000 });
    await page.waitForTimeout(800);
    salvarSaida(`g4-card-${chave}-pronto.txt`, await page.locator('main').innerText());
    await medirEGuardar(page, 'g4', `card-${chave}-pronto`);
    await foto(page, `g4-card-${chave}-2-pronto`, true);

    // Baixar a imagem
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Baixar a imagem' }).click()]);
    const caminhoPng = `${dl.suggestedFilename()}`;
    await dl.saveAs(salvarSaida(`g4-card-${chave}.png`, ''));
    anotar(`CARD ${chave}: arquivo baixado "${caminhoPng}"; aviso="${await avisoAtual(page)}"`);

    // Texto do WhatsApp
    await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
    if (await page.locator('#fluxo-confirma').isVisible()) {
      anotar(`CARD ${chave}: painel de confirmação: ${await page.locator('#fluxo-confirma-texto').innerText()}`);
      await page.getByRole('button', { name: /Mandar mesmo assim/ }).click();
    }
    await expect.poll(() => page.evaluate(() => window.__partilhas.length)).toBeGreaterThan(0);
    const p = await page.evaluate(() => window.__partilhas[0]!);
    salvarSaida(`g4-card-${chave}-whatsapp.txt`, `${p.texto}\n\n--- arquivos: ${p.arquivos}; título: ${p.titulo}; url: ${p.url}\n`);
    const linkNoTexto = /Mais detalhes: (\S+)/.exec(p.texto)?.[1] ?? '';
    anotar(`CARD ${chave}: texto do zap ${p.texto.length} letras; link ${linkNoTexto.length} caracteres; igual ao recebido: ${linkNoTexto.endsWith(LINKS[chave]!.dados)}; link original ${link.length}`);

    // Cartaz
    await page.getByRole('button', { name: 'Imprimir cartaz para o mural' }).click();
    await expect.poll(() => page.evaluate(() => window.__impressoes), { timeout: 60_000 }).toBeGreaterThan(0);
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ format: 'A4' });
    salvarSaida(`g4-cartaz-${chave}.pdf`, pdf);
    // A imagem do cartaz (o PDF não é legível sem poppler): foto do elemento em mídia de impressão.
    try {
      await page.setViewportSize({ width: 794, height: 1123 });
      await page.screenshot({ path: salvarSaida(`g4-cartaz-${chave}.png`, ""), fullPage: true, timeout: 30_000 });
    } catch (e) {
      anotar(`CARTAZ ${chave}: sem foto da imagem: ${String(e).slice(0, 150)}`);
    }
    await page.emulateMedia({ media: 'screen' });
    anotar(`CARTAZ ${chave}: pdf ${pdf.length} bytes`);
    expect.soft(s.erros.filter((e) => !e.includes('interactive-widget')), 'erros de JS (o aviso do WebKit sobre interactive-widget é só ruído, ver achados)').toEqual([]);
    await s.fechar();
  });
}

test('G4 "Criar outro evento a partir deste" (AND-GRANDE)', async ({ browser }, info) => {
  const base = info.project.use.baseURL!;
  const s = await abrirAparelho(browser, 'AND-GRANDE');
  const { page } = s;
  await paginaDoEvento(page, base, 'evento-sp-19h');
  await page.getByRole('link', { name: 'Criar outro evento a partir deste' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Passo 1 de 3');
  salvarSaida('g4-criar-outro-passo1.txt', await page.locator('main').innerText());
  await medirEGuardar(page, 'g4', 'criar-outro-passo1');
  await foto(page, 'g4-criar-outro-1', true);
  const orgValor = await page.locator('#fluxo-organizacao').inputValue();
  anotar(`CRIAR-OUTRO: organização já vem preenchida com "${orgValor}"`);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await foto(page, 'g4-criar-outro-3', true);
  await page.getByRole('button', { name: 'Ficou bom' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Pronto!');
  await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…', { timeout: 60_000 });
  await foto(page, 'g4-criar-outro-4-pronto', true);
  salvarSaida('g4-criar-outro-pronto.txt', await page.locator('main').innerText());
  await s.fechar();
});

for (const modo of ['cancela', 'recusa-arquivo'] as const) {
  test(`G4 Mandar no WhatsApp com compartilhar "${modo}" (AND-GRANDE)`, async ({ browser }, info) => {
    const base = info.project.use.baseURL!;
    const s = await abrirAparelho(browser, 'AND-GRANDE', { compartilhar: modo });
    const { page } = s;
    await paginaDoEvento(page, base, 'evento-sp-19h');
    await page.getByRole('link', { name: 'Fazer o card deste evento' }).click();
    await page.getByRole('button', { name: 'Ficou bom' }).click();
    await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…', { timeout: 60_000 });
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
    if (await page.locator('#fluxo-confirma').isVisible()) await page.getByRole('button', { name: /Mandar mesmo assim/ }).click();
    await page.waitForTimeout(1500);
    const aviso = await avisoAtual(page);
    const estado = await page.locator('#fluxo-estado').innerText();
    const partilhas = await page.evaluate(() => window.__partilhas);
    anotar(`ZAP ${modo}: aviso="${aviso}"; estado="${estado}"; partilhas=${partilhas.length}`);
    await foto(page, `g4-zap-${modo}`);
    await s.fechar();
  });
}
