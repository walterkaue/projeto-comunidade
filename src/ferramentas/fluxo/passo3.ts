// Passo 3 do fluxo (docs/produto.md 7.6): formato, cor e "Mais opções", com a prévia grande. Lê e muda os dados de
// memoria.ts. Desenha só o que a pessoa escreveu (sem exemplo). Todo texto digitado entra por esc ou textContent;
// as amostras de cor vão por CSSOM.

import './pronto.css';
import { avisar } from '../../comum/aviso';
import { limparErro, mostrarErro } from '../../comum/formulario';
import { esc } from '../../comum/html';
import { NOME } from '../../comum/marca';
import { nivelDoAparelho } from '../../comum/nivel';
import { escalaDoFormato, type Formato } from '../cards/modelos';
import { lerLogo } from '../cards/logo';
import { aplicarCorLivre, PALETAS, paletaPorId } from '../cards/paletas';
import { EXPLICACAO_DO_FORMATO, FORMATOS, linkAindaVale, NOME_DO_FORMATO, type DadosDoFluxo } from './estado';
import { criarAgendador, descricaoDaImagem, esperaDoRedesenho } from './apoio';
import { logoAtual, trocarLogo } from './memoria';
import { irAoPasso, voltarDoPasso } from './navegacao';
import { BOTAO_VER_MAIOR, desenharCardEm, htmlDoDialogo, ligarDialogo, medirFaixasFixas } from './previa';
import { barra, topoDoPasso } from './topo';

