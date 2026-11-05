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
  MENSAGEM_SEM_LINK,
  nomeDoArquivoDoFluxo,
} from './apoio';
import {
  AVISO_DO_EXEMPLO,
  avisoDoLinkNoPronto,
  convocacaoDoFluxo,
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

  raiz.innerHTML = `<main class="tela fluxo fluxo-pronto">
    <h1 tabindex="-1"><span class="fluxo-verbo">${esc(PORTAS[d.tipo].verbo)}</span><span class="fluxo-so-leitor">: </span><span class="fluxo-pronto-titulo">Pronto!</span></h1>
    ${d.origem === 'exemplo' ? `<p class="fluxo-nota" id="fluxo-aviso-exemplo">${esc(AVISO_DO_EXEMPLO)}</p>` : ''}
    <p class="fluxo-estado fluxo-estado-neutro" id="fluxo-link-estado" role="status">${agenda ? 'Preparando o link…' : ''}</p>
    <div class="fluxo-moldura"><canvas id="fluxo-canvas" role="img" aria-label="Prévia do card"></canvas></div>
    <p class="fluxo-estado" id="fluxo-estado"></p>

    <button type="button" class="botao" id="fluxo-mandar" aria-describedby="fluxo-mandar-dica">Mandar no WhatsApp</button>
    <p class="campo-dica" id="fluxo-mandar-dica">Abre o menu do celular. Escolha o WhatsApp e a conversa.</p>
    <p class="campo-dica" id="fluxo-aviso-link" hidden>${esc(avisoDoLinkNoPronto(d.tipo))}</p>

    <div class="fluxo-saidas">
      <button type="button" class="botao botao-sec" id="fluxo-baixar">Baixar a imagem</button>
      <button type="button" class="botao botao-sec" id="fluxo-copiar-texto">Copiar só o texto</button>
      <button type="button" class="botao botao-sec" id="fluxo-copiar-link" hidden>Copiar o link</button>
      <button type="button" class="botao botao-sec" id="fluxo-imprimir">Imprimir cartaz para o mural</button>
      <a class="botao botao-sec" id="fluxo-pagina" href="#/" hidden>Ver a página do evento</a>
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

  // A imagem do formato escolhido: desenhada e já convertida em arquivo, para o toque em "Mandar" não esperar.
  const arquivoPronto: Promise<File> = linkPronto.then(async ({ link }) => {
    const r = await desenharCardEm(canvas, d, d.formato, escalaDoFormato(d.formato, nivel), link, () => vivo);
    if (!r) throw new Error('fechada');
    if (r.semQr) dizer('Não deu para gerar o QR deste link. O cartaz sai sem QR.');
    canvas.setAttribute('aria-label', descricaoDaImagem(d, d.formato, link, !!link && !r.semQr && d.formato === 'cartaz'));
    return canvasParaArquivo(canvas, nomeDoArquivoDoFluxo(d));
  });
  arquivoPronto.catch((e) => {
    if (vivo && !(e instanceof Error && e.message === 'fechada')) {
      dizer(e instanceof Error ? e.message : 'Não deu para gerar a imagem.');
    }
  });

  linkPronto
    .then(({ link, aviso }) => {
      if (!vivo) return;
      estadoDoLink.textContent = aviso;
      if (aviso) avisar(aviso);
      if (!link) return;
      q('fluxo-copiar-link').hidden = false;
      q('fluxo-aviso-link').hidden = false;
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

  q('fluxo-mandar').addEventListener('click', () =>
    exclusivo(async () => {
      try {
        const { texto, arquivo } = await comAvisoDeEspera(async () => ({ ...(await textoAgora()), arquivo: await arquivoPronto }));
        const r = await compartilhar({ arquivo, texto, titulo: d.titulo.trim() });
        avisar(avisoDoCompartilhamento(r));
      } catch {
        avisar('Não deu para gerar a imagem. Tente de novo.');
      }
    }),
  );

  q('fluxo-baixar').addEventListener('click', () =>
    exclusivo(async () => {
      try {
        const arquivo = await comAvisoDeEspera(() => arquivoPronto);
        baixarImagem(arquivo, arquivo.name);
        avisar('Imagem baixada. Procure em Downloads ou na galeria.');
      } catch {
        avisar('Não deu para gerar a imagem. Tente de novo.');
      }
    }),
  );

  async function copiar(texto: string, pronto: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      avisar(pronto);
    } catch {
      avisar('Não deu para copiar sozinho. Use Mandar no WhatsApp ou copie pelo seu aparelho.');
    }
  }
  q('fluxo-copiar-texto').addEventListener('click', async () => {
    try {
      const { texto } = await textoAgora();
      await copiar(texto, 'Texto copiado. Cole na conversa.');
    } catch {
      avisar('Não deu para copiar o texto. Use Mandar no WhatsApp.');
    }
  });
  q('fluxo-copiar-link').addEventListener('click', async () => {
    const { link } = await linkPronto;
    if (link) await copiar(link, 'Link copiado. Cole na conversa.');
  });

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

  q('fluxo-imprimir').addEventListener('click', () =>
    exclusivo(async () => {
      try {
        limparImpressao();
        const { link } = await linkPronto;
        if (fechou()) return;
        const folha = document.createElement('canvas');
        const r = await desenharCardEm(folha, d, 'cartaz', escalaDoFormato('cartaz', nivel), link, () => vivo);
        if (!r || fechou()) return;
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
    }),
  );

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
