import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  conferirDadosDoCard,
  dadosDoLinkDoEvento,
  ENDERECO_DO_CARDS,
  ehLinkDoEvento,
  estaBloqueado,
  impressaoDoLink,
  lerLinkDenunciado,
  linkDeDenuncia,
  pegarCardPreparado,
  prepararCard,
} from './entreTelas';

const BASE = 'https://walterkaue.github.io/projeto-comunidade/#/cards';
const EVENTO = 'https://walterkaue.github.io/projeto-comunidade/#/evento/abc123';

describe('card preenchido pela memória da aba', () => {
  const dados = {
    modelo: 'evento' as const,
    titulo: 'Mutirão da praça',
    data: '2026-11-21',
    hora: '09:00',
    local: 'Praça Central & arredores',
    texto: 'Traga luva.',
    organizacao: 'Associação de Moradores',
    link: EVENTO,
  };

  it('ida e volta, uma vez só', () => {
    prepararCard(dados, BASE);
    expect(pegarCardPreparado()).toEqual(dados);
    // Abrir o Cards de novo começa vazio.
    expect(pegarCardPreparado()).toEqual({});
  });

  it('o endereço do Cards não leva dados', () => {
    expect(ENDERECO_DO_CARDS).toBe('#/cards');
  });

  it('descarta o que não vale e corta o comprido', () => {
    const d = conferirDadosDoCard(
      {
        modelo: 'comicio' as never,
        data: '21/11/2026',
        hora: '25:00',
        titulo: 'palavra '.repeat(30),
        link: 'https://outro.exemplo/#/evento/abc',
        texto: '  linha\num  ',
      },
      BASE,
    );
    expect(d.modelo).toBeUndefined();
    expect(d.data).toBeUndefined();
    expect(d.hora).toBeUndefined();
    expect(d.link).toBeUndefined();
    expect(d.titulo).toHaveLength(80);
    expect(d.titulo?.endsWith('…')).toBe(true);
    expect(d.texto).toBe('linha um');
  });

  it('não lança com dado estranho', () => {
    expect(conferirDadosDoCard({}, BASE)).toEqual({});
    expect(conferirDadosDoCard({ titulo: 42 as never, link: {} as never }, BASE)).toEqual({});
  });

  it('filtra o texto como o evento (link, telefone, PIX, nome do site)', () => {
    const d = conferirDadosDoCard(
      {
        modelo: 'aviso',
        titulo: 'Zap 98765 e 4321',
        local: 'golpe.bet',
        organizacao: 'Evento verificado pelo site',
        texto: 'PIX chave golpe@mail.com ou ligue 11987654321',
      },
      BASE,
    );
    expect(d).toEqual({ modelo: 'aviso' });
    expect(conferirDadosDoCard({ texto: 'Reunião dia 21/11 às 19h' }, BASE)).toEqual({ texto: 'Reunião dia 21/11 às 19h' });
  });
});

describe('link de evento do próprio site', () => {
  it('aceita só evento deste site', () => {
    expect(ehLinkDoEvento(EVENTO, BASE)).toBe(true);
    expect(ehLinkDoEvento('https://walterkaue.github.io/projeto-comunidade/index.html#/evento/abc', BASE)).toBe(true);
    expect(ehLinkDoEvento('https://walterkaue.github.io/outro-projeto/#/evento/abc', BASE)).toBe(false);
    expect(ehLinkDoEvento('https://exemplo.org/projeto-comunidade/#/evento/abc', BASE)).toBe(false);
    expect(ehLinkDoEvento('http://walterkaue.github.io/projeto-comunidade/#/evento/abc', BASE)).toBe(false);
    expect(ehLinkDoEvento('https://walterkaue.github.io/projeto-comunidade/?x=1#/evento/abc', BASE)).toBe(false);
    expect(ehLinkDoEvento('https://walterkaue.github.io/projeto-comunidade/#/evento/', BASE)).toBe(false);
    expect(ehLinkDoEvento('https://walterkaue.github.io/projeto-comunidade/#/cards/abc', BASE)).toBe(false);
    expect(ehLinkDoEvento('javascript:alert(1)//#/evento/abc', BASE)).toBe(false);
    expect(ehLinkDoEvento('nada', BASE)).toBe(false);
  });

  // Auditoria 05/11/2026, A1: o link da denúncia chega por e-mail a quem modera e não pode levar comando do shell.
  it('aceita só o formato dos dados (letras sem acento, números, - e _)', () => {
    const site = 'https://walterkaue.github.io/projeto-comunidade/#/evento/';
    for (const ruim of ['abc$(comando)', "abc'x", 'abc;x', 'abc|x', 'abc(x)', 'abc%24', 'ab', 'a'.repeat(6001)]) {
      expect(ehLinkDoEvento(site + ruim, BASE), ruim.slice(0, 20)).toBe(false);
      expect(lerLinkDenunciado(encodeURIComponent(site + ruim), BASE)).toBe('');
    }
    expect(ehLinkDoEvento(`${site}1r${'A'.repeat(5998)}`, BASE)).toBe(true);
    expect(ehLinkDoEvento(`${site}1r-_Az09`, BASE)).toBe(true);
  });

  it('tira os dados do link', () => {
    expect(dadosDoLinkDoEvento(EVENTO, BASE)).toBe('abc123');
    expect(dadosDoLinkDoEvento('https://exemplo.org/#/evento/abc', BASE)).toBe('');
  });
});

