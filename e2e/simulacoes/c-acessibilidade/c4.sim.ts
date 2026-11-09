// C4 Jéssica, 31, lê devagar, cooperativa de catadores. Aparelho AND-FRACO, CPU 6x, 3G lento.
// Sessão de TESTE E RELATO: percorre o caminho inteiro, junta todos os textos (vistos e só lidos por leitor de tela)
// e grava em .saida/c4-textos.md, tela por tela, com marcas de frase longa, palavra difícil e palavras repetidas.
// Não muda nada do site. Personagem fictícia.

import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import type { Porta } from '../../apoio';
import { preencherObrigatoriosVazios } from '../obrigatorios';
import { APARELHOS, SAIDA, condicoes, cronometro, expect, foto, guardar, medirAlvos, ORGANIZACAO, PORTAS, rolagemLateral, test, titulo } from './apoio-sim';

test.use({ ...APARELHOS['AND-FRACO'] });

const REP = Number(process.env.C4_REP ?? 1);
const MD = join(SAIDA, REP === 1 ? 'c4-textos.md' : `c4-textos-rep${REP}.md`);

// ---------- coleta ----------

interface Linha {
  tipo: string; // T texto visível | L só leitor de tela (recortado) | A atributo | O oculto agora
  texto: string;
}

/** Junta, na ordem da tela, o texto visível e o que só o leitor de tela lê. */
async function junta(page: Page, raizSel = 'body'): Promise<Linha[]> {
  return page.evaluate((raizSel) => {
    const saida: { tipo: string; texto: string }[] = [];
    const raiz = document.querySelector(raizSel) ?? document.body;
    const BLOCOS = 'P,DIV,LI,UL,OL,SECTION,FORM,FIELDSET,H1,H2,H3,H4,LABEL,BUTTON,A,SUMMARY,DETAILS,NAV,MAIN,FOOTER,ARTICLE,HEADER,DIALOG,LEGEND,PRE,TEXTAREA,SELECT,OPTION,DT,DD,TABLE,TR,TD,TH';
    const limpa = (s: string) => s.replace(/\s+/g, ' ').trim();
    const visivelPeloLeitor = (el: Element) => {
      // escondido de todos (display:none, hidden)?
      return (el as HTMLElement).checkVisibility ? (el as HTMLElement).checkVisibility({ checkVisibilityCSS: true } as never) : true;
    };
    const soLeitor = (el: Element) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      return r.width <= 2 || r.height <= 2 || el.classList.contains('fluxo-so-leitor');
    };
    const vistos = new Set<Element>();
    const todos = [...raiz.querySelectorAll('*')];
    for (const el of todos) {
      if (['SCRIPT', 'STYLE', 'SVG', 'PATH', 'CIRCLE', 'RECT', 'CANVAS'].includes(el.tagName.toUpperCase())) {
        if (el.tagName.toUpperCase() === 'CANVAS') {
          const a = el.getAttribute('aria-label');
          if (a) saida.push({ tipo: 'A', texto: `canvas aria-label: ${a}` });
        }
        continue;
      }
      if (el.closest('svg')) continue;
      const oculto = !visivelPeloLeitor(el);
      if (oculto && el.closest('dialog:not([open])')) continue;
      // texto próprio: se não tem filho "bloco", usa o innerText inteiro; senão só os nós de texto diretos
      const temBloco = [...el.children].some((c) => BLOCOS.includes(c.tagName));
      let t = '';
      if (!temBloco) t = limpa(oculto ? el.textContent ?? '' : (el as HTMLElement).innerText ?? el.textContent ?? '');
      else t = limpa([...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' '));
      if (t && !vistos.has(el)) {
        vistos.add(el);
        if (el.tagName === 'OPTION' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
          if (el.tagName === 'TEXTAREA') {
            saida.push({ tipo: 'A', texto: `campo de texto, valor: ${(el as HTMLTextAreaElement).value.replace(/\n/g, ' / ')}` });
            continue;
          }
        }
        const eInline = !temBloco;
        saida.push({ tipo: oculto ? 'O' : eInline && soLeitor(el) ? 'L' : 'T', texto: `${el.tagName === 'H1' ? '# ' : el.tagName === 'H2' ? '## ' : ''}${t}` });
      }
      for (const attr of ['aria-label', 'title', 'alt', 'placeholder']) {
        const v = el.getAttribute(attr);
        if (v && !oculto) saida.push({ tipo: 'A', texto: `${attr} de <${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}>: ${v}` });
      }
      if (el instanceof HTMLInputElement && !oculto && el.type !== 'radio' && el.type !== 'checkbox' && el.value && el.type !== 'file' && el.type !== 'color') {
        saida.push({ tipo: 'A', texto: `valor do campo ${el.id}: ${el.value}` });
      }
      const dd = el.getAttribute('aria-describedby');
      if (dd && !oculto) {
        const tt = dd.split(/\s+/).map((id) => limpa(document.getElementById(id)?.textContent ?? '')).filter(Boolean).join(' | ');
        if (tt) saida.push({ tipo: 'A', texto: `aria-describedby de #${el.id || el.tagName.toLowerCase()}: ${tt}` });
      }
    }
    return saida;
  }, raizSel);
}

