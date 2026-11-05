// "Apagar tudo que este site guardou neste aparelho".
// No github.io o endereço é dividido com outros projetos: só apaga o que é nosso
// (localStorage com chave "pc:" e caches com nome "pc-"). Nunca limpa o storage inteiro.

export const PREFIXO_DE_CHAVE = 'pc:';
export const PREFIXO_DE_CACHE = 'pc-';

type Armazenamento = Pick<Storage, 'length' | 'key' | 'removeItem'>;
type Caches = Pick<CacheStorage, 'keys' | 'delete'>;

export interface Apagado {
  chaves: number;
  caches: number;
}

export async function apagarDadosDoSite(
  storage: Armazenamento | null = tentar(() => localStorage),
  caches: Caches | null = typeof globalThis.caches === 'undefined' ? null : globalThis.caches,
): Promise<Apagado> {
  const resultado: Apagado = { chaves: 0, caches: 0 };
  if (storage) {
    // Primeiro junta os nomes: apagar mexe nos índices.
    const chaves: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k?.startsWith(PREFIXO_DE_CHAVE)) chaves.push(k);
    }
    for (const k of chaves) {
      storage.removeItem(k);
      resultado.chaves++;
    }
  }
  if (caches) {
    for (const nome of await caches.keys()) {
      if (nome.startsWith(PREFIXO_DE_CACHE) && (await caches.delete(nome))) resultado.caches++;
    }
  }
  return resultado;
}

function tentar<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null; // armazenamento bloqueado pelo navegador
  }
}
