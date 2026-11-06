// Rotas por # (puro, sem DOM). Tudo depois do # fica no aparelho: o servidor nunca vê.
// Formato: "#/nome" ou "#/nome/resto". O "resto" é da ferramenta (ex.: os dados do evento) e
// chega como veio, sem decodificar: cada ferramenta lê o seu formato.
//
// Fluxo único (docs/produto.md 7.6): "#/fazer/<tipo>" e os passos dele; "#/ata" é "Depois da reunião".
// Os endereços antigos continuam valendo: "#/cards", "#/evento" (sem dados ou com "editar/…") e "#/reuniao"
// abrem o fluxo, que leva ao ponto certo; "#/evento/<dados>" continua sendo a página do evento.

export const ROTAS = [
  'inicio',
  'fazer',
  'ata',
  'cards',
  'evento',
  'reuniao',
  'sobre',
  'termos',
  'privacidade',
  'regras',
  'denunciar',
  'contato',
] as const;

export type NomeDaRota = (typeof ROTAS)[number];

export interface Rota {
  nome: NomeDaRota;
  /** O que vem depois de "#/nome/". Vazio quando não há. */
  resto: string;
}

const ehRota = (s: string): s is NomeDaRota => (ROTAS as readonly string[]).includes(s);

/** Lê o location.hash. Endereço vazio ou desconhecido cai na página inicial. */
export function lerRota(hash: string): Rota {
  const semCerquilha = hash.replace(/^#\/?/, '');
  const barra = semCerquilha.indexOf('/');
  const nome = barra < 0 ? semCerquilha : semCerquilha.slice(0, barra);
  const resto = barra < 0 ? '' : semCerquilha.slice(barra + 1);
  if (!ehRota(nome)) return { nome: 'inicio', resto: '' };
  return { nome, resto };
}

/** Endereço relativo de uma rota, para usar em href: "#/evento/abc". A inicial é "#/". */
export function linkPara(nome: NomeDaRota, resto = ''): string {
  if (nome === 'inicio') return '#/';
  return resto ? `#/${nome}/${resto}` : `#/${nome}`;
}

/**
 * Endereço do site (a pasta do app), sem caminho a mais, "?…" nem "#…". É a base de todo link que sai do site
 * (link do evento, QR, denúncia). Vem da pasta do endereço aberto, não do caminho inteiro: aberto em
 * ".../projeto-comunidade/qualquer-texto" ou em ".../index.html?fbclid=…", dá ".../projeto-comunidade/"
 * (auditoria do fluxo, 05/11/2026, B7). O service worker só serve o app nessa pasta e no index.html.
 */
export function enderecoDoSite(href: string): string {
  return new URL('./', href).href;
}

/** Qual parte do site abre cada rota (cada parte é um arquivo baixado só quando abre). */
export type Parte = 'inicio' | 'fluxo' | 'ata' | 'evento' | 'galeria' | 'paginas';

export function parteDaRota(rota: Rota): Parte {
  switch (rota.nome) {
    case 'inicio':
      return 'inicio';
    case 'fazer':
    case 'reuniao':
      return 'fluxo';
    case 'ata':
      return 'ata';
    case 'cards':
      return rota.resto === 'galeria' ? 'galeria' : 'fluxo';
    case 'evento':
      // Só a página do evento fica com o Evento; criar e "criar outro a partir deste" agora são o fluxo.
      return rota.resto === '' || rota.resto.startsWith('editar/') ? 'fluxo' : 'evento';
    default:
      return 'paginas';
  }
}

/**
 * O rodapé comum (Sobre, Termos, Regras, Como denunciar) fica nas páginas, na ata e na página de um evento.
 * Some no início (que tem o próprio rodapé) e em todo o fluxo, onde a pessoa está criando algo.
 */
export function mostraORodapeComum(rota: Rota): boolean {
  const parte = parteDaRota(rota);
  return parte !== 'inicio' && parte !== 'fluxo';
}
