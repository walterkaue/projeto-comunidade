// Conferência de conteúdo de terceiros (puro, sem DOM). No nosso domínio, texto vindo de outra pessoa
// (formulário do evento, link recebido, link do Cards) nunca mostra link, PIX, telefone, contato nem HTML,
// e não pode se passar pela plataforma. A lista é de propósito rígida: quando erra, erra para o lado de
// recusar, e a mensagem diz o que mudar. Usada por src/ferramentas/evento/validar.ts e por entreTelas.ts.

import { NOME, NOME_CURTO } from './marca';

// ---------- limpeza ----------

// Invisíveis que servem para esconder link ou trocar a ordem do texto (zero-width, marcas de direção, tags,
// seletores, BOM...). Tudo que o Unicode marca como "ignorável" some. O seletor de emoji (FE0F) fica, e o
// ZWJ (200D) só fica entre dois emoji (família, profissão...); na hora de conferir, os dois também somem.
const IGNORAVEIS = /[\p{Default_Ignorable_Code_Point}⠀]/gu;
// Metade de emoji sem a outra metade: o navegador não sabe mostrar nem codificar em endereço.
const SOLTOS = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
const mantemNoTexto = (c: string): string => (c === '‍' || c === '️' ? c : '');
const CONTROLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
// ZWJ que não está entre dois emoji (com seletor de emoji ou tom de pele no meio, se houver).
const ZWJ_SOLTO = /(?<![\p{Extended_Pictographic}\p{Emoji_Modifier}]️?)‍|‍(?!\p{Extended_Pictographic})/gu;
// Mais de 2 marcas combinantes seguidas (acentos empilhados, "zalgo"): sobram só 2.
const MARCAS_DEMAIS = /(\p{M}{2})\p{M}+/gu;

/**
 * Tira invisíveis e controles, junta espaços, deixa no máximo 2 marcas combinantes seguidas, põe o texto na
 * forma canônica (NFC: "ã" composto e decomposto viram o mesmo) e, se `multilinha`, mantém no máximo uma
 * linha em branco seguida.
 */
