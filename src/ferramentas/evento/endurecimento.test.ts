// Casos achados na revisão: disfarces que passavam pela validação, o mesmo evento escrito de outro jeito
// para fugir da lista de bloqueio, e evento que passa da meia-noite.

import { describe, expect, it } from 'vitest';
import { impressaoDoLink } from '../../comum/entreTelas';
import { abrirEvento } from './abrir';
import { horarioPorExtenso, horariosDaAgenda } from './agenda';
import { COMPRIMIR_A_PARTIR, codificar, dadosCanonicos, decodificar, paraBase64Url } from './formato';
import { motivoDeRecusa, validarEvento, type Evento } from './validar';

const bom: Evento = {
  titulo: 'Mutirão de limpeza da praça',
  data: '2026-11-14',
  inicio: '08:30',
  fim: '12:00',
  local: 'Praça central, Rua das Flores, 120',
  descricao: 'Traga luvas e sacos.',
  organizacao: 'Associação de moradores',
};
const com = (campos: Partial<Evento>) => validarEvento({ ...bom, ...campos });
const sempre = (e: Evento): Evento => {
  const r = validarEvento(e);
  if (!r.ok) throw new Error('evento do teste inválido');
  return r.evento;
};
const montar = (marca: string, texto: string) => `1${marca}${paraBase64Url(new TextEncoder().encode(texto))}`;
const lista = (e: Evento) => [e.titulo, e.data, e.inicio, e.fim, e.local, e.descricao, e.organizacao];

describe('invisíveis que ficam no texto não anulam a conferência', () => {
  const casos = [
    'h‍ttps:/‍/golpe.xyz',
    'golpe.️xyz',
    'golpe.\u{E0020}com',
    'Zap 11 98765‍4321',
    'Siga @‍fulano',
    'p‍ix',
    'meugolpe.c‍om',
    'Ligue 11⠀99999⠀9999',
  ];
  for (const c of casos) {
    it(JSON.stringify(c), () => {
      expect(com({ descricao: c }).ok).toBe(false);
    });
  }
  it('emoji de várias partes continua inteiro no texto mostrado', () => {
    const r = com({ titulo: '👨‍👩‍👧 festa' });
    expect(r.ok && r.evento.titulo).toBe('👨‍👩‍👧 festa');
  });
  it('metade de emoji solta some em vez de quebrar o link', () => {
    const r = com({ titulo: 'Feira\uD800' });
    expect(r.ok && r.evento.titulo).toBe('Feira');
  });
});

describe('disfarces de link, contato e PIX', () => {
  const recusados: [string, string][] = [
    ['link', 'meugolpe.es'],
    ['link', 'meugolpe.ru'],
    ['link', 'meugolpe .com'],
    ['link', 'meugolpe . com'],
    ['link', 'meugolpe\n.com'],
    ['link', 'banco-seguro. com. br'],
    ['link', 'forms.gle/abc123'],
    ['link', 'youtu.be/abc'],
    ['link', 'rb.gy/abc12'],
    ['link', 'shorturl.at/abc'],
    ['link', 'banco-seguro.zz/login'],
    ['link', 'golpe[dot]com'],
    ['link', 'golpe(.)com'],
    ['link', 'golpe·com'],
    ['link', 'golpe.cоm'],
    ['contato', 'Zap 11–98765–4321'],
    ['contato', 'Zap 11/98765/4321'],
    ['contato', 'Zap 99999_9999'],
    ['contato', '(11) 99999,9999'],
    ['contato', 'Zap 11 9 87.65.4321'],
    ['contato', 'Zap ١١٩٩٩٩٩٩٩٩٩'],
    ['contato', 'fulano [at] gmail [dot] com'],
    ['contato', 'fulano arroba gmail'],
    ['pix', 'P I X'],
    ['pix', 'p1x'],
    ['pix', 'Faça um píx'],
  ];
  for (const [motivo, texto] of recusados) {
    it(`recusa (${motivo}): ${JSON.stringify(texto)}`, () => {
      expect(motivoDeRecusa(texto)).toBe(motivo);
      expect(com({ descricao: texto }).ok).toBe(false);
    });
  }

  it('texto normal com datas, horas, números e endereço passa', () => {
    for (const t of [
      '14/11/2026 - 19:30',
      'Dia 14/11 às 19h, sala 3, 2º andar',
      'Exercício 2026/2027',
      'Av. Paulista, 1578 - Bela Vista',
      'Das 08:30 às 12:00 e das 14:00 às 18:00',
      'Entrada: R$ 10,50',
      'Rua 7 de Setembro, 120',
      '19:30, 20:00 e 21:00',
    ]) {
      expect(motivoDeRecusa(t), t).toBeNull();
    }
  });
});

