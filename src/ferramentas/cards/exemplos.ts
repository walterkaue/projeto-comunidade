// Exemplos de preenchimento, em rodízio entre tipos de organização. Tudo fictício, sem nomes reais.

import type { CamposDoCard, ModeloDeCard } from './modelos';

/** Posição do tipo "grupo religioso" no rodízio. Ela alterna entre tradições (`RELIGIOSAS`). */
const POSICAO_RELIGIOSA = 2;

/** Grupos religiosos fictícios, de tradições diferentes. Nenhum nome real de igreja, terreiro, centro ou grupo. */
const RELIGIOSAS = [
  'Grupo de Oração Flor do Pomar',
  'Casa de Matriz Africana Pé de Jaca Dourado',
  'Centro Espírita Lume do Vale Cheiroso',
] as const;

const TIPOS = [
  'Associação de Moradores Vila Cantinho Sereno',
  'Sindicato dos Metalúrgicos Vale das Pedras Mansas',
  RELIGIOSAS[0],
  'Núcleo de Bairro Morro do Tatu-Bola',
  'Coletivo Palco Aberto',
  'Instituto Rede Viva',
  'Conselho Escolar Riacho Cinco Pedras',
] as const;

/** Todos os nomes de organização dos exemplos (os testes conferem o equilíbrio e que nenhum é nome real). */
export const ORGANIZACOES: readonly string[] = [...TIPOS, ...RELIGIOSAS.slice(1)];

type Linha = readonly [titulo: string, texto: string, local: string];

/** O exemplo religioso de cada modelo, uma linha por tradição. Os textos servem para todas (sem dia de culto). */
const RELIGIOSO: Record<ModeloDeCard, readonly [Linha, Linha, Linha]> = {
  reuniao: [
    ['Reunião de planejamento do grupo', 'Vamos combinar os encontros do próximo mês. Traga ideias.', 'Salão comunitário'],
    ['Reunião de planejamento da casa', 'Vamos combinar os encontros do próximo mês. Traga ideias.', 'Espaço da casa'],
    ['Reunião de planejamento do centro', 'Vamos combinar os encontros do próximo mês. Traga ideias.', 'Sala do centro'],
  ],
  evento: [
    ['Encontro de partilha e café', 'Um café para conversar e conhecer quem chegou agora.', 'Salão comunitário'],
    ['Roda de conversa e café', 'Um café para conversar e conhecer quem chegou agora.', 'Espaço da casa'],
    ['Encontro aberto e café', 'Um café para conversar e conhecer quem chegou agora.', 'Sala do centro'],
  ],
  aviso: [
    ['Encontro adiado', 'O encontro será na semana seguinte, no mesmo horário.', ''],
    ['Encontro da casa adiado', 'O encontro será na semana seguinte, no mesmo horário.', ''],
    ['Encontro do centro adiado', 'O encontro será na semana seguinte, no mesmo horário.', ''],
  ],
  resultado: [
    ['Alcançamos a meta da arrecadação de alimentos', 'Foram arrecadadas mais de 300 cestas. Gratidão a quem doou.', ''],
    ['Alcançamos a meta da arrecadação de alimentos', 'Foram arrecadadas mais de 300 cestas. Gratidão a quem doou.', ''],
    ['Alcançamos a meta da arrecadação de alimentos', 'Foram arrecadadas mais de 300 cestas. Gratidão a quem doou.', ''],
  ],
  agradecimento: [
    ['Gratidão a quem preparou o encontro', 'Cada mão fez diferença: cozinha, som, limpeza e acolhida.', ''],
    ['Gratidão a quem preparou o encontro', 'Cada mão fez diferença: cozinha, som, limpeza e acolhida.', ''],
    ['Gratidão a quem preparou o encontro', 'Cada mão fez diferença: cozinha, som, limpeza e acolhida.', ''],
  ],
};

