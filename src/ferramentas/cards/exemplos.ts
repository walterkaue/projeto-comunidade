// Exemplos de preenchimento, em rodízio entre tipos de organização. Tudo fictício, sem nomes reais.

import type { CamposDoCard, ModeloDeCard } from './modelos';

export const ORGANIZACOES = [
  'Associação de Moradores Vila Pedrinhas Verdes',
  'Sindicato dos Metalúrgicos Vale das Pedras Mansas',
  'Grupo de Oração Estrela do Pomar',
  'Núcleo de Bairro Morro do Tatu-Bola',
  'Coletivo Palco Aberto',
  'Instituto Rede Viva',
  'Conselho Escolar Riacho Cinco Pedras',
] as const;

type Linha = readonly [titulo: string, texto: string, local: string];

const LINHAS: Record<ModeloDeCard, readonly Linha[]> = {
  reuniao: [
    ['Assembleia geral de moradores', 'Pauta: limpeza do córrego, horário da coleta e contas do ano.', 'Salão da associação'],
    ['Assembleia da categoria', 'Pauta: calendário de atividades e relatório de contas.', 'Sede do sindicato'],
    ['Reunião de planejamento do grupo', 'Vamos combinar os encontros do próximo mês. Traga ideias.', 'Salão paroquial'],
    ['Reunião de núcleo', 'Pauta: agenda do bairro e divisão de tarefas.', 'Sala de reuniões do núcleo'],
    ['Reunião de produção', 'Vamos fechar a agenda de ensaios e a divulgação.', 'Casa de cultura'],
    ['Reunião de equipe e voluntários', 'Balanço do semestre e novas frentes de trabalho.', 'Sede do instituto'],
    ['Reunião ordinária do conselho', 'Pauta: calendário, merenda e reforma do pátio.', 'Biblioteca da escola'],
  ],
  evento: [
    ['Mutirão de limpeza da praça', 'Traga luvas e vontade. Água e lanche por nossa conta.', 'Praça central'],
    ['Plantão de dúvidas sobre direitos', 'Atendimento gratuito para quem quiser tirar dúvidas.', 'Sede do sindicato'],
    ['Encontro de partilha e café', 'Um café para conversar e conhecer quem chegou agora.', 'Salão paroquial'],
    ['Roda de conversa no bairro', 'Conversa aberta sobre os problemas e as boas ideias do bairro.', 'Praça da Matriz'],
    ['Sarau de poesia e música', 'Quem quiser pode subir ao palco. Entrada livre.', 'Casa de cultura'],
    ['Oficina de reciclagem para crianças', 'Atividade gratuita, para crianças de 6 a 12 anos.', 'Sede do instituto'],
    ['Festa de encerramento do ano', 'Apresentações dos alunos e lanche coletivo.', 'Pátio da escola'],
  ],
  aviso: [
    ['Coleta de lixo muda de horário', 'A partir de segunda, a coleta passa às 7h. Deixe o lixo na calçada à noite.', ''],
    ['Atendimento só por agendamento', 'Para evitar fila, o atendimento passa a ser com hora marcada.', ''],
    ['Encontro de domingo adiado', 'O encontro será na semana seguinte, no mesmo horário.', ''],
    ['Reunião de núcleo transferida', 'A reunião desta semana passa para o salão ao lado. Mesmo horário.', ''],
    ['Ensaio aberto cancelado', 'Por causa da chuva, o ensaio fica para a próxima semana.', ''],
    ['Inscrições prorrogadas', 'As inscrições seguem abertas até o fim do mês. Vagas limitadas.', ''],
    ['Entrega de material escolar', 'A retirada do material será na secretaria, de segunda a sexta.', ''],
  ],
  resultado: [
    ['Conseguimos o asfalto da rua 4', 'Depois de um ano de pedidos, as obras vão começar. Obrigado a todos.', ''],
    ['Acordo fechado com a empresa', 'A categoria aprovou o acordo em assembleia. Veja o resumo no mural.', ''],
    ['Alcançamos a meta da campanha de alimentos', 'Foram arrecadadas mais de 300 cestas. Gratidão a quem doou.', ''],
    ['Nossa horta comunitária está de pé', 'Já são 40 canteiros e 25 famílias participando.', ''],
    ['Casa cheia em todas as sessões', 'Mais de mil pessoas no festival. Obrigado ao público e à equipe.', ''],
    ['Mil crianças atendidas neste ano', 'Meta cumprida graças às pessoas voluntárias e apoiadoras.', ''],
    ['Reforma da biblioteca concluída', 'O espaço reabre na segunda, com acervo novo e computadores.', ''],
  ],
  agradecimento: [
    ['Obrigado, vizinhas e vizinhos', 'A festa de rua deu certo porque cada pessoa ajudou um pouco.', ''],
    ['Obrigado por estarem presentes', 'Assembleia lotada e debate respeitoso. Seguimos juntos.', ''],
    ['Gratidão a quem preparou o encontro', 'Cada mão fez diferença: cozinha, som, limpeza e acolhida.', ''],
    ['Obrigado a quem participou', 'A conversa foi boa e as ideias vão para a próxima reunião.', ''],
    ['Obrigado ao público e aos parceiros', 'Sem o apoio de vocês o festival não aconteceria.', ''],
    ['Obrigado, equipe de voluntários', 'Vocês tornaram possível mais um ano de trabalho.', ''],
    ['Obrigado, famílias e professores', 'A feira de ciências foi linda graças à participação de todos.', ''],
  ],
};

export const QUANTOS_EXEMPLOS = ORGANIZACOES.length;

/** AAAA-MM-DD do próximo sábado (ou o de daqui a 7 dias, se hoje for sábado). Usa a data local. */
export function proximoSabado(hoje: Date): string {
  const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  d.setDate(d.getDate() + (((6 - d.getDay() + 7) % 7) || 7));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** O exemplo número `indice` (qualquer inteiro; dá a volta). O link nunca vem de exemplo. */
export function exemplo(modelo: ModeloDeCard, indice: number, hoje: Date = new Date()): CamposDoCard {
  const n = ((Math.trunc(indice) % QUANTOS_EXEMPLOS) + QUANTOS_EXEMPLOS) % QUANTOS_EXEMPLOS;
  const [titulo, texto, local] = LINHAS[modelo][n]!;
  const agenda = modelo === 'reuniao' || modelo === 'evento';
  return {
    modelo,
    titulo,
    texto,
    local,
    organizacao: ORGANIZACOES[n]!,
    data: agenda ? proximoSabado(hoje) : '',
    hora: agenda ? (modelo === 'reuniao' ? '19:00' : '09:30') : '',
    link: '',
  };
}
