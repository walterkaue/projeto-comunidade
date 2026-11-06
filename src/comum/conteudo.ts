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
  // Endereço "data:" só com tipo de arquivo de verdade ("data:text/html", "data:image/png", "data:,"): "Data:
  // sáb/dom" é dia da semana (B-14).
  /\bdata\s*:\s*(?:(?:text|image|application|audio|video|font|model|multipart|message)\s*\/|[;,])/iu,
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
  new RegExp(`${INICIO}(?:ag|cc)${FIM}${ENTRE}(?:\\d{3}|r\\$\\s*\\d)`, 'u'),
  // "Doc" e "Ted" também são nome ("Mostra Doc 2026", "Festa do Ted 2026"; B-09): só com valor em reais ou com
  // número de conta (5 algarismos ou mais, como "TED 12345-6").
  new RegExp(`${INICIO}(?:ted|doc)${FIM}${ENTRE}(?:r\\$\\s*\\d|\\d(?:[.\\-\\s]?\\d){4,})`, 'u'),
];

// A palavra PIX (e PicPay), com ou sem separador entre as letras. Fica barrada mesmo sem chave, até em nome de
// evento ("Festa do Pix"): decisão D2 da simulação de 06/11/2026.
const PIX_PALAVRA = [/\bpix\b/iu, /\bpicpay\b/iu, /(?<![\p{L}\p{N}])p[\s.\-_*]?[i1l!][\s.\-_*]?x(?![\p{L}\p{N}])/iu];

// Chave aleatória ou código comprido. Linha só de traços ou de enfeite não é código (B-09).
const CODIGO = [
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/iu,
  /(?<!\S)(?=\S*[\p{L}\p{N}])\S{30,}/u,
  /\b(?=[a-z0-9]*\d)(?=[a-z0-9]*[a-z])[a-z0-9]{16,}\b/iu,
];

// Hashtag feita só de letras, com até 4 algarismos no fim ("#EncontroDosMoradores2026"): não é código (B-09).
// Chave aleatória tem algarismos no meio e não cabe aqui.
const HASHTAG = /(?<![\p{L}\p{N}])#\p{L}+\d{0,4}(?![\p{L}\p{N}])/gu;

const temPix = (t: string): boolean => PIX_PALAVRA.some((re) => re.test(t));
const temPagamento = (t: string): boolean => PAGAMENTO.some((re) => re.test(t));
const temCodigo = (t: string): boolean => {
  const semHashtag = t.replace(HASHTAG, ' ');
  return CODIGO.some((re) => re.test(semHashtag));
};

// Evento se passando pela plataforma ou dizendo que ela o conferiu. Texto já sem acento e em minúsculas.
const escapar = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ANTES = String.raw`(?<![\p{L}\p{N}])`;
const DEPOIS = String.raw`(?![\p{L}\p{N}])`;
// Entre as palavras do nome: nada, espaço, ponto, hífen ou outro sinal ("Projeto-Comunidade", "P.Comunidade").
const JUNTA = String.raw`[^\p{L}\p{N}]*`;
// O nome é nosso (marca.ts): basta tirar acento e pôr em minúsculas, como paraConferir faz.
const palavrasDoNome = (s: string): string[] =>
  s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(escapar);
const NOME_P = palavrasDoNome(NOME);
const CURTO_P = palavrasDoNome(NOME_CURTO);
// O nome inteiro; a primeira palavra pode vir só com a inicial ("P.Comunidade", "P Comunidade"). B-07.
const NOME_RE = NOME_P.map((p, i) => (i < NOME_P.length - 1 ? `(?:${p}|${p.charAt(0)})` : p)).join(JUNTA);
const CURTO_RE = CURTO_P.join(JUNTA);
// "Este site" depois de "do/da": o nome curto, o nome inteiro, ou só a primeira palavra do nome sem outra
// palavra depois ("pelo site do projeto"). "Projeto da horta" e "escola" são de outro dono.
const ESTE_SITE = `(?:${CURTO_RE}${DEPOIS}|${NOME_RE}${DEPOIS}|${NOME_P[0] ?? CURTO_RE}${DEPOIS}(?!\\s+\\p{L}))`;
// "Site da escola", "plataforma da prefeitura": site de outro dono não conta (B-10).
const DE_OUTRO = String.raw`(?!\s+d[aeo]s?\s+(?!${ESTE_SITE})\p{L})`;
const VERIFICOU = '(?:conferid|checad|aprovad|verificad|validad|certificad|homologad|autorizad|confirmad|garantid|removid)[oa]s?';