describe('denúncia', () => {
  it('ida e volta, só para evento deste site', () => {
    const link = linkDeDenuncia(EVENTO);
    expect(link.startsWith('#/denunciar/')).toBe(true);
    expect(lerLinkDenunciado(link.slice('#/denunciar/'.length), BASE)).toBe(EVENTO);
    expect(lerLinkDenunciado(encodeURIComponent('https://golpe.exemplo/'), BASE)).toBe('');
    expect(lerLinkDenunciado('%E0%A4%A', BASE)).toBe('');
    expect(lerLinkDenunciado('', BASE)).toBe('');
  });
});

describe('lista de bloqueio', () => {
  it('impressão é o SHA-256 dos dados (igual ao do Node, usado no script de moderação)', async () => {
    const dados = 'abc123';
    expect(await impressaoDoLink(dados)).toBe(createHash('sha256').update(dados).digest('hex'));
  });

  it('confere a lista com tolerância', async () => {
    const imp = await impressaoDoLink('abc123');
    expect(estaBloqueado(imp, { bloqueados: [imp.toUpperCase()] })).toBe(true);
    expect(estaBloqueado(imp, { bloqueados: [] })).toBe(false);
    expect(estaBloqueado(imp, null)).toBe(false);
    expect(estaBloqueado(imp, { bloqueados: 'tudo' })).toBe(false);
    expect(estaBloqueado(imp, [imp])).toBe(false);
  });
});

describe('script de moderação', () => {
  it('calcula a mesma impressão que o site', async () => {
    // @ts-expect-error script .mjs sem tipos
    const { dadosDoLink, impressao } = await import('../../scripts/bloquear.mjs');
    expect(dadosDoLink(EVENTO)).toBe('abc123');
    expect(dadosDoLink('https://exemplo.org/')).toBe('');
    expect(impressao('abc123')).toBe(await impressaoDoLink('abc123'));
  });
});

describe('script de moderação: link vindo do e-mail', () => {
  it('junta link quebrado em linhas e aceita o de edição', async () => {
    // @ts-expect-error script .mjs sem tipos
    const { dadosDoLink } = await import('../../scripts/bloquear.mjs');
    expect(dadosDoLink('https://x.exemplo/p/#/evento/abc\n123 ')).toBe('abc123');
    expect(dadosDoLink('https://x.exemplo/p/#/evento/editar/abc123')).toBe('abc123');
  });
});

// Auditoria 05/11/2026, A1: o link vem de e-mail de pessoa desconhecida. Ele nunca vai na linha de comando
// (o shell executaria um "$(…)" antes de o script ler) e, no arquivo, só passa o formato dos dados.
describe('script de moderação: o link é dado, não comando', () => {
  const raiz = fileURLToPath(new URL('../../', import.meta.url));
  const script = join(raiz, 'scripts', 'bloquear.mjs');
  const lista = join(raiz, 'public', 'bloqueados.json');
  // Sem shell: os argumentos chegam ao Node exatamente como estão aqui.
  const rodar = (...args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

  it('recusa dados com outros sinais, inclusive numa linha a mais', async () => {
    // @ts-expect-error script .mjs sem tipos
    const { dadosDoLink, dadosValidos } = await import('../../scripts/bloquear.mjs');
    expect(dadosValidos('1rAbc-_09')).toBe(true);
    expect(dadosValidos(dadosDoLink('https://x.exemplo/p/#/evento/1rAbc\n$(comando)'))).toBe(false);
    expect(dadosValidos("1r'x")).toBe(false);
    expect(dadosValidos('ab')).toBe(false);
  });

  it('separa --arquivo e --forcar; texto solto vira sobra', async () => {
    // @ts-expect-error script .mjs sem tipos
    const { lerArgumentos } = await import('../../scripts/bloquear.mjs');
    expect(lerArgumentos(['--arquivo', 'link.txt', '--forcar'])).toEqual({ arquivo: 'link.txt', forcar: true, sobra: [] });
    expect(lerArgumentos(['https://x.exemplo/#/evento/abc']).sobra).toEqual(['https://x.exemplo/#/evento/abc']);
  });

  it('link na linha de comando: para sem gravar', () => {
    const antes = readFileSync(lista, 'utf8');
    const r = rodar('https://walterkaue.github.io/projeto-comunidade/#/evento/abc123');
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('--arquivo');
    expect(readFileSync(lista, 'utf8')).toBe(antes);
  });

  it('arquivo com "$(…)" no link: para sem gravar', () => {
    const pasta = mkdtempSync(join(tmpdir(), 'bloquear-'));
    const arquivo = join(pasta, 'link.txt');
    writeFileSync(arquivo, 'https://walterkaue.github.io/projeto-comunidade/#/evento/1rAbc$(comando)\n');
    const antes = readFileSync(lista, 'utf8');
    try {
      const r = rodar('--arquivo', arquivo);
      expect(r.status).toBe(1);
      expect(r.stderr).toContain('Nada foi gravado');
      expect(readFileSync(lista, 'utf8')).toBe(antes);
    } finally {
      rmSync(pasta, { recursive: true, force: true });
    }
  });
});
