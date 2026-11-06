// Validação do evento (puro, sem DOM). A MESMA função vale na criação (formulário) e na leitura (link
// recebido): quem altera o link na mão passa pelas mesmas regras de quem usa o formulário.
//
// Regras: data e hora reais; limite por campo; e recusa de texto com cara de link, telefone, chave PIX,
// e-mail, @ de rede social ou HTML. A lista é de propósito rígida: a página aparece no nosso domínio e
// não pode servir para golpe. Quando a regra erra para o lado de recusar (ex.: "Feira.Com todos" sem espaço),
// a mensagem diz o que mudar, com um exemplo (mensagemDaRecusa, em src/comum/conteudo.ts).

import { limparTexto, mensagemDaRecusa, motivoDeRecusa, type Motivo } from '../../comum/conteudo';

// A detecção de conteúdo proibido mora em src/comum/conteudo.ts (o Cards também a usa).
export { limparTexto, motivoDeRecusa, type Motivo };

export const CAMPOS = ['titulo', 'data', 'inicio', 'fim', 'local', 'descricao', 'organizacao'] as const;
export type CampoDoEvento = (typeof CAMPOS)[number];
export type Evento = Record<CampoDoEvento, string>;

/** Limite de letras por campo (títulos, local e organização combinam com src/comum/entreTelas.ts). */
export const LIMITES = { titulo: 80, local: 120, descricao: 400, organizacao: 60 } as const;

export const ANO_MINIMO = 2000;
export const ANO_MAXIMO = 2099;

export type Erros = Partial<Record<CampoDoEvento, string>>;
export type ResultadoDaValidacao = { ok: true; evento: Evento } | { ok: false; erros: Erros };

const NOMES: Record<'titulo' | 'local' | 'descricao' | 'organizacao', string> = {
  titulo: 'o título',
  local: 'o local',
  descricao: 'a descrição',
  organizacao: 'o nome da organização',
};

// ---------- texto ----------

/** Quantidade de letras como a pessoa conta (emoji vale um). */
export const tamanho = (s: string): number => Array.from(s).length;

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
    if (motivo) erros[campo] = `Confira ${NOMES[campo]}: ${mensagemDaRecusa(limpo, motivo)}`;
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
