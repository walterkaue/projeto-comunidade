import { EMAIL_CONTATO, NOME } from '../../comum/marca';
import type { Pagina } from './tipos';

export const termos: Pagina = {
  titulo: 'Termos de uso',
  resumo: `Combinados simples para usar o ${NOME}.`,
  juridico: true,
  secoes: [
    {
      titulo: 'Quem pode usar',
      blocos: [
        'Qualquer pessoa pode usar, de graça. Não pedimos cadastro.',
        'Menores de idade podem usar, sem restrição de uso. Um advogado ainda vai conferir essa regra, e ela pode mudar.',
        'Só pessoas usam o site. Ainda não existe conta de organização.',
      ],
    },
    {
      titulo: 'O que oferecemos',
      blocos: [
        'Ferramentas gratuitas, que funcionam no seu aparelho: cards e convites, evento em um link e reunião com pauta e ata.',
        'O site é oferecido como está. Pode ter erros, mudar ou sair do ar. Não garantimos que sirva para um fim específico.',
        'Modelos de ata e de convocação são exemplos. Não substituem o estatuto da sua organização nem orientação jurídica.',
      ],
    },
    {
      titulo: 'O que é seu e o que é nosso',
      blocos: [
        'O que você escreve e cria é seu. Você é a pessoa responsável por esse conteúdo.',
        'Logos, nomes e marcas que você colocar num card são de quem faz o card. Coloque só o que você tem direito de usar.',
        'O código do site usa licença livre (MIT). Modelos e textos usam a licença CC BY 4.0.',
      ],
    },
    {
      titulo: 'O que você se compromete a fazer',
      blocos: [
        'Seguir as Regras de uso.',
        'Não usar o site para golpe, ameaça, ódio, perseguição, mentira comprovada ou violação de direitos de outras pessoas.',
        'Não colocar dados de outras pessoas sem permissão.',
      ],
    },
    {
      titulo: 'Links de evento',
      blocos: [
        'Um link de evento leva os dados dentro dele. Quem recebe o link vê o que você escreveu.',
        'A página do evento mostra: "Conteúdo criado por quem enviou este link". O site não confere nem guarda esse conteúdo.',
        'Se um link ferir as Regras de uso, ele pode ser recusado pelo site depois de uma denúncia.',
      ],
    },
    {
      titulo: 'Denúncias e remoção',
      blocos: [
        'Qualquer pessoa pode denunciar um conteúdo ou pedir remoção. Veja a página "Como denunciar".',
        'Uma pessoa decide. Uma inteligência artificial pode ajudar a separar e resumir as denúncias, mas ela não decide.',
        'Ao denunciar um evento, o link dele, com o conteúdo, vai por e-mail (Gmail) e pode ser lido por uma inteligência artificial (Gemini).',
      ],
    },
    {
      titulo: 'Responsabilidade',
      blocos: [
        'Fazemos o possível para o site funcionar bem, mas não nos responsabilizamos por danos causados por erro, falha ou mau uso. Os limites exatos desta responsabilidade ainda serão conferidos por um advogado.',
      ],
    },
    {
      titulo: 'Mudanças e contato',
      blocos: [
        'Estes termos podem mudar. A data da versão fica na página. Se a mudança for importante, vamos avisar no site.',
        `Dúvidas: ${EMAIL_CONTATO}.`,
      ],
    },
  ],
};
