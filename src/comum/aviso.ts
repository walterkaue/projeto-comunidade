// Aviso falado e visual numa região aria-live única (role=status). Uma só região no body, criada na primeira
// vez; o texto é limpo e escrito no quadro seguinte para o leitor de tela repetir uma mensagem igual.
// O visual some pelo tempo (1 s por palavra, ao menos 5 s) ou, se traz instrução de como continuar, no próximo
// toque. Quando some, o texto também sai da região viva. O aviso foge do campo com foco (vai para o alto) e,
// havendo erro escrito embaixo do campo, fica só para o leitor de tela. O CSS está em componentes.css.

export const ID_AVISO = 'aviso-vivo';
export const TEMPO_DO_AVISO_MS = 5000;
/** Passa a transição de 0,2 s do CSS antes de esvaziar a região. */
export const LIMPEZA_DO_AVISO_MS = 250;

export interface OpcoesDoAviso {
  doc?: Document;
  /** 'toque' fica até o próximo toque; 'tempo' some pelo tempo. Sem isto, decide o texto (temInstrucao). */
  ate?: 'toque' | 'tempo';
  /** Só para o leitor de tela: o texto não aparece na tela. */
  soLeitor?: boolean;
}

const VERBOS_DE_INSTRUCAO = [
  'toque', 'use', 'procure', 'baixe', 'cole', 'copie', 'abra', 'escolha', 'selecione', 'mande', 'peça',
  'escreva', 'tente', 'confira', 'troque', 'atualize', 'salve',
];

/** Tempo na tela: pelo menos 1 s por palavra, nunca menos de 5 s. */
export function tempoDoAviso(mensagem: string): number {
  const palavras = mensagem.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(TEMPO_DO_AVISO_MS, palavras * 1000);
}

/** Alguma frase (ou oração depois de vírgula) começa por verbo de instrução: "Cole na conversa.", "…, toque em Abrir." */
export function temInstrucao(mensagem: string): boolean {
  return mensagem
    .split(/[.!?;:,]+/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)
    .some((p) => VERBOS_DE_INSTRUCAO.includes(p.split(/\s+/)[0] ?? ''));
}

interface Estado {
  token: number;
  tempo?: ReturnType<typeof setTimeout>;
  limpeza?: ReturnType<typeof setTimeout>;
  soltar?: () => void;
}
const estados = new WeakMap<object, Estado>();

function estadoDe(el: HTMLElement): Estado {
  let e = estados.get(el);
  if (!e) estados.set(el, (e = { token: 0 }));
  return e;
}

/**
 * Cria a região vazia logo na abertura do site (src/main.ts): leitor de tela costuma ignorar
 * texto numa região aria-live recém-inserida, então ela precisa existir antes do primeiro aviso.
 */
export function prepararAviso(doc: Document = document): void {
  regiao(doc);
}

function regiao(doc: Document): HTMLElement {
  const existente = doc.getElementById(ID_AVISO);
  if (existente) return existente;
  const el = doc.createElement('div');
  el.id = ID_AVISO;
  el.className = 'aviso-vivo';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  doc.body.append(el);
  return el;
}

function noProximoQuadro(fn: () => void): void {
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => fn());
  else setTimeout(fn, 16);
}

/** Desfaz temporizadores e ouvintes do aviso anterior. */
function cancelar(e: Estado): void {
  if (e.tempo) clearTimeout(e.tempo);
  if (e.limpeza) clearTimeout(e.limpeza);
  e.tempo = e.limpeza = undefined;
  e.soltar?.();
  e.soltar = undefined;
}

function campoComFoco(doc: Document): Element | null {
  const foco = doc.activeElement ?? null;
  // Sem nada focado, o foco é o body (a caixa da página inteira): não há campo para desviar.
  if (!foco || foco === doc.body || foco === doc.documentElement) return null;
  return foco;
}

/** O campo com foco está na metade de baixo da tela (onde o aviso ficaria por cima)? */
function focoEmBaixo(doc: Document): boolean {
  const foco = campoComFoco(doc);
  const janela = doc.defaultView;
  if (!foco || !janela || typeof foco.getBoundingClientRect !== 'function') return false;
  const vv = janela.visualViewport;
  const altura = vv?.height ?? janela.innerHeight ?? 0;
  if (!altura) return false;
  const r = foco.getBoundingClientRect();
  if (!r.width && !r.height) return false;
  const centro = r.top + r.height / 2 - (vv?.offsetTop ?? 0);
  return centro > altura / 2;
}

function focoComErro(doc: Document): boolean {
  return campoComFoco(doc)?.getAttribute?.('aria-invalid') === 'true';
}

/**
 * Avisa a pessoa (tela e leitor de tela). Mensagem vazia não faz nada.
 * O segundo argumento pode ser só o documento (testes) ou as opções.
 */
export function avisar(mensagem: string, opcoes: Document | OpcoesDoAviso = {}): void {
  if (!mensagem) return;
  const op: OpcoesDoAviso = typeof (opcoes as Document).getElementById === 'function' ? { doc: opcoes as Document } : (opcoes as OpcoesDoAviso);
  const doc = op.doc ?? document;
  const el = regiao(doc);
  const e = estadoDe(el);
  cancelar(e);
  const meu = ++e.token;
  el.textContent = '';
  el.classList.remove('aviso-vivo-visivel');
  noProximoQuadro(() => {
    if (e.token !== meu) return;
    const soLeitor = op.soLeitor === true || focoComErro(doc);
    el.classList.toggle('aviso-vivo-leitor', soLeitor);
    const posicionar = () => el.classList.toggle('aviso-vivo-alto', !soLeitor && focoEmBaixo(doc));
    posicionar();
    el.textContent = mensagem;
    el.classList.add('aviso-vivo-visivel');

    const esconder = () => {
      if (e.token !== meu) return;
      cancelar(e);
      el.classList.remove('aviso-vivo-visivel');
      e.limpeza = setTimeout(() => {
        if (e.token !== meu) return;
        el.textContent = '';
        el.classList.remove('aviso-vivo-alto', 'aviso-vivo-leitor');
      }, LIMPEZA_DO_AVISO_MS);
    };

    const ficaAteOToque = op.ate === 'toque' || (op.ate !== 'tempo' && temInstrucao(mensagem));
    const soltar: Array<() => void> = [];
    if (!soLeitor) {
      doc.addEventListener('focusin', posicionar);
      soltar.push(() => doc.removeEventListener('focusin', posicionar));
    }
    if (ficaAteOToque) {
      // Só no quadro seguinte: o toque que gerou o aviso não pode fechá-lo.
      noProximoQuadro(() => {
        if (e.token !== meu || !e.soltar) return;
        const aoTocar = () => esconder();
        const aoTecla = (ev: Event) => {
          const k = (ev as KeyboardEvent).key;
          if (k === 'Shift' || k === 'Control' || k === 'Alt' || k === 'Meta') return;
          esconder();
        };
        doc.addEventListener('pointerdown', aoTocar, true);
        doc.addEventListener('keydown', aoTecla, true);
        const antigo = e.soltar;
        e.soltar = () => {
          antigo?.();
          doc.removeEventListener('pointerdown', aoTocar, true);
          doc.removeEventListener('keydown', aoTecla, true);
        };
      });
    } else {
      e.tempo = setTimeout(esconder, tempoDoAviso(mensagem));
    }
    e.soltar = () => soltar.forEach((f) => f());
  });
}
