// Tela "Pronto" (#/fazer/<tipo>/pronto): um botão principal (imagem + texto no WhatsApp), logo abaixo do título e
// do aviso do exemplo (cabe na primeira tela de 360 × 640), depois a prévia, as outras saídas
// (baixar, copiar, imprimir cartaz), "Mudar algo", "Fazer outro" e, na reunião, a ponte para a ata.
// Nada daqui vai para link nem armazenamento; o único link com dados é o do evento (link.ts).

import { avisar } from '../../comum/aviso';
import { baixarImagem, canvasParaArquivo, compartilhar } from '../../comum/compartilhar';
import { esc } from '../../comum/html';
import { nivelDoAparelho } from '../../comum/nivel';
import { linkPara } from '../../comum/rotas';
import { escalaDoFormato } from '../cards/modelos';
import { rascunho } from '../reuniao/rascunho';
import { temConteudo } from '../reuniao/ata';
import { cortesDoCartaz } from '../cards/desenho';
import {
  AVISO_FAZER_OUTRO,
  avisoDoCompartilhamento,
  descricaoDaImagem,
  dicaDoMandar,
  enderecoDaPaginaDoEvento,
  frasePainel,
  idsDaDescricao,
  MENSAGEM_DE_BAIXAR,
  MENSAGEM_SEM_INTERNET,
  MENSAGEM_SEM_LINK,
  nomeDoArquivoDoFluxo,
  notaDoCorte,
  precisaConfirmar,
  temMenuDeCompartilhar,
} from './apoio';
import {
  avisoDoExemplo,
  fraseDoLinkNoPronto,
  camposDoCard,
  camposDoExemplo,
  convocacaoDoFluxo,
  exemploNoLink,
  fraseDaConfirmacao,
  lembreteDoDia,
  NOTA_DO_LINK,
  PORTAS,
  temAgenda,
  textoParaMandar,
  type DadosDoFluxo,
} from './estado';
import { linkDoFluxo, type ResultadoDoLink } from './link';
import { esquecerTudo } from './memoria';
import { irAoInicio, mudarAlgo } from './navegacao';
import { ataComAPauta, haPontosComTexto, PERGUNTA_DA_TROCA } from './ponte';
import { desenharCardEm, esperarFontes, medirFaixasFixas } from './previa';

