// Apoio do grupo a5 (neutralidade: dois personagens, mesmo roteiro). Só testes; nada entra no site.
import type { Page } from '@playwright/test';
import { cronometro, expect, foto, inspecionar as inspecionarCompleto, partilhas, registrar, salvarPartilhado, salvarTexto, tocar, titulo } from './sim';

export const PORTAS = [
  { tipo: 'reuniao', verbo: 'Chamar para uma reunião', agenda: true },
  { tipo: 'evento', verbo: 'Divulgar um evento', agenda: true },
  { tipo: 'aviso', verbo: 'Dar um aviso', agenda: false },
  { tipo: 'resultado', verbo: 'Contar uma conquista', agenda: false },
  { tipo: 'agradecimento', verbo: 'Agradecer', agenda: false },
] as const;
export type Porta = (typeof PORTAS)[number];

export const porta = (tipo: Porta['tipo']): Porta => PORTAS.find((p) => p.tipo === tipo)!;

/** Os tipos de organização do rodízio (src/ferramentas/cards/exemplos.ts), pelo começo do nome. */
export const TIPOS: [string, RegExp][] = [
  ['associacao-de-moradores', /^Associação de Moradores/],
  ['sindicato', /^Sindicato/],
  ['grupo-de-oracao', /^(Grupo de Oração|Casa de Matriz Africana|Centro Espírita)/], // o grupo religioso agora alterna entre 3 tradições (exemplos.ts)
  ['nucleo-de-bairro', /^Núcleo de Bairro/],
  ['coletivo-cultural', /^Coletivo/],
  ['instituto-ong', /^Instituto/],
  ['conselho-escolar', /^Conselho Escolar/],
];
export const tipoDaOrg = (org: string): string => TIPOS.find(([, r]) => r.test(org))?.[0] ?? `OUTRO:${org}`;

/** Conteúdo igual para os dois personagens, em cada porta; só a organização muda. */
export const CONTEUDO = {
  evento: {
    titulo: 'Palestra sobre a coleta de lixo no bairro',
    texto: 'Conversa aberta com a vizinhança. Entrada livre.',
    local: 'Rua das Flores, 120',
    hora: '19:30',
  },
  reuniao: {
    titulo: 'Plenária sobre a horta do bairro',
    pauta: 'Calendário do mês\nDivisão de tarefas',
    local: 'Salão da associação, Rua Sete, 45',
    hora: '19:00',
  },
} as const;

/** O axe no WebKit, com a máquina cheia, chega a travar: dá 45 s e segue (registra que não deu). */
export async function inspecionar(page: Page, tela: string): Promise<void> {
  if (page.context().browser()?.browserType().name() === 'webkit') {
    registrar('inspecao-falhou', { tela, motivo: 'axe pulado no WebKit (trava com a máquina cheia; o iPhone é medido pelos outros grupos)' });
    return;
  }
  const limite = new Promise<'tempo'>((r) => setTimeout(() => r('tempo'), 45_000));
  const r = await Promise.race([inspecionarCompleto(page, tela).then(() => 'ok' as const).catch(() => 'erro' as const), limite]);
  if (r !== 'ok') registrar('inspecao-falhou', { tela, motivo: r });
}

export const mainTexto = (page: Page) => page.locator('main').innerText();

export async function irParaOInicio(page: Page): Promise<void> {
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
}

export async function tocarNaPorta(page: Page, p: Porta): Promise<void> {
  await tocar(page.getByRole('link', { name: new RegExp(p.verbo) }));
  await expect(titulo(page)).toContainText('Passo 1 de 3');
}

/** Lê organização e título do exemplo no passo 1. */
export async function exemploDoPasso1(page: Page) {
  const organizacao = await page.locator('#fluxo-organizacao').inputValue();
  const tituloEx = await page.locator('#fluxo-titulo').inputValue();
  return { organizacao, titulo: tituloEx, tipo: tipoDaOrg(organizacao) };
}

async function digitar(page: Page, sel: string, texto: string): Promise<void> {
  const c = page.locator(sel);
  await c.click();
  await c.fill('');
  await c.pressSequentially(texto, { delay: 5 });
}

export async function passo1(page: Page, p: Porta, org: string): Promise<void> {
  const c = CONTEUDO[p.tipo as 'evento' | 'reuniao'];
  await digitar(page, '#fluxo-titulo', c.titulo);
  await digitar(page, '#fluxo-organizacao', org);
  if (p.tipo === 'reuniao') await digitar(page, '#fluxo-pauta', (c as typeof CONTEUDO.reuniao).pauta);
  else await digitar(page, '#fluxo-texto', (c as typeof CONTEUDO.evento).texto);
}

export async function passo2(page: Page, p: Porta): Promise<void> {
  const c = CONTEUDO[p.tipo as 'evento' | 'reuniao'];
  await tocar(page.getByRole('button', { name: 'Próximo sábado' }));
  await page.locator('#fluxo-hora').fill(c.hora);
  await digitar(page, '#fluxo-local', c.local);
}

export async function continuar(page: Page, ate: string): Promise<void> {
  await tocar(page.getByRole('button', { name: 'Continuar' }));
  await expect(titulo(page)).toContainText(ate);
}

export interface Telas {
  tipo: string;
  organizacaoTipada: string;
  exemplo?: { organizacao: string; titulo: string; tipo: string };
  home?: string;
  homeIcones?: Record<string, string>;
  passo1?: string;
  passo2?: string;
  passo3?: string;
  pronto?: string;
  painel?: string;
  canvasAria?: string;
  paletas?: { id: string; nome: string; fundo: string; imagem: string; marcada: boolean }[];
  formatos?: string[];
  textoWhatsapp?: string;
  link?: string;
  botoesPronto?: string[];
  [k: string]: unknown;
}

