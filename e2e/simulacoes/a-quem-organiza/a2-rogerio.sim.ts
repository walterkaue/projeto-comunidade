// A2 Rogério, 41, sindicato. Samsung Internet (aproximação), modo escuro. Reunião com pauta de 9 itens (2 longos),
// WhatsApp, cartaz em PDF, página do evento e .ics, ata com 15 presentes, recarregar e fechar a aba.
import { readFileSync } from 'node:fs';
import { preencherDia } from '../../fluxo-apoio';
import { preencherObrigatoriosVazios } from '../obrigatorios';
import { cronometro, copias, foto, inspecionar, partilhas, registrar, salvarPartilhado, salvarPdf, salvarTexto, baixarPor, test, expect, tocar, titulo, cobertoPorFaixa } from './sim';

const ORG = 'Sindicato dos Trabalhadores em Serviços Gerais da Região';
const LONGO1 = 'Prestação de contas do fundo de greve do último semestre, com a apresentação do parecer do conselho fiscal e votação';
const LONGO2 = 'Reajuste da contribuição assistencial e discussão da pauta de reivindicações da campanha salarial do próximo ano';
const PAUTA_COMPLETA = [
  'Abertura e leitura da ata anterior',
  LONGO1,
  'Informes da diretoria',
  'Campanha salarial',
  LONGO2,
  'Eleição da comissão de base',
  'Calendário de visitas aos locais de trabalho',
  'Assuntos gerais',
  'Encerramento',
];
const PAUTA_CURTA = ['Abertura', 'Contas do fundo de greve', 'Informes', 'Campanha salarial', 'Reajuste da contribuição', 'Comissão de base', 'Visitas aos locais', 'Assuntos gerais', 'Encerramento'];

const PRESENTES = Array.from({ length: 15 }, (_, i) => ['Ana Lima', 'Bruno Souza', 'Carla Dias', 'Davi Rocha', 'Elisa Prado', 'Fábio Nunes', 'Gisele Matos', 'Hugo Pires', 'Irene Costa', 'João Batista', 'Kátia Moura', 'Lúcio Freitas', 'Marta Ramos', 'Nilton Alves', 'Odete Cunha'][i]!);

async function digitar(page: import('@playwright/test').Page, sel: string, texto: string) {
  const el = page.locator(sel);
  await el.click();
  await el.fill('');
  await el.pressSequentially(texto, { delay: 3 });
}

async function passo1(page: import('@playwright/test').Page, pauta: string[], trocarOrg: boolean) {
  await digitar(page, '#fluxo-titulo', 'Assembleia geral da categoria');
  if (trocarOrg) await digitar(page, '#fluxo-organizacao', ORG);
  await page.locator('#fluxo-pauta').fill(pauta.join('\n'));
}

