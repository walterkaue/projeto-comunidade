// Página do evento: lê os dados do link, confere a lista de bloqueio e mostra tudo como texto puro.
// Todo texto do evento entra por textContent (nunca innerHTML). Os href montados por nós passam por
// esc(urlSegura(...)); os internos (denúncia, card) são montados com encodeURIComponent/URLSearchParams.

import { avisar } from '../../comum/aviso';
import { baixarImagem } from '../../comum/compartilhar';
import { ENDERECO_DO_CARDS, linkDeDenuncia, prepararCard, type MotivoDaRemocao } from '../../comum/entreTelas';
import { esc } from '../../comum/html';
import { icone } from '../../comum/icones';
import { NOME } from '../../comum/marca';
import { linkPara } from '../../comum/rotas';
import type { Limpeza } from '../../comum/tela';
import { abrirEvento } from './abrir';
import { gerarIcs, hrefExterno, jaPassou, linkDoGoogleAgenda, linkDoMapa, nomeDoArquivoIcs, quandoNaPagina } from './agenda';
import { MENSAGEM_DO_PROBLEMA } from './formato';
import { dadosDoCardDoEvento, enderecoDoSite, ligarCompartilhar, ligarQr } from './partes';
import { textosDoRemovido, type TextosDoRemovido } from './removido';
import { semIndexar } from './semindexar';
import type { Evento } from './validar';

const NOVO = linkPara('evento');

/** Faixa de cinco cores do topo (enfeite; o CSS é global). */
const FAIXA_DE_CORES = '<div class="faixa-cores" aria-hidden="true"></div>';

/** A faixa de aviso da página (texto de hoje, sem mudar uma palavra). A última frase vai em negrito. */
export const faixaInicio = (nome: string): string =>
  `Conteúdo criado por quem enviou este link. O ${nome} não confere nem guarda este conteúdo. `;
export const FAIXA_FORTE = 'Nunca faça pagamento nem mande documentos pedidos por um evento.';

/** O fim de "quandoNaPagina": fica fora do negrito. */
export const SUFIXO_DO_HORARIO = ' (horário do local do evento)';

/** Separa o texto de "Quando" no que vai em negrito e no sufixo do horário (que não vai). */
export function partirQuando(texto: string): { forte: string; sufixo: string } {
  return texto.endsWith(SUFIXO_DO_HORARIO)
    ? { forte: texto.slice(0, -SUFIXO_DO_HORARIO.length), sufixo: SUFIXO_DO_HORARIO }
    : { forte: texto, sufixo: '' };
}

/** HTML da tela só com uma mensagem (carregando, link ruim). Título em h1 e a saída para criar outro. */
export function htmlDaMensagem(titulo: string, texto: string, ocupado = false, cortado = false): string {
  const criar = (principal: boolean) => `<a class="botao${principal ? '' : ' botao-sec'}" href="${esc(NOVO)}">Criar um evento</a>`;
  const inicio = (principal: boolean) => `<a class="botao${principal ? '' : ' botao-sec'}" href="${esc(linkPara('inicio'))}">Voltar ao início</a>`;
  // Link cortado (B-23): quem recebeu quer voltar a tentar, não criar um evento; a dica diz o que fazer.
  const saidas = cortado ? inicio(true) + criar(false) : criar(true) + inicio(false);
  return `<main class="tela evento" data-porta="evento"${ocupado ? ' aria-busy="true"' : ''}>
    ${FAIXA_DE_CORES}
    <h1 tabindex="-1">${esc(titulo)}</h1>
    <p${ocupado ? ' role="status"' : ''}>${esc(texto)}</p>
    ${cortado ? '<p>Copie a mensagem inteira, até o fim do link.</p>' : ''}
    ${ocupado ? '' : saidas}
  </main>`;
}

/** Tela só com uma mensagem (carregando, link ruim). */
function telaDeMensagem(raiz: HTMLElement, titulo: string, texto: string, foco: boolean, ocupado = false, cortado = false): void {
  raiz.innerHTML = htmlDaMensagem(titulo, texto, ocupado, cortado);
  if (foco) raiz.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
}

