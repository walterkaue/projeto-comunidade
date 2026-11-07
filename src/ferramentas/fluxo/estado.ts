// Fluxo único (docs/produto.md 7.6): o modelo puro, sem DOM. As telas (index.ts e vizinhos) só leem e mudam
// estes dados. Os motores de antes continuam valendo: desenho e textos do card (../cards), validação e formato
// do evento (../evento), convocação e ata (../reuniao).
//
// Privacidade: os dados do fluxo ficam só na memória da aba (memoria.ts). O endereço leva só o tipo e o passo
// ("#/fazer/evento/2"), nunca o que a pessoa digitou. O único link com dados é o do evento, que já existia,
// e ele passa pela mesma validação de sempre (validarEvento). Presença e ata nunca entram aqui.

import { ehLinkDoEvento, MODELOS_DE_CARD, TAMANHO_MAXIMO, type DadosDoCard, type ModeloDeCard } from '../../comum/entreTelas';
import { linkPara, type Rota } from '../../comum/rotas';
import { letras } from '../../comum/texto';
import { citaOrgaoPublico } from '../../comum/conteudo';
import { exemplo, proximoSabado } from '../cards/exemplos';
import { aplicarLimites, FORMATOS, type CamposDoCard, type Formato } from '../cards/modelos';
import { PALETAS } from '../cards/paletas';
import { onde, quando } from '../cards/textos';
import { validarEvento, type Evento } from '../evento/validar';
import { pautaPreenchida, type Convocacao } from '../reuniao/convocacao';

export { MODELOS_DE_CARD as TIPOS, type ModeloDeCard as Tipo };

// ---------- dados ----------

/** De onde vieram os dados: ainda sem mexer ('novo'), link de evento ou o que a pessoa escreveu. */
export type Origem = 'novo' | 'link' | 'pessoa';

export interface DadosDoFluxo {
  tipo: ModeloDeCard;
  /** Vira 'pessoa' quando ela muda um campo dos passos 1 e 2 (de 'novo'); 'link' continua 'link'. */
  origem: Origem;
  /** Só com origem 'link': o que do evento não coube aqui (oQueFicouDeFora). Texto fixo, nada digitado. */
  ficouDeFora: string;
  // passo 1
  titulo: string;
  organizacao: string;
  /** Texto curto do card (todos os tipos menos reunião). */
  texto: string;
  /** Pauta da reunião: um item por linha. */
  pauta: string;
  // passo 2
  /** AAAA-MM-DD ou vazio. */
  data: string;
  /** HH:MM ou vazio. */
  hora: string;
  local: string;
  // passo 3
  formato: Formato;
  paletaId: string;
  /** Cor da faixa quando paletaId é "livre" (#rrggbb). */
  corLivre: string;
  rodape: boolean;
  /**
   * Link de evento que já existia (veio da página do evento ou de "criar outro a partir deste"). Só vale enquanto
   * os campos do evento não mudarem (assinaturaDoLink); depois, o Pronto gera um link novo.
   */
  link: string;
  assinaturaDoLink: string;
  /** O link guardado é o que veio com o evento recebido (não um que o Pronto gerou). */
  linkOriginal?: boolean;
  /**
   * O exemplo desta vez do rodízio: só ilustração (placeholder dos campos e miniatura dos passos 1 e 2, por
   * comExemplo). NUNCA entra no evento, na assinatura, no texto, no card do passo 3 e do Pronto, no link, no nome
   * do arquivo, no endereço nem em armazenamento.
   */
  exemplo: CamposDoExemplo;
  /**
   * Combinações campo + texto que a pessoa já confirmou que não falam em nome de órgão público (confirmarOrgao).
   * Só na memória da aba; NUNCA entra no evento, na assinatura, no texto, no link nem no endereço.
   */
  orgaoConfirmado?: string[];
}

/** O que o exemplo ilustra: os campos dos passos 1 e 2 (dia e hora entram só na miniatura, nunca como placeholder). */
export interface CamposDoExemplo {
  titulo: string;
  organizacao: string;
  texto: string;
  pauta: string;
  data: string;
  hora: string;
  local: string;
}

/** Sem exemplo ainda (dados de link, antes de memoria.ts tirar um do rodízio). */
export const SEM_EXEMPLO: CamposDoExemplo = Object.freeze({ titulo: '', organizacao: '', texto: '', pauta: '', data: '', hora: '', local: '' });

/** O exemplo está todo vazio (dados de link que ainda não ganharam o da vez)? */
export const exemploVazio = (e: CamposDoExemplo): boolean => Object.values(e).every((v) => v === '');

export const LIMITES = {
  titulo: TAMANHO_MAXIMO.titulo,
  organizacao: TAMANHO_MAXIMO.organizacao,
  texto: TAMANHO_MAXIMO.texto,
  local: TAMANHO_MAXIMO.local,
  /** Itens da pauta e letras por item (as mesmas da convocação). */
  itensDaPauta: 20,
  itemDaPauta: 120,
  /** Descrição do link do evento (validar.ts). */
  descricao: 400,
} as const;

