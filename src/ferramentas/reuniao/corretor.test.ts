// Auditoria 05/11/2026, achado M1: o corretor ortográfico "avançado" do Chrome e o do Edge mandam o texto
// digitado para o Google ou a Microsoft. Na reunião, todo campo de texto tem o corretor desligado, para a
// lista de presença (que pode revelar filiação) não sair do aparelho.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const codigo = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.ts'), 'utf8');

describe('corretor ortográfico desligado na reunião', () => {
  it('a tela inteira desliga o corretor', () => {
    expect(codigo).toMatch(/base\.spellcheck = false;/);
  });

  it('todo <input> e <textarea> escrito à mão leva os atributos', () => {
    const campos = codigo.match(/<(input|textarea)\b[^>]*>/g) ?? [];
    expect(campos.length).toBeGreaterThan(0);
    for (const c of campos) expect(c, c.slice(0, 60)).toContain('${ATRIBUTOS_SEM_CORRETOR}');
  });

  it('todo campo de texto dos componentes pede semCorretor (data e hora não precisam)', () => {
    const chamadas = codigo.match(/campo(?:Texto|AreaDeTexto)\(\{[^}]*\}\)/g) ?? [];
    expect(chamadas.length).toBeGreaterThan(0);
    // Chamada com "${…}" dentro do objeto não casa com a busca acima: em vez de pular em silêncio, o teste falha.
    const todas = codigo.match(/campo(?:Texto|AreaDeTexto)\(/g) ?? [];
    expect(chamadas.length, 'alguma chamada não foi conferida (tem ${…} dentro?)').toBe(todas.length);
    for (const c of chamadas) {
      if (/tipo: '(date|time)'/.test(c)) continue;
      expect(c, c.slice(0, 60)).toContain('semCorretor: true');
    }
  });
});
