import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pasta = dirname(fileURLToPath(import.meta.url));
const arquivos = readdirSync(pasta).filter((f) => /\.(ts|css)$/.test(f) && !f.endsWith('.test.ts'));

/** O código sem os comentários (comentário pode citar o que é proibido). */
const semComentarios = (arquivo: string) =>
  readFileSync(join(pasta, arquivo), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('esta pasta não guarda nada no aparelho', () => {
  const proibidos = [/localStorage/, /sessionStorage/, /indexedDB/, /document\.cookie/, /history\.(push|replace)State/, /caches\./];

  it.each(arquivos)('%s', (arquivo) => {
    const codigo = semComentarios(arquivo);
    for (const p of proibidos) expect(codigo, `${arquivo} usa ${p}`).not.toMatch(p);
  });
});

describe('os dados nunca vêm do endereço', () => {
  it('só estado.ts lê rota.resto', () => {
    for (const f of arquivos.filter((a) => a !== 'estado.ts')) {
      expect(semComentarios(f), `${f} lê o resto da rota`).not.toMatch(/\.resto\b/);
    }
  });

  it('nenhuma tela lê location.search nem URLSearchParams', () => {
    for (const f of arquivos) expect(semComentarios(f), f).not.toMatch(/location\.search|URLSearchParams/);
  });
});

describe('nada de rede nem endereço de outro site', () => {
  it.each(arquivos)('%s', (arquivo) => {
    const codigo = semComentarios(arquivo);
    expect(codigo).not.toMatch(/https?:\/\//);
    expect(codigo).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket/);
  });
});

describe('texto digitado não entra no HTML sem esc', () => {
  it('as telas não põem os campos do fluxo crus num template', () => {
    // Os campos digitados só entram via formulario.ts (que usa esc) ou textContent.
    for (const f of ['passos.ts', 'passo3.ts', 'topo.ts', 'pronto.ts', 'previa.ts', 'index.ts']) {
      expect(semComentarios(f), f).not.toMatch(/\$\{d\.(titulo|organizacao|texto|pauta|local)\}/);
    }
  });
});

describe('o exemplo só ilustra (placeholder e miniatura dos passos 1 e 2)', () => {
  const cita = /comExemplo|faltaAlgo|CamposDoExemplo|SEM_EXEMPLO|exemploDoRodizio|exemploVazio|\.exemplo\b/;
  const podem = ['passos.ts', 'previa.ts', 'estado.ts', 'memoria.ts', 'dados-de-teste.ts'];

  it.each(['passos.ts', 'previa.ts', 'estado.ts', 'memoria.ts'])('%s é um dos lugares que leem o exemplo', (arquivo) => {
    expect(semComentarios(arquivo)).toMatch(cita);
  });

  it('pronto.ts, passo3.ts, link.ts, ponte.ts e apoio.ts não citam o exemplo', () => {
    for (const f of ['pronto.ts', 'passo3.ts', 'link.ts', 'ponte.ts', 'apoio.ts']) expect(semComentarios(f), f).not.toMatch(cita);
  });

  it('nenhum outro arquivo da pasta cita o exemplo', () => {
    for (const f of arquivos.filter((a) => a.endsWith('.ts') && !podem.includes(a))) expect(semComentarios(f), f).not.toMatch(cita);
  });

  it('só previa.ts usa comExemplo e faltaAlgo (a miniatura e o diálogo); passos.ts usa só os placeholders', () => {
    for (const f of arquivos.filter((a) => a.endsWith('.ts') && a !== 'estado.ts')) {
      const usa = /comExemplo|faltaAlgo/.test(semComentarios(f));
      expect(usa, f).toBe(f === 'previa.ts');
    }
  });
});

describe('exemplo da Organização no passo 1', () => {
  it('o placeholder usa o nome curto (cabe numa linha, sem "…")', () => {
    expect(semComentarios('passos.ts')).toContain('exemplo: nomeCurtoDaOrganizacao(d.exemplo.organizacao)');
  });
});
