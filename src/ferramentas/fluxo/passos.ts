// Os passos 1 e 2 do fluxo (docs/produto.md 7.6). Cada passo lê e muda os dados de memoria.ts; o endereço só
// leva o tipo e o passo. Todo texto digitado entra no HTML por esc (ou textContent). O passo 3 fica em passo3.ts.

import { avisar } from '../../comum/aviso';
import { campoAreaDeTexto, campoTexto, limparErro, limparTodosOsErros, mostrarErro } from '../../comum/formulario';
import { esc } from '../../comum/html';
import { icone } from '../../comum/icones';
import { nomeCurtoDaOrganizacao } from '../cards/exemplos';
import { DEF_MODELOS } from '../cards/modelos';
import {
  apagarOPasso1,
  AVISO_DE_APAGAR,
  botaoDeApagar,
  atalhoEscolhido,
  atalhosDoDia,
  AVISO_DIA_PASSADO,
  AVISO_DO_LINK_RESTO,
  AVISO_DO_LINK_TITULO,
  avisoDasLetrasDaPauta,
  camposComOrgao,
  confirmarOrgao,
  copiaDoPasso1,
  dataBr,
  devolverOPasso1,
  diaDoCalendario,
  diaJaPassou,
  DICA_DA_ORGANIZACAO,
  DICA_DA_PAUTA,
  DICA_DO_LOCAL,
  diaPorExtensoCurto,
  errosDoPasso,
  LIMITES,
  lerDataBr,
  marcarMudanca,
  perguntaDoOrgaoEmPartes,
  podePularOPasso2,
  precisaPerguntarDoOrgao,
  letrasQueFaltamNaPauta,
  temAgenda,
  type CopiaDoPasso1,
  type DadosDoFluxo,
  type ErrosDoFluxo,
} from './estado';
import { deveAnunciarOContador, faixaDoContador } from './contador';
import { avisoDeErros, camposDoPasso } from './apoio';
import { irAoPasso, voltarDoPasso } from './navegacao';
import { htmlDaMiniatura, ligarMiniatura, medirFaixasFixas } from './previa';
import { montarPasso3 } from './passo3';
import { barra, topoDoPasso, type PassoNumerado } from './topo';

/** Mostra os erros do passo (do último ao primeiro, para o foco ficar no primeiro). Devolve se havia erro. */
function mostrarErros(form: HTMLFormElement, campos: readonly string[], erros: ErrosDoFluxo): boolean {
  limparTodosOsErros(form);
  const com = campos.filter((c) => erros[c as keyof ErrosDoFluxo]);
  if (!com.length) return false;
  for (const c of [...com].reverse()) mostrarErro(form, `fluxo-${c}`, erros[c as keyof ErrosDoFluxo]!);
  avisar(avisoDeErros(com.length));
  return true;
}

/** Passos 1 e 2 (miniatura fixa no topo) ou o 3 (prévia grande). Devolve a limpeza. */
export function montarPasso(raiz: HTMLElement, d: DadosDoFluxo, passo: PassoNumerado): () => void {
  return passo === 3 ? montarPasso3(raiz, d) : montarPasso12(raiz, d, passo);
}

// ---------- passos 1 e 2 ----------

function camposDoPasso1Html(d: DadosDoFluxo): string {
  const m = DEF_MODELOS[d.tipo];
  // Reunião: o corretor do navegador pode mandar o texto para fora do aparelho (nome de pessoa na pauta).
  const semCorretor = d.tipo === 'reuniao';
  return `${campoTexto({ id: 'fluxo-titulo', rotulo: 'Título', valor: d.titulo, exemplo: d.exemplo.titulo, maximo: LIMITES.titulo, obrigatorio: true, semCorretor })}
      ${campoTexto({ id: 'fluxo-organizacao', rotulo: 'Organização', dica: DICA_DA_ORGANIZACAO, valor: d.organizacao, exemplo: nomeCurtoDaOrganizacao(d.exemplo.organizacao), maximo: LIMITES.organizacao, autocomplete: 'off', semCorretor })}
      ${
        d.tipo === 'reuniao'
          ? `<div class="aviso-info fluxo-aviso-do-link" id="fluxo-aviso-do-link">${icone('info', { classe: 'aviso-icone' })}<div class="aviso-corpo"><p><strong>${esc(AVISO_DO_LINK_TITULO)}</strong> ${esc(AVISO_DO_LINK_RESTO)}</p></div></div>
      ${campoAreaDeTexto({ id: 'fluxo-pauta', rotulo: 'Pauta (os assuntos da reunião)', dica: DICA_DA_PAUTA, valor: d.pauta, exemplo: d.exemplo.pauta, linhas: 5, obrigatorio: true, semCorretor })}
      <p class="campo-dica fluxo-pauta-letras" id="fluxo-pauta-letras">${esc(avisoDasLetrasDaPauta(d.pauta))}</p>
      <p class="fluxo-so-leitor" id="fluxo-pauta-fala" role="status" aria-live="polite"></p>`
          : campoAreaDeTexto({ id: 'fluxo-texto', rotulo: 'Texto curto', dica: m.dicaTexto, valor: d.texto, exemplo: d.exemplo.texto, maximo: LIMITES.texto, linhas: 3 })
      }`;
}

