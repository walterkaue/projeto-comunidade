import { EMAIL_CONTATO } from '../../comum/marca';
import type { Pagina } from './tipos';

/** Texto fixo da página de denúncia. A caixa com o link denunciado e o botão são desenhados pela página. */
export const denunciar: Pagina = {
  titulo: 'Como denunciar',
  resumo: 'Viu algo que fere as Regras de uso? Ou quer pedir a remoção de algo seu? Escreva para nós.',
  juridico: false,
  secoes: [
    {
      titulo: 'Como denunciar um evento',
      blocos: [
        'Na página do evento, toque em "Denunciar". Você chega aqui com o link já preenchido.',
        'Escolha como enviar: pelo aplicativo de e-mail, pelo Gmail no navegador ou copiando o texto. Escreva o motivo e envie.',
      ],
    },
    {
      titulo: 'Como denunciar outro conteúdo ou pedir remoção',
      blocos: [
        `Escreva para ${EMAIL_CONTATO} com:`,
        [
          'o link ou a descrição de onde está o conteúdo;',
          'o motivo: o que fere as Regras de uso, ou por que o conteúdo é seu;',
          'seu nome e um meio de resposta, se quiser ser respondido.',
        ],
        'Pedidos sobre direito autoral e uso de marca também entram por aqui.',
      ],
    },
    {
      titulo: 'O que acontece depois',
      blocos: [
        [
          'A denúncia chega por e-mail.',
          'Uma inteligência artificial (Gemini, do Google) pode ajudar a separar e resumir as denúncias.',
          'Quem decide é uma pessoa. A inteligência artificial nunca decide sozinha.',
          'Se o conteúdo ferir as Regras de uso, o link passa a ser recusado pelo site.',
          'Respondemos por e-mail. Se não quiser resposta, diga no texto.',
        ],
        'Não prometemos prazo fixo. Casos de ameaça ou de risco a criança vêm primeiro.',
      ],
    },
    {
      titulo: 'Lista de links recusados',
      blocos: [
        'A lista é pública, mas guarda só uma impressão digital de cada link (um código). Ela nunca repete o conteúdo denunciado.',
      ],
    },
    {
      titulo: 'Em caso de perigo',
      blocos: ['Se houver risco imediato a alguém, procure a polícia (190) ou o serviço de emergência da sua cidade. Este e-mail não é plantão.'],
    },
  ],
};
