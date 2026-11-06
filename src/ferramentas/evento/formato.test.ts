import { describe, expect, it } from 'vitest';
import {
  DADOS_MAXIMO,
  JSON_MAXIMO,
  LINK_IDEAL,
  codificar,
  cortarDadosDoLink,
  MENSAGEM_DO_PROBLEMA,
  decodificar,
  deBase64Url,
  linkCompleto,
  paraBase64Url,
  temCompressao,
} from './formato';
import { validarEvento, type Evento } from './validar';

const evento: Evento = {
  titulo: 'Mutirão de limpeza da praça',
  data: '2026-11-14',
  inicio: '08:30',
  fim: '12:00',
  local: 'Praça central, Rua das Flores, 120 - Centro',
  descricao: 'Traga luvas e sacos.\nTem café para quem ajudar. Crianças são bem-vindas, com um adulto.',
  organizacao: 'Associação de moradores do Bairro Novo',
};

const sempre = (e: Evento): Evento => {
  const r = validarEvento(e);
  if (!r.ok) throw new Error('evento do teste inválido');
  return r.evento;
};

/** Monta dados "à mão", para simular link adulterado. */
const montar = (marca: string, texto: string) => `1${marca}${paraBase64Url(new TextEncoder().encode(texto))}`;

describe('base64url', () => {
  it('ida e volta, sem + / =', () => {
    const bytes = Uint8Array.from([251, 255, 254, 0, 1, 2, 63, 62]);
    const s = paraBase64Url(bytes);
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Array.from(deBase64Url(s) ?? [])).toEqual(Array.from(bytes));
  });
  it('recusa o que não é base64url', () => {
    expect(deBase64Url('a+b')).toBeNull();
    expect(deBase64Url('abc=')).toBeNull();
    expect(deBase64Url('a')).toBeNull();
    expect(deBase64Url('ab cd')).toBeNull();
  });
});