const LINHAS: Record<ModeloDeCard, readonly Linha[]> = {
  reuniao: [
    ['Assembleia geral de moradores', 'Pauta: limpeza do córrego, horário da coleta e contas do ano.', 'Salão da associação'],
    ['Assembleia da categoria', 'Pauta: calendário de atividades e relatório de contas.', 'Sede do sindicato'],
    RELIGIOSO.reuniao[0],
    ['Reunião de núcleo', 'Pauta: agenda do bairro e divisão de tarefas.', 'Sala de reuniões do núcleo'],
    ['Reunião de produção', 'Vamos fechar a agenda de ensaios e a divulgação.', 'Casa de cultura'],
    ['Reunião de equipe e voluntários', 'Balanço do semestre e novas frentes de trabalho.', 'Sede do instituto'],
    ['Reunião ordinária do conselho', 'Pauta: calendário, merenda e reforma do pátio.', 'Biblioteca da escola'],
  ],
  evento: [
    ['Mutirão de limpeza da praça', 'Traga luvas e vontade. Água e lanche por nossa conta.', 'Praça central'],
    ['Plantão de dúvidas sobre direitos', 'Atendimento gratuito para quem quiser tirar dúvidas.', 'Sede do sindicato'],
    RELIGIOSO.evento[0],
    ['Roda de conversa no bairro', 'Conversa aberta sobre os problemas e as boas ideias do bairro.', 'Praça da Matriz'],
    ['Sarau de poesia e música', 'Quem quiser pode subir ao palco. Entrada livre.', 'Casa de cultura'],
    ['Oficina de reciclagem para crianças', 'Atividade gratuita, para crianças de 6 a 12 anos.', 'Sede do instituto'],
    ['Festa de encerramento do ano', 'Apresentações dos alunos e lanche coletivo.', 'Pátio da escola'],
  ],
  aviso: [
    ['Coleta de lixo muda de horário', 'A partir de segunda, a coleta passa às 7h. Deixe o lixo na calçada à noite.', ''],
    ['Atendimento só por agendamento', 'Para evitar fila, o atendimento passa a ser com hora marcada.', ''],
    RELIGIOSO.aviso[0],
    ['Reunião de núcleo transferida', 'A reunião desta semana passa para o salão ao lado. Mesmo horário.', ''],
    ['Ensaio aberto cancelado', 'Por causa da chuva, o ensaio fica para a próxima semana.', ''],
    ['Inscrições prorrogadas', 'As inscrições seguem abertas até o fim do mês. Vagas limitadas.', ''],
    ['Entrega de material escolar', 'A retirada do material será na sede da escola, de segunda a sexta.', ''],
  ],
  resultado: [
    ['Conseguimos o asfalto da rua 4', 'Depois de um ano de pedidos, as obras vão começar. Obrigado a todos.', ''],
    ['Acordo fechado com a empresa', 'A categoria aprovou o acordo em assembleia. Veja o resumo no mural.', ''],
    RELIGIOSO.resultado[0],
    ['Nossa horta comunitária está de pé', 'Já são 40 canteiros e 25 famílias participando.', ''],
    ['Casa cheia em todas as sessões', 'Mais de mil pessoas no festival. Obrigado ao público e à equipe.', ''],
    ['Mil crianças atendidas neste ano', 'Meta cumprida graças às pessoas voluntárias e apoiadoras.', ''],
    ['Reforma da biblioteca concluída', 'O espaço reabre na segunda, com acervo novo e computadores.', ''],
  ],
  agradecimento: [
    ['Obrigado, vizinhas e vizinhos', 'A festa de rua deu certo porque cada pessoa ajudou um pouco.', ''],
    ['Obrigado por estarem presentes', 'Assembleia lotada e debate respeitoso. Seguimos juntos.', ''],
    RELIGIOSO.agradecimento[0],
    ['Obrigado a quem participou', 'A conversa foi boa e as ideias vão para a próxima reunião.', ''],
    ['Obrigado ao público e aos parceiros', 'Sem o apoio de vocês o festival não aconteceria.', ''],
    ['Obrigado, equipe de voluntários', 'Vocês tornaram possível mais um ano de trabalho.', ''],
    ['Obrigado, famílias e professores', 'A feira de ciências foi linda graças à participação de todos.', ''],
  ],
};

/** Tipos de organização do rodízio (o índice do exemplo dá a volta nesta conta). */
export const QUANTOS_EXEMPLOS = TIPOS.length;
/** Quantos índices seguidos o rodízio leva para mostrar todos os exemplos e todas as tradições (o fluxo sorteia o começo nesta faixa). */
export const VOLTA_DO_RODIZIO = QUANTOS_EXEMPLOS * RELIGIOSAS.length;