const PLATAFORMA = [
  // "Oficial" e "verificado" sozinhos são comuns ("lançamento oficial da feira"): só contam ligados ao site
  // ou ao próprio conteúdo ("evento verificado", "conteúdo oficial", "oficial do site"). "Oficial do projeto
  // da horta" e "oficial do site da escola" falam de outro dono (B-10).
  new RegExp(
    `${ANTES}(?:oficia(?:l|is)|verificad[oa]s?)\\s+(?:d[oa]|pel[oa])\\s+(?:(?:site|plataforma|sistema)${DEPOIS}${DE_OUTRO}|${NOME_P[0] ?? 'projeto'}${DEPOIS}(?!\\s+(?!${CURTO_RE}${DEPOIS})\\p{L}))`,
    'u',
  ),
  new RegExp(`${ANTES}(?:conteudo|evento|link|pagina|anuncio)s?\\s+(?:oficia(?:l|is)|verificad[oa]s?)${DEPOIS}`, 'u'),
  new RegExp(`${ANTES}(?:conferid|aprovad|validad|certificad|homologad|autorizad)[oa]s?\\s+(?:pel[oa]|por)\\s+(?:site|plataforma|projeto|sistema|ferramenta)`, 'u'),
  new RegExp(`${ANTES}pel[oa]\\s+(?:site|plataforma)${DEPOIS}${DE_OUTRO}`, 'u'),
  // "Este evento foi conferido", "conteúdo checado", "evento aprovado" (B-07). "Evento aprovado em assembleia"
  // e "aprovado pela diretoria" dizem quem aprovou e não é o site: passam.
  new RegExp(
    `${ANTES}(?:conteudo|evento|link|pagina|anuncio|convite)s?(?:\\s+(?:foi|foram|ja|esta|estao|e|sao|sera|serao|tambem|devidamente|totalmente|todo|todos)){0,3}\\s+${VERIFICOU}${DEPOIS}` +
      String.raw`(?!\s+(?:pel[oa]s?|por|em|na|no|nas|nos|d[aeo]s?|durante|com)\s+(?!(?:site|plataforma|sistema|moderacao|moderadores?)${DEPOIS})\p{L})`,
    'u',
  ),
  // "Checado pela equipe do site", "aprovado pela moderação" (B-07): quem conferiu é o site.
  new RegExp(`${ANTES}${VERIFICOU}\\s+(?:pel[oa]s?|por)\\s+(?:\\p{L}+\\s+){0,3}(?:site|plataforma|sistema|moderacao|moderadores?)${DEPOIS}${DE_OUTRO}`, 'u'),
  new RegExp(`${ANTES}selo\\s+(?:de\\s+)?(?:verificacao|verificado)${DEPOIS}`, 'u'),
];

// Frases do aviso da página do evento e da tela de link removido (src/ferramentas/evento/pagina.ts e
// removido.ts), comparadas sem pontuação: quem copia a faixa faz parecer que o site conferiu (B-07). Um teste
// em endurecimento.test.ts confere que a faixa de pagina.ts continua barrada.
const FRASES_DO_SITE = new RegExp(
  `${ANTES}(?:` +
    [
      'criado por quem enviou',
      'quem enviou este link',
      'nao confere nem guarda',
      'nunca faca pagamento',
      'segundo quem criou o link',
      'removido apos denuncia',
      'removido a pedido de quem o criou',
      'removemos este link',
    ].join('|') +
    `)${DEPOIS}`,
  'u',
);