/** O navegador sabe escolher um dia no calendário (`<input type="date">`)? Raro que não: cai no campo de texto. */
function temCampoDeData(): boolean {
  try {
    const t = document.createElement('input');
    t.type = 'date';
    return t.type === 'date';
  } catch {
    return false;
  }
}

function campoDia(d: DadosDoFluxo, nativo: boolean): string {
  const agenda = temAgenda(d.tipo);
  const atalhos = atalhosDoDia()
    .map(
      (a) =>
        `<button type="button" class="pilula fluxo-atalho" data-dia="${esc(a.data)}" aria-pressed="${atalhoEscolhido(a, d.data)}">${icone('check', { tamanho: 18, classe: 'pilula-check' })}${esc(a.rotulo)}</button>`,
    )
    .join('');
  // O dia por extenso acompanha a escolha, mas só a região ao lado (fluxo-data-fala) é lida em voz alta,
  // e só quando a pessoa termina de escolher ou toca num atalho.
  const entradaDoDia = nativo
    ? `<input class="campo-entrada" type="date" min="2000-01-01" max="2099-12-31" id="fluxo-data" name="fluxo-data" value="${esc(diaDoCalendario(d.data))}"`
    : `<input class="campo-entrada" type="text" inputmode="numeric" autocomplete="off" id="fluxo-data" name="fluxo-data" value="${esc(dataBr(d.data))}"`;
  return `<div class="campo">
        <label class="campo-rotulo" for="fluxo-data">Dia${agenda ? '' : ' <span class="campo-opcional">(opcional)</span>'}</label>
        <div class="pilulas" role="group" aria-label="Atalhos do dia">${atalhos}</div>
        ${nativo ? '' : '<p class="campo-dica" id="fluxo-data-dica">Ex.: 14/11/2026</p>'}
        ${entradaDoDia}${agenda ? ' aria-required="true"' : ''} aria-describedby="${nativo ? '' : 'fluxo-data-dica '}fluxo-data-extenso fluxo-data-passado fluxo-data-erro">
        <p class="fluxo-extenso" id="fluxo-data-extenso">${esc(diaPorExtensoCurto(d.data))}</p>
        <p class="campo-dica fluxo-dia-passado" id="fluxo-data-passado">${esc(diaJaPassou(d.data) ? AVISO_DIA_PASSADO : '')}</p>
        <p class="fluxo-so-leitor" id="fluxo-data-fala" role="status"></p>
        <p class="campo-erro" id="fluxo-data-erro" hidden></p>
      </div>`;
}

function camposDoPasso2Html(d: DadosDoFluxo, nativo: boolean): string {
  const agenda = temAgenda(d.tipo);
  return `${campoDia(d, nativo)}
      ${agenda ? campoTexto({ id: 'fluxo-hora', rotulo: 'Hora', tipo: 'time', valor: d.hora, obrigatorio: true }) : ''}
      ${agenda ? campoTexto({ id: 'fluxo-local', rotulo: 'Local', dica: DICA_DO_LOCAL, valor: d.local, exemplo: d.exemplo.local, maximo: LIMITES.local, obrigatorio: true, autocomplete: 'off', semCorretor: d.tipo === 'reuniao' }) : ''}
      ${podePularOPasso2(d.tipo) ? '<button type="button" class="botao botao-sec" id="fluxo-pular">Pular este passo</button>' : ''}`;
}

/** "Apagar tudo" na linha da dica: escondido enquanto não há texto no passo 1. */
function htmlDoApagar(d: DadosDoFluxo): string {
  const b = botaoDeApagar(d, false);
  return `<button type="button" class="link-acao fluxo-apagar" id="fluxo-apagar"${b.escondido ? ' hidden' : ''}>${esc(b.rotulo)}</button>`;
}

