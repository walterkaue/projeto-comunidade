// Apoio do grupo b: escreve o dia no campo do passo 2, que agora é <input type="date"> (valor AAAA-MM-DD)
// ou, no navegador sem calendário, um campo de texto de reserva (dd/mm/aaaa). Só teste; nada daqui entra no site.
import type { Page } from '@playwright/test';

/** Escreve o dia (dd/mm/aaaa) no campo `#fluxo-data`, no formato que o campo aceita. */
export async function preencherDiaBr(page: Page, ddmmaaaa: string): Promise<void> {
  const campo = page.locator('#fluxo-data');
  const calendario = (await campo.getAttribute('type')) === 'date';
  const [d, m, a] = ddmmaaaa.split('/');
  await campo.fill(calendario ? `${a}-${m}-${d}` : ddmmaaaa);
}