/** O nome da plataforma aparece (nome completo em qualquer lugar; nome curto só se for o campo inteiro). */
const NOME_EM_QUALQUER_LUGAR = new RegExp(`${ANTES}${NOME_RE}${DEPOIS}`, 'u');
const CURTO_SOZINHO = new RegExp(`^[^\\p{L}\\p{N}]*${CURTO_RE}[^\\p{L}\\p{N}]*$`, 'u');

function imitaPlataforma(t: string): boolean {
  if (NOME_RE && NOME_EM_QUALQUER_LUGAR.test(t)) return true;
  if (CURTO_RE && CURTO_SOZINHO.test(t)) return true;
  if (FRASES_DO_SITE.test(t.replace(/[^\p{L}\p{N}]+/gu, ' '))) return true;
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

// Texto honesto que, junto, parece número comprido (B-08). Só vale quando o texto não tem palavra de contato:
// com "zap", "ligue", "contato"..., fica a regra de antes, mais rígida (um telefone disfarçado de horário,
// "ligue 23:45-23:59", continua barrado).
// - Faixa de horário ou de datas numa palavra só: "19:30-21:00", "10/11-15/11".
const HORA_SO = String.raw`(?:[01]?\d|2[0-3]):[0-5]\d`;
const DATA_SO = String.raw`(?:0?[1-9]|[12]\d|3[01])[./](?:0?[1-9]|1[0-2])(?:[./](?:(?:19|20)\d{2}|\d{2}))?`;
const FAIXA = new RegExp(`^(?:${HORA_SO}[-–—]${HORA_SO}|${DATA_SO}[-–—]${DATA_SO})$`);
// - Lista com vírgula: 3 ou mais números do mesmo tamanho (até 4 algarismos), em ordem crescente e de 1 a 10
//   em 10 ("Dias 10, 11, 12, 13", "Salas 101, 102, 103", "Dias 10, 17, 24, 31"). Telefone partido com vírgula
//   ("11, 91234, 5678", "12, 34, 56, 78") não fica assim.
const LISTA = /(?<![\p{L}\p{N}.,/:-])\d{1,4}(?:\s*,\s*\d{1,4}){2,}(?!\p{N}|[.,/:-]\d)/gu;
const SALTO_MAXIMO_DA_LISTA = 10;
function ehListaEmOrdem(trecho: string): boolean {
  const partes = trecho.split(/\s*,\s*/);
  const tamanho = partes[0]!.length;
  return partes.every((p, i) => {
    if (p.length !== tamanho) return false;
    if (i === 0) return true;
    const salto = Number(p) - Number(partes[i - 1]);
    return salto > 0 && salto <= SALTO_MAXIMO_DA_LISTA;
  });
}

function temNumeroLongo(texto: string): boolean {
  const rigido = PALAVRA_DE_CONTATO.test(texto);
  // Tira só o que é, sozinho, data, CEP ou hora; espaço no lugar para não juntar o que sobra com o que não é.
  let limpo = texto
    .replace(/[^\S\n]+/g, ' ')
    .replace(/[^\s]+/g, (palavra) => {
      const p = palavra.replace(PONTUACAO_DA_BORDA, '');
      return ISOLADO.test(p) || (!rigido && FAIXA.test(p)) ? ' ' : palavra;
    });
  if (!rigido) limpo = limpo.replace(LISTA, (l) => (ehListaEmOrdem(l) ? ' ' : l));
  for (const m of limpo.matchAll(SEQUENCIA)) if (contaDigitos(m[0]) >= MINIMO_DE_DIGITOS) return true;
  // Com palavra de contato logo antes, "e"/"ou" também junta os grupos.
  for (const m of limpo.matchAll(SEQUENCIA_COM_LIGACAO)) {
    if (contaDigitos(m[0]) < MINIMO_DE_DIGITOS) continue;
    const inicio = m.index ?? 0;
    if (PALAVRA_DE_CONTATO.test(limpo.slice(Math.max(0, inicio - 40), inicio + m[0].length))) return true;
  }
  return false;
}

// Letras de enfeite que o NFKC não desfaz (B-27): letras de bandeira (🇵🇮🇽), letras em quadrado ou círculo
// cheio (🅿🅸🆇, 🅟) e letras entre parênteses (🄟, ⒫). Viram letras comuns.
const letraDesde = (inicio: number) => (c: string) => String.fromCharCode(97 + c.codePointAt(0)! - inicio);
function letrasDeEnfeite(s: string): string {
  return (
    s
      // Duas letras de bandeira certas viram bandeira (🇧🇷), não palavra: ficam entre espaços para não
      // grudar no texto em volta ("Brasil.🇧🇷" não vira "brasil.br").
      .replace(/[\u{1F1E6}-\u{1F1FF}]+/gu, (l) => ` ${Array.from(l, letraDesde(0x1f1e6)).join('')} `)
      .replace(/[\u{1F110}-\u{1F129}]/gu, letraDesde(0x1f110))
      .replace(/[\u{1F130}-\u{1F149}]/gu, letraDesde(0x1f130))
      .replace(/[\u{1F150}-\u{1F169}]/gu, letraDesde(0x1f150))
      .replace(/[\u{1F170}-\u{1F189}]/gu, letraDesde(0x1f170))
      .replace(/[⒜-⒵]/g, letraDesde(0x249c))
  );
}

/**
 * Texto como a conferência o enxerga: letras de largura total e "。" viram as comuns (NFKC), letras de
 * bandeira e de enfeite viram letras, invisíveis somem, acentos somem (NFKD), letras de outros alfabetos que
 * parecem latinas viram latinas, e os disfarces "[dot]", "(.)", "·" e "[at]" voltam a ser "." e "@". Só serve
 * para decidir; o que se mostra é outro texto.
 */
export function paraConferir(texto: string): string {
  return letrasDeEnfeite(texto)
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
// "Banco" de coisa ("banco de alimentos", "banco de sangue", "banco da praça") não é banco de dinheiro (B-10).
// "Banco do Brasil" e "banco digital" continuam contando.
const BANCO = String.raw`(?:banco(?!\s+d[eoa]s?\s+(?:alimentos?|sangue|leite|roupas?|livros?|sementes?|horas?|tempo|talentos?|brinquedos?|racao|agasalhos?|doacoes?|praca|jardim|madeira|cimento|concreto)${F})|bancari[oa])`;
// "Passe na portaria com documento com foto" é ir à portaria levando o documento, não mandar o documento (B-10).
// Só vale para "passe/passem" + lugar + "com documento", sem outro dado depois; "passe no privado" não conta.
const PASSE_NA_PORTARIA = String.raw`(?!\s+(?:n[ao]s?|pel[ao]s?|em|aqui|ali|la)\s+(?!(?:privado|pv|inbox|direct|dm|zap|whats|whatsapp|chat|mensagem)${F})[^\n]{0,40}?${B}com\s+(?:(?:o|a|os|as|seu|sua|seus|suas|um|uma)\s+)?documentos?${F}(?![^\n]{0,40}${B}(?:cpf|rg|senhas?|cartao|codigo)${F}))`;
const DADOS: readonly RegExp[] = [
  new RegExp(String.raw`${B}senhas?${F}.{0,40}${B}(cartao|cartoes|${BANCO}|pix)`, 'u'),
  new RegExp(String.raw`${B}(cartao|cartoes|${BANCO}|pix)${F}.{0,40}${B}senhas?${F}`, 'u'),
  new RegExp(String.raw`${B}(numero|numeros|dados|foto|fotos)\s+d[oe]s?\s+(seu\s+|teu\s+)?cartao\s+(de\s+(credito|debito)|do\s+banco|bancario)${F}`, 'u'),
  new RegExp(String.raw`${B}(cvv|cvc|codigo\s+de\s+seguranca|token)${F}`, 'u'),
  new RegExp(String.raw`${B}codigos?${F}.{0,30}${B}(sms|chegar|chegou|receber|recebeu|mensagem)${F}`, 'u'),
  new RegExp(String.raw`${B}(mande|mandem|manda|envie|enviem|envia|informe|informem|repasse|passem?${F}${PASSE_NA_PORTARIA})${F}.{0,40}${B}(cpf|rg|documento|documentos|senha|senhas|cartao|codigo)${F}`, 'u'),
];

/** O motivo, olhando o texto como está (`t` já passou por paraConferir). */
function motivoNoTexto(t: string, texto: string): Motivo | null {
  if (/[<>]/.test(t) || /&#?\w+;/.test(t)) return 'html';
  // Telefone partido em linhas ("Chame no zap" / "11" / "91234" / "5678") também conta (B-06).
  if (/@\s*[\p{L}\p{N}_.]/u.test(t) || temNumeroLongo(t) || (t.includes('\n') && temNumeroLongo(t.replace(/\s*\n\s*/g, ' ')))) {
    return 'contato';
  }
  // "palavra.xx" sem espaço (letras minúsculas), como "centro.br": quase sempre é endereço de site.
  const semInvisiveis = texto.normalize('NFKC').replace(IGNORAVEIS, '');
  if (LINK.some((re) => re.test(t)) || /[\p{L}\p{N}]\.[a-z]{2,}(?![\p{L}\p{N}])/u.test(semInvisiveis)) return 'link';
  if (temPix(t) || temPagamento(t) || temCodigo(t)) return 'pix';
  if (DADOS.some((re) => re.test(t))) return 'dados';
  if (imitaPlataforma(t)) return 'plataforma';
  return null;
}

export function motivoDeRecusa(texto: string): Motivo | null {
  return motivoNoTexto(paraConferir(texto), texto);
}

// ---------- órgão público ----------

// Nomes de órgão público. Texto já sem acento e em minúsculas (paraConferir). "Receita" sozinha só conta no
// singular e sem "de/do/da" depois ("receita de bolo" e "troca de receitas" não contam).
const SEP = String.raw`[^\p{L}\p{N}]*`;
const ORGAO_PUBLICO = new RegExp(
  `${B}(?:` +
    [
      'prefeituras?',
      `defesa${SEP}civil`,
      'governos?',
      'inss',
      `receita${SEP}federal`,
      String.raw`receita(?!\s+d[eoa]s?${F})`,
      'policias?',
      `banco${SEP}central`,
      'ministerios?',
      'secretarias?',
    ].join('|') +
    `)${F}`,
  'u',
);

/**
 * O texto cita um órgão público (Prefeitura, Defesa Civil, Governo, INSS, Receita Federal, Polícia, Banco
 * Central, Ministério, Secretaria)? Com ou sem acento, em qualquer caixa e com os mesmos disfarces que
 * `paraConferir` desfaz. NÃO barra nada: "reunião com a Prefeitura" é honesto. Serve para o Pronto perguntar
 * antes de mandar se o convite fala em nome de um órgão (simulação B, 06/11/2026, B-01).
 */
export function citaOrgaoPublico(texto: string): boolean {
  return ORGAO_PUBLICO.test(paraConferir(texto));
}

// Mensagens de recusa (WCAG 3.3.3): dizem o que trocar, com um exemplo curto, sem acusar quem escreveu.
// Começam em minúscula: validar.ts põe "Confira o título: " antes.
const PEDIDO: Record<Motivo, string> = {
  dados: 'o evento não pode pedir senha, cartão, código recebido por mensagem nem documento. Tire esse pedido.',
  html: 'não use os sinais < e > nem códigos como &amp;.',
  link: 'parece ter um link ou endereço de site, e o evento não aceita links. Tire o endereço.',
  contato: 'parece ter telefone, e-mail, @ ou outro número comprido, e o evento não aceita contato. Tire esse trecho.',
  pix: 'parece ter pagamento, chave ou código comprido, e o evento não aceita isso. Tire esse trecho.',
  plataforma: 'o evento não pode usar o nome deste site nem dizer que foi conferido por ele. Tire o nome do site e frases como "evento verificado".',
};
const EXEMPLO: Record<Motivo, string> = {
  dados: 'Se é para levar documento, escreva "traga documento com foto".',
  html: 'Escreva com palavras, como em "menos de 12 anos".',
  link: 'Se foi um ponto sem espaço depois, coloque um espaço, como em "Av. das Flores".',
  contato: 'Se for lista, separe com "e", como em "salas 101 e 102".',
  pix: 'Se for preço, escreva só o valor, como em "Entrada: R$ 10".',
  plataforma: 'Se fala do site de outro lugar, diga de quem, como em "site da escola".',
};
const MOTIVOS = Object.keys(PEDIDO) as Motivo[];
export const MENSAGEM_DO_MOTIVO = Object.fromEntries(MOTIVOS.map((m) => [m, `${PEDIDO[m]} ${EXEMPLO[m]}`])) as Record<Motivo, string>;

/** A mensagem de recusa com o exemplo que mais ajuda para este texto (horário, CEP, Pix, senha...). */
export function mensagemDaRecusa(texto: string, motivo: Motivo): string {
  const t = paraConferir(texto);
  const base = MENSAGEM_DO_MOTIVO[motivo];
  const trocarExemplo = (frase: string): string => `${PEDIDO[motivo]} ${frase}`;
  switch (motivo) {
    case 'contato':
      if (/\d{1,2}:\d{2}/.test(t)) return trocarExemplo('Se for horário, escreva 19h30 às 21h.');
      if (/(?<![\p{L}\p{N}])cep(?![\p{L}\p{N}])/u.test(t) || /(?<!\d)0\d{7}(?!\d)/.test(t)) {
        return trocarExemplo('Escreva o CEP com hífen ou tire o CEP, como em "CEP 01234-567".');
      }
      if (/\d{1,2}\/\d{1,2}\s*[-–—]\s*\d/.test(t)) return trocarExemplo('Se for período, escreva "de 10/11 a 15/11".');
      if (t.includes('@')) return trocarExemplo('Se o @ quer dizer "em", escreva a palavra, como em "Sarau na praça".');
      return base;
    case 'pix':
      if (temPix(t)) return 'o site não aceita a palavra Pix, nem em nome de evento. Troque a palavra.';
      if (temPagamento(t)) return `o evento não aceita pedido de pagamento nem dado de banco. Tire esse trecho. ${EXEMPLO.pix}`;
      return 'parece ter um código ou chave comprida, e o evento não aceita isso. Tire o código ou separe as palavras com espaço.';
    case 'dados':
      if (/(?<![\p{L}\p{N}])senhas?(?![\p{L}\p{N}])/u.test(t)) return trocarExemplo('Se é senha de atendimento, escreva ficha.');
      if (/(?<![\p{L}\p{N}])token(?![\p{L}\p{N}])/u.test(t)) return trocarExemplo('Se é ficha de entrada, escreva ficha.');
      return base;
    case 'link':
      if (!/[\p{L}\p{N}]\.\p{L}/u.test(t) && /\p{L}\/\p{L}/u.test(t)) {
        return trocarExemplo('Se a barra separa palavras, troque por "e", como em "sábado e domingo".');
      }
      return base;
    case 'plataforma':
      if (FRASES_DO_SITE.test(t.replace(/[^\p{L}\p{N}]+/gu, ' '))) {
        return 'o evento não pode repetir o aviso do site. Tire essa frase: o site já mostra o aviso em cima do evento.';
      }
      return base;
    default:
      return base;
  }
}