const DIFICEIS: [RegExp, string][] = [
  [/\bpauta\b/i, 'pauta'], [/\bencaminhament/i, 'encaminhamento'], [/\bindex/i, 'indexar'], [/\brevis[ãa]o\b/i, 'revisão'],
  [/\bconte[úu]do\b/i, 'conteúdo'], [/\bcan[ôo]nic/i, 'canônico'], [/\bcompactad/i, 'compactado'], [/\bpr[ée]via\b/i, 'prévia'],
  [/\bformato\b/i, 'formato'], [/\bpaleta\b/i, 'paleta'], [/\bcontraste\b/i, 'contraste'], [/\bQR\b/, 'QR'], [/\bPDF\b/, 'PDF'],
  [/\blinks?\b/i, 'link'], [/\bstatus\b/i, 'status'], [/\blogo\b/i, 'logo'], [/\brodap[ée]\b/i, 'rodapé'], [/\bminiatura\b/i, 'miniatura'],
  [/\bcanvas\b/i, 'canvas'], [/\bURL\b/, 'URL'], [/\bcadastro\b/i, 'cadastro'], [/\brepassar\b/i, 'repassar'], [/\bobrigat[óo]ri/i, 'obrigatório'],
  [/\bopcional\b/i, 'opcional'], [/\bdispositivo\b/i, 'dispositivo'], [/\bnavegador\b/i, 'navegador'], [/\bextenso\b/i, 'por extenso'],
  [/\bbloquead|\bbloqueio\b/i, 'bloqueio'], [/\bden[úu]nci/i, 'denúncia'], [/\bplataforma\b/i, 'plataforma'], [/\bdados\b/i, 'dados'],
  [/\bservidor\b/i, 'servidor'], [/\bcompartilh/i, 'compartilhar'], [/\banexo\b/i, 'anexo'], [/\bconfirma[çc]/i, 'confirmação'],
  [/\bgerad[oa]\b|\bgerar\b/i, 'gerar'], [/\bconvoca/i, 'convocar'], [/\bplen[áa]ria\b/i, 'plenária'], [/\bassembleia\b/i, 'assembleia'],
  [/\bagenda\b/i, 'agenda'], [/\barquivo\b/i, 'arquivo'], [/\bapagar\b/i, 'apagar'], [/\blimpar\b/i, 'limpar'], [/\bcard\b/i, 'card'],
  [/\bcartaz\b/i, 'cartaz'], [/\bimagem\b/i, 'imagem'], [/\bconvite\b/i, 'convite'], [/\bevento\b/i, 'evento'], [/\bp[áa]gina\b/i, 'página'],
  [/\bcriptograf/i, 'criptografia'], [/\bhash\b/i, 'hash'], [/\bindicad|\bfonte\b/i, 'fonte'], [/\bmemória\b/i, 'memória'],
  [/\bfeito com\b/i, 'feito com'], [/\bmapa\b/i, 'mapa'], [/\bprivacidade\b/i, 'privacidade'], [/\btermos\b/i, 'termos'],
  [/\bata\b/i, 'ata'], [/\borganiza[çc][ãa]o\b/i, 'organização'], [/\bcolar\b|\bcopiar\b|\bcopiad/i, 'copiar'], [/\bbaixar\b/i, 'baixar'],
];
const GRUPOS = ['card', 'imagem', 'cartaz', 'convite', 'evento', 'página', 'link', 'apagar', 'limpar', 'mandar', 'enviar', 'compartilh', 'divulgar', 'aviso', 'mensagem', 'texto', 'prévia', 'miniatura', 'arquivo'];

const contaPalavras = (s: string) => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’\-./:]*/gu) ?? []).length;
const frases = (s: string) => s.split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ“"(])/u).filter(Boolean);

const palavrasPorTela: Record<string, number> = {};
const usoDeGrupos: Record<string, Record<string, number>> = {};
const resumoFlags: string[] = [];

