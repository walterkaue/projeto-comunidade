// Validação do evento (puro, sem DOM). A MESMA função vale na criação (formulário) e na leitura (link
// recebido): quem altera o link na mão passa pelas mesmas regras de quem usa o formulário.
//
// Regras: data e hora reais; limite por campo; e recusa de texto com cara de link, telefone, chave PIX,
// e-mail, @ de rede social ou HTML. A lista é de propósito rígida: a página aparece no nosso domínio e
// não pode servir para golpe. Quando a regra erra para o lado de recusar (ex.: "Feira.Com todos" sem espaço),
// a mensagem diz o que mudar.

export const CAMPOS = ['titulo', 'data', 'inicio', 'fim', 'local', 'descricao', 'organizacao'] as const;
export type CampoDoEvento = (typeof CAMPOS)[number];
export type Evento = Record<CampoDoEvento, string>;

/** Limite de letras por campo (títulos, local e organização combinam com src/comum/entreTelas.ts). */
export const LIMITES = { titulo: 80, local: 120, descricao: 400, organizacao: 60 } as const;

export const ANO_MINIMO = 2000;
export const ANO_MAXIMO = 2099;

export type Erros = Partial<Record<CampoDoEvento, string>>;
export type ResultadoDaValidacao = { ok: true; evento: Evento } | { ok: false; erros: Erros };

export type Motivo = 'html' | 'link' | 'contato' | 'pix';

const NOMES: Record<'titulo' | 'local' | 'descricao' | 'organizacao', string> = {
  titulo: 'o título',
  local: 'o local',
  descricao: 'a descrição',
  organizacao: 'o nome da organização',
};

// ---------- limpeza ----------

// Invisíveis que servem para esconder link ou trocar a ordem do texto (zero-width, marcas de direção, tags,
// seletores, BOM...). Tudo que o Unicode marca como "ignorável" some. O ZWJ (200D) e o seletor de emoji (FE0F)
// ficam no texto mostrado, porque emoji de várias partes precisa deles; na hora de conferir, eles também somem.
const IGNORAVEIS = /[\p{Default_Ignorable_Code_Point}\u2800]/gu;
// Metade de emoji sem a outra metade: o navegador não sabe mostrar nem codificar em endereço.
const SOLTOS = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
const mantemNoTexto = (c: string): string => (c === '\u200D' || c === '\uFE0F' ? c : '');
const CONTROLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

/** Tira invisíveis e controles, junta espaços e (se `multilinha`) mantém no máximo uma linha em branco seguida. */
export function limparTexto(s: string, multilinha = false): string {
  let t = s.replace(/\r\n?/g, '\n').replace(CONTROLE, '').replace(SOLTOS, '').replace(IGNORAVEIS, mantemNoTexto);
  if (!multilinha) t = t.replace(/\n/g, ' ');
  t = t.replace(/[^\S\n]+/g, ' ');
  t = t
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

/** Quantidade de letras como a pessoa conta (emoji vale um). */
export const tamanho = (s: string): number => Array.from(s).length;

// ---------- recusa de conteúdo ----------

const TLDS =
  'com|net|org|edu|gov|mil|int|info|biz|br|pt|io|me|co|ly|gl|tv|cc|ws|to|link|app|dev|site|online|xyz|club|shop|store|top|tk|ml|ga|cf|gq|ai|us|uk|de|ar|fm|ee|gle|page|click|live|one|cloud|tech|vip|fun|win|bid|icu|cyou|rest|sbs|today|digital|cam|bio|day|zip|mov|ru|cn|su|pw|cx|in|at|be|eu|fr|it|es|nl|ch|jp|kr|id|vn|tr|ir|pk|ng|za|mx|cl|pe|uy|py|bo|ve|ec|cu|gt|hn|ni|pa|do|sv|cr|blog|pro|name|art|lat|sh|is|gg|so|ao|mz';

const LINK = [
  /\b(?:https?|ftp|sftp|ws|wss)\b/iu,
  /(?:^|[^\p{L}\p{N}])www(?:[^\p{L}\p{N}]|$)/iu,
  /\/\//u,
  /\b(?:javascript|vbscript)\s*:/iu,
  /\bdata\s*:\s*[a-z]+\/[a-z]/iu,
  /\b(?:ponto|dot)\s+(?:com|net|org|br|me|io)\b/iu,
  new RegExp(String.raw`[\p{L}\p{N}-]+\.(?:${TLDS})(?![\p{L}\p{N}])`, 'iu'),
  // "golpe . com", "golpe. com. br": espaço no meio para enganar.
  new RegExp(String.raw`\s\.\s?(?:${TLDS})(?![\p{L}\p{N}])`, 'iu'),
  new RegExp(String.raw`\.\s*(?:${TLDS})\s*\.\s*(?:${TLDS})(?![\p{L}\p{N}])`, 'iu'),
  // Qualquer "palavra.palavra/": endereço com caminho (encurtadores, domínios de qualquer país).
  /[\p{L}\p{N}-]+\.\p{L}{2,}\//u,
];

const PIX = [
  /\bpix\b/iu,
  /\bpicpay\b/iu,
  /(?<![\p{L}\p{N}])p[\s.]?[i1l!][\s.]?x(?![\p{L}\p{N}])/iu,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/iu,
  /[^\s]{30,}/u,
  /\b(?=[a-z0-9]*\d)(?=[a-z0-9]*[a-z])[a-z0-9]{16,}\b/iu,
];

// Letras de outros alfabetos que parecem latinas ("golpe.cоm" com "о" cirílico).
const PARECIDAS: Record<string, string> = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', у: 'y', х: 'x', і: 'i', ј: 'j', ѕ: 's', ԁ: 'd', һ: 'h', м: 'm', к: 'k', т: 't', н: 'h', в: 'b', ɡ: 'g',
  α: 'a', ο: 'o', ν: 'v', ρ: 'p', τ: 't', ι: 'i', κ: 'k', ε: 'e', β: 'b', υ: 'u', χ: 'x', η: 'n',
};

