// Marca do projeto num lugar só. O nome é provisório: trocar aqui troca em toda a interface.
// (index.html, manifest e ícones têm o nome escrito à mão: ao trocar, procure "Projeto Comunidade" no repositório.)

export const NOME = 'Projeto Comunidade';

/** Nome curto, para a tela inicial do celular. */
export const NOME_CURTO = 'Comunidade';

/** Único e-mail de contato da plataforma (dúvidas, denúncias, pedidos de remoção). */
export const EMAIL_CONTATO = 'contato.projetocomunidade@gmail.com';

/**
 * Métricas de visita, sem cookie. Vazio = desligado: nenhum script de fora é carregado.
 * Só o script de métricas pode falar com outro site (ver testes/privacidade.test.ts).
 */
export const METRICAS_ID = '';
