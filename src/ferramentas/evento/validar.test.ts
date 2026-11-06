import { describe, expect, it } from 'vitest';
import { dadosCanonicos } from './formato';
import { LIMITES, dataValida, horaValida, limparTexto, motivoDeRecusa, validarEvento, type Evento } from './validar';

const bom: Evento = {
  titulo: 'Mutirão de limpeza da praça',
  data: '2026-11-14',
  inicio: '08:30',
  fim: '12:00',
  local: 'Praça central, Rua das Flores, 120 - Centro',
  descricao: 'Traga luvas e sacos.\nTem café para quem ajudar.',
  organizacao: 'Associação de moradores do Bairro Novo',
};

const com = (campos: Partial<Record<keyof Evento, unknown>>) => validarEvento({ ...bom, ...campos });

describe('validarEvento: o que passa', () => {
  it('aceita um evento completo e devolve os textos limpos', () => {
    const r = validarEvento(bom);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.evento).toEqual(bom);
  });

  it('só título, data, início e local são obrigatórios', () => {
    const r = validarEvento({ titulo: 'Roda de conversa', data: '2026-12-01', inicio: '19:00', local: 'Salão da igreja' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.evento).toMatchObject({ fim: '', descricao: '', organizacao: '' });
  });

  it('aceita acentos, emoji, "&", datas e CEP escritos no texto', () => {
    const r = com({
      titulo: 'Cultura & Arte 🎶',
      descricao: 'Dia 14-11-2026 às 19h. CEP 01310-100. Preço: R$ 10,00. Sala 3, 2º andar.',
    });
    expect(r.ok).toBe(true);
  });

  it('limpa espaços repetidos, invisíveis e controle', () => {
    const r = com({ titulo: '  Festa   da​  rua\u0007  ', descricao: 'a\r\n\r\n\r\n\r\nb' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.evento.titulo).toBe('Festa da rua');
      expect(r.evento.descricao).toBe('a\n\nb');
    }
  });
});

describe('validarEvento: limites', () => {
  it('recusa campo obrigatório vazio', () => {
    const r = validarEvento({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.erros).sort()).toEqual(['data', 'inicio', 'local', 'titulo']);
  });

  it('recusa texto acima do limite de cada campo', () => {
    for (const campo of ['titulo', 'local', 'descricao', 'organizacao'] as const) {
      const limite = LIMITES[campo];
      expect(com({ [campo]: 'a '.repeat(limite / 2) }).ok, `${campo} no limite`).toBe(true);
      const r = com({ [campo]: 'a '.repeat(limite / 2 + 1) });
      expect(r.ok, `${campo} acima`).toBe(false);
      if (!r.ok) expect(r.erros[campo]).toMatch(/no máximo/);
    }
  });

  it('conta emoji como uma letra', () => {
    expect(com({ titulo: '🎉 '.repeat(LIMITES.titulo / 2) }).ok).toBe(true);
    expect(com({ titulo: '🎉 '.repeat(LIMITES.titulo / 2 + 1) }).ok).toBe(false);
  });

  it('recusa valor que não é texto', () => {
    expect(com({ titulo: 42 }).ok).toBe(false);
    expect(com({ data: ['2026-11-14'] }).ok).toBe(false);
    expect(com({ local: { a: 1 } }).ok).toBe(false);
    expect(validarEvento(null).ok).toBe(false);
    expect(validarEvento('texto').ok).toBe(false);
  });
});

describe('data e hora', () => {
  it('datas que existem', () => {
    expect(dataValida('2026-11-14')).toBe(true);
    expect(dataValida('2028-02-29')).toBe(true);
  });
  it('datas que não existem ou fora do formato', () => {
    for (const d of ['2026-02-30', '2027-02-29', '2026-13-01', '2026-00-10', '2026-11-31', '14/11/2026', '2026-1-1', '1999-12-31', '2100-01-01', '']) {
      expect(dataValida(d), d).toBe(false);
    }
  });
  it('horas', () => {
    for (const h of ['00:00', '08:30', '23:59']) expect(horaValida(h), h).toBe(true);
    for (const h of ['24:00', '8:30', '12:60', '12h30', '', '12:30:00']) expect(horaValida(h), h).toBe(false);
  });
  it('o fim não pode ser igual ao início; fim menor é no dia seguinte', () => {
    expect(com({ fim: '08:30' }).ok).toBe(false);
    expect(com({ fim: '08:00' }).ok).toBe(true);
    expect(com({ inicio: '22:00', fim: '02:00' }).ok).toBe(true);
    expect(com({ fim: '08:31' }).ok).toBe(true);
    expect(com({ fim: '' }).ok).toBe(true);
    expect(com({ fim: '25:00' }).ok).toBe(false);
  });
  it('recusa data e hora ruins no evento', () => {
    expect(com({ data: '2026-02-30' }).ok).toBe(false);
    expect(com({ inicio: '99:99' }).ok).toBe(false);
  });
});

