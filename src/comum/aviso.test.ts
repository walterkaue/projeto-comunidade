import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { avisar, ID_AVISO, LIMPEZA_DO_AVISO_MS, TEMPO_DO_AVISO_MS, TETO_DO_AVISO_MS, temInstrucao, tempoDoAviso } from './aviso';

interface Foco {
  top: number;
  height: number;
  invalido?: boolean;
}

// Documento falso mínimo: só o que aviso.ts usa.
function docFalso(altura = 640, alturaDoAviso?: number) {
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
    // Só quando o teste dá a altura do aviso: embaixo (16 px da base) ou no alto (16 px do topo).
    getBoundingClientRect = alturaDoAviso
      ? () =>
          this.classes.has('aviso-vivo-alto')
            ? { top: 16, bottom: 16 + alturaDoAviso }
            : { top: altura - 16 - alturaDoAviso, bottom: altura - 16 }
      : undefined;
  }
  const criados: FakeEl[] = [];
  const estado = { foco: null as Foco | 'body' | null };
  const doc = {
    getElementById: (id: string) => elementos.get(id) ?? null,
    createElement: () => {
      const e = new FakeEl();
      criados.push(e);
      return e;
    },
    body: { append: (e: FakeEl) => elementos.set(e.id, e), getBoundingClientRect: () => ({ top: 0, height: 3000, width: 360 }), getAttribute: () => null },
    defaultView: { innerHeight: altura },
    get activeElement() {
      const f = estado.foco;
      if (!f) return null;
      if (f === 'body') return doc.body;
      return {
        getBoundingClientRect: () => ({ top: f.top, bottom: f.top + f.height, height: f.height, width: 200 }),
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
    vi.advanceTimersByTime(TETO_DO_AVISO_MS - 1000);
    expect(el.classes.has('aviso-vivo-visivel')).toBe(true);
    disparar('keydown', { key: 'Shift' });
    expect(el.classes.has('aviso-vivo-visivel')).toBe(true);
    disparar('pointerdown');
    expect(el.classes.has('aviso-vivo-visivel')).toBe(false);
    vi.advanceTimersByTime(LIMPEZA_DO_AVISO_MS + 1);
    expect(el.textContent).toBe('');
  });

  it('com instrução: um click (leitor de tela) também fecha, e o teto longo fecha sozinho', () => {
    const a = docFalso();
    avisar('Texto copiado. Cole na conversa.', a.doc);
    vi.advanceTimersByTime(100);
    a.disparar('click');
    expect(a.criados[0]?.classes.has('aviso-vivo-visivel')).toBe(false);

    const b = docFalso();
    avisar('Texto copiado. Cole na conversa.', b.doc);
    vi.advanceTimersByTime(100);
    vi.advanceTimersByTime(TETO_DO_AVISO_MS);
    expect(b.criados[0]?.classes.has('aviso-vivo-visivel')).toBe(false);
    expect(b.total()).toBe(0);
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

  it('medindo: fica onde não cobre o campo; se cobrir nos dois, onde cobre menos', () => {
    // Aviso de 380 px (letra grande) numa tela de 640: embaixo vai de 244 a 624; no alto, de 16 a 396.
    const a = docFalso(640, 380);
    a.estado.foco = { top: 350, height: 52 }; // centro na metade de baixo, mas o alto também cobriria
    avisar('Ata apagada.', a.doc);
    vi.advanceTimersByTime(20);
    // Embaixo cobre 52 px; no alto, 46 px: fica no alto.
    expect(a.criados[0]?.classes.has('aviso-vivo-alto')).toBe(true);

    const b = docFalso(640, 60); // aviso curto: embaixo de 564 a 624
    b.estado.foco = { top: 400, height: 52 }; // metade de baixo, mas o aviso não chega lá
    avisar('Ata apagada.', b.doc);
    vi.advanceTimersByTime(20);
    expect(b.criados[0]?.classes.has('aviso-vivo-alto')).toBe(false);

    const c = docFalso(640, 60);
    c.estado.foco = { top: 560, height: 52 }; // embaixo cobriria; no alto, não
    avisar('Ata apagada.', c.doc);
    vi.advanceTimersByTime(20);
    expect(c.criados[0]?.classes.has('aviso-vivo-alto')).toBe(true);
  });

  it('sem nada focado (foco no body, a página inteira), o aviso fica embaixo', () => {
    const { doc, criados, estado } = docFalso(640);
    estado.foco = 'body';
    avisar('Ata apagada.', doc);
    vi.advanceTimersByTime(20);
    expect(criados[0]?.classes.has('aviso-vivo-alto')).toBe(false);
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

// Regras de componentes.css que a auditoria de 06/11/2026 pediu (o CSS não roda nos testes: lemos o texto).
describe('componentes.css', () => {
  async function css() {
    const { readFileSync } = await import('node:fs');
    return readFileSync(new URL('./componentes.css', import.meta.url), 'utf8');
  }
  const bloco = (c: string, seletor: string) => {
    const i = c.indexOf(`${seletor} {`);
    expect(i, seletor).toBeGreaterThanOrEqual(0);
    return c.slice(i, c.indexOf('}', i));
  };

  it('aviso no alto usa a área segura e solta o rodapé; o de só leitor fica escondido', async () => {
    const c = await css();
    const alto = bloco(c, '.aviso-vivo-alto');
    expect(alto).toMatch(/top:[^;]*safe-area-inset-top/);
    expect(alto).toMatch(/bottom:\s*auto/);
    expect(bloco(c, '.aviso-vivo-leitor')).toMatch(/clip/);
  });
  it('no alto contraste o aviso ganha borda', async () => {
    const c = await css();
    // Só no aviso visível: o que é só para o leitor de tela continua sem caixa.
    expect(c).toMatch(/@media \(forced-colors: active\)\s*{\s*\.aviso-vivo:not\(\.aviso-vivo-leitor\)\s*{\s*border: 2px solid CanvasText/);
  });
  it('contador e anúncio existem; o anúncio é só para leitor de tela', async () => {
    const c = await css();
    expect(bloco(c, '.campo-contador')).toContain('font-size');
    expect(bloco(c, '.campo-anuncio')).toMatch(/clip/);
  });
  it('folha de saída rola, e o domínio só quebra nos pontos', async () => {
    const c = await css();
    const folha = bloco(c, '.folha');
    expect(folha).toMatch(/overflow-y:\s*auto/);
    expect(folha).toMatch(/align-items:\s*safe flex-end/);
    const caixa = bloco(c, '.folha-caixa');
    expect(caixa).toMatch(/max-height:\s*100%/);
    expect(caixa).toMatch(/overflow-y:\s*auto/);
    // A coluna nunca passa da caixa: domínio de um pedaço só, comprido, quebra por dentro em vez de rolar de lado.
    expect(caixa).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(bloco(c, '.folha-caixa p')).toMatch(/overflow-wrap:\s*anywhere/);
    expect(c).not.toContain('.folha-caixa strong {');
    // Navegador sem "safe" fica com a linha de antes.
    expect(folha).toMatch(/align-items:\s*flex-end;[\s\S]*align-items:\s*safe flex-end/);
  });
  it('caixa de marcar com 48 px, radio como está', async () => {
    const c = await css();
    const cx = bloco(c, ".campo-radio input[type='checkbox']");
    expect(cx).toMatch(/width:\s*48px/);
    expect(cx).toMatch(/height:\s*48px/);
    expect(bloco(c, '.campo-radio input')).toMatch(/width:\s*24px/);
  });
});
