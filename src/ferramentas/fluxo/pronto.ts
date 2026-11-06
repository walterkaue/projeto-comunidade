// Tela "Pronto" (#/fazer/<tipo>/pronto): um botão principal (imagem + texto no WhatsApp), as outras saídas
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
import {
  avisoDoCompartilhamento,
  descricaoDaImagem,
  enderecoDaPaginaDoEvento,
  idsDaDescricao,
  MENSAGEM_LINK_COM_EXEMPLO,
  MENSAGEM_SEM_LINK,
  nomeDoArquivoDoFluxo,
  precisaConfirmar,
} from './apoio';
import {
  avisoDoExemplo,
  fraseDoLinkNoPronto,
  camposDoExemplo,
  convocacaoDoFluxo,
  fraseDaConfirmacao,
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
import { desenharCardEm, medirFaixasFixas } from './previa';

export function montarPronto(raiz: HTMLElement, d: DadosDoFluxo): () => void {
  const agenda = temAgenda(d.tipo);
  const nivel = nivelDoAparelho();
  // O que ainda é do exemplo (qualquer origem): o aviso, a confirmação e a falta do link dependem só disto.
  const doExemplo = camposDoExemplo(d);
  const aviso = avisoDoExemplo(doExemplo);

  raiz.innerHTML = `<main class="tela fluxo fluxo-pronto">
    <h1 tabindex="-1"><span class="fluxo-verbo">${esc(PORTAS[d.tipo].verbo)}</span><span class="fluxo-so-leitor">: </span><span class="fluxo-pronto-titulo">Pronto!</span></h1>
    ${d.origem === 'link' ? `<p class="fluxo-nota">${esc(NOTA_DO_LINK)}</p>` : ''}
    ${aviso ? `<p class="fluxo-nota" id="fluxo-aviso-exemplo">${esc(aviso)}</p>` : ''}
    <p class="fluxo-estado fluxo-estado-neutro" id="fluxo-link-estado" role="status">${agenda ? 'Preparando o link…' : ''}</p>
    <a class="botao botao-sec" id="fluxo-regras" href="${esc(linkPara('regras'))}" hidden>Ver as Regras de uso</a>
    <div class="fluxo-moldura"><canvas id="fluxo-canvas" role="img" aria-label="Prévia do card"></canvas></div>
    <p class="fluxo-estado" id="fluxo-estado"></p>

    <button type="button" class="botao" id="fluxo-mandar" aria-describedby="${esc(idsDaDescricao(!!aviso, 'fluxo-mandar-dica'))}">Mandar no WhatsApp</button>
    <p class="campo-dica" id="fluxo-mandar-dica">Abre o menu do celular. Escolha o WhatsApp e a conversa.</p>
    <p class="campo-dica" id="fluxo-aviso-link" hidden>${esc(fraseDoLinkNoPronto(d))}</p>

    <div class="fluxo-saidas">
      <button type="button" class="botao botao-sec" id="fluxo-baixar">Baixar a imagem</button>
      <button type="button" class="botao botao-sec" id="fluxo-copiar-texto">Copiar só o texto</button>
      <button type="button" class="botao botao-sec" id="fluxo-copiar-link"${aviso ? ' aria-describedby="fluxo-aviso-exemplo"' : ''} hidden>Copiar o link</button>
      <button type="button" class="botao botao-sec" id="fluxo-imprimir">Imprimir cartaz para o mural</button>
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
      <button type="button" class="botao botao-sec" id="fluxo-outro">Fazer outro</button>
    </div>
    ${
      d.tipo === 'reuniao'
        ? `<section class="fluxo-ata" aria-labelledby="fluxo-ata-titulo">
      <h2 id="fluxo-ata-titulo">E depois da reunião?</h2>
      <button type="button" class="botao" id="fluxo-ata">Fazer a ata</button>
      <p class="campo-dica">A ata já começa com a pauta. Ela fica só neste aparelho.</p>
    </section>`
        : ''
    }
  </main>`;

  const q = <T extends HTMLElement>(id: string) => raiz.querySelector<T>(`[id="${id}"]`)!;
  const canvas = q<HTMLCanvasElement>('fluxo-canvas');
  const estado = q('fluxo-estado');
  const estadoDoLink = q('fluxo-link-estado');

  const medidas = medirFaixasFixas(raiz);
  let vivo = true;
  let ocupado = false;

  /** Mensagem importante: na tela e também no aviso falado. */
  function dizer(mensagem: string): void {
    estado.textContent = mensagem;
    avisar(mensagem);
  }

  // O link do evento (só reunião e evento). Os botões que dependem dele esperam esta promessa, que nunca falha:
  // qualquer erro (inclusive baixar o formato do evento) vira "sem link" com a mensagem de sempre.
  const linkPronto: Promise<ResultadoDoLink> = (
    agenda ? import('../evento/partes').then((p) => linkDoFluxo(d, p.enderecoDoSite())) : Promise.resolve({ link: '', aviso: '' })
  ).catch((): ResultadoDoLink => ({ link: '', aviso: MENSAGEM_SEM_LINK }));

  // A nota "O QR do cartaz abre a pauta inteira." só vale com link e com QR. Venha o link antes ou depois do
  // desenho, o QR que falhou vence.
  let haLink = false;
  let semQr = false;
  function atualizarNotaDoQr(): void {
    const nota = raiz.querySelector<HTMLElement>('[id="fluxo-aviso-qr"]');
    if (!nota) return;
    const mostrar = haLink && !semQr;
    nota.hidden = !mostrar;
    const imprimirBtn = q('fluxo-imprimir');
    if (mostrar) imprimirBtn.setAttribute('aria-describedby', 'fluxo-aviso-qr');
    else imprimirBtn.removeAttribute('aria-describedby');
  }

  // A imagem do formato escolhido: desenhada e já convertida em arquivo, para o toque em "Mandar" não esperar.
  const arquivoPronto: Promise<File> = linkPronto.then(async ({ link }) => {
    const r = await desenharCardEm(canvas, d, d.formato, escalaDoFormato(d.formato, nivel), link, () => vivo);
    if (!r) throw new Error('fechada');
    if (r.semQr) {
      dizer('Não deu para gerar o QR deste link. O cartaz sai sem QR.');
      semQr = true;
      atualizarNotaDoQr();
    }
    canvas.setAttribute('aria-label', descricaoDaImagem(d, d.formato, link, !!link && !r.semQr && d.formato === 'cartaz'));
    return canvasParaArquivo(canvas, nomeDoArquivoDoFluxo(d));
  });
  arquivoPronto.catch((e) => {
    if (vivo && !(e instanceof Error && e.message === 'fechada')) {
      dizer(e instanceof Error ? e.message : 'Não deu para gerar a imagem.');
    }
  });

  linkPronto
    .then(({ link, aviso, removido }) => {
      if (!vivo) return;
      estadoDoLink.textContent = aviso;
      if (removido) q('fluxo-regras').hidden = false;
      // O aviso do exemplo já está na tela e no aviso do topo; a região de status basta para o do link.
      if (aviso && aviso !== MENSAGEM_LINK_COM_EXEMPLO) avisar(aviso);
      if (!link) return;
      q('fluxo-copiar-link').hidden = false;
      q('fluxo-aviso-link').hidden = false;
      haLink = true;
      atualizarNotaDoQr();
      // A base é o endereço deste site, nunca o próprio link.
      const pagina = enderecoDaPaginaDoEvento(link, location.href);
      if (pagina) {
        const a = q<HTMLAnchorElement>('fluxo-pagina');
        a.setAttribute('href', pagina);
        a.hidden = false;
      }
    })
    .catch(() => undefined);

  const textoAgora = async (): Promise<{ texto: string; link: string }> => {
    const { link } = await linkPronto;
    return { texto: textoParaMandar(d, link), link };
  };

  /** Evita dois toques seguidos fazerem a mesma coisa duas vezes. */
  async function exclusivo(acao: () => Promise<void>): Promise<void> {
    if (ocupado) return;
    ocupado = true;
    try {
      await acao();
    } finally {
      ocupado = false;
    }
  }

  /** Se a imagem demorar mais de 300 ms, avisa que está preparando (o toque não pode parecer perdido). */
  async function comAvisoDeEspera<T>(esperar: () => Promise<T>): Promise<T> {
    const t = setTimeout(() => avisar('Preparando a imagem…'), 300);
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
        avisar(avisoDoCompartilhamento(r));
      } catch {
        avisar('Não deu para gerar a imagem. Tente de novo.');
      }
    });

  const baixar = () =>
    exclusivo(async () => {
      try {
        const arquivo = await comAvisoDeEspera(() => arquivoPronto);
        baixarImagem(arquivo, arquivo.name);
        avisar('Imagem baixada. Procure em Downloads ou na galeria.');
      } catch {
        avisar('Não deu para gerar a imagem. Tente de novo.');
      }
    });

  async function copiar(texto: string, pronto: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      avisar(pronto);
    } catch {
      avisar('Não deu para copiar sozinho. Use Mandar no WhatsApp ou copie pelo seu aparelho.');
    }
  }
  const copiarTexto = async (): Promise<void> => {
    try {
      const { texto } = await textoAgora();
      await copiar(texto, 'Texto copiado. Cole na conversa.');
    } catch {
      avisar('Não deu para copiar o texto. Use Mandar no WhatsApp.');
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
        avisar('Abrindo a impressão. Para guardar em PDF, escolha “Salvar como PDF”.');
        window.print();
      } catch {
        limparImpressao();
        avisar('Não deu para preparar o cartaz. Tente de novo.');
      }
    });

  // ---------- confirmação quando ainda há partes do exemplo ----------
  // Na própria tela (sem window.confirm): o menu de compartilhar e a cópia precisam vir do toque da pessoa.
  const painel = q('fluxo-confirma');
  const seguir = q<HTMLButtonElement>('fluxo-confirma-seguir');
  let confirmado = false;
  let quemAbriu: HTMLElement | undefined;
  let aoSeguir: (() => unknown) | undefined;

  function fecharPainel(): void {
    painel.hidden = true;
    aoSeguir = undefined;
  }
  // Esc fecha o painel e devolve o foco a quem o abriu.
  painel.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || painel.hidden) return;
    e.preventDefault();
    fecharPainel();
    quemAbriu?.focus();
  });

  /** O primeiro toque, com partes do exemplo, só abre o painel logo abaixo do botão. Depois de confirmar, não pergunta mais. */
  function comConfirmacao(botao: HTMLElement, verbo: string, acao: () => unknown): () => void {
    return () => {
      if (!precisaConfirmar(doExemplo, confirmado)) {
        void acao();
        return;
      }
      quemAbriu = botao;
      aoSeguir = acao;
      q('fluxo-confirma-texto').textContent = fraseDaConfirmacao(doExemplo);
      seguir.textContent = `${verbo} mesmo assim`;
      // Depois do botão e das descrições que vêm logo depois dele (ocultas ou não).
      let ancora: Element = botao;
      while (ancora.nextElementSibling?.classList.contains('campo-dica')) ancora = ancora.nextElementSibling;
      ancora.insertAdjacentElement('afterend', painel);
      painel.hidden = false;
      q('fluxo-confirma-mudar').focus();
    };
  }
  seguir.addEventListener('click', () => {
    const acao = aoSeguir;
    confirmado = true;
    fecharPainel();
    quemAbriu?.focus();
    if (acao) void acao();
  });
  q('fluxo-confirma-mudar').addEventListener('click', () => mudarAlgo(d.tipo));

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

  return () => {
    vivo = false;
    medidas();
    window.removeEventListener('afterprint', limparImpressao);
    limparImpressao();
  };
}
