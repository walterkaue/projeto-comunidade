// G2 / B3 Kleber: vê o cartaz no mural. (1) faz o cartaz (como quem criou), PDF, QR; (2) abre o QR no iPhone;
// (3) Wi-Fi com página de login (portal cativo) em três cenários.
// O teste não fica vermelho por achado: anota em .saidas/g2-log.jsonl.

import { expect, test, webkit, type Page } from '@playwright/test';
import { impressaoDoLink } from '../../../src/comum/entreTelas';
import { codificar } from '../../../src/ferramentas/evento/formato';
import { abrirAparelho, cronometro, foto, medirEGuardar, salvarSaida, SAIDAS } from './aparelhos';
import { anotar, subirServidor, texto } from './g2-apoio';
import { lerQrDoPdf } from './g2-qr';

interface Pedido {
  titulo: string;
  org: string;
  corpo: string;
  data: string;
  hora: string;
  local: string;
}

const NORMAL: Pedido = {
  titulo: 'Feira de troca de sementes e mudas',
  org: 'Grupo da horta comunitária',
  corpo: 'Traga o que sobrou da sua horta e leve algo novo para casa.',
  data: '21/11/2026',
  hora: '09:00',
  local: 'Praça da Matriz, Rua do Comércio, 100',
};
const PIOR: Pedido = {
  titulo: 'Grande festival comunitário de música, poesia, teatro de rua e roda de conversa',
  org: 'Associação de Moradores e Amigos do Jardim das Acácias e Arredores',
  corpo: 'Venha com a família toda. Teremos música, poesia, comidas típicas, brincadeiras para as crianças e muito mais.',
  data: '28/11/2026',
  hora: '18:30',
  local: 'Salão comunitário da Associação de Moradores do Jardim das Acácias, Avenida Central, número 1500, fundos, Centro',
};