export function montarPasso3(raiz: HTMLElement, d: DadosDoFluxo): () => void {
  const nivel = nivelDoAparelho();
  // Formato: três botões lado a lado (radios de verdade, com o input escondido de forma acessível).
  const formatos = FORMATOS.map((f) => {
    const id = `fluxo-formato-${f}`;
    return `<div class="fluxo-seg-item">
        <input type="radio" id="${id}" name="fluxo-formato" value="${f}"${f === d.formato ? ' checked' : ''}>
        <label for="${id}"><span class="fluxo-seg-nome">${esc(NOME_DO_FORMATO[f])}</span><span class="fluxo-so-leitor">. ${esc(EXPLICACAO_DO_FORMATO[f])}</span></label>
      </div>`;
  }).join('');
  // Cor: bolinhas com o nome curto embaixo (o leitor de tela lê o nome só uma vez, no rótulo).
  const paletas = PALETAS.map((p) => {
    const id = `fluxo-paleta-${p.id}`;
    return `<div class="fluxo-bola-item">
        <input type="radio" id="${id}" name="fluxo-paleta" value="${esc(p.id)}"${p.id === d.paletaId ? ' checked' : ''}>
        <label for="${id}"><span class="fluxo-amostra" data-paleta="${esc(p.id)}" aria-hidden="true"></span><span class="fluxo-so-leitor">${esc(p.nome)}</span></label>
        <span class="fluxo-bola-nome" aria-hidden="true">${esc(p.nome)}</span>
      </div>`;
  }).join('');
  const nomeDaCor = (id: string): string => (id === 'livre' ? 'Cor livre' : paletaPorId(id).nome);

  raiz.innerHTML = `<main class="tela fluxo">
    ${topoDoPasso(d, 3)}
    <section class="fluxo-previa" aria-label="Prévia">
      <p class="fluxo-estado" id="fluxo-estado"></p>
      <div class="fluxo-moldura fluxo-moldura-passo3"><canvas id="fluxo-canvas" role="img" aria-label="Prévia da imagem"></canvas>${BOTAO_VER_MAIOR}</div>
    </section>
    ${htmlDoDialogo()}
    <form class="fluxo-form" id="fluxo-form" novalidate>
      <fieldset class="campo campo-grupo" id="fluxo-formato">
        <legend class="campo-rotulo">Onde vai mandar?</legend>
        <div class="fluxo-seg">${formatos}</div>
        <p class="fluxo-formato-expl" id="fluxo-formato-expl">${esc(EXPLICACAO_DO_FORMATO[d.formato])}</p>
      </fieldset>
      <fieldset class="campo campo-grupo" id="fluxo-cor">
        <legend class="campo-rotulo">Cor: <span id="fluxo-cor-nome">${esc(nomeDaCor(d.paletaId))}</span></legend>
        <div class="fluxo-bolas">${paletas}</div>
        <p class="campo-dica" id="fluxo-cor-aviso"${d.paletaId === 'livre' ? '' : ' hidden'}>Você escolheu uma cor livre, em Mais opções.</p>
      </fieldset>
      <details class="fluxo-mais">
        <summary>Mais opções</summary>
        <div class="fluxo-mais-corpo">
          <div class="campo">
            <label class="campo-rotulo" for="fluxo-logo">Logo (opcional)</label>
            <p class="campo-dica" id="fluxo-logo-dica">A imagem é lida e reduzida só neste aparelho. Ela não é enviada nem guardada.</p>
            <input class="campo-entrada" type="file" id="fluxo-logo" accept="image/*" aria-describedby="fluxo-logo-dica fluxo-logo-erro">
            <p class="campo-erro" id="fluxo-logo-erro" hidden></p>
            <p id="fluxo-logo-nome" class="fluxo-logo-nome"${logoAtual() ? '' : ' hidden'}>Logo colocado na imagem.</p>
            <button type="button" class="botao botao-sec" id="fluxo-logo-tirar"${logoAtual() ? '' : ' hidden'}>Tirar o logo</button>
          </div>
          <div class="campo">
            <label class="campo-rotulo" for="fluxo-cor-livre">Cor livre</label>
            <input class="fluxo-cor" type="color" id="fluxo-cor-livre" value="${esc(d.corLivre)}" aria-describedby="fluxo-cor-msg">
            <p class="campo-dica" id="fluxo-cor-msg" role="status"></p>
          </div>
          <div class="campo-radio">
            <input type="checkbox" id="fluxo-rodape"${d.rodape ? ' checked' : ''}>
            <label for="fluxo-rodape">Mostrar “Feito com ${esc(NOME)}” no rodapé</label>
          </div>
        </div>
      </details>
    </form>
    ${barra('Ficou bom')}
  </main>`;

  const q = <T extends HTMLElement>(id: string) => raiz.querySelector<T>(`[id="${id}"]`)!;
  const form = q<HTMLFormElement>('fluxo-form');
  const canvas = q<HTMLCanvasElement>('fluxo-canvas');
  const estado = q('fluxo-estado');
  const medidas = medirFaixasFixas(raiz);
  let vivo = true;
  // O diálogo desenha de novo, com o mesmo link (o QR do cartaz): nunca mostra um desenho pela metade.
  const fecharDialogo = ligarDialogo(raiz, (grande) => {
    const link = linkAindaVale(d) ? d.link : '';
    desenharCardEm(grande, d, d.formato, escalaDoFormato(d.formato, nivel), link)
      .then((r) => grande.setAttribute('aria-label', descricaoDaImagem(d, d.formato, link, !!link && !!r && !r.semQr && d.formato === 'cartaz')))
      .catch(() => undefined);
  });

  // Mensagem importante: fica na tela e também vai pelo aviso falado (uma vez por mensagem nova).
  let ultimoEstado = '';
  function dizer(mensagem: string): void {
    estado.textContent = mensagem;
    if (mensagem && mensagem !== ultimoEstado) avisar(mensagem);
    ultimoEstado = mensagem;
  }

  // amostras de cor (por CSSOM, nunca por atributo style)
  raiz.querySelectorAll<HTMLElement>('.fluxo-amostra').forEach((el) => {
    const p = paletaPorId(el.dataset.paleta ?? '');
    el.style.background = p.fundo;
    el.style.borderColor = p.destaque;
    el.style.boxShadow = `inset 0 -10px 0 ${p.destaque}`;
  });

  // ---------- desenho ----------
  let token = 0;
  async function desenhar(): Promise<void> {
    const meu = ++token;
    const link = linkAindaVale(d) ? d.link : '';
    try {
      const r = await desenharCardEm(canvas, d, d.formato, escalaDoFormato(d.formato, nivel), link, () => meu === token);
      if (!r) return;
      dizer(r.semQr ? 'Não deu para gerar o QR deste link. O cartaz sai sem QR.' : '');
      canvas.setAttribute('aria-label', descricaoDaImagem(d, d.formato, link, !!link && !r.semQr && d.formato === 'cartaz'));
    } catch (e) {
      if (meu === token) dizer(e instanceof Error ? e.message : 'Não deu para desenhar.');
    }
  }
  const agendador = criarAgendador(esperaDoRedesenho(nivel), () => void desenhar());
  // A mensagem de contraste da cor livre só muda depois de 800 ms parados: arrastar a cor não fala a cada movimento.
  let mensagemDaCor = '';
  const falarACor = criarAgendador(800, () => {
    q('fluxo-cor-msg').textContent = mensagemDaCor;
  });

  // ---------- reações ----------
  const radios = () => raiz.querySelectorAll<HTMLInputElement>('input[name="fluxo-paleta"]');
  function avisoDaCorLivre(): void {
    q('fluxo-cor-aviso').hidden = d.paletaId !== 'livre';
  }

  form.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.name === 'fluxo-formato') {
      d.formato = el.value as Formato;
      q('fluxo-formato-expl').textContent = EXPLICACAO_DO_FORMATO[d.formato];
      void desenhar();
    } else if (el.name === 'fluxo-paleta') {
      d.paletaId = el.value;
      q('fluxo-cor-nome').textContent = nomeDaCor(d.paletaId);
      avisoDaCorLivre();
      void desenhar();
    } else if (el.id === 'fluxo-rodape') {
      d.rodape = el.checked;
      void desenhar();
    }
  });

  q<HTMLInputElement>('fluxo-cor-livre').addEventListener('input', (e) => {
    const r = aplicarCorLivre((e.target as HTMLInputElement).value);
    mensagemDaCor = r.mensagem;
    falarACor.agendar();
    if (!r.ok || !r.paleta) return;
    d.corLivre = (e.target as HTMLInputElement).value;
    d.paletaId = 'livre';
    radios().forEach((r2) => (r2.checked = false));
    q('fluxo-cor-nome').textContent = nomeDaCor('livre');
    avisoDaCorLivre();
    agendador.agendar();
  });

  q<HTMLInputElement>('fluxo-logo').addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    limparErro(form, 'fluxo-logo');
    const arquivo = input.files?.[0];
    if (!arquivo) return;
    try {
      const lido = await lerLogo(arquivo);
      if (!vivo) return; // a pessoa já saiu deste passo
      trocarLogo(lido);
      const nome = q('fluxo-logo-nome');
      nome.textContent = `Logo escolhido: ${arquivo.name}`;
      nome.hidden = false;
      q('fluxo-logo-tirar').hidden = false;
      avisar('Logo colocado na imagem.');
      agendador.agendar();
    } catch (erro) {
      if (!vivo) return;
      input.value = '';
      // O arquivo recusado não troca nada: se já havia logo, o de antes continua (e "Tirar o logo" também).
      const base = 'Esse arquivo não deu.';
      const pedido = 'Escolha uma foto ou um desenho: PNG, JPG ou SVG.';
      const mensagem = logoAtual() ? `${base} O logo de antes continua. ${pedido}` : `${base} ${pedido}`;
      mostrarErro(form, 'fluxo-logo', mensagem);
      // Troca o aviso que ainda podia estar na tela ("Logo colocado na imagem.", do logo de antes).
      avisar(mensagem);
    }
  });
  q('fluxo-logo-tirar').addEventListener('click', () => {
    trocarLogo(undefined);
    q<HTMLInputElement>('fluxo-logo').value = '';
    q('fluxo-logo-nome').hidden = true;
    q('fluxo-logo-tirar').hidden = true;
    q<HTMLInputElement>('fluxo-logo').focus();
    avisar('Logo retirado.');
    agendador.agendar();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    irAoPasso(d.tipo, 'pronto');
  });
  q('fluxo-voltar').addEventListener('click', () => voltarDoPasso(d.tipo, 3));

  void desenhar();

  return () => {
    vivo = false;
    token++;
    agendador.cancelar();
    falarACor.cancelar();
    fecharDialogo();
    medidas();
  };
}
