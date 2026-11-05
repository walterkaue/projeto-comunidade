import { describe, expect, it } from 'vitest';
import { enderecoDaContagem } from './metricas';

describe('contagem de visitas', () => {
  it('manda só a tela, nunca os dados que vêm depois dela', () => {
    const u = new URL(enderecoDaContagem('projetocomunidade', '#/evento/1rWyJNdXRpcsOj', 42));
    expect(u.origin).toBe('https://projetocomunidade.goatcounter.com');
    expect(u.pathname).toBe('/count');
    expect(u.searchParams.get('p')).toBe('/evento');
    expect(u.searchParams.get('t')).toBe('Projeto Comunidade');
    expect([...u.searchParams.keys()].sort()).toEqual(['p', 'rnd', 't']);
    expect(u.href).not.toContain('1rWy');
  });

  it('dados de card e denúncia também ficam de fora', () => {
    expect(new URL(enderecoDaContagem('x', '#/cards/titulo=Segredo', 1)).searchParams.get('p')).toBe('/cards');
    expect(enderecoDaContagem('x', '#/denunciar/https%3A%2F%2Fa', 1)).not.toContain('https%3A');
    expect(new URL(enderecoDaContagem('x', '', 1)).searchParams.get('p')).toBe('/');
  });
});
