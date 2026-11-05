import { EMAIL_CONTATO, NOME } from '../../comum/marca';
import { REGRAS_DE_USO } from '../../comum/regras';
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
      // A lista mora em src/comum/regras.ts (a tela de link removido mostra a regra ferida).
      blocos: [REGRAS_DE_USO],
    },
    {
      titulo: 'O que é mentira comprovada',
      blocos: [
        'Só conta como comprovada quando há decisão judicial, ou checagem publicada por uma iniciativa de checagem independente (de preferência mais de uma, de linhas editoriais diferentes).',
        `Nunca é só a avaliação do ${NOME}.`,
      ],
    },
    {
      titulo: 'Quem modera',
      blocos: [
        'Quem modera não decide casos com conflito de interesse: organização própria ou de parente, adversário direto, ou caso em que tenha interesse pessoal.',
        'Enquanto houver uma pessoa só moderando, o conflito é declarado no relatório público semestral.',
      ],
    },
    {
      titulo: 'O que não fazemos',
      blocos: [
        'Não usamos robô nem a API do WhatsApp. O site só abre links do WhatsApp (wa.me) e usa recursos que o próprio WhatsApp já tem.',
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
