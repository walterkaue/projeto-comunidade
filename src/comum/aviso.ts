// Aviso falado e visual numa região aria-live única (role=status). Uma só região no body, criada na primeira
// vez; o texto é limpo e escrito no quadro seguinte para o leitor de tela repetir uma mensagem igual.
// O visual some sozinho depois de alguns segundos. O CSS está em componentes.css.

export const ID_AVISO = 'aviso-vivo';
export const TEMPO_DO_AVISO_MS = 5000;

const temporizadores = new WeakMap<object, ReturnType<typeof setTimeout>>();

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

/** Avisa a pessoa (tela e leitor de tela). Mensagem vazia não faz nada. */
export function avisar(mensagem: string, doc: Document = document): void {
  if (!mensagem) return;
  const el = regiao(doc);
  el.textContent = '';
  el.classList.remove('aviso-vivo-visivel');
  noProximoQuadro(() => {
    el.textContent = mensagem;
    el.classList.add('aviso-vivo-visivel');
    const antigo = temporizadores.get(el);
    if (antigo) clearTimeout(antigo);
    temporizadores.set(
      el,
      setTimeout(() => el.classList.remove('aviso-vivo-visivel'), TEMPO_DO_AVISO_MS),
    );
  });
}