/** HTML da tela de link removido: o motivo num aviso de atenção, como pedir revisão e o caminho para as Regras de uso. */
export function htmlDoRemovido(t: TextosDoRemovido): string {
  const paragrafos = t.paragrafos.map((p, i) => `<p>${i === 0 ? `<strong>${esc(p)}</strong>` : esc(p)}</p>`).join('');
  return `<main class="tela evento" data-porta="evento">
    ${FAIXA_DE_CORES}
    <h1 tabindex="-1">${esc(t.titulo)}</h1>
    <div class="aviso-atencao evento-removido">
      ${icone('atencao', { classe: 'aviso-icone' })}
      <div class="aviso-corpo">${paragrafos}</div>
    </div>
    <a class="botao" href="${esc(linkPara('regras'))}">Ver as Regras de uso</a>
    <a class="botao botao-sec" href="${esc(NOVO)}">Criar um evento</a>
    <a class="botao botao-sec" href="${esc(linkPara('inicio'))}">Voltar ao início</a>
  </main>`;
}

/** Tela de link removido. */
function telaDeRemovido(raiz: HTMLElement, motivo: MotivoDaRemocao): void {
  raiz.innerHTML = htmlDoRemovido(textosDoRemovido(motivo));
  raiz.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
}

/** HTML da página do evento (os dados do evento entram depois, por textContent). `denuncia` já vem com esc. */
export function htmlDaPagina(e: Evento, dados: string, denuncia: string, rotuloCompartilhar: string): string {
  return `<main class="tela evento" data-porta="evento">
    ${FAIXA_DE_CORES}
    <aside class="evento-faixa aviso-atencao" aria-label="Aviso sobre este conteúdo">
      ${icone('atencao', { classe: 'aviso-icone' })}
      <div class="aviso-corpo">
        <p id="ev-faixa">${esc(faixaInicio(NOME))}<strong>${esc(FAIXA_FORTE)}</strong></p>
        <a class="evento-denunciar link-acao link-tinta" href="${denuncia}">Denunciar</a>
      </div>
    </aside>

    <p class="evento-convite"><span class="icone-quadro icone-quadro-p">${icone('calendario', { tamanho: 18 })}</span>Convite</p>
    <h1 tabindex="-1" aria-describedby="ev-faixa" data-titulo></h1>
    <p class="evento-organizacao" data-organizacao hidden></p>

    <dl class="evento-dados">
      <div data-bloco-quando><dt>${icone('calendario', { tamanho: 22 })}<span>Quando</span></dt><dd data-quando></dd></div>
      <div><dt>${icone('local', { tamanho: 22 })}<span>Onde</span></dt><dd data-local></dd></div>
    </dl>
    <a class="botao botao-ter" data-mapa target="_blank" rel="noopener noreferrer" data-destino="o mapa" aria-label="Ver no mapa (abre o Google Maps em outro site)" href="${hrefExterno(linkDoMapa(e.local))}">${icone('local', { tamanho: 22 })}Ver no mapa</a>

    <p class="evento-descricao" data-descricao hidden></p>

    <section class="evento-secao" aria-labelledby="ev-h-agenda">
      <h2 id="ev-h-agenda">Adicionar à agenda</h2>
      <button class="botao" type="button" data-ics>Baixar arquivo para a agenda</button>
      <a class="botao botao-ter" target="_blank" rel="noopener noreferrer" data-destino="o Google Agenda" aria-label="Abrir no Google Agenda (abre outro site)" href="${hrefExterno(linkDoGoogleAgenda(e))}">${icone('calendario', { tamanho: 22 })}Abrir no Google Agenda</a>
    </section>

    <section class="evento-secao" aria-labelledby="ev-h-link">
      <h2 id="ev-h-link">Compartilhar</h2>
      <button class="botao" type="button" data-compartilhar>${rotuloCompartilhar}</button>
      <button class="botao botao-ter" type="button" data-qr aria-expanded="false" aria-controls="ev-qr-area">${icone('link', { tamanho: 22 })}QR do link</button>
      <div class="evento-qr-area" id="ev-qr-area" data-qr-area hidden></div>
    </section>

    <section class="evento-secao" aria-labelledby="ev-h-mais">
      <h2 id="ev-h-mais">Mais</h2>
      <a class="botao" href="${esc(ENDERECO_DO_CARDS)}" data-fazer-card>Fazer a imagem deste evento</a>
      <a class="botao botao-ter" href="${esc(linkPara('evento', `editar/${dados}`))}">${icone('lapis', { tamanho: 22 })}Criar outro evento a partir deste</a>
      <a class="botao botao-ter" href="${denuncia}">${icone('denunciar', { tamanho: 22 })}Denunciar este evento</a>
      <a class="botao botao-ter" href="${esc(linkPara('inicio'))}">${icone('direita', { tamanho: 22 })}Conhecer o ${esc(NOME)}</a>
    </section>
  </main>`;
}