describe('formato: ida e volta', () => {
  it('sem compressão', async () => {
    const dados = await codificar(evento, { comprimir: false });
    expect(dados.startsWith('1r')).toBe(true);
    const r = await decodificar(dados);
    expect(r).toEqual({ ok: true, evento: sempre(evento) });
  });

  it('com compressão (quando o navegador tem)', async () => {
    expect(temCompressao()).toBe(true);
    const dados = await codificar(evento, { comprimir: true });
    expect(dados.startsWith('1z')).toBe(true);
    const r = await decodificar(dados);
    expect(r).toEqual({ ok: true, evento: sempre(evento) });
  });

  it('comprimido é menor que sem compressão em texto normal', async () => {
    expect((await codificar(evento, { comprimir: true })).length).toBeLessThan((await codificar(evento, { comprimir: false })).length);
  });

  it('só usa caracteres seguros no link', async () => {
    for (const comprimir of [true, false]) expect(await codificar(evento, { comprimir })).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('guarda acentos, emoji e quebra de linha', async () => {
    const e = sempre({ ...evento, titulo: 'Festa junina 🎉 São João', descricao: 'Linha um\n\nLinha dois ção' });
    for (const comprimir of [true, false]) {
      const r = await decodificar(await codificar(e, { comprimir }));
      expect(r).toEqual({ ok: true, evento: e });
    }
  });

  it('com só os campos obrigatórios', async () => {
    const e = sempre({ titulo: 'Roda de conversa', data: '2026-12-01', inicio: '19:00', fim: '', local: 'Salão', descricao: '', organizacao: '' });
    for (const comprimir of [true, false]) expect(await decodificar(await codificar(e, { comprimir }))).toEqual({ ok: true, evento: e });
  });

  it('um evento cheio fica abaixo do link ideal', async () => {
    const cheio = sempre({
      titulo: 'x'.repeat(10) + ' ' + 'Mutirão '.repeat(8),
      data: '2026-11-14',
      inicio: '08:30',
      fim: '12:00',
      local: 'Praça central, Rua das Flores, 120 - Centro, perto da escola, ao lado do mercado',
      descricao: 'Traga luvas e sacos. Tem café para quem ajudar. '.repeat(8).trim(),
      organizacao: 'Associação de moradores do Bairro Novo',
    });
    const dados = await codificar(cheio);
    expect(('https://walterkaue.github.io/projeto-comunidade/#/evento/' + dados).length).toBeLessThan(LINK_IDEAL);
  });
});

describe('formato: link adulterado ou malformado', () => {
  const ruins = ['', '1', '1z', 'abc', '2r' + 'AAAA', '1x' + 'AAAA', '1r!!!!', '1r' + 'A', 'texto com espaço', '1r' + 'A'.repeat(DADOS_MAXIMO)];

  for (const d of ruins) {
    it(`não quebra com: ${JSON.stringify(d.slice(0, 20))}`, async () => {
      const r = await decodificar(d);
      expect(r.ok).toBe(false);
    });
  }

  it('versão desconhecida', async () => {
    expect(await decodificar('2r' + 'AAAA')).toEqual({ ok: false, problema: 'versao' });
  });

  it('não é texto nem o tipo esperado', async () => {
    for (const d of [null, undefined, 42, {}]) expect((await decodificar(d as unknown as string)).ok).toBe(false);
  });

  it('base64 certo, mas JSON quebrado', async () => {
    expect(await decodificar(montar('r', '{não é json'))).toEqual({ ok: false, problema: 'malformado' });
  });

  it('JSON certo, mas formato errado', async () => {
    for (const j of ['{}', '[]', '"texto"', '42', 'null', '["a"]', '["a","b","c","d","e","f"]', '["a","b","c","d","e","f","g","h"]', '[1,2,3,4,5,6,7]', '[["a"],"b","c","d","e","f","g"]']) {
      const r = await decodificar(montar('r', j));
      expect(r, j).toEqual({ ok: false, problema: 'malformado' });
    }
  });

  it('UTF-8 inválido', async () => {
    const bytes = Uint8Array.from([0x5b, 0x22, 0xff, 0xfe, 0x22, 0x5d]);
    expect((await decodificar('1r' + paraBase64Url(bytes))).ok).toBe(false);
  });

  it('deflate quebrado', async () => {
    const r = await decodificar('1z' + paraBase64Url(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9])));
    expect(r.ok).toBe(false);
  });

  it('bomba de compressão: recusa o que passa do limite ao descomprimir', async () => {
    const enorme = new TextEncoder().encode(JSON.stringify(['a'.repeat(JSON_MAXIMO * 4), '', '', '', '', '', '']));
    const comp = await new Response(new Blob([enorme]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
    const dados = '1z' + paraBase64Url(new Uint8Array(comp));
    expect(dados.length).toBeLessThan(DADOS_MAXIMO);
    expect(await decodificar(dados)).toEqual({ ok: false, problema: 'malformado' });
  });

  it('sem compressão, JSON grande demais', async () => {
    const e = JSON.stringify(['a'.repeat(JSON_MAXIMO + 10), '', '', '', '', '', '']);
    expect((await decodificar(montar('r', e))).ok).toBe(false);
  });
});

describe('formato: a mesma validação da criação vale na leitura', () => {
  const campos = (o: Partial<Record<keyof Evento, string>>): string[] => {
    const e = { ...evento, ...o };
    return [e.titulo, e.data, e.inicio, e.fim, e.local, e.descricao, e.organizacao];
  };
  const adulterado = async (o: Partial<Record<keyof Evento, string>>, comprimir: boolean) => {
    const texto = JSON.stringify(campos(o));
    const bytes = new TextEncoder().encode(texto);
    if (!comprimir) return decodificar('1r' + paraBase64Url(bytes));
    const comp = await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
    return decodificar('1z' + paraBase64Url(new Uint8Array(comp)));
  };

  const ataques: [string, Partial<Record<keyof Evento, string>>][] = [
    ['HTML no título', { titulo: '<img src=x onerror=alert(1)>' }],
    ['script na descrição', { descricao: '<script>alert(1)</script>' }],
    ['javascript: no local', { local: 'javascript:alert(1)' }],
    ['URL na descrição', { descricao: 'Inscreva-se em https://golpe.exemplo/pague' }],
    ['site sem http', { descricao: 'golpe.com.br/pague' }],
    ['telefone', { descricao: 'Chame (11) 91234-5678' }],
    ['PIX', { descricao: 'Pix: contribua' }],
    ['chave aleatória', { descricao: '123e4567-e89b-12d3-a456-426614174000' }],
    ['e-mail', { organizacao: 'contato@exemplo.org' }],
    ['data impossível', { data: '2026-02-30' }],
    ['hora impossível', { inicio: '25:61' }],
    ['título enorme', { titulo: 'a '.repeat(500) }],
  ];
  for (const [nome, o] of ataques) {
    for (const comprimir of [false, true]) {
      it(`recusa na leitura: ${nome} (${comprimir ? 'comprimido' : 'simples'})`, async () => {
        const r = await adulterado(o, comprimir);
        expect(r.ok).toBe(false);
        if (!r.ok) {
          expect(r.problema).toBe('recusado');
          expect(Object.keys(r.erros ?? {}).length).toBeGreaterThan(0);
        }
      });
    }
  }
});

describe('linkCompleto', () => {
  it('troca o que vem depois do #', () => {
    expect(linkCompleto('1rAAAA', 'https://walterkaue.github.io/projeto-comunidade/#/evento')).toBe(
      'https://walterkaue.github.io/projeto-comunidade/#/evento/1rAAAA',
    );
    expect(linkCompleto('1rAAAA', 'https://walterkaue.github.io/projeto-comunidade/index.html')).toBe(
      'https://walterkaue.github.io/projeto-comunidade/index.html#/evento/1rAAAA',
    );
  });

  it('tira o que colou no fim dos dados', () => {
    expect(linkCompleto('1rAAAA.', 'https://walterkaue.github.io/projeto-comunidade/')).toBe(
      'https://walterkaue.github.io/projeto-comunidade/#/evento/1rAAAA',
    );
  });
});

describe('mensagens do link que não abre', () => {
  it('o link recusado diz o que pedir a quem enviou (B-28)', () => {
    expect(MENSAGEM_DO_PROBLEMA.recusado).toMatch(/Peça a quem enviou para conferir título, local e texto\.$/);
  });
  it('o link cortado continua pedindo para mandar de novo (B-23 fica como está)', () => {
    expect(MENSAGEM_DO_PROBLEMA.malformado).toBe('Este link de evento está incompleto ou foi alterado. Peça a quem enviou para mandar de novo.');
  });
});

describe('cortarDadosDoLink', () => {
  const dados = '1rABC-d_9';
  for (const sufixo of ['.', ')', ',', '%20Obrigada!', '%0A', '?x=1', ' ', ' Obrigada']) {
    it(`corta ${JSON.stringify(sufixo)} do fim`, () => {
      expect(cortarDadosDoLink(dados + sufixo)).toBe(dados);
    });
  }
  it('dados sem nada colado ficam iguais', () => {
    expect(cortarDadosDoLink(dados)).toBe(dados);
  });
  it('começo inválido dá texto vazio', () => {
    expect(cortarDadosDoLink('(1rABC')).toBe('');
    expect(cortarDadosDoLink('')).toBe('');
    expect(cortarDadosDoLink('%20')).toBe('');
  });
  it('letra fora do alfabeto ASCII também corta', () => {
    expect(cortarDadosDoLink('1rABCção')).toBe('1rABC');
  });
});
