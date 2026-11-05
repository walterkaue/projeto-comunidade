import type { Pagina } from './tipos';

/** O e-mail e o botão são desenhados pela página (tela.ts); aqui ficam só os textos. */
export const contato: Pagina = {
  titulo: 'Contato',
  resumo: 'Um só endereço para dúvidas, sugestões, denúncias e pedidos de remoção.',
  juridico: false,
  secoes: [
    {
      titulo: 'Como escrever',
      blocos: [
        'Escreva para o e-mail abaixo. Conte em poucas palavras o que você precisa.',
        'Não mande senha, documento nem dado de saúde. Não precisamos disso.',
        'Para denunciar um conteúdo ou pedir remoção, veja primeiro "Como denunciar".',
      ],
    },
  ],
};