function pagina(raiz: HTMLElement, e: Evento, dados: string, vivo: () => boolean): void {
  // Sempre o endereço limpo do site + "#/evento/<dados>", na forma que ehLinkDoEvento aceita, mesmo que a pessoa
  // tenha aberto "#evento/<dados>" (sem a barra): senão o card e a denúncia perderiam o link.
  const link = `${enderecoDoSite()}${linkPara('evento', dados)}`;
  const denuncia = esc(linkDeDenuncia(link));

  raiz.innerHTML = htmlDaPagina(e, dados, denuncia, 'share' in navigator ? 'Compartilhar este link' : 'Copiar o link');

  const $ = <T extends HTMLElement>(sel: string): T => {
    const el = raiz.querySelector<T>(sel);
    if (!el) throw new Error(`faltou ${sel}`);
    return el;
  };
  $('[data-titulo]').textContent = e.titulo;
  // Dia e hora em negrito; "(horário do local do evento)" fica sem negrito. O textContent do dd não muda.
  const quando = partirQuando(quandoNaPagina(e));
  const forte = document.createElement('strong');
  forte.textContent = quando.forte;
  $('[data-quando]').append(forte, quando.sufixo);
  if (jaPassou(e, new Date())) {
    const passou = document.createElement('dd');
    passou.textContent = 'Este evento já passou.';
    $('[data-bloco-quando]').append(passou);
  }
  const onde = document.createElement('strong');
  onde.textContent = e.local;
  $('[data-local]').append(onde);
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
    avisar('Se o arquivo não aparecer, toque em Abrir no Google Agenda.');
  });
  // O card vai pela memória da aba, no toque (nunca no link: auditoria 05/11/2026, M5).
  $('[data-fazer-card]').addEventListener('click', () => prepararCard(dadosDoCardDoEvento(e, link), location.href));
  ligarCompartilhar($<HTMLButtonElement>('[data-compartilhar]'), () => ({ link, evento: e }), 'Não deu para copiar. Copie o endereço da barra do navegador.');
  ligarQr($<HTMLButtonElement>('[data-qr]'), $('[data-qr-area]'), () => link, vivo);

  $('h1').focus({ preventScroll: true });
}

/** Tela `#/evento/<dados>`. Nunca lança erro: link ruim, bloqueado ou falha viram mensagem. */
export function telaPagina(raiz: HTMLElement, dados: string): Limpeza {
  const liberarIndexacao = semIndexar(document);
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
        telaDeMensagem(raiz, 'Não deu para abrir este evento', MENSAGEM_DO_PROBLEMA[r.problema], true, false, r.problema === 'malformado');
      } else {
        const limpos = r.dados ?? dados;
        // Cola no fim do link (ponto, "Obrigada!"): a barra volta ao link limpo, sem remontar a tela (B-03).
        if (limpos !== dados) history.replaceState(history.state, '', linkPara('evento', limpos));
        pagina(raiz, r.evento, limpos, vivo);
      }
    } catch (erro) {
      console.error(erro);
      if (vivo()) telaDeMensagem(raiz, 'Não deu para abrir este evento', MENSAGEM_DO_PROBLEMA.malformado, true);
    }
  })();

  return () => {
    aberta = false;
    liberarIndexacao();
  };
}