/** AAAA-MM-DD do próximo sábado (ou o de daqui a 7 dias, se hoje for sábado). Usa a data local. */
export function proximoSabado(hoje: Date): string {
  const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  d.setDate(d.getDate() + (((6 - d.getDay() + 7) % 7) || 7));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const volta = (n: number, de: number) => ((n % de) + de) % de;

/**
 * O exemplo número `indice` (qualquer inteiro; dá a volta). O tipo de organização é `indice` mod 7; no tipo
 * religioso, a tradição é `floor(indice / 7)` mod 3. O link nunca vem de exemplo.
 */
export function exemplo(modelo: ModeloDeCard, indice: number, hoje: Date = new Date()): CamposDoCard {
  const i = Math.trunc(indice);
  const n = volta(i, QUANTOS_EXEMPLOS);
  const tradicao = volta(Math.floor(i / QUANTOS_EXEMPLOS), RELIGIOSAS.length);
  const religioso = n === POSICAO_RELIGIOSA;
  const [titulo, texto, local] = religioso ? RELIGIOSO[modelo][tradicao]! : LINHAS[modelo][n]!;
  const agenda = modelo === 'reuniao' || modelo === 'evento';
  return {
    modelo,
    titulo,
    texto,
    local,
    organizacao: religioso ? RELIGIOSAS[tradicao]! : TIPOS[n]!,
    data: agenda ? proximoSabado(hoje) : '',
    hora: agenda ? (modelo === 'reuniao' ? '19:00' : '09:30') : '',
    link: '',
  };
}

/** Ponto de partida ao acaso do rodízio de exemplos (0 … VOLTA_DO_RODIZIO − 1). Fluxo e ata sorteiam por aqui. */
export const sorteioDoRodizio = (): number => Math.floor(Math.random() * VOLTA_DO_RODIZIO);

/** Tamanho máximo do exemplo num campo de uma linha (o placeholder não quebra linha). */
export const MAXIMO_DO_EXEMPLO = 28;

/**
 * Nome curto, escrito à mão, de cada organização do catálogo (o nome inteiro passa de 28 letras).
 * Os três grupos religiosos têm o mesmo tratamento: todos perdem o nome da tradição e ficam só com o nome
 * inventado, para nenhum sair cortado pela metade (revisão de neutralidade, 07/11/2026).
 */
export const NOMES_CURTOS: Readonly<Record<string, string>> = {
  'Associação de Moradores Vila Cantinho Sereno': 'Associação Vila Cantinho',
  'Sindicato dos Metalúrgicos Vale das Pedras Mansas': 'Sindicato dos Metalúrgicos',
  'Grupo de Oração Flor do Pomar': 'Grupo Flor do Pomar',
  'Núcleo de Bairro Morro do Tatu-Bola': 'Núcleo Morro do Tatu-Bola',
  'Coletivo Palco Aberto': 'Coletivo Palco Aberto',
  'Instituto Rede Viva': 'Instituto Rede Viva',
  'Conselho Escolar Riacho Cinco Pedras': 'Conselho Escolar Riacho',
  'Casa de Matriz Africana Pé de Jaca Dourado': 'Casa Pé de Jaca Dourado',
  'Centro Espírita Lume do Vale Cheiroso': 'Centro Lume do Vale',
};

const PALAVRAS_SOLTAS = new Set(['de', 'do', 'da', 'dos', 'das', 'e']);

/** Reserva para um nome novo no catálogo sem nome curto: corta na última palavra inteira que cabe. */
export function cortarLimpo(nome: string, maximo = MAXIMO_DO_EXEMPLO): string {
  const palavras = nome.trim().split(/\s+/);
  while (palavras.length > 1 && palavras.join(' ').length > maximo) palavras.pop();
  while (palavras.length > 1 && PALAVRAS_SOLTAS.has(palavras[palavras.length - 1]!.toLowerCase())) palavras.pop();
  return palavras.join(' ');
}

/** O nome curto de uma organização do catálogo, para o exemplo em cinza de um campo de uma linha. */
export const nomeCurtoDaOrganizacao = (nome: string): string => NOMES_CURTOS[nome] ?? cortarLimpo(nome);

/** Nome de organização fictício, curto, do rodízio (índice qualquer; dá a volta). */
export const exemploDeOrganizacao = (indice: number): string => nomeCurtoDaOrganizacao(exemplo('reuniao', indice).organizacao);

/** Para o teste: todo nome do catálogo tem nome curto. */
export const nomesSemCurto = (): string[] => ORGANIZACOES.filter((o) => !(o in NOMES_CURTOS));