/** Nome de cada formato na tela do fluxo ("Conversa" passa a se chamar "Grupo"). */
export const NOME_DO_FORMATO: Record<Formato, string> = { status: 'Status', conversa: 'Grupo', cartaz: 'Cartaz' };
export const EXPLICACAO_DO_FORMATO: Record<Formato, string> = {
  status: 'Tela cheia, para o Status do WhatsApp',
  conversa: 'Quadrado, para mandar no grupo',
  cartaz: 'Folha A4, para imprimir e pôr no mural',
};
export { FORMATOS };

/** O que aparece em cada porta da página inicial (src/paginas/inicio.ts tem a cópia leve destes textos). */
export const PORTAS: Record<ModeloDeCard, { verbo: string; exemplos: string }> = {
  reuniao: { verbo: 'Chamar para uma reunião', exemplos: 'Assembleia, encontro, plenária' },
  evento: { verbo: 'Divulgar um evento', exemplos: 'Mutirão, festa, culto, ato, curso' },
  aviso: { verbo: 'Dar um aviso', exemplos: 'Mudança, lembrete, recado' },
  resultado: { verbo: 'Contar uma conquista', exemplos: 'O que o grupo conseguiu' },
  agradecimento: { verbo: 'Agradecer', exemplos: 'A quem ajudou' },
};

/** Reunião e evento têm dia, hora e local obrigatórios e ganham o link do evento. */
export const temAgenda = (tipo: ModeloDeCard): boolean => tipo === 'reuniao' || tipo === 'evento';

/** Aviso e agradecimento podem pular o passo 2 (docs/produto.md 7.6). */
export const podePularOPasso2 = (tipo: ModeloDeCard): boolean => tipo === 'aviso' || tipo === 'agradecimento';

/** Campos do passo 2 de cada tipo. Sem agenda, o card só mostra o dia (cards/modelos.ts: usaHora e usaLocal). */
export const camposDoPasso2 = (tipo: ModeloDeCard): readonly ('data' | 'hora' | 'local')[] =>
  temAgenda(tipo) ? ['data', 'hora', 'local'] : ['data'];

/** Título do passo 2 de cada tipo. */
export const tituloDoPasso2 = (tipo: ModeloDeCard): string => (temAgenda(tipo) ? 'Quando e onde' : 'Quando');

// ---------- exemplos ----------

/** Pauta de cada exemplo de reunião (mesma ordem dos exemplos de cards/exemplos.ts: uma por tipo de organização). */
const PAUTAS: readonly string[][] = [
  ['Limpeza do córrego', 'Horário da coleta de lixo', 'Contas do ano'],
  ['Calendário de atividades', 'Relatório de contas'],
  ['Encontros do próximo mês', 'Festa de fim de ano'],
  ['Agenda do bairro', 'Divisão de tarefas'],
  ['Agenda de ensaios', 'Divulgação da estreia'],
  ['Balanço do semestre', 'Novas frentes de trabalho'],
  ['Calendário escolar', 'Merenda', 'Reforma do pátio'],
];

/**
 * O exemplo número `indice` do rodízio (qualquer inteiro; dá a volta): o tipo de organização e a pauta da reunião são
 * `indice mod 7`; o nome da organização é decidido em cards/exemplos.ts. Tudo fictício. Só ilustra (comExemplo).
 */
export function exemploDoRodizio(tipo: ModeloDeCard, indice: number, hoje: Date = new Date()): CamposDoExemplo {
  const n = ((Math.trunc(indice) % PAUTAS.length) + PAUTAS.length) % PAUTAS.length;
  const e = exemplo(tipo, Math.trunc(indice), hoje);
  return {
    titulo: e.titulo,
    organizacao: e.organizacao,
    texto: tipo === 'reuniao' ? '' : e.texto,
    pauta: tipo === 'reuniao' ? PAUTAS[n]!.join('\n') : '',
    data: e.data,
    hora: e.hora,
    local: e.local,
  };
}

/** Dados novos de um tipo: todos os campos de texto, o dia e a hora vazios; só o exemplo do rodízio vem junto. */
export function dadosNovos(tipo: ModeloDeCard, exemploDaVez: CamposDoExemplo): DadosDoFluxo {
  return {
    tipo,
    origem: 'novo',
    ficouDeFora: '',
    titulo: '',
    organizacao: '',
    texto: '',
    pauta: '',
    data: '',
    hora: '',
    local: '',
    ...APARENCIA_PADRAO,
    link: '',
    assinaturaDoLink: '',
    exemplo: exemploDaVez,
  };
}

const CAMPOS_DO_EXEMPLO = ['titulo', 'organizacao', 'texto', 'pauta', 'data', 'hora', 'local'] as const;

/**
 * Uma CÓPIA dos dados com o exemplo nos campos vazios (sem contar os espaços das pontas), para a miniatura e a prévia
 * maior dos passos 1 e 2. Os dados de entrada não mudam. Não use em mais nenhum lugar.
 */
export function comExemplo(d: DadosDoFluxo): DadosDoFluxo {
  const copia = { ...d };
  for (const c of CAMPOS_DO_EXEMPLO) if (d[c].trim() === '' && d.exemplo[c] !== '') copia[c] = d.exemplo[c];
  return copia;
}