/** Grava a tela em c4-textos.md e devolve as linhas. */
async function tela(page: Page, nome: string, opcoes: { raiz?: string; nota?: string } = {}): Promise<Linha[]> {
  // 3G lento: espera a tela chegar (o título "Carregando…" é o de espera).
  await page.waitForFunction(() => document.querySelector('h1')?.textContent?.trim() !== 'Carregando…', null, { timeout: 150_000 }).catch(() => undefined);
  const linhas = await junta(page, opcoes.raiz);
  const visiveis = linhas.filter((l) => l.tipo === 'T' || l.tipo === 'L');
  const vistoEmTela = visiveis.filter((l) => l.tipo === 'T').map((l) => l.texto).join(' ');
  palavrasPorTela[nome] = contaPalavras(vistoEmTela);
  let md = `\n## ${nome}\n`;
  if (opcoes.nota) md += `_${opcoes.nota}_\n`;
  md += `Palavras visíveis nesta tela: ${palavrasPorTela[nome]}. Legenda: T texto na tela; L só leitor de tela; A atributo lido (aria, alt, title, valor); O oculto agora (aparece em outra situação).\n\n`;
  const vistos = new Set<string>();
  for (const l of linhas) {
    const chave = `${l.tipo}|${l.texto}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    const marcas: string[] = [];
    if (l.tipo !== 'A') {
      for (const f of frases(l.texto.replace(/^#+\s*/, ''))) {
        const n = contaPalavras(f);
        if (n > 20) marcas.push(`FRASE LONGA ${n} palavras`);
      }
      const achadas = new Set<string>();
      for (const [re, nomeDif] of DIFICEIS) if (re.test(l.texto)) achadas.add(nomeDif);
      if (achadas.size) marcas.push(`palavras: ${[...achadas].join(', ')}`);
      for (const g of GRUPOS) if (new RegExp(`\\b${g}`, 'i').test(l.texto)) (usoDeGrupos[nome] ??= {})[g] = ((usoDeGrupos[nome] ??= {})[g] ?? 0) + 1;
    }
    md += `- [${l.tipo}] ${l.texto}${marcas.length ? `  **«${marcas.join(' · ')}»**` : ''}\n`;
    if (marcas.some((m) => m.startsWith('FRASE'))) resumoFlags.push(`${nome}: ${l.texto.slice(0, 90)}… (${marcas.filter((m) => m.startsWith('FRASE')).join(', ')})`);
  }
  appendFileSync(MD, md);
  return linhas;
}

/** Palavras que uma pessoa vê escritas na tela (sem o que é só para leitor de tela, sem repetir, sem o que está escondido). */
async function palavrasNaTela(page: Page): Promise<number> {
  const texto = await page.evaluate(() => {
    const partes: string[] = [];
    const andar = (n: Node): void => {
      if (n.nodeType === 3) {
        const t = (n.textContent ?? '').replace(/\s+/g, ' ').trim();
        const el = n.parentElement;
        if (t && el && el.checkVisibility() && !el.closest('.fluxo-so-leitor,dialog:not([open]),script,style')) {
          const r = el.getBoundingClientRect();
          if (r.width > 2 && r.height > 2) partes.push(t);
        }
        return;
      }
      n.childNodes.forEach(andar);
    };
    andar(document.body);
    return partes.join(' ');
  });
  return contaPalavras(texto);
}

async function iniciar(page: Page, cond = true): Promise<void> {
  if (cond) await condicoes(page, { cpu: 6, rede: '3G-LENTO' });
}

async function abrirPorta(page: Page, tipo: string): Promise<void> {
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  await page.locator(`a[href$="#/fazer/${tipo}"]`).click();
  await expect(titulo(page)).toContainText('Passo 1 de 3', { timeout: 120_000 });
}

const PORTA_AVISO = { tipo: 'aviso', verbo: 'Dar um aviso', agenda: false } as Porta;

/** Escreve o dia (dd/mm/aaaa) em #fluxo-data. No calendário (type="date") vai AAAA-MM-DD; texto livre e dia impossível não cabem (devolve false). */
async function escreverDia(page: Page, texto: string): Promise<boolean> {
  const campo = page.locator('#fluxo-data');
  if ((await campo.getAttribute('type')) !== 'date') {
    await campo.fill(texto);
    return true;
  }
  const m = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec(texto);
  if (!m) return false;
  try {
    await campo.fill(`${m[3]}-${m[2]}-${m[1]}`);
  } catch {
    return false;
  }
  return (await campo.inputValue()) !== '';
}

/** Os campos dos passos 1 e 2 começam vazios: escreve só os obrigatórios que faltam e segue até o passo 3. */
async function atePasso3(page: Page, porta: Porta): Promise<void> {
  await preencherObrigatoriosVazios(page, porta, 1);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await preencherObrigatoriosVazios(page, porta, 2);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(titulo(page)).toContainText('Passo 3 de 3');
}

async function chegarAoPronto(page: Page, agenda: boolean): Promise<void> {
  await page.getByRole('button', { name: 'Ficou bom' }).click();
  await expect(titulo(page)).toContainText('Pronto!');
  if (agenda) await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…', { timeout: 120_000 });
}

test.beforeAll(() => {
  // O arquivo é apagado por quem roda (rm) antes da rodada; aqui só se põe o cabeçalho se ainda não existe.
  if (!existsSync(MD))
    writeFileSync(MD, `# C4 Jéssica: textos coletados, tela por tela (rodada ${REP})

Aparelho AND-FRACO (360x640), CPU 6x, 3G lento. Coletado em ${new Date().toISOString()}. Só leitura: nada do site foi mudado.
`);
  const rod = join(SAIDA, 'c4-rodizio.md');
  if (REP === 1 && !existsSync(rod)) writeFileSync(rod, '# Rodízio dos exemplos por porta\n');
});

// ---------- 1. início e as cinco portas ----------

test('C4: início, rodapé e as cinco portas (passos 1, 2 e 3)', async ({ page, erros }) => {
  await iniciar(page);
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  await tela(page, 'Início');
  await foto(page, 'c4-inicio');

  for (const porta of PORTAS) {
    await abrirPorta(page, porta.tipo);
    await tela(page, `${porta.verbo}: passo 1 (vazio, com o exemplo em cinza)`);
    if (porta.tipo === 'reuniao') await foto(page, 'c4-reuniao-passo1', true);
    await preencherObrigatoriosVazios(page, porta, 1);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(titulo(page)).toContainText('Passo 2 de 3');
    await tela(page, `${porta.verbo}: passo 2`);
    await preencherObrigatoriosVazios(page, porta, 2);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(titulo(page)).toContainText('Passo 3 de 3');
    await tela(page, `${porta.verbo}: passo 3`);
  }
  expect(erros).toEqual([]);
});

// ---------- 2. erros de campo ----------

test('C4: erros de campo vazio e longo demais, atalhos de dia, passo 3 com Mais opções, Ver maior e cor livre', async ({ page }) => {
  await iniciar(page);
  // Evento: os campos já começam vazios (o exemplo é só o cinza de dentro); toca em Continuar sem escrever.
  await abrirPorta(page, 'evento');
  await tela(page, 'Evento passo 1: campos vazios, antes de Continuar');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForTimeout(400);
  await tela(page, 'Evento passo 1: campos vazios, depois de Continuar (erros)');
  await foto(page, 'c4-erro-vazio', true);
  const alvosErro = await page.evaluate(() => [...document.querySelectorAll('.campo-erro:not([hidden])')].map((e) => `${e.id}: ${e.textContent}`));
  guardar('c4-erros-vazio-evento-p1.json', JSON.stringify(alvosErro, null, 1));

  // Longo demais: o campo corta? há contador?
  const longo = 'Mutirão de limpeza do córrego com muita gente da vizinhança e das associações do bairro inteiro '.repeat(5);
  await page.locator('#fluxo-titulo').fill(longo);
  await page.locator('#fluxo-organizacao').fill(longo);
  await page.locator('#fluxo-texto').fill(longo + longo);
  await page.waitForTimeout(300);
  await tela(page, 'Evento passo 1: texto longo demais digitado', { nota: `Digitado ${longo.length} letras no título e na organização, ${longo.length * 2} no texto.` });
  const tamanhoDepois = await page.evaluate(() => ({ t: (document.getElementById('fluxo-titulo') as HTMLInputElement).value.length, o: (document.getElementById('fluxo-organizacao') as HTMLInputElement).value.length, x: (document.getElementById('fluxo-texto') as HTMLTextAreaElement).value.length }));
  guardar('c4-longo-evento.json', JSON.stringify(tamanhoDepois));
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForTimeout(400);
  await tela(page, 'Evento passo 1: depois de Continuar com texto longo');

  // O título longo foi cortado em silêncio e o passo 1 passou: já está no passo 2.
  await expect(titulo(page)).toContainText('Passo 2 de 3');
  await page.locator('#fluxo-data').fill('');
  await page.locator('#fluxo-hora').fill('');
  await page.locator('#fluxo-local').fill('');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForTimeout(400);
  await tela(page, 'Evento passo 2: tudo vazio, depois de Continuar (erros)');
  await foto(page, 'c4-erro-passo2', true);
  // O dia é <input type="date"> (AAAA-MM-DD): texto livre e dia impossível não cabem no calendário; só o campo de
  // texto de reserva (navegador sem calendário) aceita escrever "amanhã" ou "32/13/2026".
  for (const [texto, rotulo] of [['amanhã', 'dia escrito "amanhã"'], ['32/13/2026', 'dia "32/13/2026"'], ['01/01/2020', 'dia no passado "01/01/2020"']] as const) {
    if (await escreverDia(page, texto)) {
      if (texto === 'amanhã') await page.locator('#fluxo-data').blur();
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.waitForTimeout(300);
      await tela(page, `Evento passo 2: ${rotulo}`);
    } else test.info().annotations.push({ type: 'dia', description: `o campo de calendário não aceita ${rotulo}` });
  }
  await page.locator('#fluxo-local').fill('x'.repeat(300));
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForTimeout(300);
  await tela(page, 'Evento passo 2: local com 300 letras');
  // atalhos do dia
  const atalho = page.locator('.fluxo-atalho').first();
  await atalho.click();
  await page.waitForTimeout(300);
  await tela(page, 'Evento passo 2: depois de tocar num atalho de dia');

});

test('C4: erros da reunião (pauta vazia, nome de pessoa na pauta)', async ({ page }) => {
  await iniciar(page);
  await abrirPorta(page, 'reuniao');
  await page.getByRole('button', { name: 'Continuar' }).click(); // campos vazios
  await page.waitForTimeout(400);
  await tela(page, 'Reunião passo 1: vazio, depois de Continuar (erros)');
  await foto(page, 'c4-erro-reuniao-p1', true);
  await page.locator('#fluxo-titulo').fill('Assembleia da associação');
  await page.locator('#fluxo-pauta').fill('Falar com a Maria Silva sobre o dinheiro\nPrestação de contas');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForTimeout(300);
  await tela(page, 'Reunião passo 1: pauta com nome de pessoa (aviso, se houver)');

});

test('C4: passo 3 do aviso: Ver maior, Mais opções, cor livre e logo', async ({ page }) => {
  await iniciar(page);
  await abrirPorta(page, 'aviso');
  await atePasso3(page, PORTA_AVISO);
  await page.locator('#fluxo-ver-maior').click();
  await page.waitForTimeout(800);
  await tela(page, 'Aviso passo 3: "Ver a prévia maior" aberto', { raiz: 'dialog[open]' });
  await foto(page, 'c4-ver-maior');
  await page.locator('#fluxo-fechar').click();
  await page.locator('details.fluxo-mais summary').click();
  await tela(page, 'Aviso passo 3: "Mais opções" aberto');
  // cor livre com pouco contraste: amarelo claro; depois uma cor boa; depois uma cor intermediária
  const defineCor = async (hex: string) => {
    await page.evaluate((hex) => {
      const el = document.getElementById('fluxo-cor-livre') as HTMLInputElement;
      el.value = hex;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, hex);
    await page.waitForTimeout(1200);
  };
  await defineCor('#ffff99');
  await tela(page, 'Aviso passo 3: cor livre clara demais (#ffff99)');
  await foto(page, 'c4-cor-livre-clara', true);
  await defineCor('#777777');
  await tela(page, 'Aviso passo 3: cor livre média (#777777)');
  await defineCor('#1b5e20');
  await tela(page, 'Aviso passo 3: cor livre boa (#1b5e20)');
  // logo inválido: arquivo de texto
  await page.locator('#fluxo-logo').setInputFiles({ name: 'meu-logo.txt', mimeType: 'text/plain', buffer: Buffer.from('não sou imagem') });
  await page.waitForTimeout(1500);
  await tela(page, 'Aviso passo 3: arquivo que não é imagem no campo de logo');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await page.locator('#fluxo-logo').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png });
  await page.waitForTimeout(2500);
  await tela(page, 'Aviso passo 3: logo colocado');
});

// ---------- 3. Pronto (exemplo e organização trocada) ----------

test('C4: Pronto só com o obrigatório, mandar, copiar e imprimir', async ({ page }) => {
  await iniciar(page);
  for (const porta of PORTAS) {
    await abrirPorta(page, porta.tipo);
    await atePasso3(page, porta);
    await chegarAoPronto(page, porta.agenda);
    await tela(page, `${porta.verbo}: Pronto só com o obrigatório`);
    if (porta.tipo === 'aviso') await foto(page, 'c4-pronto-aviso-obrigatorio', true);
    if (porta.tipo === 'reuniao' || porta.tipo === 'aviso') {
      await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
      // O painel "Isto ainda tem partes do exemplo" não existe mais; o painel do Pronto só abre sem link ou com órgão público.
      if (await page.locator('#fluxo-confirma').isVisible()) {
        await tela(page, `${porta.verbo}: painel de confirmação do Pronto`);
        await page.getByRole('button', { name: 'Mandar mesmo assim' }).click();
      }
      await page.waitForTimeout(1500);
      await tela(page, `${porta.verbo}: Pronto depois de mandar (WhatsApp)`);
      await page.getByRole('button', { name: 'Copiar só o texto' }).click();
      await page.waitForTimeout(800);
      await tela(page, `${porta.verbo}: depois de "Copiar só o texto"`);
      await page.getByRole('button', { name: 'Imprimir cartaz para o mural' }).click();
      await page.waitForTimeout(800);
      await tela(page, `${porta.verbo}: depois de "Imprimir cartaz para o mural"`);
      const dl = page.waitForEvent('download', { timeout: 60_000 }).catch(() => null);
      await page.getByRole('button', { name: 'Baixar a imagem' }).click();
      await dl;
      await page.waitForTimeout(500);
      await tela(page, `${porta.verbo}: depois de "Baixar a imagem"`);
      const texto = await page.evaluate(() => window.__partilhas.map((p) => p.texto).join('\n----\n'));
      guardar(`c4-texto-mandado-obrigatorio-${porta.tipo}.txt`, texto);
      guardar(`c4-texto-copiado-obrigatorio-${porta.tipo}.txt`, (await page.evaluate(() => window.__copias)).join('\n----\n'));
    }
  }
});

test('C4: Pronto com organização trocada (reunião e evento): link, QR, copiar e página do evento', async ({ page, context }) => {
  await iniciar(page);
  const links: Record<string, string> = {};
  for (const porta of [PORTAS[0], PORTAS[1]]) {
    await abrirPorta(page, porta.tipo);
    await page.locator('#fluxo-organizacao').fill(ORGANIZACAO);
    await atePasso3(page, porta);
    await chegarAoPronto(page, true);
    await tela(page, `${porta.verbo}: Pronto com link (organização trocada)`);
    if (porta.tipo === 'reuniao') await foto(page, 'c4-pronto-reuniao-link', true);
    await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
    await page.waitForTimeout(800);
    if (await page.locator('#fluxo-confirma').isVisible()) await page.getByRole('button', { name: 'Mandar mesmo assim' }).click();
    await page.waitForTimeout(1500);
    const texto = await page.evaluate(() => window.__partilhas.map((p) => p.texto).join('\n----\n'));
    guardar(`c4-texto-mandado-${porta.tipo}.txt`, texto);
    links[porta.tipo] = /Mais detalhes: (\S+)/.exec(texto)?.[1] ?? '';
    await page.getByRole('button', { name: 'Copiar o link' }).click();
    await page.waitForTimeout(800);
    await tela(page, `${porta.verbo}: depois de "Copiar o link"`);
    if (porta.tipo === 'reuniao') {
      await page.getByRole('button', { name: 'Fazer a ata' }).click();
      await expect(page).toHaveURL(/#\/ata$/);
      await expect(titulo(page)).toHaveText('Depois da reunião: a ata', { timeout: 120_000 });
      await tela(page, 'Ata vinda da reunião (com pauta e organização)');
      await page.goBack();
      await expect(titulo(page)).toContainText('Pronto!', { timeout: 120_000 }).catch(() => undefined);
    }
  }
  guardar('c4-links.json', JSON.stringify(links));

  // Página do evento aberta pelo link, como quem recebe.
  const recebida = await context.newPage();
  await recebida.goto(links['evento']!);
  await expect(titulo(recebida)).not.toHaveText(/Abrindo o evento|Carregando/, { timeout: 120_000 });
  await tela(recebida, 'Página do evento (aberta pelo link, como quem recebe)');
  await foto(recebida, 'c4-pagina-evento', true);
  const ag = recebida.getByRole('link', { name: /agenda/i });
  if (await ag.count()) {
    await tela(recebida, 'Página do evento: botão da agenda', { nota: `link de agenda: ${await ag.first().getAttribute('href')} / download=${await ag.first().getAttribute('download')}` });
  }
  const reuniaoPag = await context.newPage();
  await reuniaoPag.goto(links['reuniao']!);
  await expect(titulo(reuniaoPag)).not.toHaveText(/Abrindo o evento|Carregando/, { timeout: 120_000 });
  await tela(reuniaoPag, 'Página do evento (reunião, com a pauta)');

  // Denúncia pelo link.
  await recebida.getByRole('link', { name: 'Denunciar este evento' }).click();
  await expect(recebida).toHaveURL(/#\/denunciar\//);
  await tela(recebida, 'Denúncia: formulário (vindo da página do evento)');
  await recebida.getByRole('button', { name: 'Revisar a denúncia' }).click();
  await recebida.waitForTimeout(400);
  await tela(recebida, 'Denúncia: formulário vazio, depois de "Revisar a denúncia" (erros)');
  await foto(recebida, 'c4-denuncia-erro', true);
  await recebida.getByLabel('Tipo de problema').selectOption({ index: 1 });
  await recebida.getByLabel('O que há de errado').fill('Pede dinheiro adiantado para garantir a vaga.');
  await recebida.getByRole('button', { name: 'Revisar a denúncia' }).click();
  await expect(recebida.getByRole('heading', { name: 'Confira antes de enviar' })).toBeVisible();
  await tela(recebida, 'Denúncia: revisão ("Confira antes de enviar")');
  await foto(recebida, 'c4-denuncia-revisao', true);
  const opcoesTipo = await recebida.evaluate(() => [...document.querySelectorAll('select option')].map((o) => o.textContent));
  guardar('c4-denuncia-tipos.json', JSON.stringify(opcoesTipo));

  // Link removido (lista de bloqueio trocada só aqui).
  const dados = links['evento']!.slice(links['evento']!.indexOf('#/evento/') + '#/evento/'.length);
  const impressao = createHash('sha256').update(dados).digest('hex');
  const bloqueada = await context.newPage();
  await bloqueada.route('**/bloqueados.json', (rota) =>
    rota.fulfill({ contentType: 'application/json', body: JSON.stringify({ bloqueados: [{ h: impressao, motivo: 'regra-5' }] }) }),
  );
  await bloqueada.goto(links['evento']!);
  await expect(titulo(bloqueada)).toHaveText('Este link foi removido após denúncia', { timeout: 120_000 });
  await tela(bloqueada, 'Link removido (motivo regra 5)');
  await foto(bloqueada, 'c4-link-removido', true);
  // outro motivo
  const bloq2 = await context.newPage();
  await bloq2.route('**/bloqueados.json', (rota) =>
    rota.fulfill({ contentType: 'application/json', body: JSON.stringify({ bloqueados: [{ h: impressao, motivo: 'pedido' }] }) }),
  );
  await bloq2.goto(links['evento']!);
  await expect(titulo(bloq2)).toHaveText('Este link foi removido a pedido de quem o criou', { timeout: 120_000 });
  await tela(bloq2, 'Link removido (motivo "pedido")');
});

// ---------- 4. ata, páginas e rodapé ----------

test('C4: ata (vazia, com erro, pronta), páginas do rodapé e Como denunciar', async ({ page }) => {
  await iniciar(page);
  await page.goto('./#/ata');
  await expect(titulo(page)).toHaveText('Depois da reunião: a ata');
  await tela(page, 'Ata: vazia');
  await foto(page, 'c4-ata-vazia', true);
  const ver = page.getByRole('button', { name: 'Ver a ata pronta' });
  await ver.click();
  await page.waitForTimeout(400);
  await tela(page, 'Ata: "Ver a ata pronta" sem preencher (avisos, se houver)');
  await page.getByLabel('Organização').fill('Coletivo Cultural Beira-Rio');
  await page.getByLabel('Data').fill('2026-11-14');
  await page.getByLabel('Presentes').fill('Pessoa Um\nPessoa Dois');
  await page.getByLabel('Ponto 1: assunto').fill('Festa junina');
  await page.getByLabel('Ponto 1: o que foi decidido').fill('A festa será no dia 20.');
  await ver.click();
  await page.waitForTimeout(600);
  await tela(page, 'Ata: pronta');
  await foto(page, 'c4-ata-pronta', true);
  await page.getByRole('button', { name: 'Salvar em PDF' }).click();
  await page.waitForTimeout(600);
  await tela(page, 'Ata: depois de "Salvar em PDF"');
  await page.getByRole('button', { name: 'Apagar a ata' }).click();
  await page.waitForTimeout(500);
  await tela(page, 'Ata: depois de "Apagar a ata"');

  // Rodapé e páginas institucionais (só coletar; texto jurídico só se aponta).
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  for (const nome of ['Sobre', 'Termos', 'Privacidade', 'Regras de uso', 'Como denunciar', 'Contato']) {
    await page.goto('./#/');
    await expect(titulo(page)).toHaveText('O que você quer fazer?');
    await page.locator('footer').getByRole('link', { name: nome, exact: true }).click();
    await page.waitForTimeout(600);
    await tela(page, `Página: ${nome}`, { nota: nome === 'Como denunciar' ? 'Página de denúncia (sem link a denunciar).' : 'Texto institucional: só apontar, sem reescrita longa.' });
    if (nome === 'Como denunciar') await foto(page, 'c4-como-denunciar', true);
  }
  await page.goto('./#/denunciar');
  await page.waitForTimeout(500);
  await tela(page, 'Denúncia: formulário aberto direto pelo rodapé (sem link)');
  await page.getByRole('button', { name: 'Revisar a denúncia' }).click();
  await page.waitForTimeout(400);
  await tela(page, 'Denúncia: sem link, formulário vazio, depois de revisar (erros)');
  const rodapeEmPronto = await page.evaluate(() => !!document.querySelector('footer'));
  guardar('c4-rodape.json', JSON.stringify({ rodapeNaUltimaTela: rodapeEmPronto }));
});

// ---------- 5. rodízio dos exemplos ----------

test('C4: rodízio dos exemplos (cada porta 6 vezes) e neutralidade', async ({ page }) => {
  // sem 3G aqui: só quer ver o que o exemplo sorteia
  const tabela: Record<string, string[]> = {};
  for (const porta of PORTAS) {
    tabela[porta.tipo] = [];
    for (let i = 0; i < 6; i++) {
      await page.goto('./');
      await page.evaluate(() => sessionStorage.clear());
      await page.goto('./#/');
      await page.reload();
      await page.locator(`a[href$="#/fazer/${porta.tipo}"]`).click();
      await expect(titulo(page)).toContainText('Passo 1 de 3');
      const campos = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('#fluxo-titulo,#fluxo-organizacao,#fluxo-texto,#fluxo-pauta')].map((c) => `${c.id.replace('fluxo-', '')}=${(c.placeholder || c.value).replace(/\n/g, ' / ')}`).join(' | '),
      );
      tabela[porta.tipo]!.push(campos);
    }
  }
  let md = '';
  for (const [tipo, lista] of Object.entries(tabela)) {
    md += `\n## ${tipo}\n`;
    for (const l of lista) md += `- ${l}\n`;
    md += `Diferentes: ${new Set(lista).size} de ${lista.length}\n`;
  }
  appendFileSync(join(SAIDA, 'c4-rodizio.md'), md);
  // paletas (nomes e cores)
  await abrirPorta(page, 'aviso');
  await atePasso3(page, PORTA_AVISO);
  const paletas = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.fluxo-amostra')].map((e) => `${e.dataset.paleta}: fundo ${e.style.background} / borda ${e.style.borderColor}; nome lido: ${e.closest('label')?.textContent?.trim()}`),
  );
  appendFileSync(join(SAIDA, 'c4-rodizio.md'), `\n## Paletas do passo 3\n${paletas.map((p) => `- ${p}`).join('\n')}\n`);
  await foto(page, 'c4-passo3-paletas', true);
});

