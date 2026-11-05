import { EMAIL_CONTATO, NOME } from '../../comum/marca';
import type { Pagina } from './tipos';

export const privacidade: Pagina = {
  titulo: 'Política de privacidade',
  resumo: 'Em resumo: o que você cria fica no seu aparelho. Não pedimos cadastro e não usamos cookie.',
  juridico: true,
  secoes: [
    {
      titulo: 'O essencial',
      blocos: [
        [
          'O que você cria fica no seu aparelho. Só sai se você compartilhar ou enviar.',
          'Sem conta, sem senha e sem cookie.',
          'Sem anúncio e sem venda de dados.',
          'Nunca perguntamos voto, filiação nem opinião política.',
        ],
      ],
    },
    {
      titulo: 'O que fica no seu aparelho',
      blocos: [
        'Textos, datas, locais e logo dos seus cards são lidos e usados no próprio aparelho. O logo é reduzido ali mesmo e nunca é enviado.',
        'Podemos guardar no aparelho um rascunho ou uma preferência, com nome que começa com "pc:". Sempre há um botão para apagar.',
        'O site guarda uma cópia de si mesmo no aparelho para funcionar sem internet. Os nomes desses arquivos guardados começam com "pc-".',
        'O rascunho da ata fica só na memória da aba aberta. Some quando você fecha a aba. Salve o PDF se quiser guardar.',
      ],
    },
    {
      titulo: 'Links de evento',
      blocos: [
        'Os dados de um evento vão dentro do link, depois do símbolo #. O servidor não vê o que vem depois do #.',
        'Esses dados levam só o que você escolheu publicar. Quem receber o link verá esse conteúdo.',
        'Presença e ata nunca entram em link.',
      ],
    },
    {
      titulo: 'O que o servidor pode ver',
      blocos: [
        'O site é entregue pelo GitHub Pages (GitHub, da Microsoft). Como em qualquer site, o servidor recebe o endereço de internet (IP) e dados do navegador de quem abre as páginas, e pode guardar isso em registros. Não controlamos esses registros.',
        'Fontes, imagens e códigos vêm do próprio site. Não carregamos nada de outros sites.',
      ],
    },
    {
      titulo: 'Métricas de visita',
      blocos: [
        'Hoje não medimos visitas.',
        'Se passarmos a medir, será sem cookie e sem identificar você. Esta página avisará antes.',
      ],
    },
    {
      titulo: 'Denúncias e e-mails',
      blocos: [
        `Denúncias e mensagens chegam por e-mail, em ${EMAIL_CONTATO}. Esse e-mail passa pelo Gmail, do Google.`,
        'Ao denunciar, você manda o link, o motivo e o que mais escrever. Seu endereço de e-mail também fica visível para nós.',
        'Uma inteligência artificial (Gemini, do Google) pode ajudar a separar e resumir as denúncias. Para isso, o texto da denúncia pode ser lido por essa ferramenta.',
        'Quem decide a remoção é sempre uma pessoa.',
        'A lista pública de links recusados guarda só uma impressão digital (um código) de cada link, nunca o conteúdo.',
        'Por quanto tempo guardamos os e-mails: [a definir antes do lançamento].',
      ],
    },
    {
      titulo: 'Seus direitos',
      blocos: [
        'Pela lei (LGPD), você pode saber que dados temos sobre você, corrigir, pedir que apaguemos e se opor a um uso.',
        `Como quase nada fica conosco, os dados que podemos ter são os do seu e-mail. Para pedir, escreva para ${EMAIL_CONTATO}.`,
        `Quem é responsável pelo ${NOME} e pelos seus dados: [a definir antes do lançamento].`,
      ],
    },
    {
      titulo: 'Crianças e adolescentes',
      blocos: ['Menores podem usar, sem restrição de uso. Não pedimos idade. Um advogado ainda vai conferir essa regra.'],
    },
    {
      titulo: 'Mudanças',
      blocos: ['Se esta política mudar, a data da versão muda e, se for importante, avisamos no site.'],
    },
  ],
};
