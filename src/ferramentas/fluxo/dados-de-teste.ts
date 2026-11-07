// Ajuda só dos testes desta pasta: dados do fluxo já preenchidos com um exemplo do rodízio, como a pessoa deixaria
// depois de escrever tudo. (Os dados novos de verdade começam vazios: dadosNovos em estado.ts.)

import { dadosNovos, exemploDoRodizio, type DadosDoFluxo, type Tipo } from './estado';

/** Dados com todos os campos escritos igual ao exemplo número `indice` do rodízio (origem "novo"). */
export function cheio(tipo: Tipo, indice = 0, hoje: Date = new Date()): DadosDoFluxo {
  const ex = exemploDoRodizio(tipo, indice, hoje);
  return { ...dadosNovos(tipo, ex), ...ex, origem: 'novo' };
}
