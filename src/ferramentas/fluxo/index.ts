// Fluxo único (docs/produto.md 7.6): a tela que o roteador chama para #/fazer/…, #/cards, #/evento sem dados,
// #/evento/editar/<dados> e #/reuniao. Os dados ficam só em memoria.ts; o endereço leva só o tipo e o passo.
// Carregada sob demanda (src/main.ts).

import './fluxo.css';
import { avisar } from '../../comum/aviso';
import { pegarCardPreparado } from '../../comum/entreTelas';
import type { Tela } from '../../comum/tela';
import { abrirParaEditar } from './editar';
import { dadosDoCardPreparado, enderecoDoPasso, lerDestino, passoPendente } from './estado';
import { dadosDo, existe, trocarPorDadosDeLink } from './memoria';
import { observarHash, zerarPassos } from './navegacao';
import { montarPasso } from './passos';
import { montarPronto } from './pronto';

/** Troca o endereço sem empilhar histórico (e zera a contagem de passos do Voltar). */
function trocarEndereco(endereco: string): void {
  zerarPassos();
  location.replace(endereco);
}

/**
 * Aviso de um redirecionamento: sai depois que o roteador monta o passo e põe o foco no título. Antes disso,
 * o leitor de tela descarta a fala pendente quando o foco muda.
 */
function avisarDepoisDoTitulo(mensagem: string): void {
  setTimeout(() => avisar(mensagem), 700);
}

export const tela: Tela = (raiz, rota) => {
  observarHash();
  const destino = lerDestino(rota);
  let aberta = true;
  let limpeza: (() => void) | undefined;

  switch (destino.tipo) {
    case 'redirecionar':
      trocarEndereco(destino.para);
      return;
    case 'preparado': {
      const d = dadosDoCardPreparado(pegarCardPreparado());
      if (!d) {
        trocarEndereco('#/');
        return;
      }
      // Se a pessoa já tinha um rascunho dela e recusou a troca, volta ao passo 1 com ele.
      trocarEndereco(enderecoDoPasso(d.tipo, trocarPorDadosDeLink(d) ? 3 : 1));
      return;
    }
    case 'editar':
      void abrirParaEditar(raiz, destino.dados, () => aberta);
      break;
    case 'passo': {
      // Sem dados na memória desta aba (recarregou, marcador): começa pelo passo 1.
      if (destino.passo !== 1 && !existe(destino.modelo)) {
        trocarEndereco(enderecoDoPasso(destino.modelo, 1));
        avisarDepoisDoTitulo('Comece pelo passo 1.');
        return;
      }
      const d = dadosDo(destino.modelo);
      const antes = passoPendente(d, destino.passo);
      if (antes) {
        trocarEndereco(enderecoDoPasso(destino.modelo, antes));
        avisarDepoisDoTitulo(`Falta preencher o passo ${antes}.`);
        return;
      }
      limpeza = destino.passo === 'pronto' ? montarPronto(raiz, d) : montarPasso(raiz, d, destino.passo);
      break;
    }
  }

  return () => {
    aberta = false;
    limpeza?.();
  };
};
