// Página do evento: lê os dados do link, confere a lista de bloqueio e mostra tudo como texto puro.
// Todo texto do evento entra por textContent (nunca innerHTML). Os href montados por nós passam por
// esc(urlSegura(...)); os internos (denúncia, card) são montados com encodeURIComponent/URLSearchParams.

import { avisar } from '../../comum/aviso';
import { baixarImagem } from '../../comum/compartilhar';
import { ENDERECO_DO_CARDS, linkDeDenuncia, prepararCard, type MotivoDaRemocao } from '../../comum/entreTelas';
import { esc } from '../../comum/html';
import { NOME } from '../../comum/marca';
import { linkPara } from '../../comum/rotas';
import type { Limpeza } from '../../comum/tela';
import { abrirEvento } from './abrir';
import { dataPorExtenso, gerarIcs, hrefExterno, horarioPorExtenso, linkDoGoogleAgenda, linkDoMapa, nomeDoArquivoIcs } from './agenda';
import { MENSAGEM_DO_PROBLEMA } from './formato';
import { dadosDoCardDoEvento, enderecoDoSite, ligarCompartilhar, ligarQr } from './partes';
import { textosDoRemovido } from './removido';
import type { Evento } from './validar';

const NOVO = linkPara('evento');

/** Tela só com uma mensagem (carregando, removido, link ruim). Título em h1 e a saída para criar outro. */
function telaDeMensagem(raiz: HTMLElement, titulo: string, texto: string, foco: boolean, ocupado = false): void {
  raiz.innerHTML = `<main class="tela evento"${ocupado ? ' aria-busy="true"' : ''}>
    <h1 tabindex="-1">${esc(titulo)}</h1>
    <p${ocupado ? ' role="status"' : ''}>${esc(texto)}</p>
    ${
      ocupado
        ? ''
        : `<a class="botao" href="${esc(NOVO)}">Criar um evento</a>
    <a class="botao botao-sec" href="${esc(linkPara('inicio'))}">Voltar ao início</a>`
    }
  </main>`;
  if (foco) raiz.querySelector<HTMLElement>('h1')?.focus();
}

/** Tela de link removido: o motivo, como pedir revisão e o caminho para as Regras de uso. */
function telaDeRemovido(raiz: HTMLElement, motivo: MotivoDaRemocao): void {
  const t = textosDoRemovido(motivo);
  raiz.innerHTML = `<main class="tela evento">
    <h1 tabindex="-1">${esc(t.titulo)}</h1>
    ${t.paragrafos.map((p) => `<p>${esc(p)}</p>`).join('')}
    <a class="botao" href="${esc(linkPara('regras'))}">Ver as Regras de uso</a>
    <a class="botao botao-sec" href="${esc(NOVO)}">Criar um evento</a>
    <a class="botao botao-sec" href="${esc(linkPara('inicio'))}">Voltar ao início</a>
  </main>`;
  raiz.querySelector<HTMLElement>('h1')?.focus();
}

