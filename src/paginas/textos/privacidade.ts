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
        'O site guarda uma cópia de si mesmo no aparelho para funcionar sem internet. Essa cópia fica guardada em um espaço do navegador com nome que começa com "pc-".',
        'O rascunho da ata fica só na memória da aba aberta. Some quando você fecha a aba. Salve o PDF se quiser guardar.',
      ],
    },
    {
      titulo: 'Links de evento',
      blocos: [
        'Os dados de um evento vão dentro do link, depois do símbolo #. O servidor do site não vê o que vem depois do #. Mas, se você denunciar um evento, o link vai por e-mail (veja abaixo).',
        'Esses dados levam só o que você escolheu publicar. Quem receber o link verá esse conteúdo.',
        'Presença e ata nunca entram em link.',
      ],
    },
    {
      titulo: 'O que o servidor pode ver',
      blocos: [
        'O site é entregue pelo GitHub Pages (GitHub, da Microsoft). Como em qualquer site, o servidor recebe o endereço de internet (IP) e dados do navegador de quem abre as páginas, e pode guardar isso em registros. Não controlamos esses registros.',
        'Fontes, imagens e códigos vêm do próprio site. A única exceção é a contagem de visitas (veja abaixo).',
      ],
    },
    {
      titulo: 'Botões que abrem outro site',
      blocos: [
        'Alguns botões abrem outro site ou aplicativo. Antes de sair, o site avisa. Só o que você tocar é enviado:',
        [
          '"Ver no mapa": o local do evento vai para o Google Maps.',
          '"Abrir no Google Agenda": título, data, hora, local, descrição e organização do evento vão para o Google.',
          '"Abrir no WhatsApp": o texto do card (e o link do evento, se houver) vai para o WhatsApp, da Meta.',
          '"Enviar pelo aplicativo de e-mail": abre o seu aplicativo de e-mail com a denúncia já escrita (o link ou onde está o conteúdo, o tipo de problema e o que você escreveu).',
          '"Enviar pelo Gmail no navegador": esse mesmo texto vai para o Gmail, do Google, já no rascunho do e-mail. Ele vai dentro do endereço da página do Gmail, então fica também no histórico do seu navegador.',
          '"Copiar o texto": a denúncia fica na área de transferência do aparelho (e no histórico dela, se o seu teclado ou sistema guardar).',
        ],
        'Esses serviços têm as próprias regras de privacidade. O arquivo da agenda (.ics) e as imagens são feitos no aparelho e não passam por outro site.',
      ],
    },
    {
      titulo: 'Métricas de visita',
      blocos: [
        'Contamos visitas com o GoatCounter, um serviço sem cookie que não identifica você.',
        'A cada tela aberta, o site manda só o nome da tela (por exemplo, "evento" ou "cards") e o nome do site. Nunca vão os dados do evento, do card, da ata nem o título da página.',
        'Não mandamos de onde você veio nem o tamanho da tela. O GoatCounter recebe, como qualquer site, o endereço de internet (IP) e o tipo de navegador, e diz que não os guarda.',
      ],
    },
    {
      titulo: 'Denúncias e e-mails',
      blocos: [
        `Denúncias e mensagens chegam por e-mail, em ${EMAIL_CONTATO}. Esse e-mail passa pelo Gmail, do Google.`,
        'Ao denunciar, você manda o link do evento (que leva dentro o conteúdo dele, inclusive dados de outras pessoas, se houver), o motivo e o que mais escrever. Seu endereço de e-mail também fica visível para nós.',
        'Uma inteligência artificial (Gemini, do Google) pode ajudar a separar e resumir as denúncias. Para isso, o texto da denúncia, com o conteúdo do evento, pode ser lido por essa ferramenta. O Gmail e o Gemini podem guardar dados em outros países.',
        'O nome e o e-mail de quem denunciou não são passados à inteligência artificial. A ferramenta é usada com o histórico desligado, para que esses textos não sirvam para treiná-la.',
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