/** A miniatura está usando o exemplo em algum campo (um campo vazio que o exemplo preencheria)? */
export const faltaAlgo = (d: DadosDoFluxo): boolean => CAMPOS_DO_EXEMPLO.some((c) => d[c].trim() === '' && d.exemplo[c] !== '');

const APARENCIA_PADRAO = { formato: 'conversa' as Formato, paletaId: PALETAS[0]!.id, corLivre: '#3d6b73', rodape: true };

/**
 * Dados que outra tela preparou na memória da aba (prepararCard, já conferidos por conferirDadosDoCard).
 * Guarda o link que veio junto (já conferido como link de evento do próprio site) e a assinatura dos dados como
 * chegaram. Enquanto a pessoa não muda nada, o Pronto usa o link original, que leva o evento inteiro e é o que pode
 * ser denunciado e bloqueado. Mudou algum campo, sai um link novo.
 */
export function dadosDoCardPreparado(d: DadosDoCard): DadosDoFluxo | null {
  if (!d.modelo || !d.titulo) return null;
  const tipo = d.modelo;
  const dados: DadosDoFluxo = {
    tipo,
    origem: 'link',
    ficouDeFora: '',
    titulo: d.titulo,
    organizacao: d.organizacao ?? '',
    texto: tipo === 'reuniao' ? '' : (d.texto ?? ''),
    pauta: tipo === 'reuniao' ? pautaDoTextoDoCard(d.texto ?? '') : '',
    data: d.data ?? '',
    hora: d.hora ?? '',
    local: d.local ?? '',
    ...APARENCIA_PADRAO,
    link: '',
    assinaturaDoLink: '',
    exemplo: SEM_EXEMPLO,
  };
  if (d.link && temAgenda(tipo)) {
    dados.link = d.link;
    dados.assinaturaDoLink = assinatura(dados);
    dados.linkOriginal = true;
  }
  return dados;
}

