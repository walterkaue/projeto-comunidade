// Formato dos dados do evento no link (puro, sem DOM). Os dados vão depois de "#/evento/" e nunca para servidor.
//
//   <versão><marca><base64url>
//     versão:  "1"
//     marca:   "z" = JSON comprimido com deflate-raw; "r" = JSON sem compressão (navegador sem CompressionStream)
//     JSON:    ["título","AAAA-MM-DD","HH:MM","HH:MM ou vazio","local","descrição","organização"]
//
// Na leitura, tudo é desconfiado: tamanho máximo antes e depois de descomprimir, formato dos campos e a
// mesma validação da criação (validar.ts). Nada aqui lança erro: o resultado diz o que houve.

import { validarEvento, type Erros, type Evento } from './validar';

export const VERSAO = '1';
export const MARCA_COMPRIMIDO = 'z';
export const MARCA_SIMPLES = 'r';

/** Link ideal: abaixo disto (o endereço inteiro, com o do site). Acima, avisa. */
export const LINK_IDEAL = 1500;
/** Link máximo: acima disto não gera (o card também não leva). */
export const LINK_MAXIMO = 4000;

/** O que se aceita ler depois do "#/evento/" (contra link absurdamente grande). */
export const DADOS_MAXIMO = 6000;
/** Tamanho máximo do JSON depois de descomprimir (contra "bomba" de compressão). */
export const JSON_MAXIMO = 8192;

export type ProblemaDoLink = 'malformado' | 'versao' | 'sem-suporte' | 'recusado';
export type Leitura = { ok: true; evento: Evento } | { ok: false; problema: ProblemaDoLink; erros?: Erros };

// ---------- base64url ----------

export function paraBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function deBase64Url(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) return null;
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

// ---------- compressão ----------

export const temCompressao = (): boolean => typeof CompressionStream === 'function';
export const temDescompressao = (): boolean => typeof DecompressionStream === 'function';

async function passarPor(bytes: Uint8Array, fluxo: CompressionStream | DecompressionStream, limite: number): Promise<Uint8Array | null> {
  const escritor = fluxo.writable.getWriter();
  // Sem await: o fluxo só anda quando alguém lê; ler e escrever juntos evita travar.
  const escrita = escritor.write(bytes as BufferSource).then(() => escritor.close());
  escrita.catch(() => {});
  const leitor = fluxo.readable.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      total += value.length;
      if (total > limite) {
        await leitor.cancel();
        return null;
      }
      partes.push(value);
    }
    await escrita;
  } catch {
    return null;
  }
  const saida = new Uint8Array(total);
  let ponto = 0;
  for (const p of partes) {
    saida.set(p, ponto);
    ponto += p.length;
  }
  return saida;
}

// ---------- codificar ----------

const paraLista = (e: Evento): string[] => [e.titulo, e.data, e.inicio, e.fim, e.local, e.descricao, e.organizacao];

export interface OpcoesDeCodificar {
  /** false = nunca comprime (teste e navegador sem suporte). Padrão: comprime quando o navegador sabe e compensa. */
  comprimir?: boolean;
}

/** Evento (já validado) → texto para depois do "#/evento/". */
export async function codificar(evento: Evento, opcoes: OpcoesDeCodificar = {}): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(paraLista(evento)));
  const simples = VERSAO + MARCA_SIMPLES + paraBase64Url(bytes);
  if (opcoes.comprimir === false || !temCompressao()) return simples;
  const comprimido = await passarPor(bytes, new CompressionStream('deflate-raw'), JSON_MAXIMO * 4);
  if (!comprimido) return simples;
  const z = VERSAO + MARCA_COMPRIMIDO + paraBase64Url(comprimido);
  return z.length < simples.length ? z : simples;
}

// ---------- decodificar ----------

/** Texto depois de "#/evento/" → evento validado, ou o problema (nunca lança erro). */
export async function decodificar(dados: string): Promise<Leitura> {
  try {
    if (typeof dados !== 'string' || dados.length < 3 || dados.length > DADOS_MAXIMO || !/^[A-Za-z0-9_-]+$/.test(dados)) {
      return { ok: false, problema: 'malformado' };
    }
    if (dados[0] !== VERSAO) return { ok: false, problema: /^\d$/.test(dados[0] ?? '') ? 'versao' : 'malformado' };
    const marca = dados[1];
    const miolo = deBase64Url(dados.slice(2));
    if (!miolo || miolo.length === 0) return { ok: false, problema: 'malformado' };

    let bytes: Uint8Array | null;
    if (marca === MARCA_SIMPLES) {
      bytes = miolo.length <= JSON_MAXIMO ? miolo : null;
    } else if (marca === MARCA_COMPRIMIDO) {
      if (!temDescompressao()) return { ok: false, problema: 'sem-suporte' };
      bytes = await passarPor(miolo, new DecompressionStream('deflate-raw'), JSON_MAXIMO);
    } else {
      return { ok: false, problema: 'malformado' };
    }
    if (!bytes) return { ok: false, problema: 'malformado' };

    const json: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!Array.isArray(json) || json.length !== 7 || !json.every((c) => typeof c === 'string')) {
      return { ok: false, problema: 'malformado' };
    }
    const [titulo, data, inicio, fim, local, descricao, organizacao] = json as string[];
    const r = validarEvento({ titulo, data, inicio, fim, local, descricao, organizacao });
    return r.ok ? r : { ok: false, problema: 'recusado', erros: r.erros };
  } catch {
    return { ok: false, problema: 'malformado' };
  }
}

/** Endereço completo do evento: o site (sem o #) + "#/evento/<dados>". */
export function linkCompleto(dados: string, base: string): string {
  return new URL(`#/evento/${dados}`, base).href;
}

export const MENSAGEM_DO_PROBLEMA: Record<ProblemaDoLink, string> = {
  malformado: 'Este link de evento está incompleto ou foi alterado. Peça a quem enviou para mandar de novo.',
  versao: 'Este link foi criado por uma versão mais nova do site. Atualize a página e tente de novo.',
  'sem-suporte': 'Este navegador é antigo demais para abrir este link. Tente abrir em outro navegador.',
  recusado:
    'Este link de evento tem conteúdo que o site não aceita (como link, telefone ou pedido de pagamento). Por segurança, ele não é mostrado.',
};
