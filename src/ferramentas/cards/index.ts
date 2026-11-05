// Ferramenta 1: cards e convites para WhatsApp. Carregada sob demanda (src/main.ts).
// Esta pasta é da sessão que constrói os cards. Mudanças em src/comum viram pedido em docs/pedidos-comum.md.

import { telaEmConstrucao } from '../../paginas/emConstrucao';
import type { Tela } from '../../comum/tela';

export const tela: Tela = (raiz) => telaEmConstrucao(raiz, 'Cards e convites');
