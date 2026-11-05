// Andar entre os passos sem sujar o histórico. O endereço leva só o tipo e o passo (estado.ts: enderecoDoPasso);
// o que a pessoa digitou fica em memoria.ts.
//
// "Voltar" usa history.back() só enquanto houver passos que o "Continuar" empurrou nesta sequência (contador);
// sem eles, troca o endereço (replace). Assim Voltar nunca sai do site nem enche o histórico.

import { linkPara } from '../../comum/rotas';
import { enderecoDoPasso, passoAnterior, type Passo, type Tipo } from './estado';

/** O pedaço de `location` e `history` que este módulo usa (os testes passam um falso). */
export interface Ambiente {
  location: { hash: string; replace(endereco: string): void };
  history: { back(): void };
}

const doNavegador = (): Ambiente => ({ location, history });

const INICIO = linkPara('inicio');
const ehInicio = (hash: string) => hash === '' || hash === '#' || hash === INICIO;

// Passos que o Continuar empurrou no histórico nesta sequência (só na memória da aba).
let empurrados = 0;
// Hash de agora e o anterior (null = não sei, por exemplo quem abriu o endereço direto).
let hashAtual: string | null = null;
let hashAnterior: string | null = null;
let ouvindo = false;

/** Zera a contagem (replace, "Mudar algo", "Fazer outro", entrar por #/cards ou editar). */
export function zerarPassos(): void {
  empurrados = 0;
}

/** Quantos passos o Continuar empurrou (para os testes). */
export const passosEmpurrados = (): number => empurrados;

/** Anota uma mudança de hash para saber de onde a pessoa veio. */
export function registrarHash(novo: string): void {
  hashAnterior = hashAtual;
  hashAtual = novo;
}

/** A pessoa chegou a este passo vindo do início ("#/")? Só com certeza: sem saber, não é. */
export const veioDoInicio = (): boolean => hashAnterior !== null && ehInicio(hashAnterior);

/** Passa a anotar os hashes (uma vez só). A primeira entrada, antes de a tela existir, não dá para saber. */
export function observarHash(janela: Pick<Window, 'addEventListener'> & { location: { hash: string } } = window): void {
  if (ouvindo) return;
  ouvindo = true;
  hashAtual = janela.location.hash;
  janela.addEventListener('hashchange', () => registrarHash(janela.location.hash));
}

/** Só para os testes. */
export function reiniciarNavegacao(): void {
  empurrados = 0;
  hashAtual = null;
  hashAnterior = null;
}

/** Vai a um passo adiante (Continuar, Pular): o roteador remonta a tela. */
export function irAoPasso(tipo: Tipo, passo: Passo, amb: Ambiente = doNavegador()): void {
  empurrados++;
  amb.location.hash = enderecoDoPasso(tipo, passo);
}

/** Volta um passo. Do passo 1 volta ao início. */
export function voltarDoPasso(tipo: Tipo, passo: Passo, amb: Ambiente = doNavegador()): void {
  const antes = passoAnterior(passo);
  if (antes === null) {
    empurrados = 0;
    if (veioDoInicio()) amb.history.back();
    else amb.location.replace(INICIO);
    return;
  }
  if (empurrados > 0) {
    empurrados--;
    amb.history.back();
    return;
  }
  amb.location.replace(enderecoDoPasso(tipo, antes));
}

/** "Mudar algo": volta ao passo 1 a partir do Pronto. */
export function mudarAlgo(tipo: Tipo, amb: Ambiente = doNavegador()): void {
  empurrados = 0;
  amb.location.hash = enderecoDoPasso(tipo, 1);
}

/** "Fazer outro": começa de novo no início. */
export function irAoInicio(amb: Ambiente = doNavegador()): void {
  empurrados = 0;
  amb.location.hash = INICIO;
}
