// O contrato de uma tela. Cada ferramenta (src/ferramentas/*/index.ts) e cada página exporta uma `Tela`.
// A tela desenha dentro de `raiz` e pode devolver uma função de limpeza, chamada quando a pessoa sai dela.

import type { Rota } from './rotas';

// Combinado com o roteador (src/main.ts):
// - o título da tela é um <h1 tabindex="-1">: a cada troca de tela o foco vai para ele (leitor de tela);
// - mudar location.hash remonta a tela e volta ao topo. Para só atualizar o link (ex.: dados do evento
//   enquanto a pessoa digita), use history.replaceState, que não dispara a troca de tela;
// - se a tela lançar erro, o roteador mostra "Não deu para abrir" com o botão de atualizar.

export type Limpeza = () => void;

export type Tela = (raiz: HTMLElement, rota: Rota) => Limpeza | void;
