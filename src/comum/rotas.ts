// Rotas por # (puro, sem DOM). Tudo depois do # fica no aparelho: o servidor nunca vê.
// Formato: "#/nome" ou "#/nome/resto". O "resto" é da ferramenta (ex.: os dados do evento) e
// chega como veio, sem decodificar: cada ferramenta lê o seu formato.

export const ROTAS = ['inicio', 'cards', 'evento', 'reuniao', 'sobre', 'termos', 'privacidade', 'regras', 'denunciar'] as const;

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
