// Os passos 1 e 2 do fluxo (docs/produto.md 7.6). Cada passo lê e muda os dados de memoria.ts; o endereço só
// leva o tipo e o passo. Todo texto digitado entra no HTML por esc (ou textContent). O passo 3 fica em passo3.ts.

import { avisar } from '../../comum/aviso';
import { campoAreaDeTexto, campoTexto, limparErro, limparTodosOsErros, mostrarErro } from '../../comum/formulario';
import { esc } from '../../comum/html';
import { DEF_MODELOS } from '../cards/modelos';
import {
  apagarOPasso1,
  AVISO_DE_APAGAR,
  botaoDeApagar,
  atalhosDoDia,
  AVISO_DIA_PASSADO,
  avisoDasLetrasDaPauta,
  camposComOrgao,
  confirmarOrgao,
  copiaDoPasso1,
  dataBr,
  devolverOPasso1,
  diaJaPassou,
  diaPorExtenso,
  errosDoPasso,
  LIMITES,
  lerDataBr,
  marcarMudanca,
  PERGUNTA_DO_ORGAO,
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

/**
 * Reunião: título, local e pauta vão no link do convite. Fica num quadro logo acima da pauta (o título cabe na
 * primeira tela) e também é lido junto com a pauta (aria-describedby), para quem pula de campo em campo.
 */
const AVISO_DO_LINK_DA_REUNIAO =
  'Título, local e pauta vão no link do convite, e quem receber pode repassar. Não escreva nome de pessoa nem assunto que só o grupo pode saber.';
const DICA_DO_LOCAL = 'Escreva o endereço como se fosse procurar no mapa. Se for numa casa, não ponha o nome de quem mora.';

function camposDoPasso1Html(d: DadosDoFluxo): string {
  const m = DEF_MODELOS[d.tipo];
  // Reunião: o corretor do navegador pode mandar o texto para fora do aparelho (nome de pessoa na pauta).
  const semCorretor = d.tipo === 'reuniao';
  return `${campoTexto({ id: 'fluxo-titulo', rotulo: 'Título', dica: m.dicaTitulo, valor: d.titulo, exemplo: d.exemplo.titulo, maximo: LIMITES.titulo, obrigatorio: true, semCorretor })}
      ${campoTexto({ id: 'fluxo-organizacao', rotulo: 'Organização', dica: 'Quem está chamando. Escreva o nome da organização, não de pessoas. Nome de criança ou adolescente nunca.', valor: d.organizacao, exemplo: d.exemplo.organizacao, maximo: LIMITES.organizacao, autocomplete: 'off', semCorretor })}
      ${
        d.tipo === 'reuniao'
          ? `<p class="fluxo-quadro" id="fluxo-aviso-do-link">${esc(AVISO_DO_LINK_DA_REUNIAO)}</p>
      ${campoAreaDeTexto({ id: 'fluxo-pauta', rotulo: 'Pauta (os assuntos da reunião)', dica: 'Um assunto por linha. Sem nome de pessoa.', valor: d.pauta, exemplo: d.exemplo.pauta, linhas: 5, obrigatorio: true, semCorretor })}
      <p class="campo-dica fluxo-pauta-letras" id="fluxo-pauta-letras">${esc(avisoDasLetrasDaPauta(d.pauta))}</p>
      <p class="fluxo-so-leitor" id="fluxo-pauta-fala" role="status" aria-live="polite"></p>`
          : campoAreaDeTexto({ id: 'fluxo-texto', rotulo: 'Texto curto', dica: m.dicaTexto, valor: d.texto, exemplo: d.exemplo.texto, maximo: LIMITES.texto, linhas: 3 })
      }`;
}

function campoDia(d: DadosDoFluxo): string {
  const obrig = temAgenda(d.tipo);
  const atalhos = atalhosDoDia()
    .map((a) => `<button type="button" class="botao botao-sec fluxo-atalho" data-dia="${esc(a.data)}">${esc(a.rotulo)}</button>`)
    .join('');
  // O texto do dia por extenso acompanha a digitação, mas só a região ao lado (fluxo-data-fala) é lida em voz alta,
  // e só quando a pessoa termina de escrever ou toca num atalho.
  return `<div class="campo">
        <label class="campo-rotulo" for="fluxo-data">Dia${obrig ? ' <span class="campo-obrig">(obrigatório)</span>' : ''}</label>
        <p class="campo-dica" id="fluxo-data-dica">Ex.: 14/11/2026</p>
        <input class="campo-entrada" type="text" inputmode="numeric" autocomplete="off" id="fluxo-data" name="fluxo-data" value="${esc(dataBr(d.data))}"${obrig ? ' aria-required="true"' : ''} aria-describedby="fluxo-data-dica fluxo-data-extenso fluxo-data-passado fluxo-data-erro">
        <div class="fluxo-atalhos" role="group" aria-label="Atalhos para o dia">${atalhos}</div>
        <p class="fluxo-extenso" id="fluxo-data-extenso">${esc(diaPorExtenso(d.data))}</p>
        <p class="campo-dica fluxo-dia-passado" id="fluxo-data-passado">${esc(diaJaPassou(d.data) ? AVISO_DIA_PASSADO : '')}</p>
        <p class="fluxo-so-leitor" id="fluxo-data-fala" role="status"></p>
        <p class="campo-erro" id="fluxo-data-erro" hidden></p>
      </div>`;
}

function camposDoPasso2Html(d: DadosDoFluxo): string {
  const agenda = temAgenda(d.tipo);
  return `${campoDia(d)}
      ${agenda ? campoTexto({ id: 'fluxo-hora', rotulo: 'Hora', tipo: 'time', valor: d.hora, obrigatorio: true }) : ''}
      ${agenda ? campoTexto({ id: 'fluxo-local', rotulo: 'Local', dica: DICA_DO_LOCAL, valor: d.local, exemplo: d.exemplo.local, maximo: LIMITES.local, obrigatorio: true, autocomplete: 'off', semCorretor: d.tipo === 'reuniao' }) : ''}
      ${podePularOPasso2(d.tipo) ? '<button type="button" class="botao botao-sec" id="fluxo-pular">Pular este passo</button>' : ''}`;
}

/** "Apagar tudo" na linha da dica: escondido enquanto não há texto no passo 1. */
function htmlDoApagar(d: DadosDoFluxo): string {
  const b = botaoDeApagar(d, false);
  return `<button type="button" class="fluxo-apagar" id="fluxo-apagar"${b.escondido ? ' hidden' : ''}>${esc(b.rotulo)}</button>`;
}

function montarPasso12(raiz: HTMLElement, d: DadosDoFluxo, passo: 1 | 2): () => void {
  raiz.innerHTML = `<main class="tela fluxo"${d.tipo === 'reuniao' ? ' spellcheck="false"' : ''}>
    ${topoDoPasso(d, passo, { aoLadoDaDica: passo === 1 ? htmlDoApagar(d) : '', miniatura: htmlDaMiniatura() })}
    <form class="fluxo-form" id="fluxo-form" novalidate>
      ${passo === 1 ? camposDoPasso1Html(d) : camposDoPasso2Html(d)}
    </form>
    <div class="fluxo-confirma" id="fluxo-orgao" role="group" aria-labelledby="fluxo-orgao-texto" tabindex="-1" hidden>
      <p id="fluxo-orgao-texto">${esc(PERGUNTA_DO_ORGAO)}</p>
      <button type="button" class="botao" id="fluxo-orgao-mudar">Mudar</button>
      <button type="button" class="botao botao-sec" id="fluxo-orgao-seguir">Seguir</button>
    </div>
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
    fecharOrgao(false);
    atualizarOBotao();
  }

  // ---------- pergunta do órgão público (D1) ----------
  const painelOrgao = q('fluxo-orgao');
  const continuar = q<HTMLButtonElement>('fluxo-continuar');
  function fecharOrgao(devolverFoco: boolean): void {
    if (painelOrgao.hidden) return;
    painelOrgao.hidden = true;
    if (devolverFoco) continuar.focus();
  }
  function abrirOrgao(): void {
    painelOrgao.hidden = false;
    painelOrgao.scrollIntoView({ block: 'start' });
    // O foco vai para o grupo: o leitor lê a pergunta (aria-labelledby) e o Tab leva aos botões.
    painelOrgao.focus({ preventScroll: true });
  }
  q('fluxo-orgao-mudar').addEventListener('click', () => {
    const primeiro = camposComOrgao(d, passo)[0];
    fecharOrgao(false);
    (primeiro ? raiz.querySelector<HTMLElement>(`[id="fluxo-${primeiro}"]`) : null)?.focus();
  });
  q('fluxo-orgao-seguir').addEventListener('click', () => {
    confirmarOrgao(d, passo);
    irAoPasso(d.tipo, passo === 1 ? 2 : 3);
  });
  painelOrgao.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    fecharOrgao(true);
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
  function lerDia(): void {
    const r = lerDataBr(entrada('fluxo-data').value);
    const extenso = q('fluxo-data-extenso');
    if (r === null) {
      diaInvalido = true;
      extenso.textContent = '';
      mostrarDiaPassado();
      return;
    }
    diaInvalido = false;
    d.data = r;
    extenso.textContent = r ? diaPorExtenso(r) : '';
    mostrarDiaPassado();
  }
  /** O dia já passou? Só avisa, não impede de seguir. */
  function mostrarDiaPassado(): void {
    q('fluxo-data-passado').textContent = !diaInvalido && diaJaPassou(d.data) ? AVISO_DIA_PASSADO : '';
  }
  /** Fala o dia por extenso (só ao terminar de escrever ou num atalho, nunca a cada letra). */
  function falarODia(): void {
    q('fluxo-data-fala').textContent =
      !diaInvalido && d.data ? `${diaPorExtenso(d.data)}${diaJaPassou(d.data) ? `. ${AVISO_DIA_PASSADO}` : ''}` : '';
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

  // Dia escrito certo volta no jeito de sempre (14/11/2026).
  form.addEventListener('change', (e) => {
    if ((e.target as HTMLElement).id !== 'fluxo-data') return;
    lerDia();
    if (!diaInvalido && d.data) entrada('fluxo-data').value = dataBr(d.data);
    falarODia();
  });

  raiz.querySelectorAll<HTMLButtonElement>('.fluxo-atalho').forEach((b) =>
    b.addEventListener('click', () => {
      d.data = b.dataset.dia ?? '';
      entrada('fluxo-data').value = dataBr(d.data);
      diaInvalido = false;
      q('fluxo-data-extenso').textContent = diaPorExtenso(d.data);
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
        fecharOrgao(false);
        limparTodosOsErros(form);
        atualizarOBotao();
        mini.redesenhar();
        entrada('fluxo-titulo').focus();
        avisar('Voltou o que você tinha escrito.');
        return;
      }
      copia = copiaDoPasso1(d);
      apagarOPasso1(d);
      escreverOsCampos();
      mudou();
      limparTodosOsErros(form);
      mini.redesenhar();
      entrada('fluxo-titulo').focus();
      avisar(AVISO_DE_APAGAR);
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