export function montarPronto(raiz: HTMLElement, d: DadosDoFluxo): () => void {
  const agenda = temAgenda(d.tipo);
  const nivel = nivelDoAparelho();
  // O que ainda é do exemplo (qualquer origem): o aviso, a confirmação e a falta do link dependem só disto.
  const doExemplo = camposDoExemplo(d);
  const aviso = avisoDoExemplo(doExemplo);
  const lembrete = lembreteDoDia(d);

  raiz.innerHTML = `<main class="tela fluxo fluxo-pronto">
    <h1 tabindex="-1"><span class="fluxo-verbo">${esc(PORTAS[d.tipo].verbo)}</span><span class="fluxo-so-leitor">: </span><span class="fluxo-pronto-titulo">Pronto!</span></h1>
    ${d.origem === 'link' ? `<p class="fluxo-nota">${esc(NOTA_DO_LINK)}</p>` : ''}
    ${aviso ? `<p class="fluxo-nota fluxo-nota-curta" id="fluxo-aviso-exemplo">${esc(aviso)}</p>` : ''}

    ${lembrete ? `<p class="fluxo-nota fluxo-nota-curta" id="fluxo-lembrete-dia">${esc(lembrete)}</p>` : ''}

    <button type="button" class="botao fluxo-mandar" id="fluxo-mandar" aria-describedby="${esc(idsDaDescricao(!!aviso, ...(lembrete ? ['fluxo-lembrete-dia'] : []), 'fluxo-mandar-dica'))}">Mandar no WhatsApp</button>
    <p class="campo-dica" id="fluxo-mandar-dica">${esc(dicaDoMandar(d.formato, temMenuDeCompartilhar()))}</p>
    <p class="campo-dica" id="fluxo-aviso-link" hidden>${esc(fraseDoLinkNoPronto(d))}</p>
    <p class="fluxo-estado fluxo-estado-neutro" id="fluxo-link-estado" role="status">${agenda ? 'Preparando o link…' : ''}</p>
    <button type="button" class="botao botao-sec" id="fluxo-tentar-link" hidden>Tentar de novo</button>
    <a class="botao botao-sec" id="fluxo-regras" href="${esc(linkPara('regras'))}" hidden>Ver as Regras de uso</a>

    <div class="fluxo-moldura"><canvas id="fluxo-canvas" role="img" aria-label="Prévia da imagem"></canvas></div>
    <p class="fluxo-estado" id="fluxo-estado"></p>

    <div class="fluxo-saidas">
      <button type="button" class="botao botao-sec" id="fluxo-baixar">Baixar a imagem</button>
      <button type="button" class="botao botao-sec" id="fluxo-copiar-texto">Copiar só o texto</button>
      <button type="button" class="botao botao-sec" id="fluxo-copiar-link"${aviso ? ' aria-describedby="fluxo-aviso-exemplo"' : ''} hidden>Copiar o link</button>
      <button type="button" class="botao botao-sec" id="fluxo-imprimir">Imprimir cartaz para o mural</button>
      <p class="fluxo-nota-corte" id="fluxo-nota-corte" hidden></p>
      ${d.tipo === 'reuniao' ? '<p class="campo-dica" id="fluxo-aviso-qr" hidden>O QR do cartaz abre a pauta inteira.</p>' : ''}
      <a class="botao botao-sec" id="fluxo-pagina" href="#/" hidden>Ver a página do evento</a>
    </div>

    <div class="fluxo-confirma" id="fluxo-confirma" role="group" aria-labelledby="fluxo-confirma-texto" hidden>
      <p id="fluxo-confirma-texto"></p>
      <button type="button" class="botao" id="fluxo-confirma-mudar" aria-describedby="fluxo-confirma-texto">Mudar algo</button>
      <button type="button" class="botao botao-sec" id="fluxo-confirma-seguir"></button>
    </div>

    <div class="fluxo-acoes">
      <button type="button" class="botao botao-sec" id="fluxo-mudar">Mudar algo</button>
    </div>
    ${
      d.tipo === 'reuniao'
        ? `<section class="fluxo-ata" aria-labelledby="fluxo-ata-titulo">
      <h2 id="fluxo-ata-titulo">E depois da reunião?</h2>
      <button type="button" class="botao botao-sec" id="fluxo-ata">Fazer a ata</button>
      <p class="campo-dica">A ata já começa com a pauta. Ela fica só neste aparelho.</p>
    </section>`
        : ''
    }
    <div class="fluxo-fazer-outro">
      <p class="campo-dica" id="fluxo-outro-dica">${esc(AVISO_FAZER_OUTRO)}</p>
      <button type="button" id="fluxo-outro" aria-describedby="fluxo-outro-dica">Fazer outro</button>
    </div>
  </main>`;

  const q = <T extends HTMLElement>(id: string) => raiz.querySelector<T>(`[id="${id}"]`)!;
  const canvas = q<HTMLCanvasElement>('fluxo-canvas');
  const estado = q('fluxo-estado');
  const estadoDoLink = q('fluxo-link-estado');

  const medidas = medirFaixasFixas(raiz);
  const tentar = q<HTMLButtonElement>('fluxo-tentar-link');
  estadoDoLink.tabIndex = -1;
  let vivo = true;
  let ocupado = false;
  let deAcao = false;

  /** Mensagem importante: na tela e também no aviso falado. */
  function dizer(mensagem: string): void {
    estado.textContent = mensagem;
    avisar(mensagem);
  }
  /** Instrução de como continuar depois de um toque: fica escrita na tela até a próxima ação. */
  function dizerDeAcao(mensagem: string): void {
    deAcao = true;
    dizer(mensagem);
  }

  // ---------- o link e a imagem (refeitos quando a pessoa toca em "Tentar de novo" ou a rede volta) ----------
  // Os botões que dependem do link esperam a promessa ATUAL, que nunca falha: qualquer erro vira "sem link".
  let tentativa = 0;
  let resultado: ResultadoDoLink | undefined; // undefined = ainda preparando
  let linkPronto: Promise<ResultadoDoLink>;
  let arquivoPronto: Promise<File>;
  let haLink = false;
  let semQr = false;

  async function buscarLink(): Promise<ResultadoDoLink> {
    if (!agenda) return { link: '', aviso: '' };
    let base: string;
    try {
      base = (await import('../evento/partes')).enderecoDoSite();
    } catch {
      return { link: '', aviso: MENSAGEM_SEM_INTERNET, semRede: true };
    }
    try {
      return await linkDoFluxo(d, base);
    } catch {
      return { link: '', aviso: MENSAGEM_SEM_LINK };
    }
  }

  // "Imprimir cartaz" é descrito pela nota do QR e pela nota do corte, as que estiverem à vista.
  function atualizarDescricaoDoImprimir(): void {
    const ids = ['fluxo-aviso-qr', 'fluxo-nota-corte'].filter((id) => {
      const el = raiz.querySelector<HTMLElement>(`[id="${id}"]`);
      return !!el && !el.hidden;
    });
    const botao = q('fluxo-imprimir');
    if (ids.length) botao.setAttribute('aria-describedby', ids.join(' '));
    else botao.removeAttribute('aria-describedby');
  }

  // A nota "O QR do cartaz abre a pauta inteira." só vale com link e com QR. Venha o link antes ou depois do
  // desenho, o QR que falhou vence.
  function atualizarNotaDoQr(): void {
    const nota = raiz.querySelector<HTMLElement>('[id="fluxo-aviso-qr"]');
    if (nota) nota.hidden = !(haLink && !semQr);
    atualizarDescricaoDoImprimir();
  }

  /** O cartaz corta o local ou a organização mesmo na letra menor? Mede fora da tela, com o link de agora. */
  async function medirCorte(n: number, link: string): Promise<void> {
    const nota = q('fluxo-nota-corte');
    try {
      await esperarFontes();
      if (!vivo || n !== tentativa) return;
      const ctx = document.createElement('canvas').getContext('2d');
      const texto = ctx ? notaDoCorte(cortesDoCartaz(ctx, camposDoCard(d, link), !!link)) : '';
      nota.textContent = texto;
      nota.hidden = !texto;
    } catch {
      nota.hidden = true;
    }
    atualizarDescricaoDoImprimir();
  }

  function aplicarLink({ link, aviso: msg, removido, semRede }: ResultadoDoLink): void {
    // O erro do link é anunciado uma vez só: esta região é role="status".
    estadoDoLink.textContent = msg;
    q('fluxo-regras').hidden = !removido;
    tentar.hidden = !semRede;
    q('fluxo-copiar-link').hidden = !link;
    q('fluxo-aviso-link').hidden = !link;
    haLink = !!link;
    atualizarNotaDoQr();
    // A base é o endereço deste site, nunca o próprio link.
    const pagina = link ? enderecoDaPaginaDoEvento(link, location.href) : '';
    const a = q<HTMLAnchorElement>('fluxo-pagina');
    if (pagina) a.setAttribute('href', pagina);
    a.hidden = !pagina;
    if (!painel.hidden) atualizarPainelAberto();
  }

  /** (Re)cria o link e tudo que depende dele: a imagem (o QR do cartaz), o texto, os botões e as notas. */
  function preparar(): void {
    const n = ++tentativa;
    const vigente = () => vivo && n === tentativa;
    resultado = undefined;
    semQr = false;
    haLink = false;
    estadoDoLink.textContent = agenda ? 'Preparando o link…' : '';
    tentar.hidden = true;
    q('fluxo-regras').hidden = true;
    q('fluxo-copiar-link').hidden = true;
    q('fluxo-aviso-link').hidden = true;
    q('fluxo-pagina').hidden = true;
    q('fluxo-nota-corte').hidden = true;
    atualizarNotaDoQr();

    const lp = buscarLink();
    linkPronto = lp;
    // A imagem do formato escolhido: desenhada e já convertida em arquivo, para o toque em "Mandar" não esperar.
    const ap: Promise<File> = lp.then(async ({ link }) => {
      const r = await desenharCardEm(canvas, d, d.formato, escalaDoFormato(d.formato, nivel), link, vigente);
      if (!r) throw new Error('fechada');
      if (r.semQr) {
        dizer('Não deu para gerar o QR deste link. O cartaz sai sem QR.');
        semQr = true;
        atualizarNotaDoQr();
      }
      canvas.setAttribute('aria-label', descricaoDaImagem(d, d.formato, link, !!link && !r.semQr && d.formato === 'cartaz'));
      return canvasParaArquivo(canvas, nomeDoArquivoDoFluxo(d));
    });
    arquivoPronto = ap;
    ap.catch((e) => {
      if (vigente() && !(e instanceof Error && e.message === 'fechada')) {
        dizer(e instanceof Error ? e.message : 'Não deu para gerar a imagem.');
      }
    });
    lp.then((r) => {
      if (!vigente()) return;
      resultado = r;
      aplicarLink(r);
      void medirCorte(n, r.link);
    }).catch(() => undefined);
  }

  const textoAgora = async (): Promise<{ texto: string; link: string }> => {
    const { link } = await linkPronto;
    return { texto: textoParaMandar(d, link), link };
  };

  /** Evita dois toques seguidos fazerem a mesma coisa duas vezes. */
  async function exclusivo(acao: () => Promise<void>): Promise<void> {
    if (ocupado) return;
    ocupado = true;
    if (deAcao) {
      // A instrução da ação anterior já cumpriu o papel; não deixa texto velho na tela.
      estado.textContent = '';
      deAcao = false;
    }
    try {
      await acao();
    } finally {
      ocupado = false;
    }
  }

  /** Se demorar mais de 300 ms, avisa que está preparando (o toque não pode parecer perdido). */
  async function comAvisoDeEspera<T>(esperar: () => Promise<T>, mensagem = 'Preparando a imagem…'): Promise<T> {
    const t = setTimeout(() => avisar(mensagem), 300);
    try {
      return await esperar();
    } finally {
      clearTimeout(t);
    }
  }

  const mandar = () =>
    exclusivo(async () => {
      try {
        const { texto, arquivo } = await comAvisoDeEspera(async () => ({ ...(await textoAgora()), arquivo: await arquivoPronto }));
        const r = await compartilhar({ arquivo, texto, titulo: d.titulo.trim() });
        const msg = avisoDoCompartilhamento(r);
        if (r === 'arquivo') avisar(msg);
        else if (msg) dizerDeAcao(msg);
      } catch {
        dizerDeAcao('Não deu para gerar a imagem. Tente de novo.');
      }
    });

  const baixar = () =>
    exclusivo(async () => {
      try {
        const arquivo = await comAvisoDeEspera(() => arquivoPronto);
        baixarImagem(arquivo, arquivo.name);
        dizerDeAcao(MENSAGEM_DE_BAIXAR);
      } catch {
        dizerDeAcao('Não deu para gerar a imagem. Tente de novo.');
      }
    });

  async function copiar(texto: string, pronto: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      avisar(pronto);
    } catch {
      dizerDeAcao('Não deu para copiar sozinho. Use Mandar no WhatsApp ou copie pelo seu aparelho.');
    }
  }
  const copiarTexto = async (): Promise<void> => {
    try {
      const { texto } = await textoAgora();
      await copiar(texto, 'Texto copiado. Cole na conversa.');
    } catch {
      dizerDeAcao('Não deu para copiar o texto. Use Mandar no WhatsApp.');
    }
  };
  const copiarLink = async (): Promise<void> => {
    const { link } = await linkPronto;
    if (link) await copiar(link, 'Link copiado. Cole na conversa.');
  };

  // ---------- imprimir: o cartaz é desenhado à parte, numa imagem que só aparece na impressão ----------
  let enderecoImpressao: string | undefined;
  let areaImpressao: HTMLElement | undefined;
  let paginaA4: HTMLStyleElement | undefined;
  function limparImpressao(): void {
    document.body.classList.remove('fluxo-imprimindo');
    areaImpressao?.remove();
    areaImpressao = undefined;
    paginaA4?.remove();
    paginaA4 = undefined;
    if (enderecoImpressao) URL.revokeObjectURL(enderecoImpressao);
    enderecoImpressao = undefined;
  }
  window.addEventListener('afterprint', limparImpressao);

  /** A tela fechou no meio do preparo? Então desfaz o que já tinha e para (nada de imprimir tela que não existe). */
  function fechou(): boolean {
    if (vivo) return false;
    limparImpressao();
    return true;
  }

  const imprimir = () =>
    exclusivo(async () => {
      const espera = setTimeout(() => avisar('Preparando o cartaz…'), 300);
      try {
        limparImpressao();
        const { link } = await linkPronto;
        if (fechou()) return;
        const folha = document.createElement('canvas');
        const r = await desenharCardEm(folha, d, 'cartaz', escalaDoFormato('cartaz', nivel), link, () => vivo);
        if (!r || fechou()) return;
        if (r.semQr && link) avisar('O cartaz sai sem QR.');
        const arquivo = await canvasParaArquivo(folha, nomeDoArquivoDoFluxo(d, 'cartaz'));
        if (fechou()) return;
        enderecoImpressao = URL.createObjectURL(arquivo);
        const img = new Image();
        img.alt = descricaoDaImagem(d, 'cartaz', link, !!link && !r.semQr);
        img.src = enderecoImpressao;
        await img.decode();
        if (fechou()) return;
        areaImpressao = document.createElement('div');
        areaImpressao.className = 'fluxo-cartaz-impressao';
        areaImpressao.append(img);
        raiz.querySelector('.fluxo')!.append(areaImpressao);
        // A folha A4 sem margem vale só enquanto imprime (não afeta a impressão da ata).
        paginaA4 = document.createElement('style');
        paginaA4.textContent = '@page { size: A4; margin: 0; }';
        document.head.append(paginaA4);
        document.body.classList.add('fluxo-imprimindo');
        clearTimeout(espera);
        dizerDeAcao('Abrindo a impressão. Para guardar em PDF, escolha “Salvar como PDF”.');
        window.print();
      } catch {
        limparImpressao();
        dizerDeAcao('Não deu para preparar o cartaz. Tente de novo.');
      } finally {
        clearTimeout(espera);
      }
    });

  // ---------- confirmação: partes do exemplo ou mensagem sem o link ----------
  // Na própria tela (sem window.confirm): o menu de compartilhar e a cópia precisam vir do toque da pessoa.
  const painel = q('fluxo-confirma');
  const seguir = q<HTMLButtonElement>('fluxo-confirma-seguir');
  const primeiro = q<HTMLButtonElement>('fluxo-confirma-mudar');
  let confirmado = false;
  let quemAbriu: HTMLElement | undefined;
  let aoSeguir: (() => unknown) | undefined;
  let paraTentar = false;

  /** Evento ou reunião sem link por qualquer motivo que não seja a organização do exemplo (essa já tem a sua frase). */
  const semLinkAgora = (): boolean => agenda && !!resultado && !resultado.link && !exemploNoLink(d);

  /** Escreve a frase e o primeiro botão do painel com o que vale agora. Falso = não há nada a perguntar. */
  function preencherPainel(): boolean {
    const sem = semLinkAgora();
    if (!sem && !doExemplo.length) return false;
    paraTentar = sem && !!resultado?.semRede;
    q('fluxo-confirma-texto').textContent = frasePainel(sem, doExemplo.length ? fraseDaConfirmacao(doExemplo) : '');
    primeiro.textContent = paraTentar ? 'Tentar de novo' : 'Mudar algo';
    return true;
  }

  function fecharPainel(): void {
    painel.hidden = true;
    aoSeguir = undefined;
  }
  /** O link chegou (ou falhou de novo) com o painel aberto: a razão some ou muda. */
  function atualizarPainelAberto(): void {
    if (preencherPainel()) return;
    const comFoco = painel.contains(document.activeElement);
    fecharPainel();
    if (comFoco) quemAbriu?.focus();
  }
  // Esc fecha o painel e devolve o foco a quem o abriu.
  painel.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || painel.hidden) return;
    e.preventDefault();
    fecharPainel();
    quemAbriu?.focus();
  });

  /** O primeiro toque, com partes do exemplo ou sem o link, só abre o painel logo abaixo do botão. Depois de confirmar, não pergunta mais. */
  function comConfirmacao(botao: HTMLElement, verbo: string, acao: () => unknown): () => Promise<void> {
    return async () => {
      if (confirmado) {
        void acao();
        return;
      }
      // Link ainda sendo preparado: espera, para saber se a mensagem vai com ele.
      if (agenda && !resultado) await linkPronto;
      if (!vivo) return;
      if (!precisaConfirmar(doExemplo, confirmado, semLinkAgora())) {
        void acao();
        return;
      }
      quemAbriu = botao;
      aoSeguir = acao;
      preencherPainel();
      seguir.textContent = `${verbo} mesmo assim`;
      // Depois do botão e das descrições que vêm logo depois dele (ocultas ou não).
      let ancora: Element = botao;
      while (ancora.nextElementSibling?.matches('.campo-dica, .fluxo-nota-corte')) ancora = ancora.nextElementSibling;
      ancora.insertAdjacentElement('afterend', painel);
      painel.hidden = false;
      // Com letra grande, o começo da frase tem de ficar à vista: rola até o topo do painel e foca sem rolar de novo.
      painel.scrollIntoView?.({ block: 'start' });
      primeiro.focus({ preventScroll: true });
    };
  }
  seguir.addEventListener('click', () => {
    const acao = aoSeguir;
    confirmado = true;
    fecharPainel();
    quemAbriu?.focus();
    if (acao) void acao();
  });
  primeiro.addEventListener('click', () => {
    if (paraTentar) {
      fecharPainel();
      quemAbriu?.focus();
      refazer();
    } else {
      mudarAlgo(d.tipo);
    }
  });

  for (const [id, verbo, acao] of [
    ['fluxo-mandar', 'Mandar', mandar],
    ['fluxo-baixar', 'Baixar', baixar],
    ['fluxo-copiar-texto', 'Copiar', copiarTexto],
    ['fluxo-copiar-link', 'Copiar', copiarLink],
    ['fluxo-imprimir', 'Imprimir', imprimir],
  ] as const) {
    const botao = q(id);
    botao.addEventListener('click', comConfirmacao(botao, verbo, acao));
  }

  function refazer(): void {
    if (vivo) preparar();
  }
  tentar.addEventListener('click', () => {
    refazer();
    // O botão some ao refazer: o foco vai para a mensagem, que passa a dizer "Preparando o link…".
    estadoDoLink.focus({ preventScroll: true });
  });
  // A rede voltou: refaz sozinho, só se o que faltou foi a rede.
  const aoVoltarARede = (): void => {
    if (resultado?.semRede) refazer();
  };
  window.addEventListener('online', aoVoltarARede);

  q('fluxo-mudar').addEventListener('click', () => mudarAlgo(d.tipo));
  q('fluxo-outro').addEventListener('click', () => {
    esquecerTudo();
    irAoInicio();
  });

  // ---------- ponte para a ata (só na memória da aba) ----------
  raiz.querySelector('[id="fluxo-ata"]')?.addEventListener('click', async () => {
    const { link } = await linkPronto;
    if (temConteudo(rascunho.ata) && haPontosComTexto(rascunho.ata) && !window.confirm(PERGUNTA_DA_TROCA)) return;
    rascunho.convocacao = convocacaoDoFluxo(d, link);
    rascunho.ata = ataComAPauta(rascunho.ata, d);
    location.hash = linkPara('ata');
    avisar('A ata já começa com a pauta.');
  });

  preparar();

  return () => {
    vivo = false;
    medidas();
    window.removeEventListener('afterprint', limparImpressao);
    window.removeEventListener('online', aoVoltarARede);
    limparImpressao();
  };
}