export function limparTexto(s: string, multilinha = false): string {
  let t = s.replace(/\r\n?/g, '\n').replace(CONTROLE, '').replace(SOLTOS, '').replace(IGNORAVEIS, mantemNoTexto);
  // O ZWJ solto sai ANTES do NFC: "a" + ZWJ + "~" volta a ser "ã".
  t = t.replace(ZWJ_SOLTO, '').replace(MARCAS_DEMAIS, '$1').normalize('NFC').replace(MARCAS_DEMAIS, '$1');
  if (!multilinha) t = t.replace(/\n/g, ' ');
  t = t.replace(/[^\S\n]+/g, ' ');
  t = t
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

// ---------- recusa de conteúdo ----------

export type Motivo = 'html' | 'link' | 'contato' | 'pix' | 'dados' | 'plataforma';

const TLDS =
  'com|net|org|edu|gov|mil|int|info|biz|br|pt|io|me|co|ly|gl|tv|cc|ws|to|link|app|dev|site|online|xyz|club|shop|store|top|tk|ml|ga|cf|gq|ai|us|uk|de|ar|fm|ee|gle|page|click|live|one|cloud|tech|vip|fun|win|bid|icu|cyou|rest|sbs|today|digital|cam|bio|day|zip|mov|ru|cn|su|pw|cx|in|at|be|eu|fr|it|es|nl|ch|jp|kr|id|vn|tr|ir|pk|ng|za|mx|cl|pe|uy|py|bo|ve|ec|cu|gt|hn|ni|pa|do|sv|cr|blog|pro|name|art|lat|sh|is|gg|so|ao|mz|bet|rio|news|ong|social|wiki|email|space|website|world|chat';

// "c o m", "b r": as letras do final separadas por espaço.
const espacadas = (tld: string): string => tld.split('').join(String.raw`\s*`);
const TLDS_ESPACADOS = TLDS.split('|').map(espacadas).join('|');

const LINK = [
  /\b(?:https?|ftp|sftp|ws|wss)\b/iu,
  /(?:^|[^\p{L}\p{N}])www(?:[^\p{L}\p{N}]|$)/iu,
  /\/\//u,
  /\b(?:javascript|vbscript)\s*:/iu,
  /\bdata\s*:\s*[a-z]+\/[a-z]/iu,
  /\b(?:ponto|dot)\s+(?:com|net|org|br|me|io)\b/iu,
  new RegExp(String.raw`[\p{L}\p{N}-]+\.(?:${TLDS})(?![\p{L}\p{N}])`, 'iu'),
  // "golpe . com", "golpe. com. br", "golpe . c o m": espaço no meio para enganar.
  new RegExp(String.raw`\s\.\s?(?:${TLDS})(?![\p{L}\p{N}])`, 'iu'),
  new RegExp(String.raw`\s\.\s*(?:${TLDS_ESPACADOS})(?![\p{L}\p{N}])`, 'iu'),
  new RegExp(String.raw`\.\s*(?:${TLDS})\s*\.\s*(?:${TLDS})(?![\p{L}\p{N}])`, 'iu'),
  // Qualquer "palavra.palavra/": endereço com caminho (encurtadores, domínios de qualquer país).
  /[\p{L}\p{N}-]+\.\p{L}{2,}\//u,
  // "bit,ly/abc": vírgula no lugar do ponto.
  /[\p{L}\p{N}-]+,\p{L}{2,}\//u,
];

// Pagamento sem a palavra PIX: dado bancário, boleto, depósito, pedido de pagamento. Só vale com número ou valor
// logo depois ("conta com a presença" e "nossa conta: 30 pessoas" passam). Texto já sem acento e em minúsculas.
const ENTRE = String.raw`(?:[^\p{L}\p{N}\n]|(?<!\p{L})(?:de|do|da|em|no|na|ate|valor|numero|n|rs|total)(?!\p{L})|(?<!\p{L})r\$)*`;
const INICIO = String.raw`(?<![\p{L}\p{N}])`;
const FIM = String.raw`(?![\p{L}\p{N}])`;
const PAGAMENTO = [
  new RegExp(
    `${INICIO}(?:agencia|conta\\s+corrente|conta\\s+poupanca|conta\\s+bancaria|c\\/c|boleto|deposito|transferencia|pague|pagar|pagamento)${FIM}${ENTRE}\\d`,
    'u',
  ),
  // Siglas curtas, que também são palavras comuns: só com número de 3+ dígitos ou valor em reais.
  new RegExp(`${INICIO}(?:ag|cc|ted|doc)${FIM}${ENTRE}(?:\\d{3}|r\\$\\s*\\d)`, 'u'),
];

const PIX = [
  /\bpix\b/iu,
  /\bpicpay\b/iu,
  /(?<![\p{L}\p{N}])p[\s.]?[i1l!][\s.]?x(?![\p{L}\p{N}])/iu,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/iu,
  /[^\s]{30,}/u,
  /\b(?=[a-z0-9]*\d)(?=[a-z0-9]*[a-z])[a-z0-9]{16,}\b/iu,
  ...PAGAMENTO,
];

// Evento se passando pela plataforma ou dizendo que ela o conferiu. Texto já sem acento e em minúsculas.
const PLATAFORMA = [
  // "Oficial" e "verificado" sozinhos são comuns ("lançamento oficial da feira"): só contam ligados ao site
  // ou ao próprio conteúdo ("evento verificado", "conteúdo oficial", "oficial do site").
  /(?<![\p{L}\p{N}])(?:oficia(?:l|is)|verificad[oa]s?)\s+(?:d[oa]|pel[oa])\s+(?:site|plataforma|projeto|sistema)(?![\p{L}\p{N}])/u,
  /(?<![\p{L}\p{N}])(?:conteudo|evento|link|pagina|anuncio)s?\s+(?:oficia(?:l|is)|verificad[oa]s?)(?![\p{L}\p{N}])/u,
  /(?<![\p{L}\p{N}])(?:conferid|aprovad|validad|certificad|homologad|autorizad)[oa]s?\s+(?:pel[oa]|por)\s+(?:site|plataforma|projeto|sistema|ferramenta)/u,
  /(?<![\p{L}\p{N}])pel[oa]\s+(?:site|plataforma)(?![\p{L}\p{N}])/u,
];

const escapar = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** O nome da plataforma aparece (nome completo em qualquer lugar; nome curto só se for o campo inteiro). */
function imitaPlataforma(t: string): boolean {
  const nome = paraConferir(NOME).trim().split(/\s+/).map(escapar).join('\\s+');
  const curto = paraConferir(NOME_CURTO).trim().split(/\s+/).map(escapar).join('\\s+');
  if (nome && new RegExp(`(?<![\\p{L}\\p{N}])${nome}(?![\\p{L}\\p{N}])`, 'u').test(t)) return true;
  if (curto && new RegExp(`^[^\\p{L}\\p{N}]*${curto}[^\\p{L}\\p{N}]*$`, 'u').test(t)) return true;
  return PLATAFORMA.some((re) => re.test(t));
}

// Letras de outros alfabetos que parecem latinas ("golpe.cоm" com "о" cirílico).
const PARECIDAS: Record<string, string> = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', у: 'y', х: 'x', і: 'i', ј: 'j', ѕ: 's', ԁ: 'd', һ: 'h', м: 'm', к: 'k', т: 't', н: 'h', в: 'b', ɡ: 'g',
  α: 'a', ο: 'o', ν: 'v', ρ: 'p', τ: 't', ι: 'i', κ: 'k', ε: 'e', β: 'b', υ: 'u', χ: 'x', η: 'n',
};

