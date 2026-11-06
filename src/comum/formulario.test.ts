import { describe, expect, it, vi } from 'vitest';
import {
  campoAreaDeTexto,
  campoEscolha,
  campoTexto,
  estadoDoLimite,
  faixaPerto,
  grupoDeOpcoes,
  limparErro,
  limparTodosOsErros,
  mostrarErro,
} from './formulario';

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
    expect(h).toContain('aria-describedby="nome-dica nome-contador nome-erro"');
    expect(h).toContain('id="nome-dica"');
    expect(h).toContain('id="nome-erro"');
  });
  it('limite por data-limite (sem maxlength), autocomplete e tipo padrão', () => {
    expect(h).toContain('data-limite="60"');
    expect(h).not.toContain('maxlength');
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

// Auditoria 05/11/2026, M1: o corretor "avançado" do navegador manda o texto para o Google ou a Microsoft.
describe('semCorretor', () => {
  it('desliga o corretor só quando pedido', () => {
    expect(campoTexto({ id: 'a', rotulo: 'A', semCorretor: true })).toContain('spellcheck="false" autocorrect="off"');
    expect(campoAreaDeTexto({ id: 'b', rotulo: 'B', semCorretor: true })).toContain('spellcheck="false" autocorrect="off"');
    expect(campoTexto({ id: 'c', rotulo: 'C' })).not.toContain('spellcheck');
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

// Auditoria 06/11/2026, A-03 e C-04: limite por letra, dica única e contador só perto do fim.
describe('limite de letras no HTML', () => {
  it('põe "Até N letras." na mesma dica, depois da dica existente', () => {
    const h = campoTexto({ id: 'n', rotulo: 'Nome', dica: 'Como aparece no card.', maximo: 80 });
    expect(h).toContain('<p class="campo-dica" id="n-dica">Como aparece no card. Até 80 letras.</p>');
    expect(h.match(/campo-dica/g)).toHaveLength(1);
  });
  it('dica sem ponto final ganha ponto antes do limite', () => {
    const h = campoTexto({ id: 'n', rotulo: 'Nome', dica: 'Como aparece no card', maximo: 80 });
    expect(h).toContain('Como aparece no card. Até 80 letras.');
  });
  it('sem dica, cria o parágrafo só com o limite', () => {
    const h = campoAreaDeTexto({ id: 'd', rotulo: 'D', maximo: 300 });
    expect(h).toContain('<p class="campo-dica" id="d-dica">Até 300 letras.</p>');
  });
  it('sem maxlength, com data-limite, contador escondido, anúncio e describedby completo', () => {
    const h = campoTexto({ id: 'n', rotulo: 'Nome', maximo: 80 });
    expect(h).not.toContain('maxlength');
    expect(h).toContain('data-limite="80"');
    expect(h).toContain('<p class="campo-contador" id="n-contador" hidden></p>');
    expect(h).toContain('class="campo-anuncio"');
    expect(h).toContain('aria-live="polite"></span>');
    expect(h).toContain('aria-describedby="n-dica n-contador n-erro"');
    expect(h.indexOf('n-contador"')).toBeLessThan(h.indexOf('id="n-erro"'));
  });
  it('sem maximo, nada muda', () => {
    const h = campoTexto({ id: 'n', rotulo: 'Nome' });
    expect(h).not.toContain('contador');
    expect(h).not.toContain('data-limite');
  });
  it('valor inicial maior que o limite já vem cortado', () => {
    expect(campoTexto({ id: 'n', rotulo: 'N', maximo: 5, valor: 'abcdefgh' })).toContain('value="abcde"');
  });
});

describe('estadoDoLimite', () => {
  it('perto = min(20, 20% do limite)', () => {
    expect(faixaPerto(80)).toBe(16);
    expect(faixaPerto(300)).toBe(20);
    expect(faixaPerto(10)).toBe(2);
  });
  it('emoji com tom de pele conta 1; 60 emojis cabem em 60', () => {
    expect(estadoDoLimite('👍🏽', 80).faltam).toBe(79);
    const e = estadoDoLimite('👍🏽'.repeat(60), 60);
    expect(e.cortou).toBe(false);
    expect(e.faltam).toBe(0);
    expect(e.textoVisivel).toBe('Chegou ao limite de 60 letras.');
  });
  it('corta 82 letras para 80', () => {
    const e = estadoDoLimite('a'.repeat(82), 80);
    expect(e.cortou).toBe(true);
    expect(e.valor).toBe('a'.repeat(80));
    expect(e.faltam).toBe(0);
  });
  it('contador some longe do fim e aparece perto, com os textos certos', () => {
    expect(estadoDoLimite('a'.repeat(50), 80).visivel).toBe(false);
    expect(estadoDoLimite('a'.repeat(64), 80).textoVisivel).toBe('Faltam 16 letras.');
    expect(estadoDoLimite('a'.repeat(79), 80).textoVisivel).toBe('Falta 1 letra.');
  });
  it('anuncia só ao entrar na faixa e ao chegar no limite, nunca a cada tecla', () => {
    let nivel: 0 | 1 | 2 = 0;
    const falas: string[] = [];
    for (let n = 40; n <= 80; n++) {
      const e = estadoDoLimite('a'.repeat(n), 80, nivel);
      nivel = e.nivel;
      if (e.anuncio) falas.push(e.anuncio);
    }
    expect(falas).toEqual(['Faltam 16 letras.', 'Chegou ao limite de 80 letras.']);
  });
  it('sair da faixa zera, e entrar de novo volta a anunciar', () => {
    const dentro = estadoDoLimite('a'.repeat(70), 80, 1);
    expect(dentro.anuncio).toBe('');
    const fora = estadoDoLimite('a'.repeat(10), 80, dentro.nivel);
    expect(fora.nivel).toBe(0);
    expect(estadoDoLimite('a'.repeat(70), 80, fora.nivel).anuncio).toBe('Faltam 10 letras.');
  });
  it('colar texto que já passa do limite anuncia só o limite', () => {
    const e = estadoDoLimite('a'.repeat(200), 80, 0);
    expect(e.anuncio).toBe('Chegou ao limite de 80 letras.');
  });
});
