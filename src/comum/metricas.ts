// Métricas de visita (desligadas enquanto METRICAS_ID estiver vazio em marca.ts).
// É o ÚNICO lugar do site que pode carregar algo de outro domínio (testes/privacidade.test.ts).
// Sugestão provisória: GoatCounter, que não usa cookie nem guarda IP. Manda só o caminho da página e o
// nome do site: nada do que vem depois do #, nem o título da aba, nem de onde a pessoa veio.
// ANTES DE LIGAR: (1) trocar o script de fora por uma cópia local do count.js (script de fora roda com
// acesso à página inteira); (2) acrescentar o endereço de contagem ao connect-src da CSP no index.html.

import { METRICAS_ID, NOME } from './marca';

export function ligarMetricas(doc: Document = document): void {
  if (!METRICAS_ID) return;
  (window as unknown as { goatcounter: unknown }).goatcounter = { path: () => location.pathname, title: () => NOME, referrer: () => '' };
  const s = doc.createElement('script');
  s.async = true;
  s.dataset.goatcounter = `https://${METRICAS_ID}.goatcounter.com/count`;
  s.src = 'https://gc.zgo.at/count.js';
  doc.head.append(s);
}
