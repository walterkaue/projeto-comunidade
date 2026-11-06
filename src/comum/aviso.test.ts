import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { avisar, ID_AVISO, LIMPEZA_DO_AVISO_MS, TEMPO_DO_AVISO_MS, temInstrucao, tempoDoAviso } from './aviso';

interface Foco {
  top: number;
  height: number;
  invalido?: boolean;
}

// Documento falso mínimo: só o que aviso.ts usa.
function docFalso(altura = 640) {
  const elementos = new Map<string, FakeEl>();
  const ouvintes = new Map<string, Set<(e: unknown) => void>>();
  class FakeEl {
    id = '';
    className = '';
    textContent = '';
    atributos: Record<string, string> = {};
    classes = new Set<string>();
    classList = {
      add: (...c: string[]) => c.forEach((x) => this.classes.add(x)),
      remove: (...c: string[]) => c.forEach((x) => this.classes.delete(x)),
      toggle: (c: string, on?: boolean) => {
        if (on) this.classes.add(c);
        else this.classes.delete(c);
        return !!on;
      },
    };
    setAttribute(k: string, v: string) {
      this.atributos[k] = v;
    }
  }
  const criados: FakeEl[] = [];
  const estado = { foco: null as Foco | null };
  const doc = {
    getElementById: (id: string) => elementos.get(id) ?? null,
    createElement: () => {
      const e = new FakeEl();
      criados.push(e);
      return e;
    },
    body: { append: (e: FakeEl) => elementos.set(e.id, e) },
    defaultView: { innerHeight: altura },
    get activeElement() {
      const f = estado.foco;
      if (!f) return null;
      return {
        getBoundingClientRect: () => ({ top: f.top, height: f.height, width: 200 }),
        getAttribute: (n: string) => (n === 'aria-invalid' && f.invalido ? 'true' : null),
      };
    },
    addEventListener: (t: string, f: (e: unknown) => void) => {
      if (!ouvintes.has(t)) ouvintes.set(t, new Set());
      ouvintes.get(t)!.add(f);
    },
    removeEventListener: (t: string, f: (e: unknown) => void) => ouvintes.get(t)?.delete(f),
  };
  const disparar = (t: string, e: unknown = {}) => [...(ouvintes.get(t) ?? [])].forEach((f) => f(e));
  const total = () => [...ouvintes.values()].reduce((s, c) => s + c.size, 0);
  return { doc: doc as unknown as Document, criados, estado, disparar, total };
}