// ---------- 6. sem compartilhar do aparelho ----------

test.describe('sem menu de compartilhar', () => {
  test.use({ compartilhar: 'ausente' });
  test('C4: Pronto no aparelho sem menu de compartilhar', async ({ page }) => {
    await iniciar(page);
    await abrirPorta(page, 'aviso');
    await atePasso3(page, PORTA_AVISO);
    await chegarAoPronto(page, false);
    await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
    await page.waitForTimeout(500);
    if (await page.locator('#fluxo-confirma').isVisible()) await page.getByRole('button', { name: 'Mandar mesmo assim' }).click();
    await page.waitForTimeout(2500);
    await tela(page, 'Aviso: Pronto sem menu de compartilhar (depois de "Mandar no WhatsApp")');
    await foto(page, 'c4-sem-compartilhar', true);
  });
});

test.describe('o menu de compartilhar é fechado', () => {
  test.use({ compartilhar: 'cancela' });
  test('C4: Pronto quando a pessoa fecha o menu', async ({ page }) => {
    await iniciar(page);
    await abrirPorta(page, 'aviso');
    await atePasso3(page, PORTA_AVISO);
    await chegarAoPronto(page, false);
    await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
    await page.waitForTimeout(500);
    if (await page.locator('#fluxo-confirma').isVisible()) await page.getByRole('button', { name: 'Mandar mesmo assim' }).click();
    await page.waitForTimeout(1500);
    await tela(page, 'Aviso: Pronto depois de fechar o menu de compartilhar');
  });
});

