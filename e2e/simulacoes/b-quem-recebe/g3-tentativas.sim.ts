// G3: cada tentativa (golpe e texto honesto) no fluxo e no link montado à mão. A saída vai para
// .saidas/g3-tentativas.jsonl; o teste não fica vermelho por achado.
// Rodar: PORTA_SIM=4482 npx playwright test --config e2e/simulacoes/b-quem-recebe/playwright.config.ts g3-tentativas --workers=2

import { test } from '@playwright/test';
import { abrirAparelho } from './aparelhos';
import { abrirLinkAMao, CAMPO_LINK, CAMPOS_FLUXO, guardar, tentarNoFluxo, TODAS, type Registro } from './g3-apoio';

test.describe.configure({ mode: 'parallel' });

for (const t of TODAS) {
  test(`g3 ${t.papel} ${t.id}`, async ({ browser }) => {
    const base = test.info().project.use.baseURL!;
    const s = await abrirAparelho(browser, 'AND-GRANDE', { rede: null, cpu: null });
    const reg: Registro = { id: t.id, grupo: t.grupo, papel: t.papel, texto: t.texto, fluxo: {}, mao: {} };
    try {
      reg.fluxo = await tentarNoFluxo(s.page, t.texto);
      for (const campo of CAMPOS_FLUXO) {
        const { dados: _d, ...r } = await abrirLinkAMao(s.page, base, CAMPO_LINK[campo], t.texto);
        reg.mao[campo] = r;
      }
    } catch (e) {
      (reg as Registro & { erroDoTeste?: string }).erroDoTeste = (e as Error).message.split('\n')[0];
    } finally {
      guardar(reg);
      await s.fechar();
    }
  });
}
