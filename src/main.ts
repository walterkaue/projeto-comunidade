// Entrada do site: tema, roteador por # e telas sob demanda.
// Só a página inicial vai no pacote inicial (limite em testes/peso.test.ts); cada ferramenta baixa quando abre.

import './comum/fontes.css';
import './comum/tema.css';
import './comum/componentes.css';
import { prepararAviso } from './comum/aviso';
import { ligarMetricas } from './comum/metricas';
import { lerRota, linkPara, type NomeDaRota, type Rota } from './comum/rotas';
import { ligarAvisoDeSaida } from './comum/saida';
import type { Limpeza, Tela } from './comum/tela';
import { NOME } from './comum/marca';
import { esc } from './comum/html';
import { RODAPE, telaInicio } from './paginas/inicio';
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
  contato: paginas,
};

const raiz = document.getElementById('app')!;
const rodapeComum = document.getElementById('rodape-comum');

// Rodapé com Sobre, Termos, Regras e "Como denunciar" em toda tela (quem chega por um link de evento no
// WhatsApp precisa achar as regras sem voltar ao início). A página inicial tem o próprio rodapé.
if (rodapeComum) {
  rodapeComum.innerHTML = `<nav aria-label="Informações"><ul>
    <li><a href="${linkPara('inicio')}">Início</a></li>
    ${RODAPE.map((r) => `<li><a href="${linkPara(r.rota)}">${esc(r.titulo)}</a></li>`).join('')}
  </ul></nav>`;
}

// Título da aba = título da tela (WCAG 2.4.2). Observa o <h1>, porque algumas telas carregam o conteúdo
// depois (o evento confere a lista de bloqueio antes de mostrar).
function atualizarTitulo(): void {
  const h1 = raiz.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const titulo = !h1 || h1 === NOME ? NOME : `${h1} · ${NOME}`;
  if (document.title !== titulo) document.title = titulo;
}
new MutationObserver(atualizarTitulo).observe(raiz, { childList: true, subtree: true, characterData: true });
let limpar: Limpeza | void;
let navegacao = 0;
let primeira = true;

function mostrar(tela: Tela, rota: Rota): void {
  limpar?.();
  limpar = undefined;
  try {
    limpar = tela(raiz, rota);
  } catch (erro) {
    // Ex.: um link de evento malformado. Nunca deixa a pessoa numa tela morta.
    console.error(erro);
    mostrarFalha('Não deu para abrir', 'Esta parte encontrou um problema. Atualize a página ou volte ao início.');
    return;
  }
  // Leitor de tela: a cada troca de tela, o foco vai para o título (na primeira, fica no começo da página).
  if (!primeira) raiz.querySelector<HTMLElement>('h1')?.focus();
  primeira = false;
  window.scrollTo(0, 0);
}

function telaCarregando(): string {
  return `<main class="tela" aria-busy="true"><h1 tabindex="-1">Carregando…</h1></main>`;
}

/**
 * Tela de falha. O botão recarrega a página: o navegador guarda o import() que falhou, e depois de um
 * deploy novo os arquivos antigos somem; recarregar resolve os dois casos.
 */
function mostrarFalha(titulo: string, texto: string): void {
  raiz.innerHTML = `<main class="tela">
    <h1 tabindex="-1">${titulo}</h1>
    <p>${texto}</p>
    <button class="botao" type="button" data-atualizar>Atualizar a página</button>
    <a class="botao botao-sec" href="#/">Voltar ao início</a>
  </main>`;
  raiz.querySelector<HTMLElement>('h1')?.focus();
  raiz.querySelector('[data-atualizar]')?.addEventListener('click', () => location.reload());
}

function abrir(): void {
  const rota = lerRota(location.hash);
  const alvo = TELAS[rota.nome];
  const minha = ++navegacao;
  if (rodapeComum) rodapeComum.hidden = rota.nome === 'inicio';
  if (alvo === telaInicio) {
    mostrar(telaInicio, rota);
    return;
  }
  limpar?.();
  limpar = undefined;
  raiz.innerHTML = telaCarregando();
  // Leitor de tela: em internet lenta, o foco não fica perdido enquanto a parte baixa.
  if (!primeira) raiz.querySelector<HTMLElement>('h1')?.focus();
  (alvo as Carregador)().then(
    (m) => {
      if (minha === navegacao) mostrar(m.tela, rota);
    },
    () => {
      if (minha !== navegacao) return;
      mostrarFalha('Sem conexão', 'Não deu para abrir esta parte agora. Confira a internet e atualize a página.');
    },
  );
}

prepararAviso();
ligarAvisoDeSaida();
window.addEventListener('hashchange', abrir);
abrir();
registrarServiceWorker();
ligarMetricas();
