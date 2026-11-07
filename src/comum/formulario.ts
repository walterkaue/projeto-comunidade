// Componentes de formulário acessíveis. Cada um devolve uma string de HTML (o projeto usa innerHTML + esc).
// Regras: sempre <label for>, sempre visível; dica e erro ligados por aria-describedby; o que não é obrigatório
// vem escrito em texto ("(opcional)"), e o obrigatório leva aria-required; o placeholder é só um exemplo
// ("Ex.: ..."), nunca o rótulo; todo valor passa por esc.
// Tamanho de toque e fonte de 16 px ficam em componentes.css. O erro nunca depende só de cor (texto "Erro:" + borda grossa).

import { esc } from './html';
import { icone } from './icones';
import { letras } from './texto';

export type TipoDeCampo = 'text' | 'date' | 'time' | 'url' | 'tel' | 'email';

interface Base {
  id: string;
  rotulo: string;
  dica?: string;
  valor?: string;
  obrigatorio?: boolean;
  autocomplete?: string;
  /**
   * Desliga o corretor ortográfico do navegador. O corretor "avançado" do Chrome e o do Edge mandam o texto
   * digitado para o Google ou a Microsoft: use em campo com dado que não pode sair do aparelho (ata, presença).
   */
  semCorretor?: boolean;
}

/** Atributos que desligam o corretor ortográfico (spellcheck) e a correção automática do iPhone (autocorrect). */
export const ATRIBUTOS_SEM_CORRETOR = ' spellcheck="false" autocorrect="off"';

export interface CampoTexto extends Base {
  /** Exemplo mostrado como placeholder ("Ex.: ..."); nunca substitui o rótulo. */
  exemplo?: string;
  maximo?: number;
  tipo?: TipoDeCampo;
}

export interface CampoAreaDeTexto extends Base {
  /** Exemplo mostrado como placeholder ("Ex.: ..."); nunca substitui o rótulo. */
  exemplo?: string;
  maximo?: number;
  linhas?: number;
}

export interface Opcao {
  valor: string;
  texto: string;
}

export interface CampoEscolha extends Base {
  opcoes: readonly Opcao[];
}

export interface GrupoDeOpcoes extends Omit<Base, 'autocomplete'> {
  /** Atributo name dos radios (padrão: o próprio id). */
  nome?: string;
  opcoes: readonly Opcao[];
}

const idDaDica = (id: string) => `${id}-dica`;
const idDoErro = (id: string) => `${id}-erro`;
const idDoContador = (id: string) => `${id}-contador`;
const idDoAnuncio = (id: string) => `${id}-anuncio`;

const OPCIONAL = ' <span class="campo-opcional">(opcional)</span>';

function rotuloHtml(b: Pick<Base, 'id' | 'rotulo' | 'obrigatorio'>): string {
  const opc = b.obrigatorio ? '' : OPCIONAL;
  return `<label class="campo-rotulo" for="${esc(b.id)}">${esc(b.rotulo)}${opc}</label>`;
}

/** placeholder="Ex.: ..." (sem repetir "Ex.:"; na área de texto, só a primeira linha leva o "Ex.:"). */
function placeholderHtml(exemplo: string | undefined): string {
  const e = exemplo?.trim();
  if (!e) return '';
  const linhas = e.split(/\r?\n/);
  const primeira = /^Ex\.:/.test(linhas[0] ?? '') ? linhas[0]! : `Ex.: ${linhas[0]}`;
  return ` placeholder="${esc([primeira, ...linhas.slice(1)].join('\n'))}"`;
}

function dicaHtml(b: Pick<Base, 'id' | 'dica'>): string {
  return b.dica ? `<p class="campo-dica" id="${esc(idDaDica(b.id))}">${esc(b.dica)}</p>` : '';
}

function erroHtml(id: string): string {
  return `<p class="campo-erro" id="${esc(idDoErro(id))}" hidden></p>`;
}

function descritoPor(b: Pick<Base, 'id' | 'dica'>, comContador = false): string {
  const ids = [b.dica ? idDaDica(b.id) : '', comContador ? idDoContador(b.id) : '', idDoErro(b.id)].filter(Boolean);
  return ` aria-describedby="${esc(ids.join(' '))}"`;
}