describe('recusa de conteúdo perigoso', () => {
  const recusas: [string, string, ReturnType<typeof motivoDeRecusa>][] = [
    ['html', '<script>alert(1)</script>', 'html'],
    ['html', '<img src=x onerror=alert(1)>', 'html'],
    ['html', 'a &lt;b&gt; c', 'html'],
    ['html', '&#60;b&#62;', 'html'],
    ['link', 'https://golpe.exemplo/pague', 'link'],
    ['link', 'http://x', 'link'],
    ['link', 'HTTPS://EXEMPLO', 'link'],
    ['link', 'www.exemplo', 'link'],
    ['link', 'veja www exemplo', 'link'],
    ['link', 'exemplo.com', 'link'],
    ['link', 'exemplo.com.br/inscricao', 'link'],
    ['link', 'Acesse bit.ly/abc123', 'link'],
    ['link', 'chat.whatsapp.com/ABCDEF', 'link'],
    ['link', 't.me/algo', 'link'],
    ['link', 'meusite.org', 'link'],
    ['link', 'exemplo ponto com', 'link'],
    ['link', 'javascript:alert(1)', 'link'],
    ['link', 'JavaScript : alert(1)', 'link'],
    ['link', 'data:text/html;base64,AAAA', 'link'],
    ['link', '//exemplo/x', 'link'],
    ['link', 'ｅｘｅｍｐｌｏ．ｃｏｍ', 'link'],
    ['link', 'exemplo。com', 'link'],
    ['contato', 'Ligue (11) 91234-5678', 'contato'],
    ['contato', 'Zap 11912345678', 'contato'],
    ['contato', '+55 11 91234 5678', 'contato'],
    ['contato', '91234-5678', 'contato'],
    ['contato', '4002-8922 e 3333-4444', 'contato'],
    ['contato', 'CPF 123.456.789-09', 'contato'],
    ['contato', 'CNPJ 12.345.678/0001-95', 'contato'],
    ['contato', 'fale com fulano@exemplo.org', 'contato'],
    ['contato', 'Instagram @associacao', 'contato'],
    ['pix', 'Pague por PIX', 'pix'],
    ['pix', 'chave pix: abc', 'pix'],
    ['pix', '123e4567-e89b-12d3-a456-426614174000', 'contato'],
    ['pix', 'abcdefab-cdef-abcd-efab-cdefabcdefab', 'pix'],
    ['pix', 'a1b2c3d4e5f6g7h8i9', 'pix'],
    ['pix', 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEF', 'pix'],
  ];
  for (const [rotulo, texto, motivo] of recusas) {
    it(`recusa (${rotulo}): ${texto.slice(0, 40)}`, () => {
      expect(motivoDeRecusa(texto)).toBe(motivo);
      for (const campo of ['titulo', 'local', 'descricao', 'organizacao'] as const) {
        const r = com({ [campo]: texto });
        expect(r.ok, campo).toBe(false);
        if (!r.ok) {
          expect(r.erros[campo], campo).toBeTruthy();
          // A mensagem não repete o que a pessoa escreveu.
          expect(r.erros[campo]).not.toContain(texto.trim());
        }
      }
    });
  }

  it('disfarce com caracteres invisíveis também é pego', () => {
    expect(com({ descricao: 'ww​w.exemplo.com' }).ok).toBe(false);
    expect(com({ descricao: 'ex‮emplo.com' }).ok).toBe(false);
    expect(com({ titulo: 'h⁠ttps://x' }).ok).toBe(false);
  });

  it('palavras comuns passam', () => {
    for (const t of [
      'Feira da solidariedade',
      'Reunião às 19h30, sala 3',
      'Rua Sete de Setembro, 1234',
      'Assembleia geral. Com café.',
      'Tel de emergência: veja no mural',
      'Dia 14/11',
      'Das 8h às 12h',
      'Data: sábado',
    ]) {
      expect(motivoDeRecusa(t), t).toBeNull();
    }
  });

  it('o ponto sem espaço antes de "com" é o falso positivo conhecido, com a mensagem que explica', () => {
    const r = com({ descricao: 'Vamos.Com todos' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.descricao).toMatch(/coloque um espaço/);
  });
});

describe('limparTexto', () => {
  it('não mexe em emoji com várias partes', () => {
    expect(limparTexto('👨‍👩‍👧 festa')).toBe('👨‍👩‍👧 festa');
  });
  it('em campo de uma linha, quebra vira espaço', () => {
    expect(limparTexto('a\nb')).toBe('a b');
    expect(limparTexto('a\nb', true)).toBe('a\nb');
  });
});

describe('endurecimento da conferência (conteúdo.ts)', () => {
  it('recusa evento que se passa pela plataforma, com mensagem própria', () => {
    const r = com({ organizacao: 'Projeto Comunidade' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.organizacao).toMatch(/o nome deste site e frases como "evento verificado" não podem entrar/);
    expect(com({ titulo: 'Evento oficial' }).ok).toBe(false);
  });
  it('texto legítimo passa no formulário', () => {
    expect(com({ titulo: 'Mutirão de limpeza da praça', local: 'Praça Central, Rua das Flores, 120 - Centro', organizacao: 'Associação de moradores do Bairro Novo' }).ok).toBe(true);
  });
});

describe('forma canônica', () => {
  it('"Reunião" composto, decomposto ou com ZWJ no meio dá os mesmos dados', () => {
    const formas = ['Reunião', 'Reunião', 'Reuni‍ão'].map((titulo) => {
      const r = com({ titulo });
      if (!r.ok) throw new Error('recusado');
      return dadosCanonicos(r.evento);
    });
    expect(new Set(formas).size).toBe(1);
  });
});