/** "Pauta: a; b; c" (texto do card da convocação) volta a ser um item por linha. */
function pautaDoTextoDoCard(texto: string): string {
  return texto
    .replace(/^Pauta:\s*/i, '')
    .replace(/…$/, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
}

/** Dados de um evento aberto por "criar outro a partir deste" (já validado por abrirEvento). */
export function dadosDoEvento(e: Evento, link: string, base: string): DadosDoFluxo {
  const dados: DadosDoFluxo = {
    tipo: 'evento',
    origem: 'link',
    ficouDeFora: oQueFicouDeFora(e),
    titulo: e.titulo,
    organizacao: e.organizacao,
    texto: cortar(textoDoEvento(e), LIMITES.texto),
    pauta: '',
    data: e.data,
    hora: e.inicio,
    local: e.local,
    ...APARENCIA_PADRAO,
    link: '',
    assinaturaDoLink: '',
    exemplo: SEM_EXEMPLO,
  };
  // O link de antes segue valendo enquanto a pessoa não muda nada, mesmo que hora de fim, quebras de linha ou
  // descrição longa tenham ficado de fora do card: é ele que leva o evento inteiro e pode ser denunciado.
  if (ehLinkDoEvento(link, base)) {
    dados.link = link;
    dados.assinaturaDoLink = assinatura(dados);
    dados.linkOriginal = true;
  }
  return dados;
}

/** Texto do evento depois de juntar linhas e espaços, como entra no campo "Texto curto". */
const textoDoEvento = (e: Pick<Evento, 'descricao'>): string => e.descricao.replace(/\s+/g, ' ').trim();

/**
 * O que um evento aberto por "criar outro a partir deste" tem e o fluxo não leva: a hora de fim e a parte da
 * descrição que passa do texto curto. Vazio quando coube tudo. Texto fixo, para a nota do passo 1. Sem mudança, o
 * link original segue valendo e leva o evento inteiro; a nota diz isso.
 */
export function oQueFicouDeFora(e: Pick<Evento, 'fim' | 'descricao'>): string {
  const fim = !!e.fim;
  const descricao = letras(textoDoEvento(e)).length > LIMITES.texto;
  if (fim && descricao) return 'A hora de fim e parte da descrição não cabem na imagem. Sem mudança, o link continua levando o evento inteiro.';
  if (fim) return 'A hora de fim não cabe na imagem. Sem mudança, o link continua levando o evento inteiro.';
  if (descricao) return 'Parte da descrição não cabe na imagem. Sem mudança, o link continua levando o evento inteiro.';
  return '';
}

export const NOTA_DO_LINK = 'Estes dados vieram de um link de evento. Confira tudo antes de mandar.';
export const avisoDoLinkNoPronto = (tipo: ModeloDeCard): string =>
  `O link leva título, dia, hora, local e ${tipo === 'reuniao' ? 'a pauta' : 'o texto'}. Quem receber pode repassar.`;

/** Frase do Pronto sobre o link: se ele é o original de um evento recebido, diz isso; senão, a de sempre. */
export const FRASE_DO_LINK_ORIGINAL =
  'O link é o mesmo do evento que você recebeu e leva tudo o que está nele. Quem receber pode repassar.';
export const fraseDoLinkNoPronto = (d: DadosDoFluxo): string =>
  d.origem === 'link' && d.linkOriginal && linkAindaVale(d) ? FRASE_DO_LINK_ORIGINAL : avisoDoLinkNoPronto(d.tipo);

const DICA_DO_PASSO: Record<1 | 2 | 3, string> = {
  1: 'Escreva com as suas palavras. O que está em cinza é só exemplo.',
  2: 'Escolha o dia num toque ou abra o calendário.',
  3: 'Escolha onde vai mandar e a cor. O resto já está pronto.',
};

/**
 * Nota e dica do alto de cada passo. Dados de link: a nota "Confira tudo" (com o que ficou de fora, só no passo 1)
 * vem no passo 1, no lugar da dica, e no passo 3, acima da dica. O passo 2 e os dados que não são de link só têm dica.
 */
export function notaEDicaDoPasso(
  d: Pick<DadosDoFluxo, 'origem' | 'ficouDeFora'>,
  passo: 1 | 2 | 3,
): { nota: string; dica: string } {
  const doLink = d.origem === 'link' && (passo === 1 || passo === 3);
  const nota = doLink ? [NOTA_DO_LINK, passo === 1 ? d.ficouDeFora : ''].filter(Boolean).join(' ') : '';
  return { nota, dica: passo === 1 && doLink ? '' : DICA_DO_PASSO[passo] };
}
export const PERGUNTA_DA_TROCA_DO_RASCUNHO = 'Trocar o que você estava fazendo pelos dados deste evento?';

/** A pessoa mudou um campo dos passos 1 e 2: os dados passam a ser dela. Dados de link continuam de link. */
export function marcarMudanca(d: Pick<DadosDoFluxo, 'origem'>): void {
  if (d.origem === 'novo') d.origem = 'pessoa';
}

// ---------- apagar tudo e desfazer (passo 1) ----------

/** "Apagar tudo" no passo 1: limpa título, organização, texto e pauta. O local (passo 2), o dia e a hora ficam. */
export function apagarOPasso1(d: DadosDoFluxo): void {
  d.titulo = d.organizacao = d.texto = d.pauta = '';
}

type CamposDoPasso1 = Pick<DadosDoFluxo, 'titulo' | 'organizacao' | 'texto' | 'pauta'>;

/** Título, organização, texto e pauta estão vazios (ou só espaços)? Então não há o que apagar. */
export const passo1Vazio = (d: CamposDoPasso1): boolean => ![d.titulo, d.organizacao, d.texto, d.pauta].some((t) => t.trim() !== '');

export const ROTULO_APAGAR = 'Apagar tudo';
/** Nome do botão que desfaz o "Apagar tudo" (D7). Fica até a pessoa escrever de novo ou sair do passo (sem relógio). */
export const ROTULO_DESFAZER = 'Desfazer';

/** Aviso falado depois de apagar. */
export const AVISO_DE_APAGAR = 'Tudo apagado. Para trazer de volta, toque em Desfazer.';

/**
 * O botão da linha da dica, no passo 1: "Apagar tudo" só aparece com algum campo escrito; com a cópia guardada ele
 * vira "Desfazer". Sem texto e sem cópia, some.
 */
export function botaoDeApagar(d: CamposDoPasso1, comCopia: boolean): { rotulo: string; escondido: boolean } {
  return comCopia ? { rotulo: ROTULO_DESFAZER, escondido: false } : { rotulo: ROTULO_APAGAR, escondido: passo1Vazio(d) };
}

/** O passo 1 como estava antes de apagar. Fica só com quem chamou (memória da aba); nada vai para armazenamento. */
export interface CopiaDoPasso1 {
  titulo: string;
  organizacao: string;
  texto: string;
  pauta: string;
  origem: Origem;
}

export const copiaDoPasso1 = (d: DadosDoFluxo): CopiaDoPasso1 => ({
  titulo: d.titulo,
  organizacao: d.organizacao,
  texto: d.texto,
  pauta: d.pauta,
  origem: d.origem,
});

/** Desfaz apagarOPasso1: devolve os campos e a origem de antes. */
export function devolverOPasso1(d: DadosDoFluxo, copia: CopiaDoPasso1): void {
  d.titulo = copia.titulo;
  d.organizacao = copia.organizacao;
  d.texto = copia.texto;
  d.pauta = copia.pauta;
  d.origem = copia.origem;
}

// ---------- órgão público (D1) ----------

export const PERGUNTA_DO_ORGAO =
  'Este convite fala em nome de um órgão público? O site não é para comunicado oficial, e fingir ser órgão público é contra as regras.';

/** A pergunta (em negrito no painel) e o resto do texto, palavra por palavra como em PERGUNTA_DO_ORGAO. */
export function perguntaDoOrgaoEmPartes(): { pergunta: string; resto: string } {
  const i = PERGUNTA_DO_ORGAO.indexOf('?') + 1;
  return { pergunta: PERGUNTA_DO_ORGAO.slice(0, i), resto: PERGUNTA_DO_ORGAO.slice(i).trim() };
}

/** O texto de cada campo que o passo confere (a pauta vira os itens, um por linha). */
function textoDoCampo(d: DadosDoFluxo, campo: CampoDoFluxo): string {
  if (campo === 'pauta') return itensDaPauta(d.pauta).join('\n');
  if (campo === 'titulo' || campo === 'organizacao' || campo === 'texto' || campo === 'local') return d[campo].trim();
  return '';
}

const chaveDoOrgao = (d: DadosDoFluxo, campo: CampoDoFluxo): string => `${campo}\u0000${textoDoCampo(d, campo)}`;

/**
 * Campos do passo que citam um órgão público (citaOrgaoPublico; só diz se cita, não barra), na ordem da tela.
 * Passo 1: título, organização e texto (pauta, na reunião). Passo 2: local, só em reunião e evento.
 */
export function camposComOrgao(d: DadosDoFluxo, passo: 1 | 2): CampoDoFluxo[] {
  const quais: CampoDoFluxo[] =
    passo === 1 ? ['titulo', 'organizacao', d.tipo === 'reuniao' ? 'pauta' : 'texto'] : temAgenda(d.tipo) ? ['local'] : [];
  return quais.filter((c) => citaOrgaoPublico(textoDoCampo(d, c)));
}

/** Há campo que cita órgão e ainda não foi confirmado com este mesmo texto? */
export const precisaPerguntarDoOrgao = (d: DadosDoFluxo, passo: 1 | 2): boolean =>
  camposComOrgao(d, passo).some((c) => !d.orgaoConfirmado?.includes(chaveDoOrgao(d, c)));

/**
 * No Pronto de dados de link ("Fazer a imagem deste evento", "Criar outro") a pessoa não passou pelos passos 1 e 2,
 * então a pergunta do órgão público vem aqui: igual para todos (só para origem 'link' e se algum campo cita órgão e
 * ainda não foi confirmado).
 */
export const perguntarDoOrgaoNoPronto = (d: DadosDoFluxo): boolean =>
  d.origem === 'link' && (precisaPerguntarDoOrgao(d, 1) || precisaPerguntarDoOrgao(d, 2));

/** Confirmar no Pronto vale pelos dois passos que foram pulados. */
export function confirmarOrgaoNoPronto(d: DadosDoFluxo): void {
  confirmarOrgao(d, 1);
  confirmarOrgao(d, 2);
}

/** A pessoa disse que o convite não é de órgão público: não pergunta de novo para estes textos. Texto novo, pergunta de novo. */
export function confirmarOrgao(d: DadosDoFluxo, passo: 1 | 2): void {
  const lista = (d.orgaoConfirmado ??= []);
  for (const c of camposComOrgao(d, passo)) {
    const chave = chaveDoOrgao(d, c);
    if (!lista.includes(chave)) lista.push(chave);
  }
}

// ---------- dia que já passou (C-09) ----------

export const AVISO_DIA_PASSADO = 'Esse dia já passou. Está certo?';

/** O dia (AAAA-MM-DD) é antes de hoje, pela data local? Hoje não passou. Data inválida ou vazia: não. */
export function diaJaPassou(iso: string, hoje: Date = new Date()): boolean {
  return dataBr(iso) !== '' && iso < isoDe(hoje);
}

// ---------- endereços do fluxo ----------

export type Passo = 1 | 2 | 3 | 'pronto';

/** "#/fazer/evento", "#/fazer/evento/2", "#/fazer/evento/3", "#/fazer/evento/pronto". Nunca leva dados. */
export function enderecoDoPasso(tipo: ModeloDeCard, passo: Passo): string {
  return linkPara('fazer', passo === 1 ? tipo : `${tipo}/${passo}`);
}

export type Destino =
  | { tipo: 'passo'; modelo: ModeloDeCard; passo: Passo }
  /** Abrir um evento para criar outro a partir dele (os dados passam por abrirEvento: bloqueio e validação). */
  | { tipo: 'editar'; dados: string }
  /** "#/cards": abre o que outra tela preparou na memória da aba; sem nada preparado, volta ao início. */
  | { tipo: 'preparado' }
  | { tipo: 'redirecionar'; para: string };

const ehTipo = (s: string): s is ModeloDeCard => (MODELOS_DE_CARD as readonly string[]).includes(s);
const EDITAR = 'editar/';

/** Para onde vai cada endereço que abre o fluxo (src/comum/rotas.ts, parteDaRota = 'fluxo'). */
export function lerDestino(rota: Rota): Destino {
  const inicio: Destino = { tipo: 'redirecionar', para: linkPara('inicio') };
  switch (rota.nome) {
    case 'cards':
      return { tipo: 'preparado' };
    case 'reuniao':
      return { tipo: 'redirecionar', para: enderecoDoPasso('reuniao', 1) };
    case 'evento':
      if (rota.resto.startsWith(EDITAR)) return { tipo: 'editar', dados: rota.resto.slice(EDITAR.length) };
      return { tipo: 'redirecionar', para: enderecoDoPasso('evento', 1) };
    case 'fazer': {
      if (rota.resto.startsWith(`evento/${EDITAR}`)) return { tipo: 'editar', dados: rota.resto.slice(`evento/${EDITAR}`.length) };
      const [tipo, passo, ...sobra] = rota.resto.split('/');
      if (!tipo || !ehTipo(tipo) || sobra.length) return inicio;
      if (passo === undefined) return { tipo: 'passo', modelo: tipo, passo: 1 };
      if (passo === '2' || passo === '3') return { tipo: 'passo', modelo: tipo, passo: Number(passo) as 2 | 3 };
      if (passo === 'pronto') return { tipo: 'passo', modelo: tipo, passo: 'pronto' };
      return { tipo: 'redirecionar', para: enderecoDoPasso(tipo, 1) };
    }
    default:
      return inicio;
  }
}

/** Passo seguinte. */
export function proximoPasso(passo: Passo): Passo {
  return passo === 1 ? 2 : passo === 2 ? 3 : 'pronto';
}

/** Passo anterior (o Pronto volta ao 3; o 1 não tem anterior: Voltar leva ao início). */
export function passoAnterior(passo: Passo): Passo | null {
  return passo === 'pronto' ? 3 : passo === 3 ? 2 : passo === 2 ? 1 : null;
}

/**
 * Primeiro passo que ainda tem o que corrigir antes de chegar a `passo` (quem abre um endereço de passo direto
 * não pode pular o que falta). Nulo quando pode abrir.
 */
export function passoPendente(d: DadosDoFluxo, passo: Passo): 1 | 2 | null {
  if (passo !== 1 && Object.keys(errosDoPasso(d, 1)).length) return 1;
  if ((passo === 3 || passo === 'pronto') && Object.keys(errosDoPasso(d, 2)).length) return 2;
  return null;
}

// ---------- datas no formato brasileiro ----------

const p2 = (n: number) => String(n).padStart(2, '0');
const isoDe = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

function existe(a: number, m: number, d: number): boolean {
  const t = new Date(Date.UTC(a, m - 1, d));
  return t.getUTCFullYear() === a && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** "2026-11-14" → "14/11/2026". Inválida volta vazia. */
export function dataBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m || !existe(Number(m[1]), Number(m[2]), Number(m[3]))) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/**
 * O dia que a pessoa escreveu → "AAAA-MM-DD". Aceita "14/11/2026", "14/11/26", "14/11", "14-11-2026", "14.11"
 * e "14112026". Sem ano, vale o deste ano; se esse dia já passou, o do ano que vem.
 * Vazio volta vazio; o que não for data volta null.
 */
export function lerDataBr(texto: string, hoje: Date = new Date()): string | null {
  const t = texto.trim();
  if (!t) return '';
  let d: number, m: number, a: number | undefined;
  const so = /^(\d{2})(\d{2})(\d{4}|\d{2})?$/.exec(t);
  const sep = /^(\d{1,2})\s*[/.\-]\s*(\d{1,2})(?:\s*[/.\-]\s*(\d{4}|\d{2}))?$/.exec(t);
  const r = so ?? sep;
  if (!r) return null;
  d = Number(r[1]);
  m = Number(r[2]);
  if (r[3] !== undefined) a = r[3].length === 2 ? 2000 + Number(r[3]) : Number(r[3]);
  if (a === undefined) {
    a = hoje.getFullYear();
    const hojeIso = isoDe(hoje);
    if (existe(a, m, d) && `${a}-${p2(m)}-${p2(d)}` < hojeIso) a += 1;
  }
  if (a < 2000 || a > 2099 || !existe(a, m, d)) return null;
  return `${a}-${p2(m)}-${p2(d)}`;
}

/** Atalhos do passo 2. */
export function atalhosDoDia(hoje: Date = new Date()): { rotulo: string; data: string }[] {
  const amanha = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
  return [
    { rotulo: 'Hoje', data: isoDe(hoje) },
    { rotulo: 'Amanhã', data: isoDe(amanha) },
    { rotulo: 'Próximo sábado', data: proximoSabado(hoje) },
  ];
}

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/** "2026-11-14" → "sábado, 14/11/2026" (confirmação embaixo do campo). Inválida volta vazia. */
export function diaPorExtenso(iso: string): string {
  const br = dataBr(iso);
  if (!br) return '';
  const [a, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]}, ${br}`;
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/**
 * "2026-11-14" → "sábado, 14 de novembro" (embaixo do campo de data). O ano só aparece se não for o ano de `hoje`
 * ("sábado, 14 de novembro de 2027"). Inválida volta vazia.
 */
export function diaPorExtensoCurto(iso: string, hoje: Date = new Date()): string {
  if (!dataBr(iso)) return '';
  const [a, m, d] = iso.split('-').map(Number) as [number, number, number];
  const dia = DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
  return `${dia}, ${d} de ${MESES[m - 1]}${a === hoje.getFullYear() ? '' : ` de ${a}`}`;
}

/** O atalho está escolhido? É quando o dia escrito (ou escolhido no calendário) é o dele; sem dia, nenhum. */
export const atalhoEscolhido = (atalho: { data: string }, dia: string): boolean => dia !== '' && atalho.data === dia;

/** Como o campo de dia guarda o que veio de `<input type="date">`: só um dia que existe (AAAA-MM-DD); o resto vira vazio. */
export const diaDoCalendario = (valor: string): string => (dataBr(valor) ? valor : '');

// ---------- textos dos passos 1 e 2 ----------

export const DICA_DA_ORGANIZACAO = 'O nome da organização, não de pessoas. Nome de criança ou adolescente nunca.';
export const DICA_DA_PAUTA = 'Um assunto por linha. Sem nome de pessoa.';
export const DICA_DO_LOCAL = 'Como se fosse procurar no mapa. Se for numa casa, não ponha o nome de quem mora.';
/** Quadro do link da reunião: a frase em negrito e o resto. */
export const AVISO_DO_LINK_TITULO = 'Título, local e pauta vão no link.';
export const AVISO_DO_LINK_RESTO = 'Quem receber pode repassar. Não escreva nome de pessoa nem assunto que só o grupo pode saber.';

// ---------- validação por passo ----------

export type CampoDoFluxo = 'titulo' | 'organizacao' | 'texto' | 'pauta' | 'data' | 'hora' | 'local';
export type ErrosDoFluxo = Partial<Record<CampoDoFluxo, string>>;

/** Itens da pauta (um por linha, sem vazios). */
export const itensDaPauta = (pauta: string): string[] => pautaPreenchida(pauta.split(/\r?\n/));

/**
 * O que precisa ser corrigido antes de sair do passo. Reunião e evento viram link de evento: passam pela MESMA
 * validação da página do evento (sem link, telefone, PIX, e-mail nem HTML), para o link nunca sair recusado.
 * As mensagens começam em minúscula (formulario.ts põe "Erro:" antes).
 */
export function errosDoPasso(d: DadosDoFluxo, passo: Passo): ErrosDoFluxo {
  const e: ErrosDoFluxo = {};
  if (passo === 1) {
    if (!d.titulo.trim()) e.titulo = 'escreva o título.';
    else if (letras(d.titulo.trim()).length > LIMITES.titulo) e.titulo = `use no máximo ${LIMITES.titulo} letras.`;
    if (letras(d.organizacao.trim()).length > LIMITES.organizacao) e.organizacao = `use no máximo ${LIMITES.organizacao} letras.`;
    if (d.tipo === 'reuniao') {
      const itens = itensDaPauta(d.pauta);
      if (!itens.length) e.pauta = 'escreva pelo menos um assunto na pauta.';
      else if (itens.length > LIMITES.itensDaPauta) e.pauta = `use no máximo ${LIMITES.itensDaPauta} itens.`;
      else if (itens.some((i) => letras(i).length > LIMITES.itemDaPauta)) e.pauta = `cada item pode ter até ${LIMITES.itemDaPauta} letras.`;
      else if (letrasQueFaltamNaPauta(d.pauta) < 0) e.pauta = `a pauta ${passouLetras(-letrasQueFaltamNaPauta(d.pauta))} Encurte um assunto ou tire algum.`;
    } else if (letras(d.texto.trim()).length > LIMITES.texto) e.texto = `use no máximo ${LIMITES.texto} letras.`;
  }
  if (passo === 2) {
    if (temAgenda(d.tipo)) {
      if (!d.data) e.data = 'escolha o dia.';
      if (!d.hora) e.hora = 'escolha a hora.';
      if (!d.local.trim()) e.local = 'escreva o local.';
      else if (letras(d.local.trim()).length > LIMITES.local) e.local = `use no máximo ${LIMITES.local} letras.`;
    }
  }
  if (temAgenda(d.tipo) && (passo === 1 || passo === 2)) {
    const r = validarEvento(eventoDoFluxo(d));
    if (!r.ok) {
      const no1: [CampoDoFluxo, keyof typeof r.erros][] = [
        ['titulo', 'titulo'],
        ['organizacao', 'organizacao'],
        [d.tipo === 'reuniao' ? 'pauta' : 'texto', 'descricao'],
      ];
      const no2: [CampoDoFluxo, keyof typeof r.erros][] = [
        ['data', 'data'],
        ['hora', 'inicio'],
        ['local', 'local'],
      ];
      for (const [campo, doEvento] of passo === 1 ? no1 : no2) {
        const m = r.erros[doEvento];
        if (m && !e[campo]) e[campo] = minuscula(doCampo(m, campo));
      }
    }
  }
  return e;
}

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** O erro do evento fala "a descrição"; no fluxo esse campo se chama "Pauta" ou "Texto curto". */
const doCampo = (mensagem: string, campo: CampoDoFluxo): string =>
  campo === 'pauta' ? mensagem.replace('a descrição', 'a pauta') : campo === 'texto' ? mensagem.replace('a descrição', 'o texto') : mensagem;

// ---------- o que sai ----------

const cortar = (s: string, max: number) => {
  const l = letras(s);
  return l.length <= max ? s : `${l.slice(0, max - 1).join('').trimEnd()}…`;
};

/** Campos que o motor do card desenha (cards/desenho.ts). */
export function camposDoCard(d: DadosDoFluxo, link = ''): CamposDoCard {
  return aplicarLimites({
    modelo: d.tipo,
    titulo: d.titulo.trim(),
    data: d.data,
    hora: temAgenda(d.tipo) ? d.hora : '',
    local: temAgenda(d.tipo) ? d.local.trim() : '',
    texto: d.tipo === 'reuniao' ? '' : d.texto.trim(),
    ...(d.tipo === 'reuniao' ? { pauta: itensDaPauta(d.pauta) } : {}),
    organizacao: d.organizacao.trim(),
    link,
  });
}

/** A descrição do link da reunião: a pauta numerada, sem corte (o passo 1 barra o que passa do limite). */
const descricaoDaReuniao = (pauta: string): string =>
  ['Pauta:', ...itensDaPauta(pauta).map((t, i) => `${i + 1}. ${t}`)].join('\n');

/** Quantas letras ainda cabem na descrição do link com esta pauta (negativo: passou). */
export const letrasQueFaltamNaPauta = (pauta: string): number => LIMITES.descricao - letras(descricaoDaReuniao(pauta)).length;

const passouLetras = (n: number): string => (n === 1 ? 'passou 1 letra.' : `passou ${n} letras.`);

/** Contador da pauta: vazio enquanto faltam mais de 50 letras; depois diz quantas faltam, o limite ou quantas passou. */
export function avisoDasLetrasDaPauta(pauta: string): string {
  const falta = letrasQueFaltamNaPauta(pauta);
  if (falta > 50) return '';
  if (falta > 1) return `Faltam ${falta} letras.`;
  if (falta === 1) return 'Falta 1 letra.';
  if (falta === 0) return 'Chegou no limite.';
  const passou = passouLetras(-falta);
  return passou.charAt(0).toUpperCase() + passou.slice(1);
}

/** Evento que vai no link (só reunião e evento). A descrição da reunião é a pauta numerada. */
export function eventoDoFluxo(d: DadosDoFluxo): Record<keyof Evento, string> {
  const descricao = d.tipo === 'reuniao' ? descricaoDaReuniao(d.pauta) : d.texto.trim();
  return {
    titulo: d.titulo,
    data: d.data,
    inicio: d.hora,
    fim: '',
    local: d.local,
    descricao,
    organizacao: d.organizacao,
  };
}

/** Assinatura dos campos que entram no link do evento (para saber se o link de antes ainda vale). */
export function assinatura(d: DadosDoFluxo): string {
  return JSON.stringify(eventoDoFluxo(d));
}

/** O link que já existia ainda descreve estes dados? */
export const linkAindaVale = (d: DadosDoFluxo): boolean => !!d.link && d.assinaturaDoLink === assinatura(d);

/** Tira asteriscos e sublinhados do texto digitado, para não quebrar o negrito do WhatsApp. */
const semMarcas = (s: string) => s.replace(/[*_~`]/g, '').replace(/\s+/g, ' ').trim();