function comuns(b: Base, comContador = false): string {
  return (
    `${b.obrigatorio ? ' aria-required="true"' : ''}` +
    `${b.autocomplete ? ` autocomplete="${esc(b.autocomplete)}"` : ''}` +
    `${b.semCorretor ? ATRIBUTOS_SEM_CORRETOR : ''}` +
    descritoPor(b, comContador)
  );
}

// ---------- limite de letras (A-03, C-04) ----------
// Conta por letra como a pessoa vê (emoji conta 1), não por unidade de texto como o maxlength do navegador.
// A dica leva "Até N letras." no mesmo parágrafo; o contador aparece só perto do fim; um anúncio calmo para o
// leitor de tela só fala ao entrar na faixa "perto" e ao chegar no limite, nunca a cada tecla.

/** Quanto já foi anunciado: 0 nada (fora da faixa), 1 "perto", 2 "chegou ao limite". */
export type NivelAnunciado = 0 | 1 | 2;

export interface EstadoDoLimite {
  /** O valor já cortado para caber. */
  valor: string;
  cortou: boolean;
  faltam: number;
  /** O contador aparece (perto do fim). */
  visivel: boolean;
  textoVisivel: string;
  /** Texto para a região viva; vazio quando não há o que anunciar agora. */
  anuncio: string;
  /** Guardar e passar de volta na próxima chamada. */
  nivel: NivelAnunciado;
  /** Onde o cursor fica depois do corte (no mesmo lugar, se nada foi cortado). */
  cursor: number;
}

/** Faltam quantas letras para o contador aparecer: no máximo 20, ou 20% do limite se for menor. */
export function faixaPerto(maximo: number): number {
  return Math.min(20, Math.ceil(maximo * 0.2));
}

export function textoDoLimite(faltam: number, maximo: number): string {
  if (faltam <= 0) return `Chegou ao limite de ${maximo} letras.`;
  return faltam === 1 ? 'Falta 1 letra.' : `Faltam ${faltam} letras.`;
}

/** Conta toda a regra do limite. Pura: a tela só aplica o resultado. */
export function estadoDoLimite(
  valor: string,
  maximo: number,
  anunciouAntes: NivelAnunciado = 0,
  /** Posição do cursor (unidades do campo, como selectionStart). Sem ela, conta como se estivesse no fim. */
  cursorAntes: number = valor.length,
): EstadoDoLimite {
  const partes = letras(valor);
  const cortou = partes.length > maximo;
  // O que passou do limite são as letras que acabaram de entrar, logo antes do cursor: tira essas e mantém
  // o que já estava escrito depois dele (como o maxlength fazia ao recusar a letra nova).
  let final = valor;
  let cursor = Math.min(Math.max(0, cursorAntes), valor.length);
  if (cortou) {
    const excesso = partes.length - maximo;
    const antesDoCursor = letras(valor.slice(0, cursor)).length;
    const inicio = Math.max(0, antesDoCursor - excesso);
    final = [...partes.slice(0, inicio), ...partes.slice(inicio + excesso)].join('');
    cursor = partes.slice(0, inicio).join('').length;
  }
  const faltam = Math.max(0, maximo - partes.length);
  const visivel = faltam <= faixaPerto(maximo);
  const textoVisivel = visivel ? textoDoLimite(faltam, maximo) : '';
  let nivel: NivelAnunciado = anunciouAntes;
  let anuncio = '';
  if (!visivel) nivel = 0;
  else if (faltam > 0 && anunciouAntes === 2) {
    // Apagou depois de chegar ao limite: ao chegar de novo, anuncia de novo.
    nivel = 1;
  } else if (faltam === 0 && anunciouAntes < 2) {
    nivel = 2;
    anuncio = textoVisivel;
  } else if (faltam > 0 && anunciouAntes < 1) {
    nivel = 1;
    anuncio = textoVisivel;
  }
  return { valor: final, cortou, faltam, visivel, textoVisivel, anuncio, nivel, cursor };
}

/** A dica do campo com o limite no mesmo parágrafo: "Dica. Até 80 letras." */
function dicaComLimite(dica: string | undefined, maximo: number): string {
  const limite = `Até ${maximo} letras.`;
  if (!dica) return limite;
  const d = dica.trimEnd();
  return `${d}${/[.!?]$/.test(d) ? ' ' : '. '}${limite}`;
}