function pagina(raiz: HTMLElement, e: Evento, dados: string, vivo: () => boolean): void {
  // Sempre o endereço limpo do site + o hash do evento (sem "?…" de quem abriu por um link com rastreio).
  const link = `${enderecoDoSite()}${location.hash}`;
  const denuncia = esc(linkDeDenuncia(link));

  raiz.innerHTML = `<main class="tela evento">
    <aside class="evento-faixa" aria-label="Aviso sobre este conteúdo">
      <p id="ev-faixa">Conteúdo criado por quem enviou este link. O ${esc(NOME)} não confere nem guarda este conteúdo.</p>
      <a class="evento-denunciar" href="${denuncia}">Denunciar</a>
    </aside>

    <h1 tabindex="-1" aria-describedby="ev-faixa" data-titulo></h1>
    <p class="evento-organizacao" data-organizacao hidden></p>

    <dl class="evento-dados">
      <div><dt>Quando</dt><dd data-quando></dd></div>
      <div><dt>Onde</dt><dd data-local></dd></div>
    </dl>
    <a class="botao botao-sec" data-mapa target="_blank" rel="noopener noreferrer" aria-label="Ver no mapa (abre o Google Maps em outro site)" href="${hrefExterno(linkDoMapa(e.local))}">Ver no mapa</a>

    <p class="evento-descricao" data-descricao hidden></p>

    <section class="evento-secao" aria-labelledby="ev-h-agenda">
      <h2 id="ev-h-agenda">Adicionar à agenda</h2>
      <button class="botao" type="button" data-ics>Baixar arquivo para a agenda</button>
      <a class="botao botao-sec" target="_blank" rel="noopener noreferrer" aria-label="Abrir no Google Agenda (abre outro site)" href="${hrefExterno(linkDoGoogleAgenda(e))}">Abrir no Google Agenda</a>
    </section>

    <section class="evento-secao" aria-labelledby="ev-h-link">
      <h2 id="ev-h-link">Compartilhar</h2>
      <button class="botao" type="button" data-compartilhar>Compartilhar este link</button>
      <button class="botao botao-sec" type="button" data-qr aria-expanded="false" aria-controls="ev-qr-area">QR do link</button>
      <div class="evento-qr-area" id="ev-qr-area" data-qr-area hidden></div>
    </section>

    <section class="evento-secao" aria-labelledby="ev-h-mais">
      <h2 id="ev-h-mais">Mais</h2>
      <a class="botao botao-sec" href="${esc(ENDERECO_DO_CARDS)}" data-fazer-card>Fazer o card deste evento</a>
      <a class="botao botao-sec" href="${esc(linkPara('evento', `editar/${dados}`))}">Criar outro evento a partir deste</a>
      <a class="botao botao-sec" href="${denuncia}">Denunciar este evento</a>
      <a class="botao botao-sec" href="${esc(linkPara('inicio'))}">Conhecer o ${esc(NOME)}</a>
    </section>
  </main>`;

  const $ = <T extends HTMLElement>(sel: string): T => {
    const el = raiz.querySelector<T>(sel);
    if (!el) throw new Error(`faltou ${sel}`);
    return el;
  };
  $('[data-titulo]').textContent = e.titulo;
  $('[data-quando]').textContent = `${dataPorExtenso(e.data)}, ${horarioPorExtenso(e.inicio, e.fim)}`;
  $('[data-local]').textContent = e.local;
  if (e.organizacao) {
    const org = $('[data-organizacao]');
    // Quem chama é o que quem criou o link escreveu: o site não confere (auditoria 05/11/2026, M6).
    org.textContent = `Quem chama, segundo quem criou o link: ${e.organizacao}`;
    org.hidden = false;
  }
  if (e.descricao) {
    const d = $('[data-descricao]');
    d.textContent = e.descricao;
    d.hidden = false;
  }

  $('[data-ics]').addEventListener('click', () => {
    baixarImagem(new Blob([gerarIcs(e)], { type: 'text/calendar;charset=utf-8' }), nomeDoArquivoIcs(e.titulo));
    avisar('Arquivo da agenda baixado. Abra-o para adicionar o evento.');
  });
  // O card vai pela memória da aba, no toque (nunca no link: auditoria 05/11/2026, M5).
  $('[data-fazer-card]').addEventListener('click', () => prepararCard(dadosDoCardDoEvento(e, link), location.href));
  ligarCompartilhar($<HTMLButtonElement>('[data-compartilhar]'), () => ({ link, evento: e }));
  ligarQr($<HTMLButtonElement>('[data-qr]'), $('[data-qr-area]'), () => link, vivo);

  $('h1').focus();
}

/** Tela `#/evento/<dados>`. Nunca lança erro: link ruim, bloqueado ou falha viram mensagem. */
export function telaPagina(raiz: HTMLElement, dados: string): Limpeza {
  let aberta = true;
  const vivo = () => aberta;
  // O roteador põe o foco no h1 logo depois desta chamada; o conteúdo vem a seguir.
  telaDeMensagem(raiz, 'Abrindo o evento…', 'Conferindo o link.', false, true);

  void (async () => {
    try {
      const r = await abrirEvento(dados);
      if (!vivo()) return;
      if (r.estado === 'bloqueado') {
        telaDeRemovido(raiz, r.motivo);
      } else if (r.estado === 'problema') {
        telaDeMensagem(raiz, 'Não deu para abrir este evento', MENSAGEM_DO_PROBLEMA[r.problema], true);
      } else {
        pagina(raiz, r.evento, dados, vivo);
      }
    } catch (erro) {
      console.error(erro);
      if (vivo()) telaDeMensagem(raiz, 'Não deu para abrir este evento', MENSAGEM_DO_PROBLEMA.malformado, true);
    }
  })();

  return () => {
    aberta = false;
  };
}