export async function paletasDaTela(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLInputElement>('input[name="fluxo-paleta"]')].map((r) => {
      const am = r.nextElementSibling!.querySelector<HTMLElement>('.fluxo-amostra')!;
      const s = getComputedStyle(am);
      return {
        id: r.value,
        nome: (r.nextElementSibling!.textContent ?? '').trim(),
        fundo: s.backgroundColor,
        imagem: s.backgroundImage,
        marcada: r.checked,
      };
    }),
  );
}

export async function botoesVisiveis(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('main button, main a')]
      .filter((e) => e.offsetParent !== null && !e.closest('[hidden]'))
      .map((e) => (e.textContent ?? '').trim().replace(/\s+/g, ' ')),
  );
}

/**
 * O caminho inteiro de uma porta (evento ou reunião) como a pessoa faria, até o "Mandar no WhatsApp".
 * `completar`: troca todos os campos (sem partes do exemplo) ou deixa o exemplo.
 */
export async function caminhoInteiro(
  page: Page,
  personagem: string,
  p: Porta,
  org: string,
  opc: { completar: boolean; prefixoFoto: string },
): Promise<Telas> {
  const cron = cronometro(personagem);
  const r: Telas = { tipo: p.tipo, organizacaoTipada: opc.completar ? org : '(exemplo)' };
  await irParaOInicio(page);
  r.home = await mainTexto(page);
  r.homeIcones = await page.evaluate(() =>
    Object.fromEntries([...document.querySelectorAll('.inicio-portas a')].map((a) => [(a.getAttribute('href') ?? '').split('/').pop() ?? '', a.querySelector('svg')?.innerHTML ?? ''])),
  );
  await inspecionar(page, `${opc.prefixoFoto} início`);
  await foto(page, `${opc.prefixoFoto} início`);
  cron.marca('inicio');

  await tocarNaPorta(page, p);
  r.exemplo = await exemploDoPasso1(page);
  if (opc.completar) await passo1(page, p, org);
  r.passo1 = await mainTexto(page);
  await inspecionar(page, `${opc.prefixoFoto} ${p.tipo} passo 1`);
  await foto(page, `${opc.prefixoFoto} ${p.tipo} passo 1`);
  cron.marca('passo1');

  await continuar(page, 'Passo 2 de 3');
  if (opc.completar) await passo2(page, p);
  r.passo2 = await mainTexto(page);
  await inspecionar(page, `${opc.prefixoFoto} ${p.tipo} passo 2`);
  await foto(page, `${opc.prefixoFoto} ${p.tipo} passo 2`);
  cron.marca('passo2');

  await continuar(page, 'Passo 3 de 3');
  await page.waitForTimeout(300);
  r.passo3 = await mainTexto(page);
  r.paletas = await paletasDaTela(page);
  r.formatos = await page.evaluate(() => [...document.querySelectorAll('input[name="fluxo-formato"]')].map((i) => `${(i as HTMLInputElement).value}${(i as HTMLInputElement).checked ? '*' : ''}`));
  r.canvasAria = (await page.locator('#fluxo-canvas').getAttribute('aria-label')) ?? '';
  await inspecionar(page, `${opc.prefixoFoto} ${p.tipo} passo 3`);
  await foto(page, `${opc.prefixoFoto} ${p.tipo} passo 3`);
  cron.marca('passo3');

  await tocar(page.getByRole('button', { name: 'Ficou bom' }));
  await expect(titulo(page)).toContainText('Pronto!');
  if (p.agenda && opc.completar) await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…');
  await page.waitForTimeout(400);
  r.pronto = await mainTexto(page);
  r.botoesPronto = await botoesVisiveis(page);
  await inspecionar(page, `${opc.prefixoFoto} ${p.tipo} Pronto`);
  await foto(page, `${opc.prefixoFoto} ${p.tipo} Pronto`, true);
  cron.marca('pronto');

  const antes = (await partilhas(page)).length;
  await tocar(page.locator('#fluxo-mandar'));
  if (await page.locator('#fluxo-confirma').isVisible()) {
    r.painel = await page.locator('#fluxo-confirma').innerText();
    await foto(page, `${opc.prefixoFoto} ${p.tipo} painel do exemplo`);
    await inspecionar(page, `${opc.prefixoFoto} ${p.tipo} painel`);
    await tocar(page.getByRole('button', { name: 'Mandar mesmo assim' }));
  }
  await expect.poll(async () => (await partilhas(page)).length).toBe(antes + 1);
  cron.marca('mandar-no-whatsapp');
  const enviado = (await partilhas(page))[antes]!;
  r.textoWhatsapp = enviado.texto;
  r.link = /(\S*#\/evento\/\S+)/.exec(enviado.texto)?.[1] ?? '';
  salvarTexto(`${opc.prefixoFoto}-${p.tipo}-whatsapp.txt`, enviado.texto);
  await salvarPartilhado(page, `${opc.prefixoFoto}-${p.tipo}-card.png`);
  registrar('caminho', { personagem, porta: p.tipo, org, completar: opc.completar, exemplo: r.exemplo, caracteres: enviado.texto.length, link: r.link, linkCaracteres: r.link.length });
  return r;
}

export function guardarTelas(nome: string, r: unknown): void {
  salvarTexto(`${nome}.json`, JSON.stringify(r, null, 2));
}