function contadorHtml(id: string, inicial: EstadoDoLimite): string {
  return (
    `<p class="campo-contador" id="${esc(idDoContador(id))}"${inicial.visivel ? '' : ' hidden'}>${esc(inicial.textoVisivel)}</p>\n  ` +
    `<span class="campo-anuncio" id="${esc(idDoAnuncio(id))}" aria-live="polite"></span>`
  );
}

const niveis = new WeakMap<Element, NivelAnunciado>();
let ouvinteInstalado = false;

type Campo = HTMLInputElement | HTMLTextAreaElement;

/** Aplica o estado do limite ao campo na tela. Devolve true se o valor foi cortado. */
function aplicarLimite(campo: Campo, cortar: boolean): boolean {
  const maximo = Number(campo.dataset['limite']);
  if (!(maximo > 0)) return false;
  const est = estadoDoLimite(campo.value, maximo, niveis.get(campo) ?? 0, campo.selectionStart ?? campo.value.length);
  let cortado = false;
  if (cortar && est.cortou) {
    campo.value = est.valor;
    cortado = true;
    try {
      campo.setSelectionRange(est.cursor, est.cursor);
    } catch {
      /* tipos sem seleção */
    }
  }
  niveis.set(campo, est.nivel);
  const caixa = campo.closest('.campo');
  const contador = caixa?.querySelector<HTMLElement>(`[id="${idDoContador(campo.id)}"]`);
  const anuncio = caixa?.querySelector<HTMLElement>(`[id="${idDoAnuncio(campo.id)}"]`);
  if (contador) {
    contador.textContent = est.textoVisivel;
    contador.hidden = !est.visivel;
    contador.classList.toggle('campo-contador-cheio', est.faltam === 0);
  }
  if (anuncio) {
    if (!est.visivel) anuncio.textContent = '';
    else if (est.anuncio) anuncio.textContent = est.anuncio;
    else if (cortado) {
      // Tentou passar do limite: repete o aviso (limpa e escreve no quadro seguinte, para o leitor ler de novo).
      anuncio.textContent = '';
      const texto = textoDoLimite(0, maximo);
      requestAnimationFrame(() => (anuncio.textContent = texto));
    }
  }
  return cortado;
}

function ehCampoComLimite(alvo: EventTarget | null): alvo is Campo {
  return !!alvo && typeof (alvo as Element).matches === 'function' && (alvo as Element).matches('input[data-limite], textarea[data-limite]');
}

/** Um só ouvinte para todos os campos com limite, em captura: quem escuta depois já recebe o valor cortado. */
function instalarLimite(): void {
  if (ouvinteInstalado || typeof document === 'undefined') return;
  ouvinteInstalado = true;
  document.addEventListener(
    'input',
    (e) => {
      if (!ehCampoComLimite(e.target)) return;
      // Durante a composição (teclado de celular) o texto ainda não é final: só atualiza o contador.
      aplicarLimite(e.target, !(e as InputEvent).isComposing);
    },
    true,
  );
  document.addEventListener(
    'compositionend',
    (e) => {
      const alvo = e.target;
      if (!ehCampoComLimite(alvo)) return;
      if (aplicarLimite(alvo, true)) alvo.dispatchEvent(new Event('input', { bubbles: true }));
    },
    true,
  );
}

/** Dica, contador e atributos de um campo com limite (sem limite, nada muda). */
function comLimite<T extends CampoTexto | CampoAreaDeTexto>(c: T): { c: T; extra: string; contador: string; valor: string } {
  const maximo = c.maximo ? Math.floor(c.maximo) : 0;
  if (!maximo) return { c, extra: '', contador: '', valor: c.valor ?? '' };
  instalarLimite();
  const est = estadoDoLimite(c.valor ?? '', maximo);
  return {
    c: { ...c, dica: dicaComLimite(c.dica, maximo) },
    extra: ` data-limite="${maximo}"`,
    contador: `\n  ${contadorHtml(c.id, est)}`,
    valor: est.valor,
  };
}

export function campoTexto(campo: CampoTexto): string {
  const tipo = campo.tipo ?? 'text';
  const { c, extra, contador, valor } = comLimite(campo);
  return `<div class="campo">
  ${rotuloHtml(c)}
  ${dicaHtml(c)}
  <input class="campo-entrada" type="${esc(tipo)}" id="${esc(c.id)}" name="${esc(c.id)}" value="${esc(valor)}"${placeholderHtml(c.exemplo)}${extra}${comuns(c, !!contador)}>${contador}
  ${erroHtml(c.id)}
</div>`;
}