// Trechos que valem sozinhos (a "palavra" inteira, entre espaços) e não são telefone: data (dia até 31, mês
// até 12), período de anos, CEP e hora. Em sequência com outros números, não se tira nada.
const ISOLADO = new RegExp(
  '^(?:' +
    String.raw`(?:0?[1-9]|[12]\d|3[01])[./-](?:0?[1-9]|1[0-2])(?:[./-](?:(?:19|20)\d{2}|\d{2}))?` +
    '|' +
    String.raw`(?:19|20)\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])` +
    '|' +
    String.raw`(?:19|20)\d{2}[/-](?:(?:19|20)\d{2}|\d{2})` +
    '|' +
    String.raw`\d{5}-\d{3}` +
    '|' +
    String.raw`(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?` +
    ')$',
);
const PONTUACAO_DA_BORDA = /^[([{"'“‘]+|[)\]}"'”’,;:!?.]+$/g;

const OUTROS_DIGITOS = /[٠-٩۰-۹०-९০-৯]/g;
const MINIMO_DE_DIGITOS = 8;
// Dígitos separados por até 3 caracteres que não são letra, dígito nem quebra de linha ("98765 ‐ 4321", "9.8.7.6...").
const SEQUENCIA = /\d(?:[^\p{L}\d\n]{0,3}\d)*/gu;
// O mesmo, aceitando também "e"/"ou" entre os grupos ("Zap 98765 e 4321").
const SEQUENCIA_COM_LIGACAO = /\d(?:[^\p{L}\d\n]{0,3}\d|\s+(?:e|ou|mais)\s+\d)*/gu;
const PALAVRA_DE_CONTATO = /(?<![a-z])(?:zap|zapzap|whats|whatsapp|ligue|ligar|liga|contato|contate|tel|telefone|fone|cel|celular|chame|chama)(?![a-z])/;

const contaDigitos = (s: string): number => s.replace(/\D/g, '').length;

function temNumeroLongo(s: string): boolean {
  // Tira só o que é, sozinho, data, CEP ou hora; espaço no lugar para não juntar o que sobra com o que não é.
  const limpo = s
    .replace(/[^\S\n]+/g, ' ')
    .replace(/[^\s]+/g, (palavra) => (ISOLADO.test(palavra.replace(PONTUACAO_DA_BORDA, '')) ? ' ' : palavra));
  for (const m of limpo.matchAll(SEQUENCIA)) if (contaDigitos(m[0]) >= MINIMO_DE_DIGITOS) return true;
  // Com palavra de contato logo antes, "e"/"ou" também junta os grupos.
  for (const m of limpo.matchAll(SEQUENCIA_COM_LIGACAO)) {
    if (contaDigitos(m[0]) < MINIMO_DE_DIGITOS) continue;
    const inicio = m.index ?? 0;
    if (PALAVRA_DE_CONTATO.test(limpo.slice(Math.max(0, inicio - 40), inicio + m[0].length))) return true;
  }
  return false;
}

/**
 * Texto como a conferência o enxerga: letras de largura total e "。" viram as comuns (NFKC), invisíveis
 * somem, acentos somem (NFKD), letras de outros alfabetos que parecem latinas viram latinas, e os
 * disfarces "[dot]", "(.)", "·" e "[at]" voltam a ser "." e "@". Só serve para decidir; o que se mostra é outro texto.
 */
export function paraConferir(texto: string): string {
  return texto
    .normalize('NFKC')
    .replace(/[。｡]/g, '.')
    .replace(IGNORAVEIS, '')
    .replace(OUTROS_DIGITOS, (d) => String(d.charCodeAt(0) % 16 % 10))
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[Ͱ-ϿЀ-ӿɐ-ʯ]/g, (c) => PARECIDAS[c] ?? c)
    .replace(/[·•∙⋅・․]/g, '.')
    .replace(/\s*[[(]\s*(?:dot|ponto|\.)\s*[\])]\s*/g, '.')
    .replace(/\s*[[(]\s*(?:at|arroba)\s*[\])]\s*/g, '@')
    .replace(/\barroba\b/g, '@');
}

/**
 * Por que este texto não pode ir no conteúdo, ou null se pode. A conferência é feita sobre `paraConferir`,
 * para não ser enganada por disfarce (letras de largura total, invisíveis, alfabeto trocado, "[dot]").
 */
// Pedido de senha, dados de cartão, código recebido por mensagem ou documento: é assim que golpe começa.
// Texto já sem acento e em minúsculas. "Senha" sozinha é comum ("distribuição de senhas na entrada") e
// "cartão" também ("cartão do SUS", "cartão de vacina"): só contam ligados a banco, cartão de pagamento ou envio.
const B = String.raw`(?<![\p{L}\p{N}])`;
const F = String.raw`(?![\p{L}\p{N}])`;
const DADOS: readonly RegExp[] = [
  new RegExp(String.raw`${B}senhas?${F}.{0,40}${B}(cartao|cartoes|banco|bancari[oa]|pix)`, 'u'),
  new RegExp(String.raw`${B}(cartao|cartoes|banco|bancari[oa]|pix)${F}.{0,40}${B}senhas?${F}`, 'u'),
  new RegExp(String.raw`${B}(numero|numeros|dados|foto|fotos)\s+d[oe]s?\s+(seu\s+|teu\s+)?cartao\s+(de\s+(credito|debito)|do\s+banco|bancario)${F}`, 'u'),
  new RegExp(String.raw`${B}(cvv|cvc|codigo\s+de\s+seguranca|token)${F}`, 'u'),
  new RegExp(String.raw`${B}codigos?${F}.{0,30}${B}(sms|chegar|chegou|receber|recebeu|mensagem)${F}`, 'u'),
  new RegExp(String.raw`${B}(mande|mandem|manda|envie|enviem|envia|informe|informem|passe|passem|repasse)${F}.{0,40}${B}(cpf|rg|documento|documentos|senha|senhas|cartao|codigo)${F}`, 'u'),
];

export function motivoDeRecusa(texto: string): Motivo | null {
  const t = paraConferir(texto);
  if (/[<>]/.test(t) || /&#?\w+;/.test(t)) return 'html';
  if (/@\s*[\p{L}\p{N}_.]/u.test(t) || temNumeroLongo(t)) return 'contato';
  // "palavra.xx" sem espaço (letras minúsculas), como "centro.br": quase sempre é endereço de site.
  const semInvisiveis = texto.normalize('NFKC').replace(IGNORAVEIS, '');
  if (LINK.some((re) => re.test(t)) || /[\p{L}\p{N}]\.[a-z]{2,}(?![\p{L}\p{N}])/u.test(semInvisiveis)) return 'link';
  if (PIX.some((re) => re.test(t))) return 'pix';
  if (DADOS.some((re) => re.test(t))) return 'dados';
  if (imitaPlataforma(t)) return 'plataforma';
  return null;
}

export const MENSAGEM_DO_MOTIVO: Record<Motivo, string> = {
  dados: 'o evento não pode pedir senha, dados de cartão, código recebido por mensagem nem documento. É assim que muitos golpes começam.',
  html: 'não use os sinais < e > nem códigos como &amp; (o texto é mostrado como está, sem formatação).',
  link:
    'parece ter um link ou endereço de site. Por segurança, os eventos não aceitam links. Se foi só um ponto sem espaço depois, coloque um espaço.',
  contato:
    'parece ter telefone, e-mail, @ de rede social, CPF, CNPJ ou outro número comprido. Por segurança, os eventos não aceitam contatos. Escreva só o necessário (o endereço pode ir sem CEP).',
  pix: 'parece ter chave PIX, pagamento ou um código comprido. Por segurança, os eventos não aceitam pedido de pagamento nem chaves.',
  plataforma: 'o evento não pode dizer que é do site nem que foi conferido por ele. Tire o nome do site e frases como "evento verificado" ou "conferido pelo site".',
};
