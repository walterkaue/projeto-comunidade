// Neutralidade: os textos DA PLATAFORMA (não o que a pessoa digita) não têm linguagem de campanha
// nem sigla ou nome de partido. Varre src/ (sem os testes), public/, scripts/ (o texto da imagem de
// prévia sai de lá) e o index.html. A lista de partidos está em testes/siglas-partidos.txt e precisa
// ser conferida com a do TSE.
// Exceção pontual: a linha com o comentário "neutralidade: permitido (motivo)" é ignorada.
// O marcador só vale dentro de comentário (//, /* ou <!--).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RAIZ, arquivosEm, relativo } from './arquivos';

/**
 * Linguagem de campanha (sem diferenciar maiúsculas nem acento), palavra inteira: "votação" e
 * "eleição da diretoria" podem (assembleia de associação), "vote" e "candidato" não.
 */
export const CAMPANHA = [
  'vote',
  'vote em',
  'vote no',
  'vote na',
  'vem votar',
  'eleja',
  'elejam',
  'reeleja',
  'reeleicao',
  'candidato',
  'candidata',
  'candidatos',
  'candidatas',
  'campanha eleitoral',
  'na urna',
  'numero do candidato',
];

const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export interface Partidos {
  siglas: string[];
  nomes: string[];
}

export function lerPartidos(texto: string): Partidos {
  const partidos: Partidos = { siglas: [], nomes: [] };
  let secao: keyof Partidos | null = null;
  for (const bruta of texto.split('\n')) {
    const linha = bruta.replace(/#.*/, '').trim();
    if (!linha) continue;
    if (linha === '[siglas]' || linha === '[nomes]') secao = linha === '[siglas]' ? 'siglas' : 'nomes';
    else if (secao) partidos[secao].push(linha);
  }
  return partidos;
}

const PARTIDOS = lerPartidos(readFileSync(join(RAIZ, 'testes', 'siglas-partidos.txt'), 'utf8'));

// Limite de palavra: letra, número e "_" contam como parte da palavra (ESPERA_DA_REDE_MS não é "REDE").
const palavra = (p: string, flags: string) =>
  new RegExp(`(^|[^\\p{L}\\p{N}_])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')}($|[^\\p{L}\\p{N}_])`, flags);

const EXCECAO = /(\/\/|\/\*|<!--).*neutralidade: permitido/;

/** O que achou no texto: palavras de campanha, siglas (só em caixa alta) e nomes de partido. */
export function acharPartidario(texto: string, partidos: Partidos = PARTIDOS): string[] {
  const linhas = semAcento(texto)
    .split('\n')
    .filter((l) => !EXCECAO.test(l))
    .join('\n');
  return [
    ...CAMPANHA.filter((p) => palavra(p, 'iu').test(linhas)),
    ...partidos.siglas.filter((s) => palavra(semAcento(s), 'u').test(linhas)),
    ...partidos.nomes.filter((n) => palavra(semAcento(n), 'iu').test(linhas)),
  ];
}

describe('neutralidade dos textos da plataforma', () => {
  const lista = [
    ...arquivosEm(join(RAIZ, 'src'), /\.(ts|tsx|js|mjs|css|html|md|json|txt|svg)$/),
    ...arquivosEm(join(RAIZ, 'public'), /\.(html|webmanifest|json|txt|svg|js)$/),
    ...arquivosEm(join(RAIZ, 'scripts'), /\.(mjs|js|ts)$/),
    join(RAIZ, 'index.html'),
  ];

  it('a lista de partidos foi lida', () => {
    expect(PARTIDOS.siglas).toContain('PT');
    expect(PARTIDOS.nomes).toContain('Partido Liberal');
    expect(PARTIDOS.siglas.length + PARTIDOS.nomes.length).toBeGreaterThan(40);
  });

  it('acha o que deve achar (o teste funciona)', () => {
    expect(acharPartidario('Vote no 13!')).toEqual(['vote', 'vote no']);
    expect(acharPartidario('ELEJA quem trabalha')).toEqual(['eleja']);
    expect(acharPartidario('Conheça a candidata')).toEqual(['candidata']);
    expect(acharPartidario('Confirme na urna')).toEqual(['na urna']);
    expect(acharPartidario('Reunião do PT do bairro')).toEqual(['PT']);
    expect(acharPartidario('núcleo do PCdoB')).toEqual(['PCdoB']);
    expect(acharPartidario('apoio do Partido dos Trabalhadores')).toEqual(['Partido dos Trabalhadores']);
    expect(acharPartidario('filiados da UNIÃO BRASIL')).toEqual(['União Brasil']);
    expect(acharPartidario("'Vote' // neutralidade permitido sem dois-pontos")).toEqual(['vote']);
  });

  it('não acusa palavra comum (o teste não exagera)', () => {
    expect(acharPartidario('Votação da pauta, eleição da diretoria, devoto')).toEqual([]);
    expect(acharPartidario('NOVO EVENTO na REDE DE APOIO, FEIRA DE SOLIDARIEDADE')).toEqual([]);
    expect(acharPartidario('ASSOCIAÇÃO UNIÃO DOS MORADORES, MISSÃO SOCIAL, VOCÊ PODE AJUDAR')).toEqual([]);
    expect(acharPartidario('Idioma pt-BR, Rua DC-3, cartão SD, Curitiba - PR')).toEqual([]);
    expect(acharPartidario('const ESPERA_DA_REDE_MS = 4000; KEY_UP; LOCALE_PT')).toEqual([]);
    expect(acharPartidario('ponto de partida, PTA, apt, capt')).toEqual([]);
    expect(acharPartidario('const PT = 1; // neutralidade: permitido (exemplo)')).toEqual([]);
  });

  it(`nenhum texto da plataforma é partidário (${lista.length} arquivos)`, () => {
    const achados = lista.flatMap((a) => acharPartidario(readFileSync(a, 'utf8')).map((p) => `${relativo(a)}: "${p}"`));
    expect(achados).toEqual([]);
  });
});
