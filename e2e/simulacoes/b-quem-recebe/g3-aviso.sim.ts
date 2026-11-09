// G3: as portas sem link de evento (aviso, conquista, agradecimento) também recusam PIX, telefone e link?
// Grava .saidas/g3-aviso.json. O teste não fica vermelho por achado.
// Rodar: PORTA_SIM=4483 npx playwright test --config e2e/simulacoes/b-quem-recebe/playwright.config.ts g3-aviso --workers=1

import { writeFileSync } from 'node:fs';
import { expect } from '@playwright/test';
import { test } from '@playwright/test';
import { esperarOPronto, linkNoTexto, mandar, PORTAS, titulo } from '../../apoio';
import { abrirAparelho, foto, SAIDAS } from './aparelhos';

const CARGAS = [
  { id: 'pix', titulo: 'Ajude a família Souza', texto: 'Chave PIX 123.456.789-09 em nome de Maria. Mande o comprovante no zap 11 91234-5678.' },
  { id: 'link', titulo: 'Atualize seu cadastro', texto: 'Acesse https://golpe.example/cadastro e informe a senha do banco.' },
  { id: 'autoridade', titulo: 'Prefeitura de Vila Alegre informa', texto: 'Defesa Civil: evacuação imediata do bairro. Procure o ginásio.' },
];

for (const porta of PORTAS.filter((p) => !p.agenda)) {
  test(`g3 aviso: ${porta.tipo}`, async ({ browser }) => {
    const s = await abrirAparelho(browser, 'AND-GRANDE', { rede: null, cpu: null });
    const page = s.page;
    const saida: Record<string, unknown> = {};
    try {
      for (const c of CARGAS) {
        await page.goto('./');
        await page.getByRole('link', { name: new RegExp(porta.verbo) }).click();
        await expect(titulo(page)).toContainText('Passo 1 de 3');
        await page.locator('#fluxo-titulo').fill(c.titulo);
        await page.locator('#fluxo-organizacao').fill('Associação de Moradores Jardim das Acácias');
        const texto = page.locator('#fluxo-texto');
        if (await texto.count()) await texto.fill(c.texto);
        await page.getByRole('button', { name: 'Continuar' }).click();
        await page.waitForTimeout(250);
        const erros = await page.locator('.campo-erro:not([hidden])').allInnerTexts();
        // Título ou texto que fala em nome de órgão público abre o painel modal (dialog#fluxo-orgao): registra e toca em "Seguir assim".
        const painelOrgao = page.locator('dialog#fluxo-orgao');
        const painelDoOrgao = await painelOrgao.isVisible();
        if (painelDoOrgao) await painelOrgao.getByRole('button', { name: 'Seguir assim' }).click();
        const passo = await titulo(page).innerText();
        const r: Record<string, unknown> = { erros, painelDoOrgao, passoDepois: passo.trim() };
        if (!erros.length) {
          // segue até o Pronto
          for (let i = 0; i < 2; i++) {
            const h = (await titulo(page).innerText()).trim();
            if (/Pronto/.test(h)) break;
            if (/Passo 2/.test(h)) {
              await page.getByRole('button', { name: 'Continuar' }).click();
            } else if (/Passo 3/.test(h)) {
              await page.getByRole('button', { name: 'Ficou bom' }).click();
            }
            await page.waitForTimeout(250);
          }
          if (/Passo 3/.test((await titulo(page).innerText()))) await page.getByRole('button', { name: 'Ficou bom' }).click();
          await esperarOPronto(page, porta);
          r.mandado = await mandar(page);
          r.linkNoTexto = linkNoTexto(r.mandado as string);
          await foto(page, `g3-aviso-${porta.tipo}-${c.id}-pronto`);
        } else {
          await foto(page, `g3-aviso-${porta.tipo}-${c.id}-erro`);
        }
        saida[c.id] = r;
      }
    } catch (e) {
      saida.erroDoTeste = (e as Error).message.split('\n')[0];
    } finally {
      writeFileSync(`${SAIDAS}/g3-aviso-${porta.tipo}.json`, JSON.stringify(saida, null, 2));
      await s.fechar();
    }
  });
}
