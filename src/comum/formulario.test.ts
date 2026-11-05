import { describe, expect, it, vi } from 'vitest';
import { campoAreaDeTexto, campoEscolha, campoTexto, grupoDeOpcoes, limparErro, limparTodosOsErros, mostrarErro } from './formulario';

const ATAQUE = '"><script>alert(1)</script>';

describe('campoTexto', () => {
  const h = campoTexto({ id: 'nome', rotulo: 'Nome da organização', dica: 'Como aparece no card.', obrigatorio: true, maximo: 60, autocomplete: 'organization' });

  it('label ligado ao campo por for/id', () => {
    expect(h).toContain('<label class="campo-rotulo" for="nome">Nome da organização');
    expect(h).toContain('id="nome"');
  });
  it('marca obrigatório em texto e em aria-required', () => {
    expect(h).toContain('(obrigatório)');
    expect(h).toContain('aria-required="true"');
  });
  it('liga dica e erro por aria-describedby', () => {
    expect(h).toContain('aria-describedby="nome-dica nome-erro"');
    expect(h).toContain('id="nome-dica"');
    expect(h).toContain('id="nome-erro"');
  });
  it('maxlength, autocomplete e tipo padrão', () => {
    expect(h).toContain('maxlength="60"');
    expect(h).toContain('autocomplete="organization"');
    expect(h).toContain('type="text"');
  });
  it('não usa placeholder', () => {
    expect(h).not.toContain('placeholder');
  });
  it('sem dica, descreve só pelo erro; sem obrigatório, não marca', () => {
    const s = campoTexto({ id: 'x', rotulo: 'X', tipo: 'date' });
    expect(s).toContain('aria-describedby="x-erro"');
    expect(s).not.toContain('obrigatório');
    expect(s).toContain('type="date"');
  });
  it('escapa valor, rótulo, dica e id', () => {
    const s = campoTexto({ id: 'a', rotulo: ATAQUE, dica: ATAQUE, valor: ATAQUE });
    expect(s).not.toContain('<script>');
    expect(s).toContain('value="&quot;&gt;&lt;script&gt;');
    const t = campoTexto({ id: ATAQUE, rotulo: 'r' });
    expect(t).not.toContain('<script>');
  });
});

describe('campoAreaDeTexto', () => {
  it('textarea com label, valor escapado e describedby', () => {
    const h = campoAreaDeTexto({ id: 'desc', rotulo: 'Descrição', dica: 'Curto.', valor: ATAQUE, linhas: 6 });
    expect(h).toContain('for="desc"');
    expect(h).toContain('<textarea');
    expect(h).toContain('rows="6"');
    expect(h).toContain('aria-describedby="desc-dica desc-erro"');
    expect(h).not.toContain('<script>');
    expect(h).toContain('&lt;script&gt;');
  });
});

describe('campoEscolha', () => {
  const h = campoEscolha({
    id: 'tipo',
    rotulo: 'Tipo',
    valor: 'b',
    opcoes: [
      { valor: 'a', texto: 'A' },
      { valor: 'b', texto: ATAQUE },
    ],
  });
  it('select nativo com label for e opção selecionada', () => {
    expect(h).toContain('<label class="campo-rotulo" for="tipo">');
    expect(h).toContain('<select');
    expect(h).toContain('<option value="b" selected>');
    expect(h).not.toContain('value="a" selected');
  });
  it('escapa as opções', () => {
    expect(h).not.toContain('<script>');
  });
});

describe('grupoDeOpcoes', () => {
  const h = grupoDeOpcoes({
    id: 'turno',
    rotulo: 'Turno',
    dica: 'Escolha um.',
    obrigatorio: true,
    valor: 'noite',
    opcoes: [
      { valor: 'dia', texto: 'Dia' },
      { valor: 'noite', texto: 'Noite' },
    ],
  });
  it('fieldset com legend e radios com label for', () => {
    expect(h).toContain('<fieldset');
    expect(h).toContain('<legend class="campo-rotulo">Turno');
    expect(h).toContain('(obrigatório)');
    expect(h).toContain('<label for="turno-0">Dia</label>');
    expect(h).toContain('<label for="turno-1">Noite</label>');
    expect(h).toContain('type="radio" id="turno-1" name="turno" value="noite" checked');
  });
  it('liga dica e erro no fieldset', () => {
    expect(h).toContain('aria-describedby="turno-dica turno-erro"');
  });
  it('escapa valores', () => {
    const s = grupoDeOpcoes({ id: 'g', rotulo: 'g', valor: ATAQUE, opcoes: [{ valor: ATAQUE, texto: ATAQUE }] });
    expect(s).not.toContain('<script>');
  });
});

