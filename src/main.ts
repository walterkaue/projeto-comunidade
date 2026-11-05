// Entrada do site: tema, roteador por # e telas sob demanda.
// Só a página inicial vai no pacote inicial (limite em testes/peso.test.ts); cada ferramenta baixa quando abre.

import './comum/fontes.css';
import './comum/tema.css';
import './comum/componentes.css';
import { ligarMetricas } from './comum/metricas';
import { lerRota, type NomeDaRota, type Rota } from './comum/rotas';
import { ligarAvisoDeSaida } from './comum/saida';
import type { Limpeza, Tela } from './comum/tela';
import { telaInicio } from './paginas/inicio';
import { registrarServiceWorker } from './pwa';

type Carregador = () => Promise<{ tela: Tela }>;

const paginas: Carregador = () => import('./paginas/index');

const TELAS: Record<NomeDaRota, Tela | Carregador> = {
  inicio: telaInicio,
  cards: () => import('./ferramentas/cards/index'),
  evento: () => import('./ferramentas/evento/index'),
  reuniao: () => import('./ferramentas/reuniao/index'),
  sobre: paginas,
  termos: paginas,
  privacidade: paginas,
  regras: paginas,
  denunciar: paginas,
};

const raiz = document.getElementById('app')!;
let limpar: Limpeza | void;
let navegacao = 0;
let primeira = true;

function mostrar(tela: Tela, rota: Rota): void {
  limpar?.();
  limpar = tela(raiz, rota);
  // Leitor de tela: a cada troca de tela, o foco vai para o título (na primeira, fica no começo da página).
  if (!primeira) raiz.querySelector<HTMLElement>('h1')?.focus();
  primeira = false;
  window.scrollTo(0, 0);
}

function telaCarregando(): string {
  return `<main class="tela" aria-busy="true"><p role="status">Carregando…</p></main>`;
}

function telaSemRede(): string {
  return `<main class="tela">
    <h1 tabindex="-1">Sem conexão</h1>
    <p>Não deu para abrir esta parte agora. Confira a internet e tente de novo.</p>
    <button class="botao" type="button" data-tentar>Tentar de novo</button>
    <a class="botao botao-sec" href="#/">Voltar ao início</a>
  </main>`;
}

function abrir(): void {
  const rota = lerRota(location.hash);
  const alvo = TELAS[rota.nome];
  const minha = ++navegacao;
  if (alvo === telaInicio) {
    mostrar(telaInicio, rota);
    return;
  }
  limpar?.();
  limpar = undefined;
  raiz.innerHTML = telaCarregando();
  (alvo as Carregador)().then(
    (m) => {
      if (minha === navegacao) mostrar(m.tela, rota);
    },
    () => {
      if (minha !== navegacao) return;
      raiz.innerHTML = telaSemRede();
      raiz.querySelector('h1')?.focus();
      raiz.querySelector('[data-tentar]')?.addEventListener('click', abrir);
    },
  );
}

ligarAvisoDeSaida();
window.addEventListener('hashchange', abrir);
abrir();
registrarServiceWorker();
ligarMetricas();
