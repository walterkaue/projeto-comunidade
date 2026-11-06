// Revisão: a folha "Você vai sair do…" com o celular deitado (AND-DEITADO, 640 × 360) e letra a 200%.
// Achado do revisor-acessibilidade, reproduzido aqui: a caixa passa da altura da tela e não rola?

import { appendFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { test } from '@playwright/test';
import { abrirAparelho, foto, linkDoEvento, PASTA, SAIDAS, type NomeDoAparelho } from './aparelhos';

const LINKS = JSON.parse(readFileSync(`${PASTA}links.json`, 'utf-8')) as Record<string, { dados: string; titulo: string }>;

for (const nome of ['AND-DEITADO', 'AND-FRACO'] as NomeDoAparelho[]) {
  for (const botao of ['Abrir no Google Agenda', 'Ver no mapa']) {
    test(`folha de saída: ${nome}, letra 200%, ${botao}`, async ({ browser }, info) => {
      const s = await abrirAparelho(browser, nome, { texto200: true, rede: null, cpu: null });
      const l = LINKS['evento-sp-19h']!;
      await s.page.goto(linkDoEvento(info.project.use.baseURL!, l.dados));
      await s.page.getByRole('heading', { level: 1, name: l.titulo }).waitFor();
      await s.page.getByRole('link', { name: new RegExp(botao) }).click();
      const caixa = s.page.locator('.folha-caixa');
      await caixa.waitFor();
      await s.page.waitForTimeout(300);
      const m = await caixa.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const folha = el.closest('.folha') as HTMLElement | null;
        const p = el.querySelector('p');
        const rp = p?.getBoundingClientRect();
        return {
          topoDaCaixa: Math.round(r.top),
          alturaDaCaixa: Math.round(r.height),
          alturaDaTela: innerHeight,
          fraseVisivel: !!rp && rp.top >= 0 && rp.bottom <= innerHeight,
          frase: p?.innerText ?? '',
          folhaRola: !!folha && folha.scrollHeight > folha.clientHeight && getComputedStyle(folha).overflowY !== 'visible' && getComputedStyle(folha).overflowY !== 'hidden',
        };
      });
      appendFileSync(`${SAIDAS}/r-folha.jsonl`, JSON.stringify({ nome, botao, ...m, quando: new Date().toISOString() }) + '\n');
      await foto(s.page, `r-folha-${nome}-${botao.replace(/\s+/g, '-')}`);
      await s.fechar();
    });
  }
}
