// Métricas de visita (desligadas enquanto METRICAS_ID estiver vazio em marca.ts).
// É o ÚNICO lugar do site que pode carregar algo de outro domínio (testes/privacidade.test.ts).
// Sugestão provisória: GoatCounter, que não usa cookie nem guarda IP. Conta só o caminho da página:
// nada do que vem depois do # (dados do evento, rascunhos) é enviado.

import { METRICAS_ID } from './marca';

export function ligarMetricas(doc: Document = document): void {
  if (!METRICAS_ID) return;
  (window as unknown as { goatcounter: unknown }).goatcounter = { path: () => location.pathname };
  const s = doc.createElement('script');
  s.async = true;
  s.dataset.goatcounter = `https://${METRICAS_ID}.goatcounter.com/count`;
  s.src = 'https://gc.zgo.at/count.js';
  doc.head.append(s);
}
