// Marca do projeto num lugar só. O nome é provisório: trocar aqui troca em toda a interface.
// (index.html, manifest e ícones têm o nome escrito à mão: ao trocar, procure "Projeto Comunidade" no repositório.)

export const NOME = 'Projeto Comunidade';

/** Nome curto, para a tela inicial do celular. */
export const NOME_CURTO = 'Comunidade';

/**
 * Quem mantém o projeto e responde pelos dados (controlador, LGPD) enquanto não existir a associação.
 * Decisão do Kauê em 05/11/2026. Quando a associação existir, trocar aqui pelo nome dela.
 */
export const RESPONSAVEL = 'Walter Kauê';

/** Único e-mail de contato da plataforma (dúvidas, denúncias, pedidos de remoção). */
export const EMAIL_CONTATO = 'contato.projetocomunidade@gmail.com';

/** Prazo público de resposta a uma denúncia (docs/produto.md, seção 3). */
export const PRAZO_DENUNCIA_DIAS_UTEIS = 5;

/** Prazo para golpe, ameaça, risco a criança ou dado pessoal exposto. */
export const PRAZO_URGENTE_HORAS = 48;

/**
 * Métricas de visita, sem cookie. Vazio = desligado: nenhum script de fora é carregado.
 * Só o script de métricas pode falar com outro site (ver testes/privacidade.test.ts).
 * Conta criada: 'projetocomunidade'. Como ligar: src/comum/metricas.ts.
 */
export const METRICAS_ID = 'projetocomunidade';

/**
 * Lançamento público (divulgação). Enquanto for false, Termos, Privacidade e Regras de uso mostram a faixa
 * "Versão provisória, em revisão jurídica". Só vira true depois que o advogado aprovar os textos.
 */
export const LANCAMENTO_PUBLICO = false;
