// G4 / B6 Dona Rosa: recebe um link com golpe, denuncia, e vê o link removido.
import { expect, test } from '@playwright/test';
import { abrirAparelho, cronometro, foto, linkDoEvento, medirEGuardar, salvarSaida } from './aparelhos';
test.describe.configure({ timeout: 420_000 });
import { anotar, bloquear, criarEvento } from './g4-apoio';

const BASE = { organizacao: 'Ação Solidária do bairro', data: '20/11/2026', hora: '08:00', local: 'Praça da Matriz, São Paulo, SP' };
const TENTATIVAS = [
  { ...BASE, titulo: 'Cesta básica grátis', texto: 'Inscrição só hoje. Leve RG e CPF e chegue cedo, vagas limitadas.' },
  { ...BASE, titulo: 'Cesta básica grátis: inscrição só hoje', texto: 'Leve RG e CPF e chegue cedo. Taxa de inscrição de R$ 30 para garantir sua vaga.' },
];

test('B6: recebe o golpe, denuncia (mailto capturado) e vê o link removido', async ({ browser }, info) => {
  const base = info.project.use.baseURL!;
  let dados: string | undefined;
  for (const t of TENTATIVAS) {
    const r = await criarEvento(browser, base, t);
    anotar(`B6 criar "${t.titulo}": erros=${JSON.stringify(r.erros)} dados=${r.dados ? 'ok' : 'não'}`);
    if (r.dados) {
      dados = r.dados;
      anotar(`B6 passou pelas regras: ${JSON.stringify(t)}`);
      break;
    }
  }
  if (!dados) {
    anotar('B6: nenhuma tentativa passou');
    return;
  }

  const s = await abrirAparelho(browser, 'AND-FRACO');
  const { page } = s;
  const fim = cronometro();
  await page.goto(linkDoEvento(base, dados));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cesta básica', { timeout: 90_000 });
  anotar(`B6 abrir evento golpe AND-FRACO: ${fim()} s`);
  await medirEGuardar(page, 'g4', 'b6-pagina-golpe');
  await foto(page, 'g4-b6-pagina-golpe');
  await foto(page, 'g4-b6-pagina-golpe-inteira', true);

  await page.locator('.evento-denunciar').tap();
  await expect(page).toHaveURL(/#\/denunciar\//);
  await medirEGuardar(page, 'g4', 'b6-denuncia-form');
  await foto(page, 'g4-b6-denuncia-form', true);
  await page.getByLabel('Tipo de problema').selectOption('golpe');
  await page.getByLabel('O que há de errado').fill('Pede RG e CPF e cobra taxa para garantir vaga de cesta básica.');
  await page.getByRole('button', { name: 'Revisar a denúncia' }).tap();
  await expect(page.getByRole('heading', { name: 'Confira antes de enviar' })).toBeVisible();
  await medirEGuardar(page, 'g4', 'b6-denuncia-revisao');
  await foto(page, 'g4-b6-denuncia-revisao', true);
  const hrefs = await page.locator('a[href^="mailto:"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  const gmail = await page.locator('a[href*="mail.google.com"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  const botoes = await page.locator('[data-revisao] a.botao, [data-revisao] button.botao').allInnerTexts();
  const area = await page.getByLabel('Texto da denúncia').inputValue();
  const m = hrefs[0];
  const resumo = {
    ordemDosBotoes: botoes,
    mailtoCaracteres: m?.length,
    gmailCaracteres: gmail[0]?.length,
    para: m?.slice(7).split('?')[0],
    assunto: m ? decodeURIComponent(/subject=([^&]*)/.exec(m)![1]!) : '',
    corpo: m ? decodeURIComponent(/body=(.*)$/.exec(m)![1]!) : '',
    textoDaRevisao: area,
  };
  salvarSaida('g4-b6-mailto.json', JSON.stringify(resumo, null, 2));
  anotar(`B6 mailto: ${m?.length} caracteres; gmail: ${gmail[0]?.length}; botões: ${botoes.join(' | ')}`);

  for (const motivo of ['regra-5', 'pedido']) {
    const outra = await s.nova();
    await bloquear(outra, dados, motivo);
    const t0 = cronometro();
    await outra.goto(linkDoEvento(base, dados));
    await expect(outra.getByRole('heading', { level: 1 })).toContainText('removido', { timeout: 90_000 });
    anotar(`B6 removido ${motivo}: ${t0()} s`);
    anotar(`B6 removido ${motivo}: medindo`);
    await medirEGuardar(outra, 'g4', `b6-removido-${motivo}`);
    anotar(`B6 removido ${motivo}: medido`);
    await foto(outra, `g4-b6-removido-${motivo}`, true);
    salvarSaida(`g4-b6-removido-${motivo}.txt`, await outra.locator('main').innerText());
    await outra.close();
  }
  salvarSaida('g4-b6-erros.txt', s.erros.join('\n') + '\n--externos--\n' + s.externos.join('\n'));
  expect.soft(s.erros.filter((e) => !e.includes('interactive-widget')), 'erros de JS (o aviso do WebKit sobre interactive-widget é só ruído, ver achados)').toEqual([]);
  await s.fechar();
});
