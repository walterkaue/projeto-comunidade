import { EMAIL_CONTATO, NOME, PRAZO_URGENTE_HORAS, RESPONSAVEL } from '../../comum/marca';
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
        'Só pessoas usam o site. Ainda não existe conta de organização.',
      ],
    },
    {
      titulo: 'Crianças e adolescentes',
      blocos: [
        `Crianças e adolescentes podem usar o site. Ele não pede idade, não tem conta, não pede dados pessoais para usar e não tem conversa entre pessoas. Se você tem menos de 18 anos, não coloque no evento seu nome completo, seu telefone nem o endereço da sua casa. Viu algo que coloca uma criança ou um adolescente em risco? Denuncie: respondemos em até ${PRAZO_URGENTE_HORAS} horas.`,
      ],
    },
    {
      titulo: 'Quem responde pelo site',
      blocos: [`O ${NOME} é mantido por ${RESPONSAVEL}. Contato: ${EMAIL_CONTATO}.`],
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
        'Logos, nomes e imagens que você usa. Ao colocar um logo, uma marca, uma foto ou um texto num card, num convite ou num evento, você declara que é dono ou tem permissão para usar. Por exemplo: é o logo da sua própria organização, ou quem tem os direitos deixou. O logo é lido e reduzido no seu aparelho e não é enviado ao site. Você responde pelo uso que faz deles. Se alguém nos mostrar que um evento publicado no site usa marca ou obra sem permissão, podemos recusar o link, como preveem as Regras de uso.',
        'Modelos do site. Os desenhos, as cores, os ícones e os textos de exemplo dos modelos foram criados para o projeto ou têm licença livre. Você pode usá-los nos seus cards sem pedir permissão.',
        'O código do site usa licença livre (MIT). Modelos e textos usam a licença CC BY 4.0.',
        'A versão que vale para o uso do site é a publicada neste endereço, com esta data. A licença CC BY permite copiar o texto, mas não muda o acordo entre você e o site.',
        `O rodapé "Feito com ${NOME}" identifica a ferramenta. Não é apoio do site a ninguém.`,
      ],
    },
    {
      titulo: 'O que você se compromete a fazer',
      blocos: [
        'Seguir as Regras de uso.',
        'Não usar o site para golpe, ameaça, ódio, perseguição, mentira comprovada ou violação de direitos de outras pessoas.',
        'Não fingir ser outra pessoa, organização ou órgão público.',
        'Não colocar dados de outras pessoas sem permissão.',
      ],
    },
    {
      titulo: 'Links de evento',
      blocos: [
        'Um link de evento leva os dados dentro dele. Quem recebe o link vê o que você escreveu.',
        'Ao criar um link de evento, você autoriza o site a mostrar esse conteúdo a quem abrir o link.',
        'A página do evento mostra: "Conteúdo criado por quem enviou este link". O site não confere nem guarda esse conteúdo.',
        'Se um link ferir as Regras de uso, ele pode ser recusado pelo site depois de uma denúncia.',
      ],
    },
    {
      titulo: 'Pré-campanha e campanha',
      blocos: [
        'Quem usar o site em pré-campanha ou campanha eleitoral responde por cumprir a lei eleitoral: identificação de quem paga ou faz a propaganda, regras para pedir voto, aviso de uso de inteligência artificial e regras sobre envio de mensagens. O site não confere nem aprova propaganda e não dá atendimento especial a partido, candidato ou campanha.', // neutralidade: permitido (aviso jurídico sobre a lei eleitoral)
      ],
    },
    {
      titulo: 'Denúncias e remoção',
      blocos: [
        'Qualquer pessoa pode denunciar um conteúdo ou pedir remoção. Veja a página "Como denunciar".',
        'Uma pessoa decide. Uma inteligência artificial pode ajudar a separar e resumir as denúncias, mas ela não decide.',
        'O nome e o e-mail de quem denunciou não são passados à inteligência artificial, e a ferramenta é usada com o histórico desligado, para não treinar com esses dados.',
        'Ao denunciar um evento, o link dele, com o conteúdo, vai por e-mail (Gmail) e pode ser lido por uma inteligência artificial (Gemini).',
      ],
    },
    {
      titulo: 'Responsabilidade',
      blocos: [
        'O site é gratuito e oferecido como está. Respondemos por dano que causarmos de propósito ou por culpa grave. Não respondemos pelo conteúdo que cada pessoa cria e compartilha, a não ser nos casos previstos em lei, nem por falhas da internet, do seu aparelho ou de serviços de outras empresas, como WhatsApp, Google e GitHub. Nada nestes termos tira direitos que a lei não permite tirar.',
      ],
    },
    {
      titulo: 'Mudanças e contato',
      blocos: [
        'Estes termos podem mudar. A data da versão fica na página. Se a mudança for importante, vamos avisar no site.',
        'Vale a lei brasileira. Qualquer conflito pode ser levado ao foro da cidade onde você mora.',
        `Dúvidas: ${EMAIL_CONTATO}.`,
      ],
    },
  ],
};
