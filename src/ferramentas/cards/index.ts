// Ferramenta 1: cards e convites para WhatsApp. Carregada sob demanda (src/main.ts).
// Nada sai do aparelho e nada é guardado (nem localStorage): fechou a aba, acabou.
// Esta pasta é da sessão que constrói os cards. Mudanças em src/comum viram pedido em docs/pedidos-comum.md.

import './cards.css';
import { avisar } from '../../comum/aviso';
import { baixarImagem, canvasParaArquivo, compartilhar, mensagemDoResultado } from '../../comum/compartilhar';
import { pegarCardPreparado } from '../../comum/entreTelas';
import { campoAreaDeTexto, campoEscolha, campoTexto, grupoDeOpcoes, limparErro, mostrarErro } from '../../comum/formulario';
import { esc } from '../../comum/html';
import { NOME } from '../../comum/marca';
import { nivelDoAparelho } from '../../comum/nivel';
import { linkPara } from '../../comum/rotas';
import { matrizDoQr, type Matriz } from '../../comum/qr';
import type { Tela } from '../../comum/tela';
import { desenharCard, FAMILIA, tamanhoDoCanvas } from './desenho';
import { exemplo, QUANTOS_EXEMPLOS } from './exemplos';
import { telaGaleria } from './galeria';
import { lerLogo, type Logo } from './logo';
import {
  aplicarLimites,
  CARD_VAZIO,
  DEF_FORMATOS,
  DEF_MODELOS,
  escalaDoFormato,
  FORMATOS,
  MODELOS_DE_CARD,
  nomeDoArquivo,
  TAMANHO_MAXIMO,
  type CamposDoCard,
  type Formato,
  type ModeloDeCard,
} from './modelos';
import { aplicarCorLivre, PALETAS, paletaPorId, type Paleta } from './paletas';
import { linkDoWhatsApp, textoAlternativo, textoParaWhatsApp } from './textos';

const CAMPOS_COM_LIMITE = [
  ['titulo', TAMANHO_MAXIMO.titulo],
  ['local', TAMANHO_MAXIMO.local],
  ['texto', TAMANHO_MAXIMO.texto],
  ['organizacao', TAMANHO_MAXIMO.organizacao],
] as const;

let fontesProntas: Promise<unknown> | undefined;
function esperarFontes(): Promise<unknown> {
  fontesProntas ??= Promise.all([`700 40px ${FAMILIA}`, `400 40px ${FAMILIA}`].map((f) => document.fonts.load(f))).catch(() => undefined);
  return fontesProntas;
}

