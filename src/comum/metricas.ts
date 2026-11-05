// Métricas de visita: GoatCounter, sem cookie. Desligadas enquanto METRICAS_ID estiver vazio em marca.ts.
// É o ÚNICO lugar do site que pode pedir algo a outro domínio (testes/privacidade.test.ts).
//
// Não usa o script do GoatCounter (script de fora roda com acesso à página inteira). Em vez dele, pede uma
// imagem de 1 pixel ao endereço de contagem, com só três coisas:
//   p = a tela aberta ("/evento", "/cards"…), NUNCA o que vem depois dela (dados do evento, do card);
//   t = o nome do site (nunca o título da aba, que pode ter o título de um evento);
//   rnd = número ao acaso, para o navegador não reaproveitar a imagem.
// Sem "de onde veio" (referrer) e sem tamanho de tela. O index.html já manda o navegador não contar a
// página de origem (no-referrer).
//
// PARA LIGAR: (1) preencher METRICAS_ID em marca.ts; (2) pôr https://<id>.goatcounter.com no img-src da CSP
// do index.html; (3) avisar na Política de Privacidade (seção "Métricas de visita"). O teste de privacidade
// confere (1) e (2) juntos.

import { METRICAS_ID, NOME } from './marca';
import { lerRota } from './rotas';

/** Endereço de contagem de uma tela. Puro, testável. */
export function enderecoDaContagem(id: string, hash: string, acaso: number): string {
  const tela = lerRota(hash).nome;
  const p = new URLSearchParams({ p: tela === 'inicio' ? '/' : `/${tela}`, t: NOME, rnd: String(acaso) });
  return `https://${id}.goatcounter.com/count?${p.toString()}`;
}

export function ligarMetricas(win: Window = window): void {
  if (!METRICAS_ID) return;
  let ultima = '';
  const contar = () => {
    // Navegador automático (robô) não conta; trocar só os dados da mesma tela também não.
    if (win.navigator.webdriver) return;
    const tela = lerRota(win.location.hash).nome;
    if (tela === ultima) return;
    ultima = tela;
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.src = enderecoDaContagem(METRICAS_ID, win.location.hash, Math.floor(Math.random() * 1e9));
  };
  contar();
  win.addEventListener('hashchange', contar);
}
