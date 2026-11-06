// Link do evento para a tela Pronto (reunião e evento). O formato do evento (compressão, base64) só é
// baixado aqui, quando a tela Pronto abre, e pode ser trocado nos testes.

import type { MotivoDaRemocao } from '../../comum/entreTelas';
import { validarEvento, type Evento } from '../evento/validar';
import { MENSAGEM_DO_LINK_GRANDE, MENSAGEM_LINK_REMOVIDO, MENSAGEM_LINK_COM_EXEMPLO, MENSAGEM_SEM_INTERNET, MENSAGEM_SEM_LINK } from './apoio';
import { assinatura, eventoDoFluxo, exemploNoLink, linkAindaVale, temAgenda, type DadosDoFluxo } from './estado';

export interface ResultadoDoLink {
  /** Vazio quando não há link (tipo sem agenda, texto grande demais ou dados recusados). */
  link: string;
  /** Explicação para a pessoa quando faltou o link. */
  aviso: string;
  /** Presente quando o link novo é igual a um evento removido do site (não há link). */
  removido?: MotivoDaRemocao;
  /** Faltou o link porque não deu para baixar o formato do evento (sem internet). Tentar de novo pode resolver. */
  semRede?: true;
}

export interface DependenciasDoLink {
  codificar: (e: Evento) => Promise<string>;
  completo: (dados: string, base: string) => string;
  maximo: number;
  /** Forma canônica do evento (a que a lista de bloqueio também guarda). */
  canonico?: (e: Evento) => string;
  /** O motivo da remoção, ou null se nenhum destes dados está na lista. Sem isto, não confere. */
  bloqueado?: (dados: string[]) => Promise<MotivoDaRemocao | null>;
}

async function padrao(): Promise<DependenciasDoLink> {
  // A lista de bloqueio que não baixa não trava: segue sem conferir. O formato que não baixa é "sem internet".
  const [f, b] = await Promise.all([import('../evento/formato'), import('../evento/bloqueio').catch(() => undefined)]);
  return {
    codificar: (e) => f.codificar(e),
    completo: f.linkCompleto,
    maximo: f.LINK_MAXIMO,
    canonico: f.dadosCanonicos,
    bloqueado: b ? (dados) => b.motivoDoLinkBloqueado(dados) : undefined,
  };
}

/**
 * O link do evento destes dados. Se o link de antes ainda vale (os campos não mudaram), usa ele; senão valida
 * pela MESMA regra da página do evento e codifica. Guarda o resultado em `d` (link e assinaturaDoLink).
 * Nunca lança erro.
 */
export async function linkDoFluxo(
  d: DadosDoFluxo,
  base: string,
  deps?: DependenciasDoLink,
  carregar: () => Promise<DependenciasDoLink> = padrao,
): Promise<ResultadoDoLink> {
  if (!temAgenda(d.tipo)) return { link: '', aviso: '' };
  // O link é o que circula: com a organização do exemplo, não sai (docs/produto.md 7.6).
  if (exemploNoLink(d)) return { link: '', aviso: MENSAGEM_LINK_COM_EXEMPLO };
  if (linkAindaVale(d)) {
    // O link original pode passar do máximo (o QR do cartaz falharia). Não gera outro: ele seria outro evento.
    // Se o formato não carregar (sem rede), fica com o original: é ele que a lista de bloqueio conhece.
    const maximo = deps?.maximo ?? (await carregar().then((p) => p.maximo, () => Number.POSITIVE_INFINITY));
    return d.link.length > maximo ? { link: '', aviso: MENSAGEM_DO_LINK_GRANDE } : { link: d.link, aviso: '' };
  }
  try {
    const r = validarEvento(eventoDoFluxo(d));
    if (!r.ok) return { link: '', aviso: MENSAGEM_SEM_LINK };
    let dp: DependenciasDoLink;
    try {
      dp = deps ?? (await carregar());
    } catch {
      return { link: '', aviso: MENSAGEM_SEM_INTERNET, semRede: true };
    }
    const link = dp.completo(await dp.codificar(r.evento), base);
    if (link.length > dp.maximo) return { link: '', aviso: MENSAGEM_DO_LINK_GRANDE };
    // Um evento igual a um removido não ganha link: quem recebe só veria "removido" (conferência falha = segue).
    if (dp.bloqueado) {
      const feitos = link.slice(link.indexOf('#/evento/') + '#/evento/'.length);
      const canonico = dp.canonico?.(r.evento);
      const motivo = await dp.bloqueado(canonico && canonico !== feitos ? [feitos, canonico] : [feitos]);
      if (motivo) return { link: '', aviso: MENSAGEM_LINK_REMOVIDO, removido: motivo };
    }
    d.link = link;
    d.assinaturaDoLink = assinatura(d);
    d.linkOriginal = false;
    return { link, aviso: '' };
  } catch {
    return { link: '', aviso: MENSAGEM_SEM_LINK };
  }
}
