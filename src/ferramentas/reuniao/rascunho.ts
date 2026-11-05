// Rascunho da reunião, SÓ na memória da aba aberta (decisão de 05/11/2026).
// Variável do módulo: sobrevive a trocar de tela dentro do site e some ao fechar a aba.
// Proibido guardar em localStorage, sessionStorage, IndexedDB, cookie, link ou history
// (rascunho.test.ts confere). A lista de presença pode revelar filiação: nunca sai do aparelho.

import { ataVazia, temConteudo, type Ata } from './ata';
import { convocacaoVazia, type Convocacao } from './convocacao';

export const rascunho: { convocacao: Convocacao; ata: Ata } = {
  convocacao: convocacaoVazia(),
  ata: ataVazia(),
};

export function apagarAta(): void {
  rascunho.ata = ataVazia();
}

export function apagarConvocacao(): void {
  rascunho.convocacao = convocacaoVazia();
}

/** Há ata digitada que se perderia ao fechar a aba? */
export function haAtaNaMemoria(): boolean {
  return temConteudo(rascunho.ata);
}

let ligado = false;

/** Aviso do navegador ao fechar ou recarregar a aba com ata digitada. Liga uma vez só. */
export function ligarAvisoDeSaidaDaAta(janela: Pick<Window, 'addEventListener'> = window): void {
  if (ligado) return;
  ligado = true;
  janela.addEventListener('beforeunload', (e) => {
    if (!haAtaNaMemoria()) return;
    e.preventDefault();
    // Navegadores antigos pedem o returnValue preenchido para mostrar o aviso.
    e.returnValue = '';
  });
}
