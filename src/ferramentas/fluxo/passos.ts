// Os passos 1, 2 e 3 do fluxo (docs/produto.md 7.6). Cada passo lê e muda os dados de memoria.ts; o endereço só
// leva o tipo e o passo. Todo texto digitado entra no HTML por esc (ou textContent); as amostras de cor vão por CSSOM.

import { avisar } from '../../comum/aviso';
import { campoAreaDeTexto, campoTexto, limparErro, limparTodosOsErros, mostrarErro } from '../../comum/formulario';
import { esc } from '../../comum/html';
import { NOME } from '../../comum/marca';
import { nivelDoAparelho } from '../../comum/nivel';
import { DEF_MODELOS, escalaDoFormato, type Formato } from '../cards/modelos';
import { lerLogo } from '../cards/logo';
import { aplicarCorLivre, PALETAS, paletaPorId } from '../cards/paletas';
import {
  apagarOPasso1,
  avisoDeApagar,
  passo1Vazio,
  PRAZO_DO_DESFAZER_S,
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
  EXPLICACAO_DO_FORMATO,
  FORMATOS,
  LIMITES,
  lerDataBr,
  linkAindaVale,
  marcarMudanca,
  NOME_DO_FORMATO,
  notaEDicaDoPasso,
  PERGUNTA_DO_ORGAO,
  PORTAS,
  podePularOPasso2,
  precisaPerguntarDoOrgao,
  letrasQueFaltamNaPauta,
  ROTULO_DESFAZER,
  rotuloDeApagar,
  temAgenda,
  tituloDoPasso2,
  type CopiaDoPasso1,
  type DadosDoFluxo,
  type ErrosDoFluxo,
} from './estado';
import { deveAnunciarOContador, faixaDoContador } from './contador';
import {
  avisoDeErros,
  camposDoPasso,
  criarAgendador,
  descricaoDaImagem,
  esperaDoRedesenho,
} from './apoio';
import { logoAtual, trocarLogo } from './memoria';
import { irAoPasso, voltarDoPasso } from './navegacao';
import { BOTAO_VER_MAIOR, desenharCardEm, htmlDaMiniatura, htmlDoDialogo, ligarDialogo, ligarMiniatura, medirFaixasFixas } from './previa';

type PassoNumerado = 1 | 2 | 3;

const NOME_DO_PASSO = (d: DadosDoFluxo, passo: PassoNumerado): string =>
  passo === 1 ? 'O quê' : passo === 2 ? tituloDoPasso2(d.tipo) : 'Como fica';

/**
 * Título da tela: o verbo da porta, "Passo N de 3" e o nome do passo, tudo dentro do h1 (o leitor de tela lê
 * "Chamar para uma reunião. Passo 1 de 3: O quê"). Os separadores só aparecem para o leitor de tela.
 */
function cabecalho(d: DadosDoFluxo, passo: PassoNumerado, aoLadoDaDica = '', miniatura = ''): string {
  const { nota, dica } = notaEDicaDoPasso(d, passo);
  const htmlDaDica = dica ? `<p class="fluxo-dica">${esc(dica)}</p>` : '';
  // Passo 1: a dica e "Apagar o exemplo" dividem a mesma linha (o primeiro campo cabe na primeira tela).
  const linha = aoLadoDaDica ? `<div class="fluxo-dica-linha">${htmlDaDica}${aoLadoDaDica}</div>` : htmlDaDica;
  const aviso = `${nota ? `<p class="fluxo-nota">${esc(nota)}</p>` : ''}${linha}`;
  // A miniatura (se houver) vem logo depois do título: o Tab passa por "Ver a prévia maior" e "Apagar" antes do
  // primeiro campo. O CSS a põe no topo da tela.
  return `<h1 tabindex="-1"><span class="fluxo-verbo">${esc(PORTAS[d.tipo].verbo)}</span><span class="fluxo-so-leitor">. </span><span class="fluxo-passo">Passo ${passo} de 3</span><span class="fluxo-so-leitor">: </span><span class="fluxo-nome">${esc(NOME_DO_PASSO(d, passo))}</span></h1>
    ${miniatura}
    ${aviso}`;
}

