import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { avisar, ID_AVISO, TEMPO_DO_AVISO_MS } from './aviso';

// Documento falso mínimo: só o que aviso.ts usa.
function docFalso() {
  const elementos = new Map<string, FakeEl>();
  class FakeEl {
    id = '';
    className = '';
    textContent = '';
    atributos: Record<string, string> = {};
    classes = new Set<string>();
    classList = {
      add: (c: string) => this.classes.add(c),
      remove: (c: string) => this.classes.delete(c),
    };
    setAttribute(k: string, v: string) {
      this.atributos[k] = v;
    }
  }
  const criados: FakeEl[] = [];
  const doc = {
    getElementById: (id: string) => elementos.get(id) ?? null,
    createElement: () => {
      const e = new FakeEl();
      criados.push(e);
      return e;
    },
    body: { append: (e: FakeEl) => elementos.set(e.id, e) },
  };
  return { doc: doc as unknown as Document, criados };
}

describe('avisar', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('cria a região uma vez, com role=status e aria-live=polite', () => {
    const { doc, criados } = docFalso();
    avisar('um', doc);
    avisar('dois', doc);
    expect(criados).toHaveLength(1);
    expect(criados[0]?.id).toBe(ID_AVISO);
    expect(criados[0]?.atributos).toEqual({ role: 'status', 'aria-live': 'polite' });
  });

  it('limpa e escreve no quadro seguinte, mostra e some depois', () => {
    const { doc, criados } = docFalso();
    avisar('Texto copiado.', doc);
    const el = criados[0]!;
    expect(el.textContent).toBe('');
    vi.advanceTimersByTime(20);
    expect(el.textContent).toBe('Texto copiado.');
    expect(el.classes.has('aviso-vivo-visivel')).toBe(true);
    vi.advanceTimersByTime(TEMPO_DO_AVISO_MS + 1);
    expect(el.classes.has('aviso-vivo-visivel')).toBe(false);
  });

  it('mensagem repetida reescreve o texto', () => {
    const { doc, criados } = docFalso();
    avisar('igual', doc);
    vi.advanceTimersByTime(20);
    avisar('igual', doc);
    expect(criados[0]?.textContent).toBe('');
    vi.advanceTimersByTime(20);
    expect(criados[0]?.textContent).toBe('igual');
  });

  it('mensagem vazia não cria nada', () => {
    const { doc, criados } = docFalso();
    avisar('', doc);
    expect(criados).toHaveLength(0);
  });
});