// ---------- 7. tempo até o Pronto ("Dar um aviso") ----------

for (const rodada of [1, 2]) {
  test(`C4: tempo técnico até o Pronto em "Dar um aviso" (rodada ${rodada})`, async ({ page }) => {
    await iniciar(page);
    const palavras: Record<string, number> = {};
    const contar = async (nome: string) => {
      palavras[nome] = await palavrasNaTela(page);
    };
    let tecnico = 0;
    const marca = () => cronometro();
    let t = marca();
    await page.goto('./');
    await expect(titulo(page)).toHaveText('O que você quer fazer?');
    tecnico += t();
    await contar('início');
    t = marca();
    await page.locator('a[href$="#/fazer/aviso"]').click();
    await expect(titulo(page)).toContainText('Passo 1 de 3');
    await page.locator('#fluxo-titulo').fill('A coleta muda de dia');
    tecnico += t();
    await contar('passo 1');
    t = marca();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(titulo(page)).toContainText('Passo 2 de 3');
    tecnico += t();
    await contar('passo 2');
    t = marca();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(titulo(page)).toContainText('Passo 3 de 3');
    tecnico += t();
    await contar('passo 3');
    t = marca();
    await page.getByRole('button', { name: 'Ficou bom' }).click();
    await expect(titulo(page)).toContainText('Pronto!');
    await expect(page.locator('#fluxo-mandar')).toBeVisible();
    // desenhar a imagem: espera o botão de mandar pronto (arquivo desenhado) sem mandar
    await page.waitForFunction(() => !document.querySelector('#fluxo-estado')?.textContent?.includes('Preparando'));
    tecnico += t();
    await contar('Pronto');
    const lidas = Object.values(palavras).reduce((a, b) => a + b, 0);
    const leitura = Math.round(lidas / 3);
    const total = Math.round(tecnico / 1000 + leitura);
    const linha = `Rodada ${rodada}: tempo técnico ${(tecnico / 1000).toFixed(1)} s; palavras na tela por passo ${JSON.stringify(palavras)} = ${lidas} palavras; leitura estimada ${lidas}/3 = ${leitura} s; total estimado ${total} s (${(total / 60).toFixed(1)} min).`;
    console.log(linha);
    appendFileSync(join(SAIDA, 'c4-tempo.md'), `${linha}\n`);
    await foto(page, `c4-tempo-pronto-${rodada}`);
    const m = await medirAlvos(page);
    appendFileSync(join(SAIDA, 'c4-tempo.md'), `Alvos pequenos no Pronto: ${JSON.stringify(m.pequenos)}\n`);
    expect(await rolagemLateral(page)).toBeLessThanOrEqual(0);
  });
}