function montarPasso12(raiz: HTMLElement, d: DadosDoFluxo, passo: 1 | 2): () => void {
  const nativo = passo === 2 && temCampoDeData();
  const { pergunta, resto } = perguntaDoOrgaoEmPartes();
  raiz.innerHTML = `<main class="tela fluxo" data-porta="${esc(d.tipo)}"${d.tipo === 'reuniao' ? ' spellcheck="false"' : ''}>
    ${topoDoPasso(d, passo, { aoLadoDaDica: passo === 1 ? htmlDoApagar(d) : '', miniatura: htmlDaMiniatura(), comCalendario: passo === 2 ? nativo : true })}
    <form class="fluxo-form" id="fluxo-form" novalidate>
      ${passo === 1 ? camposDoPasso1Html(d) : camposDoPasso2Html(d, nativo)}
    </form>
    <dialog class="painel" id="fluxo-orgao" aria-labelledby="fluxo-orgao-pergunta" aria-describedby="fluxo-orgao-resto">
      <div class="aviso-atencao">${icone('predio', { classe: 'aviso-icone' })}<div class="aviso-corpo"><p id="fluxo-orgao-texto"><strong id="fluxo-orgao-pergunta">${esc(pergunta)}</strong> <span id="fluxo-orgao-resto">${esc(resto)}</span></p></div></div>
      <div class="painel-acoes">
        <button type="button" class="botao" id="fluxo-orgao-mudar" autofocus>Mudar o texto</button>
        <button type="button" class="botao botao-sec" id="fluxo-orgao-seguir">Seguir assim</button>
      </div>
    </dialog>
    ${barra()}
  </main>`;

  const q = <T extends HTMLElement>(id: string) => raiz.querySelector<T>(`[id="${id}"]`)!;
  const form = q<HTMLFormElement>('fluxo-form');
  const entrada = (id: string) => q<HTMLInputElement | HTMLTextAreaElement>(id);
  const mini = ligarMiniatura(raiz, () => d);
  // O aviso do link da reunião também descreve o título (depois da dica dele) e a pauta (antes da dica dela):
  // quem pula de campo em campo ouve o aviso antes de escrever.
  if (raiz.querySelector('[id="fluxo-aviso-do-link"]')) {
    const descrever = (id: string, antes: boolean): void => {
      const el = raiz.querySelector(`[id="${id}"]`);
      const ids = (el?.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
      el?.setAttribute('aria-describedby', (antes ? ['fluxo-aviso-do-link', ...ids] : [...ids.slice(0, 1), 'fluxo-aviso-do-link', ...ids.slice(1)]).join(' '));
    };
    descrever('fluxo-titulo', false);
    descrever('fluxo-pauta', true);
  }
  // A linha das letras da pauta entra na leitura do campo, antes do espaço do erro.
  const pauta = raiz.querySelector('[id="fluxo-pauta"]');
  if (pauta) {
    const ids = (pauta.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
    const doErro = ids.filter((i) => i === 'fluxo-pauta-erro');
    pauta.setAttribute('aria-describedby', [...ids.filter((i) => i !== 'fluxo-pauta-erro'), 'fluxo-pauta-letras', ...doErro].join(' '));
  }
  // Passo 2 com agenda: já baixa as partes que o Pronto usa para criar o link (C-01). Falhar aqui não mostra nada.
  if (passo === 2 && temAgenda(d.tipo)) {
    void import('../evento/partes').catch(() => undefined);
    void import('../evento/formato').catch(() => undefined);
    void import('../evento/bloqueio').catch(() => undefined);
  }
  const medidas = medirFaixasFixas(raiz);

  const apagar = raiz.querySelector<HTMLButtonElement>('[id="fluxo-apagar"]');
  // O que a pessoa tinha escrito antes de apagar: só nesta variável (memória da aba). Fica até ela escrever de novo
  // num campo do passo 1 ou sair do passo (sem relógio).
  let copia: CopiaDoPasso1 | undefined;
  /** Põe no botão o nome e a vista que valem agora ("Apagar tudo", "Desfazer" ou escondido). */
  function atualizarOBotao(): void {
    if (!apagar) return;
    const b = botaoDeApagar(d, !!copia);
    apagar.textContent = b.rotulo;
    apagar.hidden = b.escondido;
  }
  function esquecerACopia(): void {
    copia = undefined;
  }
  /** A pessoa mexeu num campo: os dados passam a ser dela (e o botão acompanha o texto do passo 1). */
  function mudou(): void {
    marcarMudanca(d);
    atualizarOBotao();
  }

  // ---------- pergunta do órgão público (D1) ----------
  const painelOrgao = q<HTMLDialogElement>('fluxo-orgao');
  const continuar = q<HTMLButtonElement>('fluxo-continuar');
  const orgaoAberto = (): boolean => painelOrgao.hasAttribute('open');
  function fecharOrgao(): void {
    if (!orgaoAberto()) return;
    if (typeof painelOrgao.close === 'function') painelOrgao.close();
    else painelOrgao.removeAttribute('open');
  }
  function abrirOrgao(): void {
    if (typeof painelOrgao.showModal === 'function') painelOrgao.showModal();
    else painelOrgao.setAttribute('open', '');
    // O "Mudar o texto" tem autofocus: o showModal já põe o foco nele. Sem showModal, põe aqui.
    if (!painelOrgao.contains(document.activeElement)) q('fluxo-orgao-mudar').focus();
  }
  /** "Mudar o texto" (também o Esc): fecha e leva o foco ao primeiro campo que cita órgão. */
  function mudarOTexto(): void {
    const primeiro = camposComOrgao(d, passo)[0];
    fecharOrgao();
    const campo = primeiro ? raiz.querySelector<HTMLElement>(`[id="fluxo-${primeiro}"]`) : null;
    (campo ?? continuar).focus();
  }
  q('fluxo-orgao-mudar').addEventListener('click', mudarOTexto);
  q('fluxo-orgao-seguir').addEventListener('click', () => {
    confirmarOrgao(d, passo);
    fecharOrgao();
    irAoPasso(d.tipo, passo === 1 ? 2 : 3);
  });
  // Esc = a escolha segura. Tocar no fundo escurecido não fecha: é uma confirmação.
  painelOrgao.addEventListener('cancel', (e) => {
    e.preventDefault();
    mudarOTexto();
  });

  // ---------- letras da pauta (A-02/B-19) ----------
  const linhaDasLetras = raiz.querySelector<HTMLElement>('[id="fluxo-pauta-letras"]');
  const falaDasLetras = raiz.querySelector<HTMLElement>('[id="fluxo-pauta-fala"]');
  let faixaDasLetras = faixaDoContador(letrasQueFaltamNaPauta(d.pauta));
  let tempoDaFala: ReturnType<typeof setTimeout> | undefined;
  function atualizarLetras(): void {
    if (!linhaDasLetras || !falaDasLetras) return;
    const texto = avisoDasLetrasDaPauta(d.pauta);
    linhaDasLetras.textContent = texto;
    const faixa = faixaDoContador(letrasQueFaltamNaPauta(d.pauta));
    const anunciar = deveAnunciarOContador(faixaDasLetras, faixa);
    faixaDasLetras = faixa;
    if (!anunciar) return;
    // Esvazia e escreve logo depois, para o leitor de tela repetir uma frase igual à de antes.
    falaDasLetras.textContent = '';
    clearTimeout(tempoDaFala);
    tempoDaFala = setTimeout(() => (falaDasLetras.textContent = texto), 60);
  }

  /** Escreve nos campos do passo 1 o que está em `d` (depois de apagar ou desfazer). */
  function escreverOsCampos(): void {
    for (const [id, valor] of [
      ['fluxo-titulo', d.titulo],
      ['fluxo-organizacao', d.organizacao],
      ['fluxo-texto', d.texto],
      ['fluxo-pauta', d.pauta],
    ] as const) {
      const el = raiz.querySelector<HTMLInputElement>(`[id="${id}"]`);
      if (el) el.value = valor;
    }
    atualizarLetras();
  }

  let diaInvalido = false;
  /** Os atalhos acompanham o dia escrito: o que tem o mesmo dia fica escolhido (aria-pressed), venha o dia de onde vier. */
  function atualizarAtalhos(): void {
    raiz.querySelectorAll<HTMLButtonElement>('.fluxo-atalho').forEach((b) =>
      b.setAttribute('aria-pressed', String(atalhoEscolhido({ data: b.dataset.dia ?? '' }, d.data))),
    );
  }
  function lerDia(): void {
    const extenso = q('fluxo-data-extenso');
    if (nativo) {
      d.data = diaDoCalendario(entrada('fluxo-data').value);
      diaInvalido = false;
    } else {
      const r = lerDataBr(entrada('fluxo-data').value);
      if (r === null) {
        diaInvalido = true;
        d.data = '';
        extenso.textContent = '';
        mostrarDiaPassado();
        atualizarAtalhos();
        return;
      }
      diaInvalido = false;
      d.data = r;
    }
    extenso.textContent = d.data ? diaPorExtensoCurto(d.data) : '';
    mostrarDiaPassado();
    atualizarAtalhos();
  }
  /** O dia já passou? Só avisa, não impede de seguir. */
  function mostrarDiaPassado(): void {
    q('fluxo-data-passado').textContent = !diaInvalido && diaJaPassou(d.data) ? AVISO_DIA_PASSADO : '';
  }
  /** Fala o dia por extenso (só ao terminar de escolher ou num atalho, nunca a cada letra). */
  function falarODia(): void {
    q('fluxo-data-fala').textContent =
      !diaInvalido && d.data ? `${diaPorExtensoCurto(d.data)}${diaJaPassou(d.data) ? `. ${AVISO_DIA_PASSADO}` : ''}` : '';
  }

  form.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    switch (el.id) {
      case 'fluxo-titulo':
        esquecerACopia();
        d.titulo = el.value;
        break;
      case 'fluxo-organizacao':
        esquecerACopia();
        d.organizacao = el.value;
        break;
      case 'fluxo-texto':
        esquecerACopia();
        d.texto = el.value;
        break;
      case 'fluxo-pauta':
        esquecerACopia();
        d.pauta = el.value;
        atualizarLetras();
        break;
      case 'fluxo-data':
        lerDia();
        break;
      case 'fluxo-hora':
        d.hora = el.value;
        break;
      case 'fluxo-local':
        d.local = el.value;
        break;
      default:
        return;
    }
    mudou();
    limparErro(form, el.id);
    mini.redesenhar();
  });

  // Campo de texto (sem calendário): o dia escrito certo volta no jeito de sempre (14/11/2026).
  form.addEventListener('change', (e) => {
    if ((e.target as HTMLElement).id !== 'fluxo-data') return;
    lerDia();
    if (!nativo && !diaInvalido && d.data) entrada('fluxo-data').value = dataBr(d.data);
    falarODia();
  });

  raiz.querySelectorAll<HTMLButtonElement>('.fluxo-atalho').forEach((b) =>
    b.addEventListener('click', () => {
      d.data = b.dataset.dia ?? '';
      entrada('fluxo-data').value = nativo ? d.data : dataBr(d.data);
      diaInvalido = false;
      q('fluxo-data-extenso').textContent = diaPorExtensoCurto(d.data);
      atualizarAtalhos();
      mostrarDiaPassado();
      falarODia();
      mudou();
      limparErro(form, 'fluxo-data');
      mini.redesenhar();
    }),
  );

  if (passo === 1) {
    q('fluxo-apagar').addEventListener('click', () => {
      if (copia) {
        // Desfazer: devolve o que estava escrito e põe o foco no Título.
        devolverOPasso1(d, copia);
        esquecerACopia();
        escreverOsCampos();
        limparTodosOsErros(form);
        atualizarOBotao();
        mini.redesenhar();
        avisar('Voltou o que você tinha escrito.');
        entrada('fluxo-titulo').focus();
        return;
      }
      copia = copiaDoPasso1(d);
      apagarOPasso1(d);
      escreverOsCampos();
      mudou();
      limparTodosOsErros(form);
      mini.redesenhar();
      avisar(AVISO_DE_APAGAR);
      entrada('fluxo-titulo').focus();
    });
  }

  raiz.querySelector('[id="fluxo-pular"]')?.addEventListener('click', () => irAoPasso(d.tipo, 3));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (passo === 2) lerDia();
    const erros = errosDoPasso(d, passo);
    if (passo === 2 && diaInvalido) erros.data = 'escreva o dia como 14/11/2026.';
    if (mostrarErros(form, camposDoPasso(d.tipo, passo), erros)) return;
    if (precisaPerguntarDoOrgao(d, passo)) {
      abrirOrgao();
      return;
    }
    irAoPasso(d.tipo, passo === 1 ? 2 : 3);
  });

  q('fluxo-voltar').addEventListener('click', () => voltarDoPasso(d.tipo, passo));

  return () => {
    clearTimeout(tempoDaFala);
    mini.limpar();
    medidas();
  };
}