/** Como `semMarcas`, mas mantém as quebras de linha: no máximo uma linha em branco seguida, sem espaço nas pontas. */
const semMarcasComLinhas = (s: string): string =>
  s
    .replace(/[*_~`]/g, '')
    .split(/\r\n|[\r\n\u2028\u2029]/)
    .map((l) => l.replace(/[^\S\r\n]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/**
 * Texto que vai junto com a imagem no WhatsApp. Com dia e local (reunião e evento), leva o link do evento.
 * Reunião: pauta numerada, como na convocação de antes.
 */
export function textoParaMandar(d: DadosDoFluxo, link = ''): string {
  const c = camposDoCard(d, link);
  const linhas: string[] = [];
  const titulo = semMarcas(c.titulo);
  if (titulo) linhas.push(`*${titulo}*`);
  const q = quando(c);
  if (q) linhas.push(`📅 ${q}`);
  const o = semMarcas(onde(c));
  if (o) linhas.push(`📍 ${o}`);
  if (d.tipo === 'reuniao') {
    const itens = itensDaPauta(d.pauta);
    if (itens.length) linhas.push('', '*Pauta*', ...itens.map((t, i) => `${i + 1}. ${semMarcas(t)}`));
  } else {
    const texto = semMarcasComLinhas(c.texto);
    if (texto) linhas.push('', texto);
  }
  const org = semMarcas(c.organizacao);
  if (org) linhas.push('', `_${org}_`);
  if (link) linhas.push('', `Mais detalhes: ${link}`);
  return linhas.join('\n').trim();
}

/** Convocação (reuniao/convocacao.ts) a partir do fluxo: a ata usa a pauta dela ("Usar a pauta da convocação"). */
export function convocacaoDoFluxo(d: DadosDoFluxo, link = ''): Convocacao {
  return {
    organizacao: d.organizacao.trim(),
    data: d.data,
    hora: d.hora,
    local: d.local.trim(),
    pauta: itensDaPauta(d.pauta),
    link,
  };
}
