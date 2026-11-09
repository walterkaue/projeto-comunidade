// Auxiliar das simulações (a, b e c): os campos dos passos 1 e 2 do fluxo começam vazios, então o roteiro que não
// quer escrever tudo precisa escrever os obrigatórios. É o `preencherObrigatoriosVazios` de e2e/fluxo-apoio.ts, mas o
// dia vai no formato que o campo aceita: AAAA-MM-DD no calendário (type="date") ou dd/mm/aaaa no campo de texto de
// reserva (navegador sem calendário, como o WebKit do Playwright). Só teste; nada daqui entra no site.
import type { Page } from '@playwright/test';
import type { Porta } from '../apoio';
import { DADOS, preencherDia, preencherObrigatoriosVazios as base } from '../fluxo-apoio';

export async function preencherObrigatoriosVazios(page: Page, porta: Pick<Porta, 'tipo' | 'agenda'>, passo: 1 | 2): Promise<void> {
  if (passo === 1) return base(page, porta, 1);
  if (!porta.agenda) return;
  const seVazio = async (id: string, valor: string): Promise<void> => {
    const campo = page.locator(id);
    if ((await campo.count()) && (await campo.inputValue()) === '') await campo.fill(valor);
  };
  if ((await page.locator('#fluxo-data').count()) && (await page.locator('#fluxo-data').inputValue()) === '') await preencherDia(page);
  await seVazio('#fluxo-hora', DADOS.hora);
  await seVazio('#fluxo-local', DADOS.local);
}