test.describe('A2 Rogério', () => {
  test('A2 Rogério: caminho inteiro, WhatsApp, evento, ata @SAMSUNG', async ({ page, context }) => {
    test.setTimeout(400_000);
    const cron = cronometro('A2 Rogério');
    await page.goto('./');
    await expect(titulo(page)).toHaveText('O que você quer fazer?');
    await inspecionar(page, 'início');
    await foto(page, 'inicio');
    cron.marca('inicio');
    await tocar(page.getByRole('link', { name: /Chamar para uma reunião/ }));
    await expect(titulo(page)).toContainText('Passo 1 de 3');
    await inspecionar(page, 'passo 1 (vazio)');
    await foto(page, 'passo1-vazio', true);
    // Os campos começam vazios; o exemplo é só o cinza de dentro (placeholder).
    registrar('exemplo-reuniao', {
      organizacao: await page.locator('#fluxo-organizacao').getAttribute('placeholder'),
      titulo: await page.locator('#fluxo-titulo').getAttribute('placeholder'),
      pauta: await page.locator('#fluxo-pauta').getAttribute('placeholder'),
      valoresAoAbrir: [await page.locator('#fluxo-organizacao').inputValue(), await page.locator('#fluxo-titulo').inputValue(), await page.locator('#fluxo-pauta').inputValue()],
    });

    // pauta de 9 itens com 2 longos
    await passo1(page, PAUTA_COMPLETA, true);
    await foto(page, 'passo1-preenchido', true);
    await tocar(page.getByRole('button', { name: 'Continuar' }));
    await page.waitForTimeout(400);
    const erro1 = await page.locator('.campo-erro:visible').allInnerTexts();
    const aviso1 = await page.locator('#fluxo-aviso-do-link').innerText().catch(() => '');
    if (erro1.length) {
      const e = page.locator('#fluxo-pauta-erro');
      registrar('erro-pauta-coberto', { ...(await cobertoPorFaixa(e)), visivel: await e.isVisible(), foco: await page.evaluate(() => document.activeElement?.id), letrasDaPauta: PAUTA_COMPLETA.join('').replace(/[^A-Za-zÀ-ú]/g, '').length });
    }
    registrar('pauta-completa', { erro: erro1, aviso: aviso1, url: page.url() });
    await inspecionar(page, 'passo 1 depois do Continuar (pauta completa)');
    await foto(page, 'passo1-apos-continuar-pauta-completa', true);
    if (erro1.length) {
      // trava? tenta caminho de quem corta o texto
      registrar('trava-pauta', { mensagem: erro1.join(' | ') });
      await page.locator('#fluxo-pauta').fill(PAUTA_CURTA.join('\n'));
      await tocar(page.getByRole('button', { name: 'Continuar' }));
    }
    cron.marca('passo1');
    await expect(titulo(page)).toContainText('Passo 2 de 3');
    await inspecionar(page, 'passo 2');
    await foto(page, 'passo2');
    await tocar(page.getByRole('button', { name: 'Próximo sábado' }));
    await page.locator('#fluxo-hora').fill('19:30');
    await digitar(page, '#fluxo-local', 'Sede do sindicato, Rua das Palmeiras, 120');
    await foto(page, 'passo2-preenchido');
    await tocar(page.getByRole('button', { name: 'Continuar' }));
    cron.marca('passo2');
    await expect(titulo(page)).toContainText('Passo 3 de 3');
    await inspecionar(page, 'passo 3');
    await foto(page, 'passo3', true);
    cron.marca('passo3-vista');
    // prévia: coberto pela faixa?
    registrar('previa-coberta', await cobertoPorFaixa(page.locator('#fluxo-canvas')));
    await tocar(page.getByRole('button', { name: 'Ficou bom' }));
    await expect(titulo(page)).toContainText('Pronto!');
    await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…', { timeout: 60_000 });
    await inspecionar(page, 'Pronto');
    await foto(page, 'pronto', true);
    cron.marca('pronto');
    registrar('estado-link', { estado: await page.locator('#fluxo-link-estado').innerText(), avisoLink: await page.locator('#fluxo-aviso-link').innerText().catch(() => '') });

    // WhatsApp
    await tocar(page.getByRole('button', { name: 'Mandar no WhatsApp' }));
    if (await page.locator('#fluxo-confirma').isVisible()) {
      registrar('painel-apareceu-no-mandar', { texto: await page.locator('#fluxo-confirma-texto').innerText() });
      await foto(page, 'painel-inesperado');
      await tocar(page.getByRole('button', { name: 'Mandar mesmo assim' }));
    }
    cron.marca('mandar-no-whatsapp');
    const [enviado] = await partilhas(page);
    expect(enviado).toBeTruthy();
    salvarTexto('whatsapp.txt', enviado!.texto);
    const link = /(https?:\/\/\S+)/.exec(enviado!.texto)?.[1] ?? '';
    registrar('whatsapp', { caracteresTexto: enviado!.texto.length, caracteresLink: link.length, titulo: enviado!.titulo, arquivos: enviado!.arquivos, texto: enviado!.texto });
    const png = await salvarPartilhado(page, 'card.png');
    registrar('card-png', { png });

    // Cartaz A4
    await tocar(page.getByRole('button', { name: 'Imprimir cartaz para o mural' }));
    await expect.poll(() => page.evaluate(() => window.__impressoes)).toBeGreaterThan(0);
    const pdf = await salvarPdf(page, 'cartaz.pdf');
    registrar('cartaz-pdf', { pdf });
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    cron.marca('cartaz');

    // Mudar algo (antes da página do evento) -> volta ao passo 1; a pauta volta?
    await tocar(page.getByRole('button', { name: 'Mudar algo' }).first());
    await expect(titulo(page)).toContainText('Passo 1 de 3');
    const pautaVolta = await page.locator('#fluxo-pauta').inputValue();
    registrar('mudar-algo', { pautaVoltou: pautaVolta.split('\n').length, organizacao: await page.locator('#fluxo-organizacao').inputValue() });
    await foto(page, 'mudar-algo-passo1', true);
    await page.goBack();
    await page.waitForTimeout(500);
    registrar('voltar-do-passo1-apos-mudar', { url: page.url(), titulo: await titulo(page).innerText() });
    await foto(page, 'voltar-apos-mudar');
    // volta ao Pronto pelo endereço da sequência
    if (!/pronto/.test(page.url())) {
      await page.goto('./#/fazer/reuniao/1');
      for (let i = 0; i < 2; i++) await tocar(page.getByRole('button', { name: 'Continuar' }));
      await tocar(page.getByRole('button', { name: 'Ficou bom' }));
    }
    await expect(titulo(page)).toContainText(/Pronto!|Passo/);
    if (!(await titulo(page).innerText()).includes('Pronto')) {
      registrar('nao-voltou-ao-pronto', { titulo: await titulo(page).innerText(), url: page.url() });
    }

    // Página do evento
    const pagina = page.getByRole('link', { name: 'Ver a página do evento' });
    if (await pagina.isVisible()) {
      await tocar(pagina);
      await expect(page).toHaveURL(/#\/evento\//);
      await page.waitForTimeout(800);
      await inspecionar(page, 'página do evento');
      await foto(page, 'pagina-evento', true);
      registrar('pagina-evento-texto', { texto: await page.locator('main').innerText() });
      const ics = await baixarPor(page.getByRole('button', { name: 'Baixar arquivo para a agenda' }), 'evento.ics');
      const conteudo = readFileSync(ics, 'utf8');
      registrar('ics', { ics, conteudo });
      await page.goBack();
      await page.waitForTimeout(600);
      registrar('voltar-do-evento', { url: page.url(), titulo: await titulo(page).innerText() });
      await foto(page, 'voltar-do-evento');
    } else {
      registrar('sem-link-pagina-evento', { url: page.url() });
    }

    // Ata pela ponte (garante que estamos no Pronto)
    if (!(await titulo(page).innerText()).includes('Pronto')) {
      await page.goto('./#/fazer/reuniao/1');
      await page.waitForTimeout(300);
      registrar('voltou-ao-passo1-sem-dados', { org: await page.locator('#fluxo-organizacao').inputValue() });
    }
    const ponte = page.getByRole('button', { name: 'Fazer a ata' });
    if (await ponte.count()) {
      await ponte.scrollIntoViewIfNeeded();
      await foto(page, 'ponte-ata');
      await tocar(ponte);
    } else {
      await page.goto('./#/ata');
      registrar('sem-ponte', {});
    }
    await expect(titulo(page)).toHaveText('Depois da reunião: a ata');
    cron.marca('ata-aberta');
    await inspecionar(page, 'ata (vinda do Pronto)');
    await foto(page, 'ata-aberta', true);
    const pontosVindos = await page.locator('[id^="ata-pontos-"][id$="-titulo"]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
    registrar('ata-pauta-veio', { qtde: pontosVindos.length, pontos: pontosVindos, org: await page.locator('#ata-organizacao').inputValue(), data: await page.locator('#ata-data').inputValue(), local: await page.locator('#ata-local').inputValue(), inicio: await page.locator('#ata-inicio').inputValue() });
    await page.getByLabel('Presentes').fill(PRESENTES.join('\n'));
    await page.getByLabel('Hora do fim').fill('21:30');
    // 3 decisões nos 3 primeiros pontos
    const decisoes = ['Ata anterior aprovada por todos.', 'Contas aprovadas com ressalva do conselho fiscal.', 'Campanha salarial: pauta aprovada, com assembleia dia 28.'];
    for (const [i, t] of decisoes.entries()) {
      const c = page.locator(`[id="ata-pontos-${i}-decidido"]`);
      if (await c.count()) await c.fill(t);
    }
    // 4 encaminhamentos
    for (let i = 0; i < 4; i++) {
      if ((await page.locator(`[id="ata-encaminhamentos-${i}-oque"]`).count()) === 0) await page.locator('#acrescentar-encaminhamentos').click();
      await page.locator(`[id="ata-encaminhamentos-${i}-oque"]`).fill(['Enviar o parecer a todos os sócios', 'Reservar o salão para a assembleia', 'Imprimir 300 cartazes', 'Procurar a empresa para a reunião de negociação'][i]!);
      await page.locator(`[id="ata-encaminhamentos-${i}-quem"]`).fill(['Tesouraria', 'Secretaria', 'Comissão de base', 'Diretoria'][i]!);
      await page.locator(`[id="ata-encaminhamentos-${i}-ate"]`).fill(`2026-12-0${i + 1}`);
    }
    await inspecionar(page, 'ata preenchida');
    await foto(page, 'ata-preenchida', true);
    cron.marca('ata-preenchida');
    await tocar(page.getByRole('button', { name: 'Ver a ata pronta' }));
    await foto(page, 'ata-pronta', true);
    await tocar(page.getByRole('button', { name: 'Salvar em PDF' }));
    await expect.poll(() => page.evaluate(() => window.__impressoes)).toBeGreaterThan(0);
    const pdfAta = await salvarPdf(page, 'ata.pdf');
    registrar('ata-pdf', { pdf: pdfAta });
    await tocar(page.getByRole('button', { name: 'Copiar o texto' }));
    await page.waitForTimeout(300);
    const c = await copias(page);
    salvarTexto('ata-copiada.txt', c.at(-1) ?? '');
    registrar('ata-copiada', { texto: c.at(-1) ?? '', caracteres: (c.at(-1) ?? '').length });
    cron.marca('ata-pronta');

    // Recarregar no meio da ata
    await page.reload();
    await page.waitForTimeout(600);
    registrar('ata-apos-reload', { url: page.url(), presentes: await page.getByLabel('Presentes').inputValue(), org: await page.locator('#ata-organizacao').inputValue(), aviso: await page.locator('.reuniao-avisos').innerText().catch(() => '') }); // o cartão inteiro; '.reuniao-aviso' é só uma linha dele
    await foto(page, 'ata-apos-reload', true);

    // Fechar a aba e voltar
    const nova = await context.newPage();
    await page.close();
    await nova.goto('./#/ata');
    await nova.waitForTimeout(600);
    registrar('ata-apos-fechar-aba', { presentes: await nova.getByLabel('Presentes').inputValue(), org: await nova.locator('#ata-organizacao').inputValue() });
    await foto(nova, 'ata-aba-nova', true);
  });

  test('A2 Rogério: reunião sem escrever a organização (o link sai assim, Voltar, Fazer outro) @SAMSUNG', async ({ page }) => {
    await page.goto('./');
    await tocar(page.getByRole('link', { name: /Chamar para uma reunião/ }));
    await expect(titulo(page)).toContainText('Passo 1 de 3');
    // só escreve o título e a pauta (pessoa apressada) e deixa a organização vazia; o passo 2 pede dia, hora e local
    await digitar(page, '#fluxo-titulo', 'Assembleia geral da categoria');
    await page.locator('#fluxo-pauta').fill(PAUTA_CURTA.join('\n'));
    await tocar(page.getByRole('button', { name: 'Continuar' }));
    await expect(titulo(page)).toContainText('Passo 2 de 3');
    await preencherObrigatoriosVazios(page, { tipo: 'reuniao', agenda: true }, 2);
    await tocar(page.getByRole('button', { name: 'Continuar' }));
    await tocar(page.getByRole('button', { name: 'Ficou bom' }));
    await expect(titulo(page)).toContainText('Pronto!');
    await inspecionar(page, 'Pronto (sem organização)');
    await foto(page, 'pronto-sem-organizacao', true);
    await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…', { timeout: 60_000 });
    // O aviso do exemplo não existe mais (conta 0) e o link sai com ou sem organização.
    registrar('aviso-exemplo', { avisoDoExemplo: await page.locator('#fluxo-aviso-exemplo').count(), linkEstado: await page.locator('#fluxo-link-estado').innerText() });
    await tocar(page.getByRole('button', { name: 'Mandar no WhatsApp' }));
    const painelAbriu = await page.locator('#fluxo-confirma').isVisible();
    registrar('painel-exemplo', { abriu: painelAbriu, texto: painelAbriu ? await page.locator('#fluxo-confirma').innerText() : null });
    if (painelAbriu) {
      await inspecionar(page, 'painel');
      await foto(page, 'painel');
      await tocar(page.getByRole('button', { name: 'Mandar mesmo assim' }));
    }
    const enviadoSemOrg = (await partilhas(page)).at(-1);
    registrar('link-sem-organizacao', { temLink: /#\/evento\//.test(enviadoSemOrg?.texto ?? ''), texto: enviadoSemOrg?.texto ?? null });
    // Voltar do navegador no Pronto
    await page.goBack();
    await page.waitForTimeout(500);
    registrar('voltar-no-pronto', { url: page.url(), titulo: await titulo(page).innerText() });
    await foto(page, 'voltar-no-pronto');
    await page.goForward();
    await page.waitForTimeout(500);
    registrar('avancar-no-pronto', { url: page.url(), titulo: await titulo(page).innerText() });
    // Fazer outro
    const pronto = (await titulo(page).innerText()).includes('Pronto');
    if (pronto) {
      await tocar(page.getByRole('button', { name: 'Fazer outro' }));
      await expect(titulo(page)).toHaveText('O que você quer fazer?');
      await tocar(page.getByRole('link', { name: /Chamar para uma reunião/ }));
      await page.waitForTimeout(300);
      registrar('fazer-outro', { titulo: await page.locator('#fluxo-titulo').inputValue(), pauta: (await page.locator('#fluxo-pauta').inputValue()).split('\n').length, org: await page.locator('#fluxo-organizacao').inputValue() });
      await foto(page, 'depois-de-fazer-outro', true);
    }
  });

  test('A2 Rogério: Voltar do navegador nos passos @SAMSUNG', async ({ page }) => {
    await page.goto('./');
    await tocar(page.getByRole('link', { name: /Chamar para uma reunião/ }));
    await passo1(page, PAUTA_CURTA, true);
    await tocar(page.getByRole('button', { name: 'Continuar' }));
    await expect(titulo(page)).toContainText('Passo 2 de 3');
    await preencherObrigatoriosVazios(page, { tipo: 'reuniao', agenda: true }, 2);
    await page.locator('#fluxo-hora').fill('19:30');
    await tocar(page.getByRole('button', { name: 'Continuar' }));
    await expect(titulo(page)).toContainText('Passo 3 de 3');
    await page.goBack();
    await page.waitForTimeout(400);
    registrar('voltar-passo3', { titulo: await titulo(page).innerText(), hora: await page.locator('#fluxo-hora').inputValue().catch(() => '') });
    await page.goBack();
    await page.waitForTimeout(400);
    registrar('voltar-passo2', { titulo: await titulo(page).innerText(), pauta: await page.locator('#fluxo-pauta').inputValue().catch(() => ''), org: await page.locator('#fluxo-organizacao').inputValue().catch(() => '') });
    await foto(page, 'voltar-passo1');
    await page.goBack();
    await page.waitForTimeout(400);
    registrar('voltar-passo1', { titulo: await titulo(page).innerText(), url: page.url() });
    // Botão Voltar da barra do passo 2
    await page.goto('./#/fazer/reuniao/2');
    await page.waitForTimeout(400);
    registrar('abrir-direto-passo2', { titulo: await titulo(page).innerText() });
  });

  test('A2 Rogério: pauta de 9 itens no limite de 400 letras @SAMSUNG', async ({ page }) => {
    await page.goto('./');
    await tocar(page.getByRole('link', { name: /Chamar para uma reunião/ }));
    const itens = ['Abertura e leitura da ata anterior', 'Prestação de contas do fundo de greve com parecer do conselho fiscal', 'Informes da diretoria', 'Campanha salarial e pauta de reivindicações', 'Reajuste da contribuição assistencial', 'Eleição da comissão de base', 'Calendário de visitas aos locais de trabalho', 'Assuntos gerais', 'Encerramento'];
    await passo1(page, itens, true);
    await tocar(page.getByRole('button', { name: 'Continuar' }));
    await page.waitForTimeout(300);
    const erro = await page.locator('.campo-erro:visible').allInnerTexts();
    registrar('pauta-limite', { letras: itens.join('').replace(/[^A-Za-zÀ-ú]/g, '').length, erro });
    if (erro.length) return;
    await preencherDia(page);
    await page.locator('#fluxo-hora').fill('19:30');
    await page.locator('#fluxo-local').fill('Sede do sindicato');
    await tocar(page.getByRole('button', { name: 'Continuar' }));
    await tocar(page.getByRole('button', { name: 'Ficou bom' }));
    await expect(titulo(page)).toContainText('Pronto!');
    await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…', { timeout: 60_000 });
    await tocar(page.getByRole('button', { name: 'Mandar no WhatsApp' }));
    const [e] = await partilhas(page);
    const link = /(https?:\/\/\S+)/.exec(e!.texto)?.[1] ?? '';
    registrar('whatsapp-pauta-limite', { caracteresTexto: e!.texto.length, caracteresLink: link.length });
    await salvarPartilhado(page, 'card-limite.png');
    await foto(page, 'pronto-limite', true);
  });
});
