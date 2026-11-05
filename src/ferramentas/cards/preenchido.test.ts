// Auditoria 05/11/2026, achado M5: um link "#/cards/titulo=…" mostrava texto de terceiro no nosso domínio, sem
// a faixa "conteúdo de quem enviou", sem "Denunciar" e sem a lista de bloqueio. Agora o Cards só abre preenchido
// pelo que o Evento ou a Reunião prepararam na mesma aba (prepararCard / pegarCardPreparado).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as entreTelas from '../../comum/entreTelas';

const pasta = dirname(fileURLToPath(import.meta.url));
const semComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('o Cards não lê dados do link', () => {
  it('a tela só olha o resto da rota para abrir a galeria', () => {
    const codigo = semComentarios(readFileSync(join(pasta, 'index.ts'), 'utf8'));
    expect(codigo.match(/rota\.resto/g)).toEqual(['rota.resto']);
    expect(codigo).toMatch(/rota\.resto === 'galeria'/);
    expect(codigo).toMatch(/pegarCardPreparado\(\)/);
    expect(codigo).not.toMatch(/URLSearchParams|location\.hash/);
  });

  it('o contrato entre as ferramentas não tem mais leitura nem montagem de link do Cards', () => {
    expect(Object.keys(entreTelas)).not.toContain('lerDadosDoCard');
    expect(Object.keys(entreTelas)).not.toContain('linkDoCard');
    expect(entreTelas.ENDERECO_DO_CARDS).toBe('#/cards');
  });
});