test.afterAll(() => {
  const resumo = `\n## Resumo automático (conferido à mão no relatório)\n\n### Frases com mais de 20 palavras\n${[...new Set(resumoFlags)].map((f) => `- ${f}`).join('\n')}\n\n### Palavras de grupo por tela (card, imagem, cartaz, convite, evento, página, apagar, limpar...)\n${Object.entries(usoDeGrupos).map(([t, g]) => `- ${t}: ${JSON.stringify(g)}`).join('\n')}\n\n### Palavras visíveis por tela\n${Object.entries(palavrasPorTela).map(([t, n]) => `- ${t}: ${n}`).join('\n')}\n`;
  appendFileSync(MD, resumo);
  try {
    readFileSync(MD);
  } catch {
    /* sem arquivo */
  }
});

// ---------- 8. quanto tempo os avisos ficam na tela ----------

for (const rodada of [1, 2]) {
  test(`C4: quanto tempo o aviso "copiado/baixado" fica na tela (rodada ${rodada})`, async ({ page }) => {
    await iniciar(page);
    await abrirPorta(page, 'aviso');
    await atePasso3(page, PORTA_AVISO);
    await chegarAoPronto(page, false);
    await page.getByRole('button', { name: 'Copiar só o texto' }).click();
    if (await page.locator('#fluxo-confirma').isVisible()) await page.getByRole('button', { name: 'Copiar mesmo assim' }).click();
    const t0 = Date.now();
    await page.waitForFunction(() => document.getElementById('aviso-vivo')?.classList.contains('aviso-vivo-visivel'), null, { timeout: 20_000 });
    const texto = await page.evaluate(() => document.getElementById('aviso-vivo')?.textContent ?? '');
    const apareceu = Date.now() - t0;
    // Desde a correção de C-05 (06/11/2026): aviso com instrução fica até o próximo toque; o resto, 1 s por palavra (mín. 5 s).
    await page.waitForTimeout(8_000);
    const aindaVisivel = await page.evaluate(() => !!document.getElementById('aviso-vivo')?.classList.contains('aviso-vivo-visivel'));
    if (aindaVisivel) await page.mouse.click(5, 5);
    await page.waitForFunction(() => !document.getElementById('aviso-vivo')?.classList.contains('aviso-vivo-visivel'), null, { timeout: 30_000 });
    const visivelMs = Date.now() - t0 + 0;
    const palavras = contaPalavras(texto);
    const textoDepois = await page.evaluate(() => document.getElementById('aviso-vivo')?.textContent ?? '');
    const linha = `Rodada ${rodada}: aviso "${texto}" (${palavras} palavras, leitura a 3 palavras por segundo = ${(palavras / 3).toFixed(1)} s). ${aindaVisivel ? 'Ainda à vista depois de 8 s; sumiu com o toque' : 'Sumiu sozinho'} em ${(visivelMs / 1000).toFixed(1)} s (a contar do toque). Texto na região viva depois: "${textoDepois}".`;
    console.log(linha);
    appendFileSync(join(SAIDA, 'c4-tempo-aviso.md'), `${linha}\n`);
    expect(apareceu).toBeLessThan(20_000);
  });
}
