// G1 / B1: Seu Antônio recebe o convite do sindicato no WhatsApp (navegador dentro do app, texto a 200%).
import { expect, test } from '@playwright/test';
import { abrirAparelho, type NomeDoAparelho } from './aparelhos';
import { abrirLink, espiarBlobs, guardar, tentarIcs, tocarCompartilharEQr, tocarExterno, type Registro } from './g1-apoio';

const casos: { ap: NomeDoAparelho; id: string; copia?: boolean }[] = [
  { ap: 'WEBVIEW', id: 'b1-webview-copia', copia: true },
  { ap: 'WEBVIEW', id: 'b1-webview' },
  { ap: 'AND-FRACO', id: 'b1-andfraco' },
];

for (const c of casos) {
  test(`G1 B1 ${c.id}`, async ({ browser }, info) => {
    const base = info.project.use.baseURL!;
    const s = await abrirAparelho(browser, c.ap, { texto200: true });
    if (c.copia) await s.context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(base).origin });
    await espiarBlobs(s);
    const reg: Registro = { id: c.id, aparelho: c.ap, timezone: 'America/Sao_Paulo', passos: {} };
    await abrirLink(s, base, 'reuniao-sindicato', c.id, reg);
    await tentarIcs(s, c.id, reg, true);
    await tocarExterno(s, c.id, reg, 'agenda', 'a[aria-label^="Abrir no Google Agenda"]');
    await tocarExterno(s, c.id, reg, 'mapa', '[data-mapa]');
    await tocarCompartilharEQr(s, c.id, reg);
    guardar(c.id, reg, s);
    expect(s.page.url()).toContain('#/evento/');
    await s.fechar();
  });
}
