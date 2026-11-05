import { describe, expect, it } from 'vitest';
import { apagarDadosDoSite } from './apagar';

function armazenamentoFalso(inicial: Record<string, string>) {
  const dados = new Map(Object.entries(inicial));
  return {
    dados,
    get length() {
      return dados.size;
    },
    key: (i: number) => [...dados.keys()][i] ?? null,
    removeItem: (k: string) => void dados.delete(k),
  };
}

const cachesFalso = (nomes: string[]) => {
  const lista = new Set(nomes);
  return { lista, keys: async () => [...lista], delete: async (n: string) => lista.delete(n) };
};

describe('apagarDadosDoSite', () => {
  it('apaga só chaves "pc:" e caches "pc-"', async () => {
    const s = armazenamentoFalso({ 'pc:rascunho': '1', 'pc:pref': '2', outro: '3', 'pcx:y': '4' });
    const c = cachesFalso(['pc-abc-pagina', 'pc-abc-arquivos', 'outro-projeto', 'workbox']);
    const r = await apagarDadosDoSite(s, c as never);
    expect(r).toEqual({ chaves: 2, caches: 2 });
    expect([...s.dados.keys()].sort()).toEqual(['outro', 'pcx:y']);
    expect([...c.lista].sort()).toEqual(['outro-projeto', 'workbox']);
  });

  it('funciona sem armazenamento nem caches', async () => {
    expect(await apagarDadosDoSite(null, null)).toEqual({ chaves: 0, caches: 0 });
  });
});
