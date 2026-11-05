// O contrato de uma tela. Cada ferramenta (src/ferramentas/*/index.ts) e cada página exporta uma `Tela`.
// A tela desenha dentro de `raiz` e pode devolver uma função de limpeza, chamada quando a pessoa sai dela.

import type { Rota } from './rotas';

export type Limpeza = () => void;

export type Tela = (raiz: HTMLElement, rota: Rota) => Limpeza | void;