async function fazerCartaz(page: Page, base: string, p: Pedido): Promise<string> {
  await page.goto(base);
  await page.getByRole('link', { name: /Divulgar um evento/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Passo 1 de 3');
  await page.locator('#fluxo-titulo').fill(p.titulo);
  await page.locator('#fluxo-organizacao').fill(p.org);
  await page.locator('#fluxo-texto').fill(p.corpo);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Passo 2 de 3');
  await page.locator('#fluxo-data').fill(p.data);
  await page.locator('#fluxo-hora').fill(p.hora);
  await page.locator('#fluxo-local').fill(p.local);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Passo 3 de 3');
  anotar('g2','passo','antes do formato');
  const rotulo = page.locator('label[for="fluxo-formato-cartaz"]');
  try {
    await rotulo.click({ timeout: 10_000 });
  } catch (e) {
    anotar('g2', 'formato-click-falhou', String(e).slice(0, 1500));
    await foto(page, 'g2-b3-formato-travado', true);
    await rotulo.click({ force: true, timeout: 10_000 });
  }
  anotar('g2','passo','formato ok');
  await page.getByRole('button', { name: 'Ficou bom' }).click();
  anotar('g2','passo','ficou bom');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Pronto!');
  anotar('g2','passo','pronto');
  await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…');
  await page.getByRole('button', { name: 'Mandar no WhatsApp' }).click();
  if (await page.locator('#fluxo-confirma').isVisible()) await page.getByRole('button', { name: 'Mandar mesmo assim' }).click();
  await expect.poll(() => page.evaluate(() => window.__partilhas.length)).toBeGreaterThan(0);
  const enviado = (await page.evaluate(() => window.__partilhas))[0]!.texto;
  return /Mais detalhes: (\S+)/.exec(enviado)?.[1] ?? '';
}

for (const [nome, ped] of [
  ['normal', NORMAL],
  ['pior', PIOR],
] as const) {
  test(`B3 cartaz ${nome}: PDF, QR e iPhone`, async ({ browser }) => {
    test.setTimeout(240_000);
    const s = await subirServidor();
    const sessao = await abrirAparelho(browser, 'AND-GRANDE', { rede: null, cpu: null });
    const { page } = sessao;
    try {
      const t = cronometro();
      const link = await fazerCartaz(page, s.url, ped);
      anotar('g2', `b3-${nome}-link`, { link, ms: t() });
      await medirEGuardar(page, 'g2', `Pronto do cartaz (${nome})`);
      await foto(page, `g2-b3-pronto-${nome}`, true);

      await page.locator('#fluxo-imprimir').click();
      await expect.poll(() => page.evaluate(() => window.__impressoes)).toBe(1);
      await page.emulateMedia({ media: 'print' });
      const pdf = await page.pdf({ format: 'A4' });
      salvarSaida(`g2-cartaz-${nome}.pdf`, pdf);
      await page.emulateMedia({ media: 'screen' });
      const png = `${SAIDAS}/g2-cartaz-${nome}-p1.png`;
      const leitura = lerQrDoPdf(pdf, png, 0, 4);
      anotar('g2', `b3-${nome}-qr`, { ...leitura, link, igual: leitura.texto === link });

      // iPhone SE (WebKit): abre o endereço que o QR guarda.
      const wk = await webkit.launch();
      try {
        const iph = await abrirAparelho(wk, 'IPHONE-SE', { rede: null });
        const t2 = cronometro();
        const alvo = leitura.texto ?? link;
        await iph.page.goto(alvo);
        await expect(iph.page.getByRole('heading', { level: 1 })).toHaveText(ped.titulo, { timeout: 90_000 });
        const h1 = await iph.page.getByRole('heading', { level: 1 }).innerText();
        await medirEGuardar(iph.page, 'g2', `iPhone abrindo QR do cartaz (${nome})`);
        await foto(iph.page, `g2-b3-iphone-${nome}`, false);
        anotar('g2', `b3-${nome}-iphone`, { h1, ms: t2(), erros: iph.erros, externos: iph.externos });
        await iph.fechar();
      } finally {
        await wk.close();
      }
      anotar('g2', `b3-${nome}-sessao`, { erros: sessao.erros, externos: sessao.externos });
    } finally {
      await sessao.fechar();
      await s.fechar();
    }
  });
}

// ---------- portal cativo ----------

const EVENTO_X = { titulo: 'Sarau na praça', data: '2026-11-21', inicio: '19:00', fim: '', local: 'Praça da Matriz, São Paulo', descricao: 'Música e poesia.', organizacao: 'Coletivo cultural do bairro' };
const EVENTO_Y = { ...EVENTO_X, titulo: 'Bazar beneficente', organizacao: 'Grupo de mães da escola' };

async function h1(page: Page): Promise<string> {
  return page.getByRole('heading', { level: 1 }).first().innerText({ timeout: 5000 }).catch(() => '(sem h1)');
}

async function esperarFimDoCarregando(page: Page, limiteMs: number): Promise<number> {
  const t = cronometro();
  await page
    .waitForFunction(
      () => {
        const x = document.querySelector('h1');
        return !!x && x.textContent !== 'Abrindo o evento…';
      },
      null,
      { timeout: limiteMs },
    )
    .catch(() => {});
  return t();
}

test('B3 portal (a): primeira visita com o portal na frente do documento', async ({ browser }) => {
  const s = await subirServidor();
  const sessao = await abrirAparelho(browser, 'AND-GRANDE', { rede: null, cpu: null, serviceWorkers: 'allow' });
  const { page } = sessao;
  try {
    const link = `${s.url}#/evento/${await codificar(EVENTO_X)}`;
    s.modo = 'portal';
    const t = cronometro();
    await page.goto(link);
    const visto = { h1: await h1(page), texto: (await texto(page)).slice(0, 300), ms: t(), titulo: await page.title() };
    await foto(page, 'g2-b3-portal-a');
    await medirEGuardar(page, 'g2', 'Portal cativo na frente do documento (a)');
    // A pessoa conecta no portal e recarrega.
    s.modo = 'normal';
    const t2 = cronometro();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(EVENTO_X.titulo, { timeout: 30_000 });
    anotar('g2', 'b3-portal-a', { ...visto, depoisDeConectar: { ms: t2() }, erros: sessao.erros });
  } finally {
    await sessao.fechar();
    await s.fechar();
  }
});

test('B3 portal (b): documento normal, bloqueados.json respondido com HTML do portal', async ({ browser }) => {
  const s = await subirServidor();
  const sessao = await abrirAparelho(browser, 'AND-GRANDE', { rede: null, cpu: null, serviceWorkers: 'allow' });
  const { page } = sessao;
  try {
    const link = `${s.url}#/evento/${await codificar(EVENTO_X)}`;
    s.modo = 'lista-html';
    const t = cronometro();
    await page.goto(link);
    const fim = await esperarFimDoCarregando(page, 40_000);
    const visto = { h1: await h1(page), esperaMs: fim, total: t() };
    await medirEGuardar(page, 'g2', 'Portal: lista de bloqueio vem como HTML (b)');
    await foto(page, 'g2-b3-portal-b');
    await page.waitForTimeout(1500);
    const guardou = await page.evaluate(async () => {
      const nomes = await caches.keys();
      const r: Record<string, string[]> = {};
      for (const n of nomes) r[n] = (await (await caches.open(n)).keys()).map((q) => new URL(q.url).pathname).filter((p) => p.includes('bloqueados'));
      return r;
    });
    anotar('g2', 'b3-portal-b', { ...visto, guardou, erros: sessao.erros });
  } finally {
    await sessao.fechar();
    await s.fechar();
  }
});

test('B3 portal (c): quem já visitou (lista guardada) e agora o portal responde a tudo', async ({ browser }) => {
  test.setTimeout(240_000);
  const s = await subirServidor();
  const sessao = await abrirAparelho(browser, 'AND-GRANDE', { rede: null, cpu: null, serviceWorkers: 'allow' });
  const { page } = sessao;
  try {
    const dadosX = await codificar(EVENTO_X);
    const dadosY = await codificar(EVENTO_Y);
    const hX = await impressaoDoLink(dadosX);
    s.lista = JSON.stringify({ bloqueados: [{ h: hX, motivo: 'regra-5' }] });
    // Visita normal: o service worker instala e guarda a lista (com o evento X removido).
    await page.goto(s.url);
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await page.waitForTimeout(1500);
    await page.reload();
    await page.waitForTimeout(500);
    const antes = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state ?? 'sem sw');

    // (c1) aba aberta + portal: abre X (removido) e Y (normal) por mudança de hash.
    s.modo = 'portal';
    const t1 = cronometro();
    await page.evaluate((d) => {
      location.hash = `#/evento/${d}`;
    }, dadosX);
    const fimX = await esperarFimDoCarregando(page, 30_000);
    const c1X = { h1: await h1(page), ms: fimX, total: t1() };
    await foto(page, 'g2-b3-portal-c1-removido');
    await page.evaluate((d) => {
      location.hash = `#/evento/${d}`;
    }, dadosY);
    const fimY = await esperarFimDoCarregando(page, 30_000);
    const c1Y = { h1: await h1(page), ms: fimY };

    // (c2) abrir o link em aba nova (documento novo) com o portal respondendo: o service worker entrega o quê?
    const aba = await sessao.nova();
    const t2 = cronometro();
    await aba.goto(`${s.url}#/evento/${dadosX}`).catch(() => {});
    const fim2 = await esperarFimDoCarregando(aba, 30_000);
    const c2 = { h1: await h1(aba), texto: (await texto(aba)).slice(0, 200), ms: fim2, total: t2(), titulo: await aba.title() };
    await foto(aba, 'g2-b3-portal-c2-aba-nova');

    // (c3) o portal "envenenou" a página guardada? Rede normal de novo, mas sem rede de fato: o que abre?
    s.modo = 'normal';
    await sessao.context.setOffline(true);
    const aba2 = await sessao.nova();
    const t3 = cronometro();
    await aba2.goto(`${s.url}#/evento/${dadosY}`).catch(() => {});
    const fim3 = await esperarFimDoCarregando(aba2, 15_000);
    const c3 = { h1: await h1(aba2), texto: (await texto(aba2)).slice(0, 200), ms: fim3, total: t3(), titulo: await aba2.title() };
    await foto(aba2, 'g2-b3-portal-c3-sem-rede-depois-do-portal');
    await sessao.context.setOffline(false);

    // (c4) rede normal de novo: volta ao normal?
    const aba3 = await sessao.nova();
    await aba3.goto(`${s.url}#/evento/${dadosY}`);
    const fim4 = await esperarFimDoCarregando(aba3, 30_000);
    const c4 = { h1: await h1(aba3), ms: fim4 };
    anotar('g2', 'b3-portal-c', { sw: antes, c1X, c1Y, c2, c3, c4, erros: sessao.erros });
  } finally {
    await sessao.fechar();
    await s.fechar();
  }
});
