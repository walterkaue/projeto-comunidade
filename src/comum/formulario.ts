// Componentes de formulário acessíveis. Cada um devolve uma string de HTML (o projeto usa innerHTML + esc).
// Regras: sempre <label for>; dica e erro ligados por aria-describedby; obrigatório escrito em texto
// ("(obrigatório)"), não só por cor; sem placeholder no lugar de rótulo; todo valor passa por esc.
// Tamanho de toque e fonte de 16 px ficam em componentes.css. O erro nunca depende só de cor (texto "Erro:" + borda grossa).

import { esc } from './html';

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
  maximo?: number;
  tipo?: TipoDeCampo;
}

export interface CampoAreaDeTexto extends Base {
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

function rotuloHtml(b: Pick<Base, 'id' | 'rotulo' | 'obrigatorio'>): string {
  const obrig = b.obrigatorio ? ' <span class="campo-obrig">(obrigatório)</span>' : '';
  return `<label class="campo-rotulo" for="${esc(b.id)}">${esc(b.rotulo)}${obrig}</label>`;
}

function dicaHtml(b: Pick<Base, 'id' | 'dica'>): string {
  return b.dica ? `<p class="campo-dica" id="${esc(idDaDica(b.id))}">${esc(b.dica)}</p>` : '';
}

function erroHtml(id: string): string {
  return `<p class="campo-erro" id="${esc(idDoErro(id))}" hidden></p>`;
}

function descritoPor(b: Pick<Base, 'id' | 'dica'>): string {
  const ids = [b.dica ? idDaDica(b.id) : '', idDoErro(b.id)].filter(Boolean);
  return ` aria-describedby="${esc(ids.join(' '))}"`;
}

function comuns(b: Base): string {
  return (
    `${b.obrigatorio ? ' aria-required="true"' : ''}` +
    `${b.autocomplete ? ` autocomplete="${esc(b.autocomplete)}"` : ''}` +
    `${b.semCorretor ? ATRIBUTOS_SEM_CORRETOR : ''}` +
    descritoPor(b)
  );
}

export function campoTexto(c: CampoTexto): string {
  const tipo = c.tipo ?? 'text';
  const maximo = c.maximo ? ` maxlength="${Math.floor(c.maximo)}"` : '';
  return `<div class="campo">
  ${rotuloHtml(c)}
  ${dicaHtml(c)}
  <input class="campo-entrada" type="${esc(tipo)}" id="${esc(c.id)}" name="${esc(c.id)}" value="${esc(c.valor ?? '')}"${maximo}${comuns(c)}>
  ${erroHtml(c.id)}
</div>`;
}

export function campoAreaDeTexto(c: CampoAreaDeTexto): string {
  const maximo = c.maximo ? ` maxlength="${Math.floor(c.maximo)}"` : '';
  return `<div class="campo">
  ${rotuloHtml(c)}
  ${dicaHtml(c)}
  <textarea class="campo-entrada campo-area" id="${esc(c.id)}" name="${esc(c.id)}" rows="${esc(String(c.linhas ?? 4))}"${maximo}${comuns(c)}>${esc(c.valor ?? '')}</textarea>
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
  const obrig = g.obrigatorio ? ' <span class="campo-obrig">(obrigatório)</span>' : '';
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
  <legend class="campo-rotulo">${esc(g.rotulo)}${obrig}</legend>
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
    erro.textContent = `Erro: ${mensagem}`;
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