/** Data (dia/mês, com ou sem ano) e CEP formatado: não são telefone. Dia até 31, mês até 12. */
const DATA_CURTA = /(?<!\d)(?:0?[1-9]|[12]\d|3[01])[./-](?:0?[1-9]|1[0-2])(?:[./-](?:(?:19|20)\d{2}|\d{2}))?(?!\d)/g;
const DATA_ISO = /(?<!\d)(?:19|20)\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])(?!\d)/g;
const CEP = /(?<!\d)\d{5}-\d{3}(?!\d)/g;
/** Período escrito com dois anos ("2026/2027", "2026-27"). */
const ANOS = /(?<!\d)(?:19|20)\d{2}[/-](?:(?:19|20)\d{2}|\d{2})(?!\d)/g;

const OUTROS_DIGITOS = /[\u0660-\u0669\u06F0-\u06F9\u0966-\u096F\u09E6-\u09EF]/g;
// Celular com 5+4 dígitos separados por vírgula, barra, dois-pontos ou sublinhado ("99999/9999").
const CELULAR_SEPARADO = /(?<!\d)\d{5}[,:_/]\d{4}(?!\d)/;

function temNumeroLongo(s: string): boolean {
  if (CELULAR_SEPARADO.test(s)) return true;
  const limpo = s.replace(DATA_ISO, ' ').replace(DATA_CURTA, ' ').replace(ANOS, ' ').replace(CEP, ' ');
  // Dígitos com qualquer separador comum (espaço, ponto, hífen, travessão, barra, parênteses).
  for (const m of limpo.matchAll(/\+?\(?\d[\d\s().\-–—/]{6,}\d/g)) {
    if (m[0].replace(/\D/g, '').length >= 8) return true;
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
    .replace(/[\u0370-\u03ff\u0400-\u04ff\u0250-\u02af]/g, (c) => PARECIDAS[c] ?? c)
    .replace(/[·•∙⋅・․]/g, '.')
    .replace(/\s*[[(]\s*(?:dot|ponto|\.)\s*[\])]\s*/g, '.')
    .replace(/\s*[[(]\s*(?:at|arroba)\s*[\])]\s*/g, '@')
    .replace(/\barroba\b/g, '@');
}

/**
 * Por que este texto não pode ir no evento, ou null se pode. A conferência é feita sobre `paraConferir`,
 * para não ser enganada por disfarce (letras de largura total, invisíveis, alfabeto trocado, "[dot]").
 */
export function motivoDeRecusa(texto: string): Motivo | null {
  const t = paraConferir(texto);
  if (/[<>]/.test(t) || /&#?\w+;/.test(t)) return 'html';
  if (/@\s*[\p{L}\p{N}_.]/u.test(t) || temNumeroLongo(t)) return 'contato';
  // "palavra.xx" sem espaço (letras minúsculas), como "centro.br": quase sempre é endereço de site.
  const semInvisiveis = texto.normalize('NFKC').replace(IGNORAVEIS, '');
  if (LINK.some((re) => re.test(t)) || /[\p{L}\p{N}]\.[a-z]{2}(?![\p{L}\p{N}])/u.test(semInvisiveis)) return 'link';
  if (PIX.some((re) => re.test(t))) return 'pix';
  return null;
}

const MENSAGEM_DO_MOTIVO: Record<Motivo, string> = {
  html: 'não use os sinais < e > nem códigos como &amp; (o texto é mostrado como está, sem formatação).',
  link:
    'parece ter um link ou endereço de site. Por segurança, os eventos não aceitam links. Se foi só um ponto sem espaço depois, coloque um espaço.',
  contato:
    'parece ter telefone, e-mail, @ de rede social, CPF, CNPJ ou outro número comprido. Por segurança, os eventos não aceitam contatos. Escreva só o necessário (o endereço pode ir sem CEP).',
  pix: 'parece ter chave PIX, pagamento ou um código comprido. Por segurança, os eventos não aceitam pedido de pagamento nem chaves.',
};

// ---------- data e hora ----------

const DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** A data existe no calendário (nada de 30/02) e o ano é razoável. */
export function dataValida(s: string): boolean {
  const m = DATA.exec(s);
  if (!m) return false;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (ano < ANO_MINIMO || ano > ANO_MAXIMO) return false;
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

export const horaValida = (s: string): boolean => HORA.test(s);

const minutos = (hora: string): number => {
  const m = HORA.exec(hora);
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
};

// ---------- validação ----------

const texto = (v: unknown): string | null => (typeof v === 'string' ? v : null);

/**
 * Valida o que veio do formulário ou do link. Sempre devolve algo (nunca lança erro), com os textos já
 * limpos. As mensagens não repetem o que a pessoa escreveu.
 */
export function validarEvento(entrada: unknown): ResultadoDaValidacao {
  const bruto = (entrada ?? {}) as Record<string, unknown>;
  const erros: Erros = {};
  const evento = {} as Evento;

  const campoTexto = (
    campo: 'titulo' | 'local' | 'descricao' | 'organizacao',
    obrigatorio: boolean,
    multilinha = false,
  ): void => {
    const original = bruto[campo] === undefined || bruto[campo] === null ? '' : texto(bruto[campo]);
    if (original === null) {
      erros[campo] = `Confira ${NOMES[campo]}: o formato não é de texto.`;
      evento[campo] = '';
      return;
    }
    const limpo = limparTexto(original, multilinha);
    evento[campo] = limpo;
    if (!limpo) {
      if (obrigatorio) erros[campo] = `Preencha ${NOMES[campo]}.`;
      return;
    }
    const n = tamanho(limpo);
    if (n > LIMITES[campo]) {
      erros[campo] = `Use no máximo ${LIMITES[campo]} letras em ${NOMES[campo]} (agora são ${n}).`;
      return;
    }
    const motivo = motivoDeRecusa(limpo);
    if (motivo) erros[campo] = `Confira ${NOMES[campo]}: ${MENSAGEM_DO_MOTIVO[motivo]}`;
  };

  const campoHora = (campo: 'inicio' | 'fim', obrigatorio: boolean): void => {
    const v = bruto[campo] === undefined || bruto[campo] === null ? '' : texto(bruto[campo]);
    const limpo = (v ?? '').trim();
    evento[campo] = limpo;
    if (v === null || (limpo && !horaValida(limpo))) {
      erros[campo] = campo === 'inicio' ? 'Escolha uma hora de início válida.' : 'Escolha uma hora de fim válida.';
    } else if (!limpo && obrigatorio) {
      erros[campo] = 'Escolha a hora de início.';
    }
  };

  campoTexto('titulo', true);

  const data = bruto.data === undefined || bruto.data === null ? '' : texto(bruto.data);
  const dataLimpa = (data ?? '').trim();
  evento.data = dataLimpa;
  if (!dataLimpa) erros.data = 'Escolha a data.';
  else if (!dataValida(dataLimpa)) erros.data = `Escolha uma data que exista, entre os anos ${ANO_MINIMO} e ${ANO_MAXIMO}.`;

  campoHora('inicio', true);
  campoHora('fim', false);
  if (!erros.inicio && !erros.fim && evento.fim && minutos(evento.fim) === minutos(evento.inicio)) {
    erros.fim = 'A hora de fim não pode ser igual à de início. Se não souber, deixe em branco.';
  }

  campoTexto('local', true);
  campoTexto('descricao', false, true);
  campoTexto('organizacao', false);

  return Object.keys(erros).length ? { ok: false, erros } : { ok: true, evento };
}
