import { NOME, RESPONSAVEL } from '../../comum/marca';
import type { Pagina } from './tipos';

export const sobre: Pagina = {
  titulo: 'Sobre',
  resumo: `O ${NOME} é um conjunto de ferramentas gratuitas para organizar a vida em comunidade.`,
  juridico: false,
  secoes: [
    {
      titulo: 'O que é',
      blocos: [
        'É uma plataforma gratuita, aberta a qualquer pessoa e a qualquer organização: associação de moradores, coletivo cultural, escola, igreja, sindicato, ONG, grupo de bairro, partido.',
        'Hoje tem três ferramentas: cards e convites para o WhatsApp, evento em um link e reunião com pauta e ata.',
        'Tudo é feito no seu aparelho. Não pedimos cadastro nem senha.',
      ],
    },
    {
      titulo: 'Princípios',
      blocos: [
        [
          'Aberta e apartidária: não tomamos partido, não recomendamos voto e não damos destaque a ninguém.',
          'As mesmas regras valem para todas as pessoas e organizações.',
          'Grátis para quem usa. Sem anúncio e sem venda de dados.',
          'Dados mínimos. Nunca perguntamos em quem você vota, a que partido é filiado ou o que pensa de política.',
          'Respeito: ofensa, discurso de ódio, ameaça e mentira comprovada ficam de fora.',
          'Conteúdo de outras pessoas só com permissão e com um jeito fácil de pedir a remoção.',
          'Feita para o celular, para internet fraca e para quem tem dificuldade de leitura ou de visão.',
        ],
      ],
    },
    {
      titulo: 'Neutralidade na prática',
      blocos: [
        'Nenhuma cor, ícone ou exemplo do site lembra um partido. Os exemplos mudam entre vários tipos de organização.',
        'Os textos da plataforma passam por um teste automático contra linguagem de campanha e contra nomes e siglas de partidos.',
        'O que você escreve nos seus cards e convites é seu. A plataforma não confere nem guarda esse conteúdo.',
      ],
    },
    {
      titulo: 'Quem mantém',
      blocos: [
        `O ${NOME} é mantido de forma voluntária por ${RESPONSAVEL}, pessoa física, enquanto não existe uma associação sem fins lucrativos para isso.`,
        'O projeto não tem fins lucrativos. No futuro, deve ser sustentado por doações.',
      ],
    },
    {
      titulo: 'Quem apoia',
      blocos: [
        'Ainda não há apoiadores. Quando houver, a lista será pública e ficará aqui.',
        'Regras para quem quiser apoiar:',
        [
          'Os apoiadores devem ser diversos e conhecidos do público.',
          'Apoiar não dá direito de decidir ou de influenciar o conteúdo, as regras ou os destaques.',
          'Não aceitamos dinheiro nem serviço de partido ou de candidato.', // neutralidade: permitido (regra de financiamento)
        ],
      ],
    },
    {
      titulo: 'Fale com a gente',
      blocos: ['Dúvidas, sugestões, denúncias e pedidos de remoção: veja a página de contato.'],
    },
  ],
};
