// Neutralidade: os textos DA PLATAFORMA (não o que a pessoa digita) não têm linguagem de campanha
// nem sigla de partido. Varre src/ (sem os testes), public/ e o index.html.
// Exceção pontual: uma linha com "neutralidade: permitido" (em comentário, com o motivo) é ignorada.
// A lista de siglas está em testes/siglas-partidos.txt e precisa ser conferida com a do TSE.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RAIZ, arquivosEm, relativo } from './arquivos';

/** Linguagem de campanha (sem diferenciar maiúsculas nem acento). Palavra inteira: "votação" pode. */
export const CAMPANHA = ['vote', 'votem', 'vote em', 'eleja', 'elejam', 'reeleja', 'candidato', 'candidata', 'candidatos', 'candidatas'];

const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function lerSiglas(texto: string): string[] {
  return texto
    .split('\n')
    .map((l) => l.replace(/#.*/, '').trim())
    .filter(Boolean);
}

const SIGLAS = lerSiglas(readFileSync(join(RAIZ, 'testes', 'siglas-partidos.txt'), 'utf8'));

const palavra = (p: string, flags: string) =>
  new RegExp(`(^|[^\\p{L}\\p{N}])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')}($|[^\\p{L}\\p{N}])`, flags);

/** Devolve o que achou no texto: palavras de campanha e siglas (estas só em caixa alta, como na lista). */
export function acharPartidario(texto: string, siglas: readonly string[] = SIGLAS): string[] {
  const linhas = semAcento(texto)
    .split('\n')
    .filter((l) => !l.includes('neutralidade: permitido'))
    .join('\n');
  const campanha = CAMPANHA.filter((p) => palavra(p, 'iu').test(linhas));
  const partidos = siglas.filter((s) => palavra(semAcento(s), 'u').test(linhas));
  return [...campanha, ...partidos];
}

describe('neutralidade dos textos da plataforma', () => {
  const lista = [
    ...arquivosEm(join(RAIZ, 'src'), /\.(ts|css|html|md|json|txt|svg)$/),
    ...arquivosEm(join(RAIZ, 'public'), /\.(html|webmanifest|json|txt|svg|js)$/),
    join(RAIZ, 'index.html'),
  ];

  it('a lista de siglas foi lida', () => {
    expect(SIGLAS.length).toBeGreaterThan(20);
    expect(SIGLAS).toContain('PT');
  });

  it('acha o que deve achar (o teste funciona)', () => {
    expect(acharPartidario('Vote no 13!')).toEqual(['vote']);
    expect(acharPartidario('ELEJA quem trabalha')).toEqual(['eleja']);
    expect(acharPartidario('Conheça a candidata')).toEqual(['candidata']);
    expect(acharPartidario('Reunião do PT do bairro')).toEqual(['PT']);
    expect(acharPartidario('Encontro do UNIAO')).toContain('UNIÃO');
    expect(acharPartidario('núcleo do PCdoB')).toEqual(['PCdoB']);
  });

  it('não acusa palavra comum (o teste não exagera)', () => {
    expect(acharPartidario('Votação da pauta, devoto, voters')).toEqual([]);
    expect(acharPartidario('Um novo evento na rede do bairro, avante!')).toEqual([]);
    expect(acharPartidario('Idioma pt-BR, formato PDF')).toEqual([]);
    expect(acharPartidario('ponto de partida, PTA, apt, capt')).toEqual([]);
    expect(acharPartidario('const PT = 1; // neutralidade: permitido (exemplo)')).toEqual([]);
  });

  it(`nenhum texto da plataforma é partidário (${lista.length} arquivos)`, () => {
    const achados = lista.flatMap((a) => acharPartidario(readFileSync(a, 'utf8')).map((p) => `${relativo(a)}: "${p}"`));
    expect(achados).toEqual([]);
  });
});
