import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { ataVazia } from './ata';
import { apagarAta, haAtaNaMemoria, ligarAvisoDeSaidaDaAta, rascunho } from './rascunho';

describe('rascunho só na memória', () => {
  it('apagar volta a ata ao começo', () => {
    rascunho.ata.organizacao = 'Grupo';
    expect(haAtaNaMemoria()).toBe(true);
    apagarAta();
    expect(rascunho.ata).toEqual(ataVazia());
    expect(haAtaNaMemoria()).toBe(false);
  });

  it('só avisa na saída quando há ata digitada', () => {
    let ouvinte: ((e: Event) => void) | undefined;
    ligarAvisoDeSaidaDaAta({
      addEventListener: (_t: string, f: unknown) => {
        ouvinte = f as (e: Event) => void;
      },
    } as Pick<Window, 'addEventListener'>);
    const evento = () => ({ preventDefault: vi.fn(), returnValue: 'x' }) as unknown as BeforeUnloadEvent;
    const vazio = evento();
    ouvinte!(vazio);
    expect(vazio.preventDefault).not.toHaveBeenCalled();
    rascunho.ata.presentes = 'Ana';
    const cheio = evento();
    ouvinte!(cheio);
    expect(cheio.preventDefault).toHaveBeenCalled();
    apagarAta();
  });
});

describe('esta pasta não guarda nada no aparelho', () => {
  const pasta = dirname(fileURLToPath(import.meta.url));
  const proibidos = [/localStorage/, /sessionStorage/, /indexedDB/, /document\.cookie/, /history\.(push|replace)State/, /caches\./];

  it.each(readdirSync(pasta).filter((f) => /\.(ts|css)$/.test(f) && !f.endsWith('.test.ts')))('%s', (arquivo) => {
    const codigo = readFileSync(join(pasta, arquivo), 'utf8')
      // comentários não contam: só código
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    for (const p of proibidos) expect(codigo, `${arquivo} usa ${p}`).not.toMatch(p);
  });

  it('a ata não vira link (nada de location, URLSearchParams ou linkPara no módulo da ata)', () => {
    for (const f of ['ata.ts', 'rascunho.ts']) {
      const codigo = readFileSync(join(pasta, f), 'utf8');
      expect(codigo).not.toMatch(/location\.|URLSearchParams|linkPara/);
    }
  });
});
