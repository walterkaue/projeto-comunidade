// Combinados entre as ferramentas (sem DOM). Cada ferramenta é feita numa sessão separada; estas
// funções são o contrato entre elas, para uma abrir a outra já preenchida sem importar o código da outra.
//
// - Evento e Reunião abrem o Cards preenchido PELA MEMÓRIA DA ABA, nunca pelo link: no toque do botão,
//   prepararCard(dados, location.href) e navegam para "#/cards"; o Cards lê uma vez com pegarCardPreparado().
//   Link "#/cards/…" vindo de fora não preenche nada: texto de terceiro não aparece no nosso domínio sem a
//   faixa de aviso e sem a lista de bloqueio (auditoria 05/11/2026, M5).
// - Um link de evento só é aceito se for do próprio site: ehLinkDoEvento(link, location.href).
// - O botão "Denunciar" do evento abre a página de denúncia com o link: linkDeDenuncia(link),
//   e a página lê com lerLinkDenunciado(rota.resto, location.href).
// - Lista de links removidos (public/bloqueados.json): guarda só a impressão (SHA-256) dos dados do
//   evento, nunca o conteúdo. impressaoDoLink(resto) e estaBloqueado(impressao, json).

import { motivoDeRecusa } from './conteudo';
import { linkPara } from './rotas';
import { letras } from './texto';

export const MODELOS_DE_CARD = ['reuniao', 'evento', 'aviso', 'resultado', 'agradecimento'] as const;
export type ModeloDeCard = (typeof MODELOS_DE_CARD)[number];

/** Campos que preenchem um card. Tudo opcional e só texto puro. */
export interface DadosDoCard {
  modelo?: ModeloDeCard;
  titulo?: string;
  /** AAAA-MM-DD */
  data?: string;
  /** HH:MM */
  hora?: string;
  local?: string;
  texto?: string;
  organizacao?: string;
  /** Link de evento do próprio site (vira QR no cartaz). Qualquer outro link é descartado. */
  link?: string;
}

/** Tamanho máximo de cada campo ao passar de uma ferramenta para outra (o que passar é cortado). */
export const TAMANHO_MAXIMO = { titulo: 80, local: 120, texto: 140, organizacao: 60, link: 4000 } as const;

const TEXTOS = ['titulo', 'local', 'texto', 'organizacao'] as const;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Tira caracteres de controle e espaços repetidos; passando do máximo, corta com "…" sem partir emoji composto. */
const limpar = (s: string, max: number) => {
  const partes = letras(s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim());
  return partes.length <= max ? partes.join('') : `${partes.slice(0, max - 1).join('').trimEnd()}…`;
};

/** Endereço do Cards. Os dados vão pela memória da aba (prepararCard), nunca no link. */
export const ENDERECO_DO_CARDS = linkPara('cards');

/**
 * Confere os dados que uma ferramenta passa ao Cards. Campo inválido some, o comprido é cortado, texto com
 * link, telefone, PIX ou que finge ser do site some (mesma conferência do evento), e o link só fica se for de
 * evento deste site. Puro; nunca lança erro.
 */
export function conferirDadosDoCard(entrada: DadosDoCard, base: string): DadosDoCard {
  const d: DadosDoCard = {};
  const modelo = entrada.modelo;
  if (modelo && (MODELOS_DE_CARD as readonly string[]).includes(modelo)) d.modelo = modelo;
  for (const k of TEXTOS) {
    const bruto = entrada[k];
    const v = typeof bruto === 'string' ? limpar(bruto, TAMANHO_MAXIMO[k]) : '';
    if (v && motivoDeRecusa(v) === null) d[k] = v;
  }
  if (typeof entrada.data === 'string' && DATA.test(entrada.data)) d.data = entrada.data;
  if (typeof entrada.hora === 'string' && HORA.test(entrada.hora)) d.hora = entrada.hora;
  // Link cortado viraria QR quebrado: comprido demais, fica de fora.
  const link = entrada.link;
  if (typeof link === 'string' && link.length <= TAMANHO_MAXIMO.link && ehLinkDoEvento(link, base)) d.link = link;
  return d;
}

// Dados à espera do Cards. Só na memória desta aba: some ao recarregar e nunca vira link.
let preparado: DadosDoCard | undefined;

/** Guarda (já conferidos) os dados para o Cards abrir preenchido. Chame no toque do botão que leva ao Cards. */
export function prepararCard(d: DadosDoCard, base: string): void {
  preparado = conferirDadosDoCard(d, base);
}

/** O Cards pega os dados preparados uma vez só; depois disso, abrir o Cards de novo começa vazio. */
export function pegarCardPreparado(): DadosDoCard {
  const d = preparado ?? {};
  preparado = undefined;
  return d;
}

