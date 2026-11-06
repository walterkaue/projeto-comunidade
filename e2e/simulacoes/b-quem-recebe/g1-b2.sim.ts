// G1 / B2: Joana (Manaus) e Edson (Rio Branco) recebem o evento de São Paulo às 19h. O mesmo em São Paulo, para comparar.
import { expect, test } from '@playwright/test';
import { abrirAparelho, type NomeDoAparelho } from './aparelhos';
import { abrirLink, espiarBlobs, guardar, tentarIcs, tocarExterno, type Registro } from './g1-apoio';

interface Caso {
  ap: NomeDoAparelho;
  id: string;
  tz: string;
  tag: string;
}

const casos: Caso[] = [
  { ap: 'AND-GRANDE', id: 'b2-joana-manaus', tz: 'America/Manaus', tag: '' },
  { ap: 'AND-PEQUENO', id: 'b2-edson-riobranco-and', tz: 'America/Rio_Branco', tag: '' },
  { ap: 'IPHONE-SE', id: 'b2-edson-riobranco-iphone', tz: 'America/Rio_Branco', tag: ' @webkit' },
  { ap: 'AND-GRANDE', id: 'b2-ref-saopaulo', tz: 'America/Sao_Paulo', tag: '' },
];

for (const c of casos) {
  test(`G1 B2 ${c.id}${c.tag}`, async ({ browser }, info) => {
    const base = info.project.use.baseURL!;
    const s = await abrirAparelho(browser, c.ap, { timezoneId: c.tz });
    await espiarBlobs(s);
    const reg: Registro = { id: c.id, aparelho: c.ap, timezone: c.tz, passos: {} };
    await abrirLink(s, base, 'evento-sp-19h', c.id, reg);
    // O que o relógio do aparelho diz (prova de que o fuso emulado vale).
    reg.passos['relogio-do-aparelho'] = await s.page.evaluate(() => ({
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      deslocamentoMin: new Date(2026, 10, 21, 19, 0).getTimezoneOffset(),
      agora: new Date().toString(),
    }));
    // A mesma hora local 19:00 lida em UTC, para ver o que um app que respeita o fuso mostraria:
    reg.passos['hora-flutuante-19h-vira-utc'] = await s.page.evaluate(() => new Date(2026, 10, 21, 19, 0).toISOString());
    await tentarIcs(s, c.id, reg, true);
    await tocarExterno(s, c.id, reg, 'agenda', 'a[aria-label^="Abrir no Google Agenda"]');
    await tocarExterno(s, c.id, reg, 'mapa', '[data-mapa]');
    guardar(c.id, reg, s);
    expect(s.page.url()).toContain('#/evento/');
    await s.fechar();
  });
}
