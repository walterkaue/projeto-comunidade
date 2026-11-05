import { describe, expect, it } from 'vitest';
import { ataVazia, pontoVazio } from '../reuniao/ata';
import { exemploDoFluxo } from './estado';
import { ataComAPauta, haPontosComTexto } from './ponte';

const d = exemploDoFluxo('reuniao', 0, new Date(2026, 10, 5));

describe('ataComAPauta', () => {
  it('os pontos viram a pauta e os campos vazios vêm da reunião', () => {
    const ata = ataComAPauta(ataVazia(), d);
    expect(ata.pontos.map((p) => p.titulo)).toEqual(d.pauta.split('\n'));
    expect(ata.organizacao).toBe(d.organizacao.trim());
    expect(ata.data).toBe(d.data);
    expect(ata.local).toBe(d.local.trim());
    expect(ata.inicio).toBe(d.hora);
  });

  it('não sobrescreve o que a pessoa já escreveu na ata', () => {
    const antes = { ...ataVazia(), organizacao: 'Outra', local: 'Praça', presentes: 'Ana' };
    const ata = ataComAPauta(antes, d);
    expect(ata.organizacao).toBe('Outra');
    expect(ata.local).toBe('Praça');
    expect(ata.presentes).toBe('Ana');
    expect(ata.data).toBe(d.data);
  });

  it('não muda a ata de entrada', () => {
    const antes = ataVazia();
    ataComAPauta(antes, d);
    expect(antes).toEqual(ataVazia());
  });

  it('pauta vazia mantém os pontos de antes', () => {
    const antes = { ...ataVazia(), pontos: [pontoVazio('Um')] };
    expect(ataComAPauta(antes, { ...d, pauta: '' }).pontos).toEqual(antes.pontos);
  });
});

describe('haPontosComTexto', () => {
  it('ata vazia não tem', () => {
    expect(haPontosComTexto(ataVazia())).toBe(false);
  });
  it('qualquer texto num ponto conta', () => {
    expect(haPontosComTexto({ ...ataVazia(), pontos: [{ titulo: '', discutido: '', decidido: 'x' }] })).toBe(true);
  });
});