const pastaDoSite = (pathname: string) => pathname.replace(/index\.html$/, '');

/**
 * Os dados de um link de evento só têm letras sem acento, números, "-" e "_" (base64url, ver
 * src/ferramentas/evento/formato.ts; 6000 = DADOS_MAXIMO de lá). Qualquer outro sinal ("$", "(", "'", ";")
 * fica de fora: o link da denúncia vai por e-mail até quem modera e não pode levar comando do shell.
 */
const DADOS_DO_EVENTO = /^#\/evento\/[A-Za-z0-9_-]{3,6000}$/;

/**
 * O link é de um evento DESTE site? Mesmo endereço (origem e pasta) que `base` e "#/evento/<dados>".
 * Serve para o QR do cartaz e para a denúncia: nunca se aceita link de outro lugar.
 */
export function ehLinkDoEvento(link: string, base: string): boolean {
  let u: URL;
  let b: URL;
  try {
    u = new URL(link);
    b = new URL(base);
  } catch {
    return false;
  }
  return (
    u.protocol === b.protocol &&
    u.origin === b.origin &&
    pastaDoSite(u.pathname) === pastaDoSite(b.pathname) &&
    u.search === '' &&
    DADOS_DO_EVENTO.test(u.hash)
  );
}

/** Os dados do evento num link do site (o que vem depois de "#/evento/"). Vazio se não for link de evento. */
export function dadosDoLinkDoEvento(link: string, base: string): string {
  return ehLinkDoEvento(link, base) ? new URL(link).hash.slice('#/evento/'.length) : '';
}

/** Endereço relativo da página de denúncia já com o link denunciado. */
export function linkDeDenuncia(linkDoEvento: string): string {
  return linkPara('denunciar', encodeURIComponent(linkDoEvento));
}

/** O link que veio em "#/denunciar/…", só se for evento deste site. Senão, vazio. */
export function lerLinkDenunciado(resto: string, base: string): string {
  if (!resto) return '';
  let link: string;
  try {
    link = decodeURIComponent(resto);
  } catch {
    return '';
  }
  return ehLinkDoEvento(link, base) ? link : '';
}

/**
 * Impressão dos dados de um evento (SHA-256 em hexadecimal) para a lista de bloqueio.
 * `dados` é o que vem depois de "#/evento/", exatamente como está no link.
 * A lista pública guarda só a impressão: não republica o conteúdo denunciado.
 */
export async function impressaoDoLink(dados: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dados));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Por que um link foi removido (auditoria 05/11/2026, M7 e M8): a regra ferida (número de src/comum/regras.ts),
 * a pedido de quem criou, ou sem motivo registrado (itens antigos da lista).
 */
export type MotivoDaRemocao = { tipo: 'regra'; regra: number } | { tipo: 'pedido' } | { tipo: 'sem-motivo' };

/** Motivo como fica gravado na lista: "regra-5" ou "pedido". Qualquer outra coisa conta como sem motivo. */
export function lerMotivo(gravado: unknown): MotivoDaRemocao {
  if (gravado === 'pedido') return { tipo: 'pedido' };
  const r = typeof gravado === 'string' ? /^regra-([1-9]\d?)$/.exec(gravado) : null;
  return r ? { tipo: 'regra', regra: Number(r[1]) } : { tipo: 'sem-motivo' };
}

/**
 * A impressão está na lista? Devolve o motivo, ou null se não está. Aceita o JSON de public/bloqueados.json já
 * lido, com itens em texto (só a impressão, formato antigo) ou { "h": impressão, "motivo": "regra-5" }.
 * Lista ou item estranho conta como vazio.
 */
export function motivoDoBloqueio(impressao: string, lista: unknown): MotivoDaRemocao | null {
  const itens = (lista as { bloqueados?: unknown } | null)?.bloqueados;
  if (!Array.isArray(itens)) return null;
  const alvo = impressao.toLowerCase();
  for (const i of itens) {
    if (typeof i === 'string') {
      if (i.toLowerCase() === alvo) return { tipo: 'sem-motivo' };
    } else if (i && typeof i === 'object') {
      const { h, motivo } = i as { h?: unknown; motivo?: unknown };
      if (typeof h === 'string' && h.toLowerCase() === alvo) return lerMotivo(motivo);
    }
  }
  return null;
}

/** A impressão está na lista? (O mesmo que motivoDoBloqueio, sem o motivo.) */
export function estaBloqueado(impressao: string, lista: unknown): boolean {
  return motivoDoBloqueio(impressao, lista) !== null;
}
