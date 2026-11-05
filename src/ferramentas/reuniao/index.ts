// Ferramenta 3: reunião com convocação, pauta e ata em PDF. Carregada sob demanda (src/main.ts).
// Presença e ata nunca vão para link: ficam no aparelho e saem só como arquivo.
// Esta pasta é da sessão que constrói a reunião. Mudanças em src/comum viram pedido em docs/pedidos-comum.md.

import { telaEmConstrucao } from '../../paginas/emConstrucao';
import type { Tela } from '../../comum/tela';

export const tela: Tela = (raiz) => telaEmConstrucao(raiz, 'Reunião');