describe('mesmo evento, link escrito de outro jeito: a forma canônica é a mesma', () => {
  it('marca z, marca r, JSON com espaços e bits soltos no fim do base64', async () => {
    const e = sempre(bom);
    const canonico = dadosCanonicos(e);
    expect(canonico.startsWith('1r')).toBe(true);
    const bonito = montar('r', JSON.stringify(lista(e), null, 1));
    const variantes = [await codificar(e, { comprimir: true }), await codificar(e, { comprimir: false }), bonito];
    // Troca os 2 bits livres do último caractere do base64 simples: outro texto, mesmo conteúdo.
    const simples = await codificar(e, { comprimir: false });
    const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const ultimo = alfabeto.indexOf(simples.slice(-1));
    for (const i of [ultimo ^ 1, ultimo ^ 2, ultimo ^ 3]) {
      const outro = simples.slice(0, -1) + alfabeto[i];
      if (outro !== simples) variantes.push(outro);
    }
    for (const v of variantes) {
      const r = await decodificar(v);
      expect(r.ok, v).toBe(true);
      if (r.ok) expect(dadosCanonicos(r.evento), v).toBe(canonico);
    }
    expect(new Set(variantes).size).toBeGreaterThan(3);
  });

  it('invisível no texto dá o mesmo evento canônico', async () => {
    const sujo = await decodificar(montar('r', JSON.stringify(lista({ ...bom, titulo: bom.titulo + '​' }))));
    expect(sujo.ok && dadosCanonicos(sujo.evento)).toBe(dadosCanonicos(sempre(bom)));
  });
});

describe('abrirEvento: lista e leitura juntas', () => {
  const SEM_MOTIVO = { tipo: 'sem-motivo' } as const;
  const bloqueando =
    (...bloqueados: string[]) =>
    async (dados: string[]) =>
      dados.some((d) => bloqueados.includes(d)) ? SEM_MOTIVO : null;
  const deps = (...bloqueados: string[]) => ({ bloqueado: bloqueando(...bloqueados), ler: decodificar });
  const BLOQUEADO = { estado: 'bloqueado', motivo: SEM_MOTIVO };

  it('abre o que não está na lista', async () => {
    const dados = await codificar(sempre(bom));
    expect(await abrirEvento(dados, deps())).toEqual({ estado: 'ok', evento: sempre(bom) });
  });

  it('bloqueia pelo texto do link como veio', async () => {
    const dados = await codificar(sempre(bom));
    expect(await abrirEvento(dados, deps(dados))).toEqual(BLOQUEADO);
  });

  it('bloqueia a variação do link quando a forma canônica está na lista', async () => {
    const e = sempre(bom);
    const variacao = montar('r', JSON.stringify(lista(e), null, 1));
    expect(variacao).not.toBe(dadosCanonicos(e));
    expect(await abrirEvento(variacao, deps(dadosCanonicos(e)))).toEqual(BLOQUEADO);
    const comprimido = await codificar(e, { comprimir: true });
    expect(await abrirEvento(comprimido, deps(dadosCanonicos(e)))).toEqual(BLOQUEADO);
  });

  it('com a lista de verdade (impressão SHA-256)', async () => {
    const e = sempre(bom);
    const arquivo = { bloqueados: [{ h: await impressaoDoLink(dadosCanonicos(e)), motivo: 'regra-5' }] };
    const { motivoDoLinkBloqueado } = await import('./bloqueio');
    const r = await abrirEvento(await codificar(e, { comprimir: true }), {
      bloqueado: (d) => motivoDoLinkBloqueado(d, async () => arquivo),
      ler: decodificar,
    });
    expect(r).toEqual({ estado: 'bloqueado', motivo: { tipo: 'regra', regra: 5 } });
  });

  it('link ruim vira problema, sem lançar erro', async () => {
    expect(await abrirEvento('lixo', deps())).toEqual({ estado: 'problema', problema: 'malformado' });
  });

  it('link bloqueado e ruim: bloqueado vence (nada é mostrado)', async () => {
    expect(await abrirEvento('lixo', deps('lixo'))).toEqual(BLOQUEADO);
  });
});

describe('formato: compressão só quando precisa', () => {
  it('link curto fica sem compressão (abre em aparelho antigo)', async () => {
    const curto = await codificar(sempre(bom));
    expect(curto.startsWith('1r')).toBe(true);
    expect(curto.length).toBeLessThanOrEqual(COMPRIMIR_A_PARTIR);
  });

  it('link comprido é comprimido e volta igual', async () => {
    // Com os limites dos campos, só texto de muitos bytes (emoji, 4 bytes cada) passa do ponto de comprimir.
    const cheio = sempre({
      ...bom,
      descricao: '🎉 '.repeat(200).trim(),
      local: '🎉 '.repeat(60).trim(),
      titulo: '🎉 '.repeat(40).trim(),
    });
    expect((await codificar(cheio, { comprimir: false })).length).toBeGreaterThan(COMPRIMIR_A_PARTIR);
    const dados = await codificar(cheio);
    expect(dados.startsWith('1z')).toBe(true);
    expect(await decodificar(dados)).toEqual({ ok: true, evento: cheio });
  });
});

describe('evento que passa da meia-noite', () => {
  it('fim menor que o início vale no dia seguinte (agenda e texto)', () => {
    expect(com({ inicio: '22:00', fim: '02:00' }).ok).toBe(true);
    expect(com({ inicio: '22:00', fim: '22:00' }).ok).toBe(false);
    expect(horariosDaAgenda({ data: '2026-12-31', inicio: '22:00', fim: '02:00' })).toEqual({
      inicio: '20261231T220000',
      fim: '20270101T020000',
    });
    expect(horarioPorExtenso('22:00', '02:00')).toBe('das 22h às 2h do dia seguinte');
    expect(horarioPorExtenso('08:00', '12:00')).toBe('das 8h às 12h');
  });
});
