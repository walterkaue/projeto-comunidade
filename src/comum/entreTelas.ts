// Combinados entre as ferramentas (puro, sem DOM). Cada ferramenta é feita numa sessão separada; estas
// funções são o contrato entre elas, para uma abrir a outra já preenchida sem importar o código da outra.
//
// - Evento e Reunião abrem o Cards preenchido:   linkDoCard(dados)  → "#/cards/modelo=evento&titulo=…"
//   e o Cards lê com lerDadosDoCard(rota.resto, location.href).
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

/** Endereço relativo do Cards já preenchido: "#/cards/modelo=evento&titulo=…". */
export function linkDoCard(d: DadosDoCard): string {
  const p = new URLSearchParams();
  if (d.modelo && (MODELOS_DE_CARD as readonly string[]).includes(d.modelo)) p.set('modelo', d.modelo);
  for (const k of TEXTOS) {
    const v = d[k];
    if (v) p.set(k, limpar(v, TAMANHO_MAXIMO[k]));
  }
  if (d.data && DATA.test(d.data)) p.set('data', d.data);
  if (d.hora && HORA.test(d.hora)) p.set('hora', d.hora);
  // Link cortado viraria QR quebrado: comprido demais, fica de fora.
  if (d.link && d.link.length <= TAMANHO_MAXIMO.link) p.set('link', d.link);
  return linkPara('cards', p.toString());
}

/** Lê o que veio em "#/cards/…". Campo inválido some; nunca lança erro. */
export function lerDadosDoCard(resto: string, base: string): DadosDoCard {
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(resto);
  } catch {
    return {};
  }
  const d: DadosDoCard = {};
  const modelo = p.get('modelo');
  if (modelo && (MODELOS_DE_CARD as readonly string[]).includes(modelo)) d.modelo = modelo as ModeloDeCard;
  for (const k of TEXTOS) {
    const v = limpar(p.get(k) ?? '', TAMANHO_MAXIMO[k]);
    // Quem altera o link na mão passa pela mesma conferência do evento: golpe não aparece no nosso domínio.
    // (Quem digita direto no Cards continua livre: só o que vem pelo link é filtrado.)
    if (v && motivoDeRecusa(v) === null) d[k] = v;
  }
  const data = p.get('data');
  if (data && DATA.test(data)) d.data = data;
  const hora = p.get('hora');
  if (hora && HORA.test(hora)) d.hora = hora;
  const link = p.get('link');
  if (link && link.length <= TAMANHO_MAXIMO.link && ehLinkDoEvento(link, base)) d.link = link;
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

/** A impressão está na lista? Aceita o JSON de public/bloqueados.json já lido; lista estranha conta como vazia. */
export function estaBloqueado(impressao: string, lista: unknown): boolean {
  const itens = (lista as { bloqueados?: unknown } | null)?.bloqueados;
  return Array.isArray(itens) && itens.some((i) => typeof i === 'string' && i.toLowerCase() === impressao.toLowerCase());
}
