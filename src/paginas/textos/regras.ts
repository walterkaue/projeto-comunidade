import { EMAIL_CONTATO, NOME } from '../../comum/marca';
import type { Pagina } from './tipos';

export const regras: Pagina = {
  titulo: 'Regras de uso',
  resumo: `As mesmas regras valem para todas as pessoas e organizações que usam o ${NOME}.`,
  juridico: true,
  secoes: [
    {
      titulo: 'Vale para todos',
      blocos: [
        'Não importa a posição política, a religião ou o tipo de organização. A regra é a mesma, e quem decide aplica sem olhar o lado.',
      ],
    },
    {
      titulo: 'O que não pode',
      blocos: [
        [
          'Ofensa, humilhação ou perseguição a pessoa ou grupo.',
          'Discurso de ódio, racismo e outras formas de discriminação.',
          'Ameaça e incentivo à violência.',
          'Mentira comprovada, principalmente sobre saúde, segurança ou eleição.',
          'Golpe, ou pedido de dinheiro ou de dado pessoal por meio de engano.',
          'Dados de outras pessoas sem permissão: telefone, endereço, foto, lista de presença.',
          'Conteúdo que viole direito autoral ou use marca de outra pessoa sem direito.',
          'Conteúdo sexual envolvendo crianças ou adolescentes.',
        ],
      ],
    },
    {
      titulo: 'O que não fazemos',
      blocos: [
        'Não recomendamos voto, não damos destaque a ninguém e não cobramos de nenhum lado.',
        'Não perguntamos voto, filiação nem opinião política.',
        'Não guardamos o conteúdo que você cria: ele fica no seu aparelho ou dentro do link que você escolhe compartilhar.',
      ],
    },
    {
      titulo: 'Presença, ata e logos',
      blocos: [
        'Presença e ata nunca viram link. Ficam só no seu aparelho, e você decide se salva ou imprime.',
        'Logos e marcas nos cards são de quem faz o card.',
      ],
    },
    {
      titulo: 'O que acontece se alguém desrespeitar',
      blocos: [
        'Depois de uma denúncia, uma pessoa confere o link. Se ferir estas regras, o site passa a recusá-lo e mostra: "Este link foi removido após denúncia".',
        'A lista pública de links recusados guarda só uma impressão digital do link (um código), nunca o conteúdo denunciado.',
        'Quem denunciou recebe resposta por e-mail, se quiser.',
        `Quer contestar uma remoção? Escreva para ${EMAIL_CONTATO}.`,
      ],
    },
  ],
};