const BARRA = (rotulo = 'Continuar'): string => `<div class="fluxo-barra">
      <button type="button" class="botao botao-sec" id="fluxo-voltar">Voltar</button>
      <button type="submit" form="fluxo-form" class="botao" id="fluxo-continuar">${esc(rotulo)}</button>
    </div>`;

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
  return `${campoTexto({ id: 'fluxo-titulo', rotulo: 'Título', dica: m.dicaTitulo, valor: d.titulo, maximo: LIMITES.titulo, obrigatorio: true, semCorretor })}
      ${campoTexto({ id: 'fluxo-organizacao', rotulo: 'Organização', dica: 'Quem está chamando. Escreva o nome da organização, não de pessoas. Nome de criança ou adolescente nunca.', valor: d.organizacao, maximo: LIMITES.organizacao, autocomplete: 'off', semCorretor })}
      ${
        d.tipo === 'reuniao'
          ? `<p class="fluxo-quadro" id="fluxo-aviso-do-link">${esc(AVISO_DO_LINK_DA_REUNIAO)}</p>
      ${campoAreaDeTexto({ id: 'fluxo-pauta', rotulo: 'Pauta (os assuntos da reunião)', dica: 'Um assunto por linha. Sem nome de pessoa.', valor: d.pauta, linhas: 5, obrigatorio: true, semCorretor })}
      <p class="campo-dica fluxo-pauta-letras" id="fluxo-pauta-letras">${esc(avisoDasLetrasDaPauta(d.pauta))}</p>
      <p class="fluxo-so-leitor" id="fluxo-pauta-fala" role="status" aria-live="polite"></p>`
          : campoAreaDeTexto({ id: 'fluxo-texto', rotulo: 'Texto curto', dica: m.dicaTexto, valor: d.texto, maximo: LIMITES.texto, linhas: 3 })
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
      ${agenda ? campoTexto({ id: 'fluxo-local', rotulo: 'Local', dica: DICA_DO_LOCAL, valor: d.local, maximo: LIMITES.local, obrigatorio: true, autocomplete: 'off', semCorretor: d.tipo === 'reuniao' }) : ''}
      ${podePularOPasso2(d.tipo) ? '<button type="button" class="botao botao-sec" id="fluxo-pular">Pular este passo</button>' : ''}`;
}

function montarPasso12(raiz: HTMLElement, d: DadosDoFluxo, passo: 1 | 2): () => void {
  raiz.innerHTML = `<main class="tela fluxo"${d.tipo === 'reuniao' ? ' spellcheck="false"' : ''}>
    ${cabecalho(d, passo, passo === 1 ? `<button type="button" class="fluxo-apagar" id="fluxo-apagar">${esc(rotuloDeApagar(d.origem))}</button>` : '', htmlDaMiniatura())}
    <form class="fluxo-form" id="fluxo-form" novalidate>
      ${passo === 1 ? camposDoPasso1Html(d) : camposDoPasso2Html(d)}
    </form>
    <div class="fluxo-confirma" id="fluxo-orgao" role="group" aria-labelledby="fluxo-orgao-texto" tabindex="-1" hidden>
      <p id="fluxo-orgao-texto">${esc(PERGUNTA_DO_ORGAO)}</p>
      <button type="button" class="botao" id="fluxo-orgao-mudar">Mudar</button>
      <button type="button" class="botao botao-sec" id="fluxo-orgao-seguir">Seguir</button>
    </div>
    ${BARRA()}
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
  // O que a pessoa tinha escrito antes de apagar: só nesta variável (memória da aba), por 10 s.
  let copia: CopiaDoPasso1 | undefined;
  let tempoDoDesfazer: ReturnType<typeof setTimeout> | undefined;
  /** Os 10 s do Desfazer; enquanto o foco está no próprio botão, o prazo não corre. */
  function comecarPrazo(): void {
    clearTimeout(tempoDoDesfazer);
    tempoDoDesfazer = copia ? setTimeout(esquecerACopia, PRAZO_DO_DESFAZER_S * 1000) : undefined;
  }
  function esquecerACopia(): void {
    clearTimeout(tempoDoDesfazer);
    tempoDoDesfazer = undefined;
    copia = undefined;
    if (apagar) apagar.textContent = rotuloDeApagar(d.origem);
  }
  /** A pessoa mexeu num campo: o exemplo passa a ser dela (e o botão deixa de falar em "exemplo"). */
  function mudou(): void {
    marcarMudanca(d);
    fecharOrgao(false);
    if (apagar) apagar.textContent = copia ? ROTULO_DESFAZER : rotuloDeApagar(d.origem);
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
        mini.redesenhar();
        entrada('fluxo-titulo').focus();
        avisar('Voltou o que você tinha escrito.');
        return;
      }
      const eraExemplo = d.origem === 'exemplo';
      // Nada escrito: não há o que trazer de volta, então nem guarda cópia nem oferece "Desfazer".
      const comDesfazer = !passo1Vazio(d);
      copia = comDesfazer ? copiaDoPasso1(d) : undefined;
      apagarOPasso1(d);
      escreverOsCampos();
      mudou();
      limparTodosOsErros(form);
      mini.redesenhar();
      entrada('fluxo-titulo').focus();
      comecarPrazo();
      avisar(avisoDeApagar(eraExemplo, comDesfazer));
    });
    // Foco no botão "Desfazer": o prazo para; ao sair dele, recomeça os 10 s.
    q('fluxo-apagar').addEventListener('focus', () => {
      clearTimeout(tempoDoDesfazer);
      tempoDoDesfazer = undefined;
    });
    q('fluxo-apagar').addEventListener('blur', () => {
      if (copia) comecarPrazo();
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
    clearTimeout(tempoDoDesfazer);
    clearTimeout(tempoDaFala);
    mini.limpar();
    medidas();
  };
}

// ---------- passo 3 ----------

function montarPasso3(raiz: HTMLElement, d: DadosDoFluxo): () => void {
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
    ${cabecalho(d, 3)}
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
    ${BARRA('Ficou bom')}
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
      mostrarErro(form, 'fluxo-logo', logoAtual() ? `${base} O logo de antes continua. ${pedido}` : `${base} ${pedido}`);
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
