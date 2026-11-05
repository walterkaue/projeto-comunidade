// Denúncia (puro, sem DOM). Regra do produto (docs/produto.md 4.1): o formulário pede a descrição do problema
// e mostra uma revisão antes de enviar. Nada é guardado: o texto só existe na tela e no e-mail que a pessoa manda.
//
// Três caminhos para enviar, porque nem todo aparelho tem aplicativo de e-mail configurado (no computador o
// "mailto:" muitas vezes não abre nada): aplicativo de e-mail, Gmail no navegador, ou copiar e colar.

import { EMAIL_CONTATO } from '../comum/marca';

export const ASSUNTO_DA_DENUNCIA = 'Denúncia de conteúdo';

/** Tipos de problema, na ordem das Regras de uso (src/paginas/textos/regras.ts). */
export const TIPOS_DE_PROBLEMA = [
  { valor: '', texto: 'Escolha uma opção' },
  { valor: 'ofensa', texto: 'Ofensa, humilhação ou perseguição' },
  { valor: 'odio', texto: 'Discurso de ódio ou discriminação' },
  { valor: 'ameaca', texto: 'Ameaça ou incentivo à violência' },
  { valor: 'mentira', texto: 'Mentira comprovada' },
  { valor: 'golpe', texto: 'Golpe, ou pedido de dinheiro ou de dados' },
  { valor: 'dados', texto: 'Dados de outras pessoas sem permissão' },
  { valor: 'autoral', texto: 'Direito autoral ou uso de marca' },
  { valor: 'crianca', texto: 'Conteúdo sexual com criança ou adolescente' },
  { valor: 'personificacao', texto: 'Finge ser outra pessoa, organização ou órgão público' },
  { valor: 'meu', texto: 'É um conteúdo meu e quero que saia' },
  { valor: 'outro', texto: 'Outro motivo' },
] as const;

export type TipoDeProblema = Exclude<(typeof TIPOS_DE_PROBLEMA)[number]['valor'], ''>;

export const LIMITES_DA_DENUNCIA = { onde: 300, descricao: 1000, descricaoMinima: 10 } as const;

export interface Denuncia {
  /** Link de evento deste site, já validado (pode ser vazio: denúncia de outro conteúdo). */
  link: string;
  /** Onde está o conteúdo, quando não veio link. */
  onde: string;
  tipo: string;
  descricao: string;
}

export type ErrosDaDenuncia = Partial<Record<'onde' | 'tipo' | 'descricao', string>>;

// Também troca "metade de emoji" solta (surrogate sem par) por �: encodeURIComponent daria erro com ela.
const limpar = (s: string) =>
  s
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '�')
    .replace(/\r\n?/g, '\n')
    .trim();

/** O que falta ou passa do limite. Vazio = pode revisar e enviar. */
export function validarDenuncia(d: Denuncia): ErrosDaDenuncia {
  const erros: ErrosDaDenuncia = {};
  const onde = limpar(d.onde);
  const descricao = limpar(d.descricao);
  if (!d.link && !onde) erros.onde = 'diga onde está o conteúdo (o link ou uma descrição).';
  if (onde.length > LIMITES_DA_DENUNCIA.onde) erros.onde = `use até ${LIMITES_DA_DENUNCIA.onde} letras.`;
  if (!TIPOS_DE_PROBLEMA.some((t) => t.valor && t.valor === d.tipo)) erros.tipo = 'escolha o tipo de problema.';
  if (descricao.length < LIMITES_DA_DENUNCIA.descricaoMinima) erros.descricao = 'conte o que há de errado, com pelo menos uma frase.';
  else if (descricao.length > LIMITES_DA_DENUNCIA.descricao) erros.descricao = `use até ${LIMITES_DA_DENUNCIA.descricao} letras.`;
  return erros;
}

const textoDoTipo = (tipo: string) => TIPOS_DE_PROBLEMA.find((t) => t.valor && t.valor === tipo)?.texto ?? 'Não informado';

/** Corpo do e-mail, igual ao que a pessoa revisa na tela. */
export function corpoDaDenuncia(d: Denuncia): string {
  const onde = d.link ? `Link denunciado:\n${d.link}` : `Onde está o conteúdo:\n${limpar(d.onde)}`;
  return `${onde}\n\nTipo de problema:\n${textoDoTipo(d.tipo)}\n\nO que há de errado:\n${limpar(d.descricao)}\n`;
}

/** "mailto:" com assunto e corpo codificados. */
export function mailtoDeDenuncia(d: Denuncia, email: string = EMAIL_CONTATO): string {
  return `mailto:${email}?subject=${encodeURIComponent(ASSUNTO_DA_DENUNCIA)}&body=${encodeURIComponent(corpoDaDenuncia(d))}`;
}

/** Gmail no navegador, já com destinatário, assunto e corpo (para quem não tem aplicativo de e-mail). */
export function gmailDeDenuncia(d: Denuncia, email: string = EMAIL_CONTATO): string {
  const p = new URLSearchParams({ view: 'cm', fs: '1', to: email, su: ASSUNTO_DA_DENUNCIA, body: corpoDaDenuncia(d) });
  return `https://mail.google.com/mail/?${p.toString()}`;
}

/** Texto para copiar e colar em qualquer e-mail: destinatário, assunto e corpo. */
export function textoParaCopiar(d: Denuncia, email: string = EMAIL_CONTATO): string {
  return `Para: ${email}\nAssunto: ${ASSUNTO_DA_DENUNCIA}\n\n${corpoDaDenuncia(d)}`;
}
