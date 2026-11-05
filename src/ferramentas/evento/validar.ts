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

// Invisíveis que servem para esconder link ou trocar a ordem do texto (zero-width, marcas de direção, BOM).
// O ZWJ (200D) e o seletor de emoji (FE0F) ficam: emoji com várias partes precisa deles.
const INVISIVEIS = /[­͏؜ᅟᅠ឴឵᠋-᠎​‌‎‏‪-‮⁠-⁯ㅤ︀-︎﻿ﾠ￹-￻]/g;
const CONTROLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

/** Tira invisíveis e controles, junta espaços e (se `multilinha`) mantém no máximo uma linha em branco seguida. */
export function limparTexto(s: string, multilinha = false): string {
  let t = s.replace(/\r\n?/g, '\n').replace(CONTROLE, '').replace(INVISIVEIS, '');
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
  'com|net|org|edu|gov|mil|int|info|biz|br|pt|io|me|co|ly|gl|tv|cc|ws|to|link|app|dev|site|online|xyz|club|shop|store|top|tk|ml|ga|cf|gq|ai|us|uk|de|ar|fm|ee|page|click|live|one|cloud|tech|vip|fun|win|bid|icu|cyou|rest|sbs|today|digital|cam|bio|day|zip|mov';

const LINK = [
  /\b(?:https?|ftp|sftp|ws|wss)\b/iu,
  /(?:^|[^\p{L}\p{N}])www(?:[^\p{L}\p{N}]|$)/iu,
  /\/\//u,
  /\b(?:javascript|vbscript)\s*:/iu,
  /\bdata\s*:\s*[a-z]+\/[a-z]/iu,
  /\b(?:ponto|dot)\s+(?:com|net|org|br|me|io)\b/iu,
  new RegExp(`[\\p{L}\\p{N}-]+\\.(?:${TLDS})(?![\\p{L}\\p{N}])`, 'iu'),
];

const PIX = [
  /\bpix\b/iu,
  /\bpicpay\b/iu,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/iu,
  /[^\s]{30,}/u,
  /\b(?=[a-z0-9]*\d)(?=[a-z0-9]*[a-z])[a-z0-9]{16,}\b/iu,
];

/** Datas escritas no texto ("14-11-2026", "2026-11-14") e CEP formatado não são telefone. */
function semDatasECep(s: string): string {
  return s
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b\d{1,2}[.-]\d{1,2}[.-]\d{2,4}\b/g, ' ')
    .replace(/\b\d{5}-\d{3}\b/g, ' ');
}

function temNumeroLongo(s: string): boolean {
  for (const m of semDatasECep(s).matchAll(/\+?\(?\d[\d\s().-]{6,}\d/g)) {
    if (m[0].replace(/\D/g, '').length >= 8) return true;
  }
  return false;
}

/**
 * Por que este texto não pode ir no evento, ou null se pode. A conferência olha o texto em NFKC
 * (letras de largura total, pontos "。", etc. viram os comuns) para não ser enganada por disfarce.
 */
export function motivoDeRecusa(texto: string): Motivo | null {
  // NFKC já troca "．" de largura total por "."; o ponto ideográfico "。" precisa de ajuda.
  const t = texto.normalize('NFKC').replace(/[。｡]/g, '.');
  if (/[<>]/.test(t) || /&#?\w+;/.test(t)) return 'html';
  if (/@\s*[\p{L}\p{N}_.]/u.test(t) || temNumeroLongo(t)) return 'contato';
  if (LINK.some((re) => re.test(t))) return 'link';
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
  if (!erros.inicio && !erros.fim && evento.fim && minutos(evento.fim) <= minutos(evento.inicio)) {
    erros.fim = 'A hora de fim precisa ser depois da hora de início. Se não souber, deixe em branco.';
  }

  campoTexto('local', true);
  campoTexto('descricao', false, true);
  campoTexto('organizacao', false);

  return Object.keys(erros).length ? { ok: false, erros } : { ok: true, evento };
}