// Formulário falso: só o que mostrarErro/limparErro usam.
class El {
  atributos = new Map<string, string>();
  textContent = '';
  hidden = true;
  focou = false;
  constructor(
    public id: string,
    public tagName = 'INPUT',
    private filhos: El[] = [],
  ) {}
  setAttribute(k: string, v: string) {
    this.atributos.set(k, v);
  }
  removeAttribute(k: string) {
    this.atributos.delete(k);
  }
  focus() {
    this.focou = true;
  }
  querySelector(sel: string) {
    return sel === 'input' ? (this.filhos[0] ?? null) : null;
  }
}

function formFalso(els: El[]) {
  return {
    querySelector(sel: string) {
      const id = /^\[id="(.*)"\]$/.exec(sel)?.[1];
      if (id !== undefined) return els.find((e) => e.id === id) ?? null;
      if (sel === '[aria-invalid="true"]') return els.find((e) => e.atributos.get('aria-invalid') === 'true') ?? null;
      return null;
    },
    querySelectorAll(sel: string) {
      if (sel === '[aria-invalid="true"]') return els.filter((e) => e.atributos.get('aria-invalid') === 'true');
      if (sel === '.campo-erro') return els.filter((e) => e.id.endsWith('-erro'));
      return [];
    },
  } as unknown as ParentNode;
}

describe('mostrarErro / limparErro', () => {
  it('marca aria-invalid, mostra a mensagem e foca o primeiro com erro', () => {
    const a = new El('a');
    const aErro = new El('a-erro', 'P');
    const b = new El('b');
    const bErro = new El('b-erro', 'P');
    const form = formFalso([a, aErro, b, bErro]);
    mostrarErro(form, 'b', 'Falta o nome.');
    mostrarErro(form, 'a', 'Data inválida.');
    expect(b.atributos.get('aria-invalid')).toBe('true');
    expect(bErro.textContent).toBe('Erro: Falta o nome.');
    expect(bErro.hidden).toBe(false);
    // `a` vem antes na página: é o que recebe o foco por último
    expect(a.focou).toBe(true);
  });

  it('em grupo de radios, marca e foca o primeiro radio', () => {
    const radio = new El('g-0');
    const grupo = new El('g', 'FIELDSET', [radio]);
    const erro = new El('g-erro', 'P');
    mostrarErro(formFalso([grupo, radio, erro]), 'g', 'Escolha uma opção.');
    expect(radio.atributos.get('aria-invalid')).toBe('true');
    expect(radio.focou).toBe(true);
    expect(grupo.atributos.has('aria-invalid')).toBe(false);
  });

  it('limparErro desfaz', () => {
    const a = new El('a');
    const aErro = new El('a-erro', 'P');
    const form = formFalso([a, aErro]);
    mostrarErro(form, 'a', 'x');
    limparErro(form, 'a');
    expect(a.atributos.has('aria-invalid')).toBe(false);
    expect(aErro.hidden).toBe(true);
    expect(aErro.textContent).toBe('');
  });

  it('limparTodosOsErros desfaz tudo', () => {
    const a = new El('a');
    const aErro = new El('a-erro', 'P');
    const form = formFalso([a, aErro]);
    mostrarErro(form, 'a', 'x');
    limparTodosOsErros(form);
    expect(a.atributos.has('aria-invalid')).toBe(false);
    expect(aErro.hidden).toBe(true);
  });

  it('id inexistente não quebra', () => {
    const foco = vi.fn();
    expect(() => mostrarErro(formFalso([]), 'nada', 'x')).not.toThrow();
    expect(foco).not.toHaveBeenCalled();
  });
});