describe('tempoDoAviso e temInstrucao', () => {
  it('pelo menos 1 s por palavra e nunca menos de 5 s', () => {
    expect(tempoDoAviso('Ata apagada.')).toBe(5000);
    expect(tempoDoAviso(Array(12).fill('palavra').join(' '))).toBe(12000);
  });
  it('reconhece instrução no início da frase ou depois de vírgula', () => {
    expect(temInstrucao('Texto copiado. Cole na conversa.')).toBe(true);
    expect(temInstrucao('Imagem baixada. Procure em Downloads ou na galeria.')).toBe(true);
    expect(temInstrucao('Se o arquivo não aparecer, toque em Abrir no Google Agenda.')).toBe(true);
  });
  it('avisos simples somem pelo tempo', () => {
    expect(temInstrucao('QR do link pronto.')).toBe(false);
    expect(temInstrucao('Ata apagada.')).toBe(false);
    expect(temInstrucao('Item 2 acrescentado.')).toBe(false);
  });
});

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

  it('limpa e escreve no quadro seguinte, mostra e some depois; o texto sai da região', () => {
    const { doc, criados } = docFalso();
    avisar('Ata apagada.', doc);
    const el = criados[0]!;
    expect(el.textContent).toBe('');
    vi.advanceTimersByTime(20);
    expect(el.textContent).toBe('Ata apagada.');
    expect(el.classes.has('aviso-vivo-visivel')).toBe(true);
    vi.advanceTimersByTime(TEMPO_DO_AVISO_MS + 1);
    expect(el.classes.has('aviso-vivo-visivel')).toBe(false);
    expect(el.textContent).toBe('Ata apagada.');
    vi.advanceTimersByTime(LIMPEZA_DO_AVISO_MS + 1);
    expect(el.textContent).toBe('');
  });

  it('mensagem longa fica 1 s por palavra', () => {
    const { doc, criados } = docFalso();
    avisar(Array(10).fill('palavra').join(' ') + '.', doc);
    vi.advanceTimersByTime(20 + 9000);
    expect(criados[0]?.classes.has('aviso-vivo-visivel')).toBe(true);
    vi.advanceTimersByTime(1100);
    expect(criados[0]?.classes.has('aviso-vivo-visivel')).toBe(false);
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

  it('com instrução, fica até o próximo toque, sem temporizador', () => {
    const { doc, criados, disparar } = docFalso();
    avisar('Texto copiado. Cole na conversa.', doc);
    vi.advanceTimersByTime(100);
    const el = criados[0]!;
    vi.advanceTimersByTime(60_000);
    expect(el.classes.has('aviso-vivo-visivel')).toBe(true);
    disparar('keydown', { key: 'Shift' });
    expect(el.classes.has('aviso-vivo-visivel')).toBe(true);
    disparar('pointerdown');
    expect(el.classes.has('aviso-vivo-visivel')).toBe(false);
    vi.advanceTimersByTime(LIMPEZA_DO_AVISO_MS + 1);
    expect(el.textContent).toBe('');
  });

  it('o toque que gerou o aviso não o fecha (ouvinte só no quadro seguinte)', () => {
    const { doc, criados, disparar } = docFalso();
    avisar('Cole na conversa.', doc);
    vi.advanceTimersByTime(16);
    disparar('pointerdown');
    expect(criados[0]?.classes.has('aviso-vivo-visivel')).toBe(true);
    vi.advanceTimersByTime(16);
    disparar('pointerdown');
    expect(criados[0]?.classes.has('aviso-vivo-visivel')).toBe(false);
  });

  it('ate tempo desliga o toque, ate toque força, e tecla comum fecha', () => {
    const a = docFalso();
    avisar('Cole na conversa.', { doc: a.doc, ate: 'tempo' });
    vi.advanceTimersByTime(100);
    a.disparar('pointerdown');
    expect(a.criados[0]?.classes.has('aviso-vivo-visivel')).toBe(true);
    vi.advanceTimersByTime(TEMPO_DO_AVISO_MS + 1);
    expect(a.criados[0]?.classes.has('aviso-vivo-visivel')).toBe(false);

    const b = docFalso();
    avisar('Ata apagada.', { doc: b.doc, ate: 'toque' });
    vi.advanceTimersByTime(30_000);
    expect(b.criados[0]?.classes.has('aviso-vivo-visivel')).toBe(true);
    b.disparar('keydown', { key: 'a' });
    expect(b.criados[0]?.classes.has('aviso-vivo-visivel')).toBe(false);
  });

  it('aviso novo cancela a limpeza e os ouvintes do anterior', () => {
    const { doc, criados, disparar, total } = docFalso();
    avisar('Ata apagada.', doc);
    vi.advanceTimersByTime(TEMPO_DO_AVISO_MS + 20); // some, limpeza pendente
    avisar('Outro aviso.', doc);
    vi.advanceTimersByTime(LIMPEZA_DO_AVISO_MS - 100);
    expect(criados[0]?.textContent).toBe('Outro aviso.');
    avisar('Cole aqui.', doc);
    vi.advanceTimersByTime(100);
    avisar('Item 2 acrescentado.', doc);
    vi.advanceTimersByTime(100);
    disparar('pointerdown');
    expect(criados[0]?.classes.has('aviso-vivo-visivel')).toBe(true);
    vi.advanceTimersByTime(TEMPO_DO_AVISO_MS + LIMPEZA_DO_AVISO_MS + 50);
    expect(total()).toBe(0);
  });

  it('foco na metade de baixo: aviso vai para o alto; em cima, fica embaixo', () => {
    const { doc, criados, estado, disparar } = docFalso(640);
    estado.foco = { top: 500, height: 52 };
    avisar('Ata apagada.', doc);
    vi.advanceTimersByTime(20);
    expect(criados[0]?.classes.has('aviso-vivo-alto')).toBe(true);
    estado.foco = { top: 100, height: 52 };
    disparar('focusin');
    expect(criados[0]?.classes.has('aviso-vivo-alto')).toBe(false);
    estado.foco = { top: 400, height: 52 };
    disparar('focusin');
    expect(criados[0]?.classes.has('aviso-vivo-alto')).toBe(true);
  });

  it('com erro escrito no campo com foco, ou soLeitor, o aviso fica só para o leitor', () => {
    const a = docFalso();
    a.estado.foco = { top: 300, height: 52, invalido: true };
    avisar('Ata apagada.', a.doc);
    vi.advanceTimersByTime(20);
    expect(a.criados[0]?.classes.has('aviso-vivo-leitor')).toBe(true);
    expect(a.criados[0]?.textContent).toBe('Ata apagada.');
    expect(a.criados[0]?.classes.has('aviso-vivo-alto')).toBe(false);

    const b = docFalso();
    avisar('Ata apagada.', { doc: b.doc, soLeitor: true });
    vi.advanceTimersByTime(20);
    expect(b.criados[0]?.classes.has('aviso-vivo-leitor')).toBe(true);

    const c = docFalso();
    avisar('Ata apagada.', c.doc);
    vi.advanceTimersByTime(20);
    expect(c.criados[0]?.classes.has('aviso-vivo-leitor')).toBe(false);
  });
});