export function campoAreaDeTexto(campo: CampoAreaDeTexto): string {
  const { c, extra, contador, valor } = comLimite(campo);
  return `<div class="campo">
  ${rotuloHtml(c)}
  ${dicaHtml(c)}
  <textarea class="campo-entrada campo-area" id="${esc(c.id)}" name="${esc(c.id)}" rows="${esc(String(c.linhas ?? 4))}"${placeholderHtml(c.exemplo)}${extra}${comuns(c, !!contador)}>${esc(valor)}</textarea>${contador}
  ${erroHtml(c.id)}
</div>`;
}

export function campoEscolha(c: CampoEscolha): string {
  const opcoes = c.opcoes
    .map((o) => `<option value="${esc(o.valor)}"${o.valor === c.valor ? ' selected' : ''}>${esc(o.texto)}</option>`)
    .join('');
  return `<div class="campo">
  ${rotuloHtml(c)}
  ${dicaHtml(c)}
  <select class="campo-entrada campo-escolha" id="${esc(c.id)}" name="${esc(c.id)}"${comuns(c)}>${opcoes}</select>
  ${erroHtml(c.id)}
</div>`;
}

/** Radios num fieldset com legend. O `id` é do fieldset; os radios são `${id}-0`, `${id}-1`... */
export function grupoDeOpcoes(g: GrupoDeOpcoes): string {
  const nome = g.nome ?? g.id;
  const opc = g.obrigatorio ? '' : OPCIONAL;
  const radios = g.opcoes
    .map((o, i) => {
      const rid = `${g.id}-${i}`;
      return `<div class="campo-radio">
      <input type="radio" id="${esc(rid)}" name="${esc(nome)}" value="${esc(o.valor)}"${o.valor === g.valor ? ' checked' : ''}>
      <label for="${esc(rid)}">${esc(o.texto)}</label>
    </div>`;
    })
    .join('\n    ');
  return `<fieldset class="campo campo-grupo" id="${esc(g.id)}"${descritoPor(g)}>
  <legend class="campo-rotulo">${esc(g.rotulo)}${opc}</legend>
  ${dicaHtml(g)}
  ${radios}
  ${erroHtml(g.id)}
</fieldset>`;
}

// ---------- erros (mexem no DOM; finos de propósito) ----------

function achar(form: ParentNode, id: string): HTMLElement | null {
  return form.querySelector<HTMLElement>(`[id="${id}"]`);
}

/** Onde marcar aria-invalid e focar: o próprio campo, ou o primeiro radio do grupo. */
function alvoDoErro(el: HTMLElement): HTMLElement {
  if (el.tagName === 'FIELDSET') return el.querySelector<HTMLElement>('input') ?? el;
  return el;
}

/** Mostra o erro do campo, marca aria-invalid e leva o foco ao primeiro campo com erro do formulário. */
export function mostrarErro(form: ParentNode, id: string, mensagem: string): void {
  const el = achar(form, id);
  const erro = achar(form, idDoErro(id));
  if (!el) return;
  alvoDoErro(el).setAttribute('aria-invalid', 'true');
  if (erro) {
    erro.innerHTML = `${icone('erro', { tamanho: 20, classe: 'campo-erro-icone' })}<span>${esc(`Erro: ${mensagem}`)}</span>`;
    erro.hidden = false;
  }
  const primeiro = form.querySelector<HTMLElement>('[aria-invalid="true"]');
  (primeiro ?? alvoDoErro(el)).focus();
}

export function limparErro(form: ParentNode, id: string): void {
  const el = achar(form, id);
  const erro = achar(form, idDoErro(id));
  if (el) alvoDoErro(el).removeAttribute('aria-invalid');
  if (erro) {
    erro.textContent = '';
    erro.hidden = true;
  }
}

/** Limpa o erro de todos os campos do formulário (use antes de validar de novo). */
export function limparTodosOsErros(form: ParentNode): void {
  form.querySelectorAll<HTMLElement>('[aria-invalid="true"]').forEach((e) => e.removeAttribute('aria-invalid'));
  form.querySelectorAll<HTMLElement>('.campo-erro').forEach((e) => {
    e.textContent = '';
    e.hidden = true;
  });
}
