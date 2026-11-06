// G4 / tempo para abrir o evento no AND-FRACO (CPU 6x, 3G lento), do goto até o h1 com o título.
// Pode ser rodado sozinho (de preferência com a máquina livre, --workers=1):
//   PORTA_SIM=4582 npx playwright test --config e2e/simulacoes/b-quem-recebe/playwright.config.ts g4-tempo --workers=1
// Os tempos vão para .saidas/g4-tempos.jsonl e para o console. O teste não fica vermelho por achado.
import { appendFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { abrirAparelho, cronometro, SAIDAS, linkDoEvento } from './aparelhos';
import { LINKS } from './g4-apoio';

const CHAVE = 'evento-sp-19h';

function registrar(caso: string, segundos: number, extra = ''): void {
  const linha = { caso, segundos, extra, quando: new Date().toISOString() };
  appendFileSync(`${SAIDAS}/g4-tempos.jsonl`, JSON.stringify(linha) + '\n');
  console.log(`TEMPO ${caso}: ${segundos} s ${extra}`);
}

async function abrir(page: Page, base: string): Promise<number> {
  const fim = cronometro();
  await page.goto(linkDoEvento(base, LINKS[CHAVE]!.dados));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(LINKS[CHAVE]!.titulo, { timeout: 150_000 });
  return fim();
}

test.describe.configure({ mode: 'serial', timeout: 420_000 });

test('G4 tempo: (a) primeira visita, sem nada guardado', async ({ browser }, info) => {
  const s = await abrirAparelho(browser, 'AND-FRACO', { serviceWorkers: 'allow' });
  const t = await abrir(s.page, info.project.use.baseURL!);
  registrar('a-primeira-visita', t);
  await s.fechar();
});

test('G4 tempo: (b) segunda visita, com service worker e lista guardados', async ({ browser }, info) => {
  const base = info.project.use.baseURL!;
  const s = await abrirAparelho(browser, 'AND-FRACO', { serviceWorkers: 'allow' });
  const t1 = await abrir(s.page, base);
  // Espera o service worker assumir e guardar a lista.
  await s.page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await s.page.waitForTimeout(3000);
  const guardada = await s.page.evaluate(async () => !!(await caches.match(new URL('./bloqueados.json', location.href).href)));
  const outra = await s.nova();
  const t2 = await abrir(outra, base);
  registrar('b-segunda-visita', t2, `(1a visita nesta rodada ${t1} s; lista guardada: ${guardada})`);
  await s.fechar();
});

for (const atraso of [4000, 9000, 'sem-resposta'] as const) {
  test(`G4 tempo: (c) lista de bloqueio ${atraso === 'sem-resposta' ? 'sem resposta' : `atrasada ${atraso} ms`}`, async ({ browser }, info) => {
    const base = info.project.use.baseURL!;
    const s = await abrirAparelho(browser, 'AND-FRACO', { serviceWorkers: 'allow' });
    const alvo = s.page;
    await alvo.route('**/bloqueados.json', async (rota) => {
      if (atraso === 'sem-resposta') return; // nunca responde: o site espera até o prazo dele
      await new Promise((r) => setTimeout(r, atraso));
      await rota.continue();
    });
    const t = await abrir(alvo, base);
    registrar(`c-lista-${atraso}`, t);
    await s.fechar();
  });
}
