// Cards: o motor do desenho (desenho.ts, modelos.ts, paletas.ts, textos.ts, exemplos.ts, logo.ts) é usado pelo
// fluxo único (src/ferramentas/fluxo, docs/produto.md 7.6). Esta tela só abre a galeria de revisão visual
// ("#/cards/galeria"); "#/cards" sem mais nada é atendido pelo fluxo (src/comum/rotas.ts, parteDaRota).
// Dados no link nunca preenchem nada (auditoria 05/11/2026, M5).

import './cards.css';
import type { Tela } from '../../comum/tela';
import { telaGaleria } from './galeria';

export const tela: Tela = (raiz) => telaGaleria(raiz);
