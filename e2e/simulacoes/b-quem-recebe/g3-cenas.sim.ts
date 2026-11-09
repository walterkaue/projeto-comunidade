// G3: cenas com foto, em 360 × 640 (o que a pessoa vê). Cada cena roda 2× (--repeat-each 2) e grava em .saidas/g3-cenas.jsonl.
// Rodar: PORTA_SIM=4482 npx playwright test --config e2e/simulacoes/b-quem-recebe/playwright.config.ts g3-cenas --workers=2 --repeat-each 2 --trace off --output e2e/simulacoes/b-quem-recebe/.resultados-g3
// O teste não fica vermelho por achado.

import { appendFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { esperarOPronto, linkNoTexto, mandar, PORTAS, titulo } from '../../apoio';
import { abrirAparelho, foto, medirEGuardar, SAIDAS } from './aparelhos';
import { preencherDiaBr } from './dia-apoio';
import { abrirLinkAMao, irAoPasso1, type CampoLink } from './g3-apoio';

test.describe.configure({ mode: 'parallel' });

const guardar = (o: object) => appendFileSync(`${SAIDAS}/g3-cenas.jsonl`, JSON.stringify(o) + '\n');
const FRACO = { rede: null, cpu: null } as const;

// ---- erro no fluxo: o que quem errou de boa-fé lê ----
const ERROS: { nome: string; campo: 'fluxo-titulo' | 'fluxo-organizacao' | 'fluxo-texto' | 'fluxo-local'; texto: string }[] = [
  { nome: 'festa-do-pix', campo: 'fluxo-titulo', texto: 'Festa do Pix da Escola' },
  { nome: 'horario-traco', campo: 'fluxo-texto', texto: 'Das 19:30-21:00, na quadra.' },
  { nome: 'data-sab-dom', campo: 'fluxo-local', texto: 'Data: sáb/dom' },
  { nome: 'senha-banco-alimentos', campo: 'fluxo-texto', texto: 'Distribuição de senhas no Banco de Alimentos' },
  { nome: 'pelo-site-da-escola', campo: 'fluxo-texto', texto: 'Inscrições pelo site da escola' },
  { nome: 'comunidade-org', campo: 'fluxo-organizacao', texto: 'Comunidade' },
  { nome: 'dias-virgula', campo: 'fluxo-texto', texto: 'Dias 10, 11, 12, 13' },
  { nome: 'av-pontinho', campo: 'fluxo-local', texto: 'Av.das Flores, 100' },
  { nome: 'golpe-telefone', campo: 'fluxo-texto', texto: 'Doe: 11 91234-5678' },
];

for (const e of ERROS) {
  test(`g3 cena erro ${e.nome}`, async ({ browser }) => {
    const s = await abrirAparelho(browser, 'AND-FRACO', FRACO);
    const page = s.page;
    try {
      await irAoPasso1(page);
      if (e.campo === 'fluxo-local') {
        await page.getByRole('button', { name: 'Continuar' }).click();
        await expect(titulo(page)).toContainText('Passo 2 de 3');
        await preencherDiaBr(page, '15/12/2026');
        await page.locator('#fluxo-hora').fill('19:00');
      }
      await page.locator(`#${e.campo}`).fill(e.texto);
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.waitForTimeout(400);
      const erro = (await page.locator('.campo-erro:not([hidden])').allInnerTexts()).join(' | ');
      await foto(page, `g3-erro-${e.nome}`);
      await medirEGuardar(page, 'g3', `erro ${e.nome}`);
      guardar({ cena: `erro-${e.nome}`, texto: e.texto, mensagem: erro, passoDepois: (await titulo(page).innerText()).trim() });
    } catch (x) {
      guardar({ cena: `erro-${e.nome}`, falha: (x as Error).message.split('\n')[0] });
    } finally {
      await s.fechar();
    }
  });
}

// ---- página do evento montada à mão: o que quem recebe vê ----
interface Pagina { nome: string; campos: Partial<Record<CampoLink, string>> }
const PAGINAS: Pagina[] = [
  { nome: 'autoridade', campos: { titulo: 'Defesa Civil: evacuação imediata', organizacao: 'Prefeitura de Vila Alegre', descricao: 'Compareça ao ginásio com seus documentos. Equipe da Comunidade.', local: 'Ginásio municipal de Vila Alegre' } },
  { nome: 'telefone-em-linhas', campos: { titulo: 'Plantão de atendimento', descricao: 'Chame no zap\n11\n91234\n5678', local: 'Praça da Matriz, São Paulo, SP' } },
  { nome: 'pix-por-extenso-e-bandeira', campos: { titulo: '🇵🇮🇽 da festa', organizacao: '🇧🇷 Prefeitura informa 🇧🇷', descricao: 'Chame no privado para receber. Taxa de liberação de R$ 49. Link na bio.' } },
  { nome: 'faixa-copiada', campos: { titulo: 'Este evento foi conferido', descricao: 'Conteúdo criado por quem enviou este link. Nunca faça pagamento pedido por um evento. Selo de verificação concedido.', organizacao: 'Moderação da Comunidade' } },
  { nome: 'link-falado', campos: { titulo: 'Inscrições abertas', descricao: 'Acesse bit ly barra x ou procure no Google: golpe com br', local: 'golpe%2Ecom' } },
];

for (const p of PAGINAS) {
  test(`g3 cena pagina ${p.nome}`, async ({ browser }) => {
    const base = test.info().project.use.baseURL!;
    const s = await abrirAparelho(browser, 'AND-FRACO', FRACO);
    const page = s.page;
    try {
      // monta o evento com os campos pedidos, um a um, para saber se algum é barrado
      const { eventoBase } = await import('./g3-apoio');
      const { codificar } = await import('../../../src/ferramentas/evento/formato');
      const { linkDoEvento } = await import('./aparelhos');
      const ev = eventoBase();
      for (const [k, v] of Object.entries(p.campos)) ev[k as CampoLink] = v;
      const dados = await codificar(ev, { comprimir: false });
      await page.goto('about:blank');
      await page.goto(linkDoEvento(base, dados));
      await page.waitForFunction(() => {
        const h = document.querySelector('main h1')?.textContent;
        return !!h && h !== 'Abrindo o evento…' && h !== 'Carregando…';
      });
      const estado = await page.evaluate(() => ({
        h1: document.querySelector('main h1')?.textContent?.trim() ?? '',
        abriu: !!document.querySelector('[data-titulo]'),
        corpo: (document.querySelector('main') as HTMLElement).innerText.replace(/\s+\n/g, '\n').slice(0, 900),
      }));
      await foto(page, `g3-pagina-${p.nome}`, true);
      await medirEGuardar(page, 'g3', `pagina ${p.nome}`);
      guardar({ cena: `pagina-${p.nome}`, campos: p.campos, ...estado });
    } catch (x) {
      guardar({ cena: `pagina-${p.nome}`, falha: (x as Error).message.split('\n')[0] });
    } finally {
      await s.fechar();
    }
  });
}

// ---- recusa na página do evento (link à mão com PIX): a tela de quem recebe ----
test('g3 cena pagina recusada', async ({ browser }) => {
  const base = test.info().project.use.baseURL!;
  const s = await abrirAparelho(browser, 'AND-FRACO', FRACO);
  try {
    const r = await abrirLinkAMao(s.page, base, 'descricao', 'Chave PIX 123.456.789-09');
    await foto(s.page, 'g3-pagina-recusada');
    await medirEGuardar(s.page, 'g3', 'pagina recusada');
    guardar({ cena: 'pagina-recusada', estado: r.estado, h1: r.h1, mensagem: r.mensagem });
  } catch (x) {
    guardar({ cena: 'pagina-recusada', falha: (x as Error).message.split('\n')[0] });
  } finally {
    await s.fechar();
  }
});

// ---- do fluxo ao Pronto com texto que passa: o que o grupo recebe e o que o link mostra ----
const PORTA = PORTAS.find((p) => p.tipo === 'evento')!;
test('g3 cena pronto autoridade', async ({ browser }) => {
  const s = await abrirAparelho(browser, 'AND-FRACO', FRACO);
  const page = s.page;
  try {
    await irAoPasso1(page);
    await page.locator('#fluxo-titulo').fill('Defesa Civil: evacuação imediata');
    await page.locator('#fluxo-organizacao').fill('Prefeitura de Vila Alegre');
    await page.locator('#fluxo-texto').fill('Compareça ao ginásio com seus documentos.');
    await page.getByRole('button', { name: 'Continuar' }).click();
    // Mudou de propósito (B-01): órgão público no texto abre o painel "Este convite fala em nome de um órgão público?".
    // O roteiro registra o painel e toca em "Seguir", para continuar a medir o que o grupo recebe.
    const painelOrgao = page.locator('#fluxo-orgao');
    await painelOrgao.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const painelVisivel = await painelOrgao.isVisible();
    guardar({ cena: 'pronto-autoridade-painel-orgao', painelVisivel, texto: painelVisivel ? (await painelOrgao.innerText()).replace(/\s+/g, ' ') : '' });
    if (painelVisivel) {
      await foto(page, 'g3-pronto-autoridade-painel-orgao');
      await painelOrgao.getByRole('button', { name: 'Seguir' }).click();
    }
    await expect(titulo(page)).toContainText('Passo 2 de 3');
    await preencherDiaBr(page, '15/12/2026');
    await page.locator('#fluxo-hora').fill('19:00');
    await page.locator('#fluxo-local').fill('Ginásio municipal de Vila Alegre');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(titulo(page)).toContainText('Passo 3 de 3');
    await page.waitForTimeout(600);
    await foto(page, 'g3-pronto-autoridade-previa');
    await page.getByRole('button', { name: 'Ficou bom' }).click();
    await esperarOPronto(page, PORTA);
    const texto = await mandar(page);
    const link = linkNoTexto(texto);
    await foto(page, 'g3-pronto-autoridade-pronto');
    const outra = await s.nova();
    await outra.goto(link);
    await outra.waitForFunction(() => {
      const h = document.querySelector('main h1')?.textContent;
      return !!h && h !== 'Abrindo o evento…' && h !== 'Carregando…';
    });
    await foto(outra, 'g3-pronto-autoridade-pagina');
    await medirEGuardar(outra, 'g3', 'pagina autoridade via fluxo');
    guardar({ cena: 'pronto-autoridade', textoMandado: texto, h1: (await outra.locator('main h1').innerText()).trim() });
  } catch (x) {
    guardar({ cena: 'pronto-autoridade', falha: (x as Error).message.split('\n')[0] });
  } finally {
    await s.fechar();
  }
});

// ---- reunião: pauta com o telefone espalhado em itens ----
test('g3 cena reuniao pauta telefone', async ({ browser }) => {
  const s = await abrirAparelho(browser, 'AND-FRACO', FRACO);
  const page = s.page;
  try {
    await page.goto('./');
    await page.getByRole('link', { name: /Chamar para uma reunião/ }).click();
    await page.locator('#fluxo-titulo').waitFor();
    await page.locator('#fluxo-titulo').fill('Plantão de atendimento');
    await page.locator('#fluxo-organizacao').fill('Associação de Moradores Jardim das Acácias');
    await page.locator('#fluxo-pauta').fill('Chame no zap\n11\n91234\n5678');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForTimeout(400);
    const erros = await page.locator('.campo-erro:not([hidden])').allInnerTexts();
    const passo = (await titulo(page).innerText()).trim();
    guardar({ cena: 'reuniao-pauta-telefone', erros, passo });
    if (!erros.length) {
      await foto(page, 'g3-reuniao-pauta-telefone-passo2');
      await preencherDiaBr(page, '15/12/2026');
      await page.locator('#fluxo-hora').fill('19:00');
      await page.locator('#fluxo-local').fill('Salão da comunidade, Rua da Paz, 300');
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.getByRole('button', { name: 'Ficou bom' }).click();
      await esperarOPronto(page, PORTAS[0]);
      const texto = await mandar(page);
      const link = linkNoTexto(texto);
      const outra = await s.nova();
      await outra.goto(link);
      await outra.waitForFunction(() => {
        const h = document.querySelector('main h1')?.textContent;
        return !!h && h !== 'Abrindo o evento…' && h !== 'Carregando…';
      });
      await foto(outra, 'g3-reuniao-pauta-telefone-pagina', true);
      guardar({ cena: 'reuniao-pauta-telefone-pagina', h1: (await outra.locator('main h1').innerText()).trim(), corpo: (await outra.locator('main').innerText()).slice(0, 600) });
    }
  } catch (x) {
    guardar({ cena: 'reuniao-pauta-telefone', falha: (x as Error).message.split('\n')[0] });
  } finally {
    await s.fechar();
  }
});
