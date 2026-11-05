// Ferramenta 2: evento em um link (os dados vão depois do #, em `rota.resto`). Carregada sob demanda (src/main.ts).
// Esta pasta é da sessão que constrói o evento. Mudanças em src/comum viram pedido em docs/pedidos-comum.md.

import { telaEmConstrucao } from '../../paginas/emConstrucao';
import type { Tela } from '../../comum/tela';

export const tela: Tela = (raiz) => telaEmConstrucao(raiz, 'Evento em um link');
