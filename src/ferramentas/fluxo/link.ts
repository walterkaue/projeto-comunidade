// Link do evento para a tela Pronto (reunião e evento). O formato do evento (compressão, base64) só é
// baixado aqui, quando a tela Pronto abre, e pode ser trocado nos testes.

import { validarEvento, type Evento } from '../evento/validar';
import { MENSAGEM_DO_LINK_GRANDE, MENSAGEM_LINK_COM_EXEMPLO, MENSAGEM_SEM_LINK } from './apoio';
import { assinatura, eventoDoFluxo, exemploNoLink, linkAindaVale, temAgenda, type DadosDoFluxo } from './estado';

export interface ResultadoDoLink {
  /** Vazio quando não há link (tipo sem agenda, texto grande demais ou dados recusados). */
  link: string;
  /** Explicação para a pessoa quando faltou o link. */
  aviso: string;
}

export interface DependenciasDoLink {
  codificar: (e: Evento) => Promise<string>;
  completo: (dados: string, base: string) => string;
  maximo: number;
}

async function padrao(): Promise<DependenciasDoLink> {
  const f = await import('../evento/formato');
  return { codificar: (e) => f.codificar(e), completo: f.linkCompleto, maximo: f.LINK_MAXIMO };
}

/**
 * O link do evento destes dados. Se o link de antes ainda vale (os campos não mudaram), usa ele; senão valida
 * pela MESMA regra da página do evento e codifica. Guarda o resultado em `d` (link e assinaturaDoLink).
 * Nunca lança erro.
 */
export async function linkDoFluxo(d: DadosDoFluxo, base: string, deps?: DependenciasDoLink): Promise<ResultadoDoLink> {
  if (!temAgenda(d.tipo)) return { link: '', aviso: '' };
  // O link é o que circula: com a organização do exemplo, não sai (docs/produto.md 7.6).
  if (exemploNoLink(d)) return { link: '', aviso: MENSAGEM_LINK_COM_EXEMPLO };
  if (linkAindaVale(d)) {
    // O link original pode passar do máximo (o QR do cartaz falharia). Não gera outro: ele seria outro evento.
    // Se o formato não carregar (sem rede), fica com o original: é ele que a lista de bloqueio conhece.
    const maximo = deps?.maximo ?? (await padrao().then((p) => p.maximo, () => Number.POSITIVE_INFINITY));
    return d.link.length > maximo ? { link: '', aviso: MENSAGEM_DO_LINK_GRANDE } : { link: d.link, aviso: '' };
  }
  try {
    const r = validarEvento(eventoDoFluxo(d));
    if (!r.ok) return { link: '', aviso: MENSAGEM_SEM_LINK };
    const dp = deps ?? (await padrao());
    const link = dp.completo(await dp.codificar(r.evento), base);
    if (link.length > dp.maximo) return { link: '', aviso: MENSAGEM_DO_LINK_GRANDE };
    d.link = link;
    d.assinaturaDoLink = assinatura(d);
    d.linkOriginal = false;
    return { link, aviso: '' };
  } catch {
    return { link: '', aviso: MENSAGEM_SEM_LINK };
  }
}
