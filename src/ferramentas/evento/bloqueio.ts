// Conferência da lista de links removidos após denúncia (public/bloqueados.json). Só a impressão (SHA-256)
// dos dados do link está na lista; a conta e a comparação são de src/comum/entreTelas.ts.
//
// Se a lista não puder ser lida (sem rede e sem cópia guardada, arquivo estranho), o evento é mostrado:
// o service worker já guarda a última lista que veio, então sem rede vale a última conhecida.

import { estaBloqueado, impressaoDoLink } from '../../comum/entreTelas';

export const ESPERA_DA_LISTA_MS = 8000;

/** Lê a lista do próprio site. Rejeita se não vier (rede, 404, JSON ruim ou demora demais). */
export async function lerListaDoSite(): Promise<unknown> {
  const controle = new AbortController();
  const prazo = setTimeout(() => controle.abort(), ESPERA_DA_LISTA_MS);
  try {
    const resp = await fetch('./bloqueados.json', { cache: 'no-cache', signal: controle.signal });
    if (!resp.ok) throw new Error('lista indisponível');
    return await resp.json();
  } finally {
    clearTimeout(prazo);
  }
}

/**
 * Algum destes dados (o que vem depois de "#/evento/") foi removido após denúncia? Passe o texto do link como
 * veio e, se der para ler o evento, também a forma canônica dele (formato.ts). Qualquer falha conta como "não".
 */
export async function linkBloqueado(
  dados: string | readonly string[],
  lerLista: () => Promise<unknown> = lerListaDoSite,
  impressao: (d: string) => Promise<string> = impressaoDoLink,
): Promise<boolean> {
  try {
    const todos = typeof dados === 'string' ? [dados] : dados;
    const [lista, marcas] = await Promise.all([lerLista(), Promise.all(todos.map(impressao))]);
    return marcas.some((m) => estaBloqueado(m, lista));
  } catch {
    return false;
  }
}