export const tela: Tela = (raiz, rota) => {
  if (rota.resto === 'galeria') return telaGaleria(raiz);

  const leve = nivelDoAparelho() === 'leve';
  // Preenchido só pelo que o Evento ou a Reunião prepararam nesta aba. Dados no link ("#/cards/titulo=…")
  // não preenchem nada: texto de terceiro não aparece aqui sem faixa nem lista de bloqueio (auditoria, M5).
  const inicial = pegarCardPreparado();

  const estado = {
    campos: aplicarLimites({ ...CARD_VAZIO, ...inicial } as CamposDoCard),
    formato: 'conversa' as Formato,
    paletaId: 'papel',
    corLivre: '#3d6b73',
    paletaLivre: undefined as Paleta | undefined,
    rodape: true,
    logo: undefined as Logo | undefined,
    exemplo: 0,
  };
  let matriz: { link: string; dados: Matriz } | undefined;
  let qrFalhou = false;
  let sujo = true;

  // ---------- HTML ----------
  const c = estado.campos;
  const opcoesModelo = MODELOS_DE_CARD.map((m) => ({ valor: m, texto: DEF_MODELOS[m].nome }));
  const opcoesFormato = FORMATOS.map((f) => ({ valor: f, texto: `${DEF_FORMATOS[f].nome}: ${DEF_FORMATOS[f].explicacao}` }));

  const paletasHtml = [...PALETAS, { id: 'livre', nome: 'Cor livre' } as Pick<Paleta, 'id' | 'nome'>]
    .map(
      (p) => `<div class="campo-radio cards-paleta">
      <input type="radio" id="cards-paleta-${esc(p.id)}" name="cards-paleta" value="${esc(p.id)}"${p.id === estado.paletaId ? ' checked' : ''}>
      <label for="cards-paleta-${esc(p.id)}"><span class="cards-amostra" data-paleta="${esc(p.id)}" aria-hidden="true"></span>${esc(p.nome)}</label>
    </div>`,
    )
    .join('');

  raiz.innerHTML = `<main class="tela tela-cards">
    <h1 tabindex="-1">Cards e convites</h1>
    <p class="cards-intro">Crie uma imagem para o WhatsApp ou um cartaz para imprimir. Tudo é feito neste aparelho: nada é enviado para a internet.</p>

    <form class="cards-form" id="cards-form" novalidate>
      ${campoEscolha({ id: 'cards-modelo', rotulo: 'Tipo de card', valor: c.modelo, opcoes: opcoesModelo })}
      ${campoTexto({ id: 'cards-titulo', rotulo: 'Título', dica: DEF_MODELOS[c.modelo].dicaTitulo, valor: c.titulo, maximo: TAMANHO_MAXIMO.titulo })}
      <div id="cards-agenda">
        ${campoTexto({ id: 'cards-data', rotulo: 'Data', tipo: 'date', valor: c.data })}
        <div id="cards-hora-caixa">${campoTexto({ id: 'cards-hora', rotulo: 'Hora', tipo: 'time', valor: c.hora })}</div>
      </div>
      <div id="cards-local-caixa">${campoTexto({ id: 'cards-local', rotulo: 'Local', valor: c.local, maximo: TAMANHO_MAXIMO.local })}</div>
      ${campoAreaDeTexto({ id: 'cards-texto', rotulo: 'Texto', dica: DEF_MODELOS[c.modelo].dicaTexto, valor: c.texto, maximo: TAMANHO_MAXIMO.texto, linhas: 3 })}
      ${campoTexto({ id: 'cards-organizacao', rotulo: 'Nome da organização', valor: c.organizacao, maximo: TAMANHO_MAXIMO.organizacao })}

      <button type="button" class="botao botao-sec" id="cards-exemplo">Preencher com um exemplo</button>

      <div class="campo">
        <label class="campo-rotulo" for="cards-logo">Logo (opcional)</label>
        <p class="campo-dica" id="cards-logo-dica">A imagem é lida e reduzida só neste aparelho. Ela não é enviada nem guardada.</p>
        <input class="campo-entrada" type="file" id="cards-logo" accept="image/*" aria-describedby="cards-logo-dica cards-logo-erro">
        <p class="campo-erro" id="cards-logo-erro" hidden></p>
        <p id="cards-logo-nome" class="cards-logo-nome" hidden></p>
        <button type="button" class="botao botao-sec" id="cards-logo-tirar" hidden>Tirar o logo</button>
      </div>

      <fieldset class="campo campo-grupo" id="cards-cores">
        <legend class="campo-rotulo">Cores</legend>
        ${paletasHtml}
        <div class="campo cards-cor-livre" id="cards-cor-livre" hidden>
          <label class="campo-rotulo" for="cards-cor">Escolha a cor da faixa</label>
          <input class="cards-cor" type="color" id="cards-cor" value="${esc(estado.corLivre)}" aria-describedby="cards-cor-msg">
          <p class="campo-dica" id="cards-cor-msg" role="status"></p>
        </div>
      </fieldset>

      ${grupoDeOpcoes({ id: 'cards-formato', nome: 'cards-formato', rotulo: 'Formato', valor: estado.formato, opcoes: opcoesFormato })}

      <div class="campo-radio">
        <input type="checkbox" id="cards-rodape" checked>
        <label for="cards-rodape">Mostrar “Feito com ${esc(NOME)}” no rodapé</label>
      </div>
    </form>

    <section class="cards-previa" aria-labelledby="cards-previa-titulo">
      <h2 id="cards-previa-titulo">Sua imagem</h2>
      <p class="cards-estado" id="cards-estado" role="status"></p>
      <div class="cards-moldura"><canvas id="cards-canvas" role="img" aria-label="Prévia do card"></canvas></div>
      <p class="campo-dica" id="cards-qr-nota" hidden>O cartaz sai com um QR que abre a página do evento.</p>
    </section>

    <section class="cards-saidas" aria-labelledby="cards-saidas-titulo">
      <h2 id="cards-saidas-titulo">Enviar ou guardar</h2>
      <button type="button" class="botao" id="cards-compartilhar">Compartilhar imagem</button>
      <button type="button" class="botao botao-sec" id="cards-baixar">Baixar imagem</button>
      <a class="botao botao-sec" id="cards-whatsapp" href="${esc(linkDoWhatsApp(''))}" target="_blank" rel="noopener noreferrer" aria-label="Abrir no WhatsApp com o texto (abre outro site)">Abrir no WhatsApp com o texto</a>
      <button type="button" class="botao botao-sec" id="cards-copiar">Copiar texto</button>
      <button type="button" class="botao botao-sec" id="cards-imprimir">Imprimir cartaz ou salvar em PDF</button>
    </section>

    <section class="cards-textos" aria-labelledby="cards-textos-titulo">
      <h2 id="cards-textos-titulo">Textos prontos</h2>
      <div class="campo">
        <label class="campo-rotulo" for="cards-whats">Texto para o WhatsApp</label>
        <textarea class="campo-entrada campo-area" id="cards-whats" rows="6" readonly></textarea>
      </div>
      <div class="campo">
        <label class="campo-rotulo" for="cards-alt">Descrição da imagem (para quem não enxerga)</label>
        <textarea class="campo-entrada campo-area" id="cards-alt" rows="4" readonly></textarea>
      </div>
    </section>

    <a class="botao botao-sec" href="${esc(linkPara('inicio'))}">Voltar ao início</a>
  </main>`;

  // ---------- peças ----------
  const q = <T extends HTMLElement>(id: string) => raiz.querySelector<T>(`[id="${id}"]`)!;
  const form = q<HTMLFormElement>('cards-form');
  const canvas = q<HTMLCanvasElement>('cards-canvas');
  const whats = q<HTMLTextAreaElement>('cards-whats');
  const alt = q<HTMLTextAreaElement>('cards-alt');
  const linkWhats = q<HTMLAnchorElement>('cards-whatsapp');
  const estadoEl = q<HTMLElement>('cards-estado');
  const entrada = (id: string) => q<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(id);

  // amostras de cor (por CSSOM, não por atributo style)
  raiz.querySelectorAll<HTMLElement>('.cards-amostra').forEach((el) => {
    const id = el.dataset.paleta ?? '';
    if (id === 'livre') {
      el.style.background = estado.corLivre;
      el.dataset.livre = '1';
    } else {
      const p = paletaPorId(id);
      el.style.background = p.fundo;
      el.style.borderColor = p.destaque;
      el.style.boxShadow = `inset 0 -10px 0 ${p.destaque}`;
    }
  });
  const amostraLivre = raiz.querySelector<HTMLElement>('.cards-amostra[data-livre]')!;

  // contadores de letras
  for (const [id, max] of CAMPOS_COM_LIMITE) {
    const campo = q<HTMLInputElement>(`cards-${id}`);
    const p = document.createElement('p');
    p.className = 'cards-contador';
    p.id = `cards-${id}-contador`;
    campo.insertAdjacentElement('afterend', p);
    campo.setAttribute('aria-describedby', `${campo.getAttribute('aria-describedby') ?? ''} ${p.id}`.trim());
    campo.dataset.max = String(max);
  }
  function atualizarContadores(): void {
    for (const [id, max] of CAMPOS_COM_LIMITE) {
      const n = Array.from(entrada(`cards-${id}`).value).length;
      q(`cards-${id}-contador`).textContent = `${n} de ${max} letras`;
    }
  }

  function paletaAtual(): Paleta {
    return estado.paletaId === 'livre' && estado.paletaLivre ? estado.paletaLivre : paletaPorId(estado.paletaId);
  }

  function lerCampos(): CamposDoCard {
    estado.campos = aplicarLimites({
      modelo: entrada('cards-modelo').value as ModeloDeCard,
      titulo: entrada('cards-titulo').value,
      data: entrada('cards-data').value,
      hora: entrada('cards-hora').value,
      local: entrada('cards-local').value,
      texto: entrada('cards-texto').value,
      organizacao: entrada('cards-organizacao').value,
      link: estado.campos.link,
    });
    return estado.campos;
  }

  function mostrarOuEsconder(): void {
    const m = DEF_MODELOS[estado.campos.modelo];
    q('cards-hora-caixa').hidden = !m.usaHora;
    q('cards-local-caixa').hidden = !m.usaLocal;
    const dicaT = raiz.querySelector('#cards-titulo-dica');
    const dicaX = raiz.querySelector('#cards-texto-dica');
    if (dicaT) dicaT.textContent = m.dicaTitulo;
    if (dicaX) dicaX.textContent = m.dicaTexto;
    q('cards-qr-nota').hidden = !(estado.formato === 'cartaz' && estado.campos.link);
  }

  function atualizarTextos(): void {
    const comQr = !!estado.campos.link && !qrFalhou;
    whats.value = textoParaWhatsApp(estado.campos);
    alt.value = textoAlternativo(estado.campos, estado.formato, comQr && estado.formato === 'cartaz');
    canvas.setAttribute('aria-label', alt.value);
    // Sem título o link fica neutro: o aviso de saída só atua em link externo, e o clique pede o título primeiro.
    linkWhats.href = estado.campos.titulo.trim() ? linkDoWhatsApp(whats.value) : '#';
  }

  // ---------- desenho ----------
  let token = 0;
  let espera: ReturnType<typeof setTimeout> | undefined;
  let pronto: Promise<void> = Promise.resolve();

  async function matrizSePrecisa(formato: Formato): Promise<Matriz | undefined> {
    const link = estado.campos.link;
    if (formato !== 'cartaz' || !link) return undefined;
    if (matriz?.link !== link) {
      try {
        matriz = { link, dados: await matrizDoQr(link) };
      } catch {
        qrFalhou = true;
        return undefined;
      }
    }
    return matriz.dados;
  }

  async function desenharEm(alvo: HTMLCanvasElement, formato: Formato, vigente: () => boolean = () => true): Promise<void> {
    await esperarFontes();
    const qr = await matrizSePrecisa(formato);
    if (!vigente()) return;
    const escala = escalaDoFormato(formato, leve ? 'leve' : 'normal');
    const { largura, altura } = tamanhoDoCanvas(formato, escala);
    alvo.width = largura;
    alvo.height = altura;
    const ctx = alvo.getContext('2d');
    if (!ctx) throw new Error('Este aparelho não conseguiu desenhar a imagem.');
    desenharCard(ctx, estado.campos, formato, paletaAtual(), { escala, logo: estado.logo, qr, rodape: estado.rodape });
  }

  function desenharPrevia(): Promise<void> {
    if (espera) clearTimeout(espera);
    espera = undefined;
    const meu = ++token;
    estadoEl.textContent = '';
    pronto = (async () => {
      try {
        await desenharEm(canvas, estado.formato, () => meu === token);
        if (meu === token) {
          sujo = false;
          const semQr = qrFalhou && estado.formato === 'cartaz' && !!estado.campos.link;
          estadoEl.textContent = semQr ? 'Não deu para gerar o QR deste link. O cartaz sai sem QR.' : '';
          q('cards-qr-nota').hidden = semQr || !(estado.formato === 'cartaz' && estado.campos.link);
          atualizarTextos();
        }
      } catch (e) {
        if (meu === token) estadoEl.textContent = e instanceof Error ? e.message : 'Não deu para desenhar.';
      }
    })();
    return pronto;
  }

  function agendar(): void {
    sujo = true;
    if (espera) clearTimeout(espera);
    espera = setTimeout(() => void desenharPrevia(), leve ? 900 : 450);
  }

  // ---------- reações ----------
  function aoMudar(): void {
    lerCampos();
    if (estado.campos.titulo.trim()) limparErro(form, 'cards-titulo');
    atualizarContadores();
    mostrarOuEsconder();
    atualizarTextos();
    agendar();
  }

  function preencher(d: CamposDoCard): void {
    entrada('cards-modelo').value = d.modelo;
    entrada('cards-titulo').value = d.titulo;
    entrada('cards-data').value = d.data;
    entrada('cards-hora').value = d.hora;
    entrada('cards-local').value = d.local;
    entrada('cards-texto').value = d.texto;
    entrada('cards-organizacao').value = d.organizacao;
    aoMudar();
  }

  form.addEventListener('input', (e) => {
    const alvo = e.target as HTMLElement;
    if (alvo.id === 'cards-logo' || alvo.id === 'cards-cor') return;
    const radio = alvo as HTMLInputElement;
    if (radio.name === 'cards-formato') estado.formato = radio.value as Formato;
    else if (radio.name === 'cards-paleta') {
      estado.paletaId = radio.value;
      q('cards-cor-livre').hidden = radio.value !== 'livre';
      if (radio.value === 'livre') aplicarCor();
    } else if (alvo.id === 'cards-rodape') estado.rodape = radio.checked;
    aoMudar();
  });
  form.addEventListener('submit', (e) => e.preventDefault());

  function aplicarCor(): void {
    const r = aplicarCorLivre(q<HTMLInputElement>('cards-cor').value);
    const msg = q('cards-cor-msg');
    if (!r.ok || !r.paleta) {
      msg.textContent = r.mensagem;
      return;
    }
    estado.corLivre = r.paleta.destaque;
    estado.paletaLivre = r.paleta;
    amostraLivre.style.background = r.paleta.destaque;
    msg.textContent = r.mensagem;
  }
  q('cards-cor').addEventListener('input', () => {
    aplicarCor();
    agendar();
  });

  q('cards-exemplo').addEventListener('click', () => {
    preencher({ ...exemplo(estado.campos.modelo, estado.exemplo++ % QUANTOS_EXEMPLOS), link: estado.campos.link });
    avisar('Exemplo preenchido. Troque pelo que for seu.');
  });

  // logo
  q<HTMLInputElement>('cards-logo').addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    limparErro(form, 'cards-logo');
    const arquivo = input.files?.[0];
    if (!arquivo) return;
    try {
      estado.logo = await lerLogo(arquivo);
      const nome = q('cards-logo-nome');
      nome.innerHTML = `Logo escolhido: ${esc(arquivo.name)}`;
      nome.hidden = false;
      q('cards-logo-tirar').hidden = false;
      avisar('Logo colocado no card.');
      agendar();
    } catch (erro) {
      input.value = '';
      mostrarErro(form, 'cards-logo', erro instanceof Error ? erro.message : 'Não deu para ler essa imagem.');
    }
  });
  q('cards-logo-tirar').addEventListener('click', () => {
    estado.logo = undefined;
    q<HTMLInputElement>('cards-logo').value = '';
    q('cards-logo-nome').hidden = true;
    q('cards-logo-tirar').hidden = true;
    q<HTMLInputElement>('cards-logo').focus();
    avisar('Logo retirado.');
    agendar();
  });

  // ---------- saídas ----------
  /** Só gera algo se houver pelo menos o título. Leva a pessoa ao campo. */
  function temTitulo(): boolean {
    limparErro(form, 'cards-titulo');
    if (estado.campos.titulo.trim()) return true;
    mostrarErro(form, 'cards-titulo', 'escreva o título do card.');
    avisar('Escreva o título do card primeiro.');
    return false;
  }

  async function arquivoPronto(): Promise<File> {
    lerCampos();
    // Se nada mudou, usa a prévia como está: refazer o desenho antes de compartilhar atrasa o toque.
    if (sujo || espera) await desenharPrevia();
    return canvasParaArquivo(canvas, nomeDoArquivo(estado.campos.modelo, estado.formato));
  }

  q('cards-compartilhar').addEventListener('click', async () => {
    if (!temTitulo()) return;
    try {
      const arquivo = await arquivoPronto();
      const r = await compartilhar({ arquivo, texto: whats.value, titulo: estado.campos.titulo });
      avisar(mensagemDoResultado(r));
    } catch {
      avisar('Não deu para gerar a imagem. Tente de novo.');
    }
  });

  q('cards-baixar').addEventListener('click', async () => {
    if (!temTitulo()) return;
    try {
      const arquivo = await arquivoPronto();
      baixarImagem(arquivo, arquivo.name);
      avisar('Imagem baixada. Procure em Downloads ou na galeria.');
    } catch {
      avisar('Não deu para gerar a imagem. Tente de novo.');
    }
  });

  q('cards-copiar').addEventListener('click', async () => {
    if (!temTitulo()) return;
    const texto = whats.value;
    try {
      await navigator.clipboard.writeText(texto);
      avisar('Texto copiado. Cole na conversa.');
    } catch {
      whats.focus();
      whats.select();
      avisar('Não deu para copiar sozinho. O texto está selecionado: use Copiar do seu aparelho.');
    }
  });

  linkWhats.addEventListener('click', (e) => {
    if (!temTitulo()) e.preventDefault();
  });

  // imprimir: o cartaz é desenhado à parte, numa imagem que só aparece na impressão
  let enderecoImpressao: string | undefined;
  let areaImpressao: HTMLElement | undefined;
  function limparImpressao(): void {
    document.body.classList.remove('cards-imprimindo');
    areaImpressao?.remove();
    areaImpressao = undefined;
    if (enderecoImpressao) URL.revokeObjectURL(enderecoImpressao);
    enderecoImpressao = undefined;
  }
  window.addEventListener('afterprint', limparImpressao);

  q('cards-imprimir').addEventListener('click', async () => {
    if (!temTitulo()) return;
    try {
      limparImpressao();
      lerCampos();
      const folha = document.createElement('canvas');
      await desenharEm(folha, 'cartaz');
      const arquivo = await canvasParaArquivo(folha, nomeDoArquivo(estado.campos.modelo, 'cartaz'));
      enderecoImpressao = URL.createObjectURL(arquivo);
      const img = new Image();
      img.alt = textoAlternativo(estado.campos, 'cartaz', !!estado.campos.link);
      img.src = enderecoImpressao;
      await img.decode();
      areaImpressao = document.createElement('div');
      areaImpressao.className = 'cartaz-impressao';
      areaImpressao.append(img);
      raiz.querySelector('.tela-cards')!.append(areaImpressao);
      document.body.classList.add('cards-imprimindo');
      avisar('Abrindo a impressão. Para guardar em PDF, escolha “Salvar como PDF”.');
      window.print();
    } catch {
      limparImpressao();
      avisar('Não deu para preparar o cartaz. Tente de novo.');
    }
  });

  // ---------- começo ----------
  if (inicial.link) estado.campos.link = inicial.link;
  mostrarOuEsconder();
  atualizarContadores();
  atualizarTextos();
  void desenharPrevia();

  return () => {
    token++;
    if (espera) clearTimeout(espera);
    window.removeEventListener('afterprint', limparImpressao);
    limparImpressao();
  };
};
