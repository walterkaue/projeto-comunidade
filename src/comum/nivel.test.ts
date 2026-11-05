import { describe, expect, it } from 'vitest';
import { nivelDoAparelho, nivelInicial, sinaisDoAparelho } from './nivel';

describe('nivelInicial', () => {
  it('economia de dados manda', () => {
    expect(nivelInicial({ economiaDeDados: true, nucleos: 8, memoriaGB: 8 })).toBe('leve');
  });
  it('2G é leve', () => {
    expect(nivelInicial({ tipoDeRede: 'slow-2g', nucleos: 8 })).toBe('leve');
    expect(nivelInicial({ tipoDeRede: '2g', nucleos: 8 })).toBe('leve');
    expect(nivelInicial({ tipoDeRede: '3g', nucleos: 8 })).toBe('normal');
  });
  it('poucos núcleos ou pouca memória é leve', () => {
    expect(nivelInicial({ nucleos: 4 })).toBe('leve');
    expect(nivelInicial({ nucleos: 8, memoriaGB: 2 })).toBe('leve');
  });
  it('aparelho bom, ou que não diz nada, é normal', () => {
    expect(nivelInicial({ nucleos: 8, memoriaGB: 8 })).toBe('normal');
    expect(nivelInicial({ nucleos: 5 })).toBe('normal');
    expect(nivelInicial({})).toBe('normal');
  });
});

describe('sinaisDoAparelho', () => {
  it('lê do navegador falso', () => {
    const s = sinaisDoAparelho({ hardwareConcurrency: 4, deviceMemory: 2, connection: { saveData: true, effectiveType: '2g' } });
    expect(s).toEqual({ nucleos: 4, memoriaGB: 2, economiaDeDados: true, tipoDeRede: '2g' });
  });
  it('campo ausente fica indefinido', () => {
    expect(sinaisDoAparelho({})).toEqual({ nucleos: undefined, memoriaGB: undefined, economiaDeDados: undefined, tipoDeRede: undefined });
  });
  it('nivelDoAparelho devolve um nível válido (em node, sem navegador)', () => {
    expect(['leve', 'normal']).toContain(nivelDoAparelho());
  });
});
