import { describe, expect, it } from 'vitest';
import { semIndexar } from './semindexar';

describe('semIndexar', () => {
  it('põe a meta noindex no head e tira na limpeza', () => {
    const filhos: unknown[] = [];
    const doc = {
      head: { appendChild: (n: unknown) => filhos.push(n) },
      createElement: () => ({
        name: '',
        content: '',
        remove() {
          filhos.splice(filhos.indexOf(this), 1);
        },
      }),
    };
    const limpar = semIndexar(doc);
    expect(filhos).toHaveLength(1);
    expect(filhos[0]).toMatchObject({ name: 'robots', content: 'noindex' });
    limpar();
    expect(filhos).toHaveLength(0);
  });
});
