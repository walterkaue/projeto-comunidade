import { describe, expect, it } from 'vitest';
import { passaContraste } from '../../comum/cor';
import { acharPartidario } from '../../../testes/neutralidade.test';
import { exemplo, ORGANIZACOES, proximoSabado, QUANTOS_EXEMPLOS } from './exemplos';
import { tamanhoReduzido, recusaDoArquivo } from './logo';
import { aplicarLimites, CARD_VAZIO, escalaDoFormato, FORMATOS, MODELOS_DE_CARD, TAMANHO_MAXIMO } from './modelos';
import { aplicarCorLivre, PALETAS, paresDeContraste } from './paletas';
import { dataPorExtenso, horaPorExtenso, linkDoWhatsApp, textoAlternativo, textoParaWhatsApp } from './textos';

describe('paletas', () => {
  it('toda paleta passa 4,5:1 em todos os pares de texto', () => {
    for (const p of PALETAS) for (const [t, f] of paresDeContraste(p)) expect(passaContraste(t, f), `${p.id} ${t}/${f}`).toBe(true);
  });
  it('são 6, com ids diferentes', () => {
    expect(PALETAS).toHaveLength(6);
    expect(new Set(PALETAS.map((p) => p.id)).size).toBe(6);
  });
});

describe('cor livre', () => {
  it('recusa o que não é cor', () => {
    const r = aplicarCorLivre('azul');
    expect(r.ok).toBe(false);
    expect(r.mensagem).toMatch(/não é válida/);
  });
  it('aceita #rgb e mantém a cor da faixa', () => {
    const r = aplicarCorLivre('#a00');
    expect(r.ok && r.paleta?.destaque).toBe('#aa0000');
  });
  it('cor clara demais: ajusta o detalhe e explica', () => {
    const r = aplicarCorLivre('#fff3b0');
    expect(r.ok).toBe(true);
    expect(r.mensagem).not.toBe('');
    for (const [t, f] of paresDeContraste(r.paleta!)) expect(passaContraste(t, f)).toBe(true);
  });
  it('qualquer cor deixa o texto da faixa legível', () => {
    for (const cor of ['#000000', '#ffffff', '#808080', '#ffcc00', '#336699', '#777777']) {
      const p = aplicarCorLivre(cor).paleta!;
      expect(passaContraste(p.sobreDestaque, p.destaque)).toBe(true);
      expect(passaContraste(p.acento, p.fundo)).toBe(true);
    }
  });
});

describe('textos', () => {
  it('data e hora por extenso', () => {
    expect(dataPorExtenso('2026-03-14')).toBe('sábado, 14 de março');
    expect(dataPorExtenso('2026-02-31')).toBe('');
    expect(dataPorExtenso('x')).toBe('');
    expect(horaPorExtenso('19:00')).toBe('19h');
    expect(horaPorExtenso('19:30')).toBe('19h30');
    expect(horaPorExtenso('25:00')).toBe('');
  });
  const base = { ...CARD_VAZIO, modelo: 'reuniao' as const, titulo: 'Assembleia', data: '2026-03-14', hora: '19:00', local: 'Salão', texto: 'Pauta', organizacao: 'Associação' };
  it('texto do WhatsApp usa *negrito* e tira marcas digitadas', () => {
    const t = textoParaWhatsApp({ ...base, titulo: 'A *grande* reunião' });
    expect(t.split('\n')[0]).toBe('*A grande reunião*');
    expect(t).toContain('📅 sábado, 14 de março, às 19h');
    expect(t).toContain('📍 Salão');
    expect(t).toContain('_Associação_');
  });
  it('aviso não usa hora nem local', () => {
    const t = textoParaWhatsApp({ ...base, modelo: 'aviso' });
    expect(t).not.toContain('📍');
    expect(t).not.toContain('19h');
  });
  it('inclui o link só quando existe', () => {
    expect(textoParaWhatsApp(base)).not.toContain('Mais detalhes');
    expect(textoParaWhatsApp({ ...base, link: 'https://x/#/evento/a' })).toContain('Mais detalhes: https://x/#/evento/a');
  });
  it('texto alternativo descreve os campos e o QR', () => {
    const a = textoAlternativo(base, 'cartaz', true);
    expect(a).toMatch(/^Card de reunião ou assembleia, formato Cartaz A4\./);
    expect(a).toContain('Título: Assembleia.');
    expect(a).toContain('código QR');
    expect(a).not.toContain('..');
  });
  it('link do WhatsApp codifica o texto', () => {
    expect(linkDoWhatsApp('a b&c')).toBe('https://wa.me/?text=a%20b%26c');
  });
});

describe('modelos e limites', () => {
  it('tem 5 modelos e 3 formatos', () => {
    expect(MODELOS_DE_CARD).toHaveLength(5);
    expect(FORMATOS).toHaveLength(3);
  });
  it('corta cada campo no limite', () => {
    const r = aplicarLimites({ ...CARD_VAZIO, titulo: 'a'.repeat(200), texto: 'b'.repeat(500) });
    expect(r.titulo).toHaveLength(TAMANHO_MAXIMO.titulo);
    expect(r.texto).toHaveLength(140);
  });
  it('aparelho leve desenha menor', () => {
    for (const f of FORMATOS) expect(escalaDoFormato(f, 'leve')).toBeLessThan(escalaDoFormato(f, 'normal'));
  });
});

describe('logo', () => {
  it('reduz sem ampliar nem deformar', () => {
    expect(tamanhoReduzido(800, 400)).toEqual({ largura: 400, altura: 200 });
    expect(tamanhoReduzido(100, 50)).toEqual({ largura: 100, altura: 50 });
    expect(tamanhoReduzido(0, 10)).toEqual({ largura: 0, altura: 0 });
  });
  it('recusa o que não é imagem e o que é grande demais', () => {
    expect(recusaDoArquivo('application/pdf', 10)).not.toBe('');
    expect(recusaDoArquivo('image/png', 11 * 1024 * 1024)).not.toBe('');
    expect(recusaDoArquivo('image/png', 1000)).toBe('');
  });
});

describe('exemplos', () => {
  it('em rodízio entre os tipos de organização, para todo modelo', () => {
    for (const m of MODELOS_DE_CARD) {
      const orgs = new Set(Array.from({ length: QUANTOS_EXEMPLOS }, (_, i) => exemplo(m, i).organizacao));
      expect(orgs.size).toBe(ORGANIZACOES.length);
      expect(exemplo(m, QUANTOS_EXEMPLOS).titulo).toBe(exemplo(m, 0).titulo);
      expect(exemplo(m, -1).titulo).toBe(exemplo(m, QUANTOS_EXEMPLOS - 1).titulo);
    }
  });
  it('respeitam os limites e não têm link', () => {
    for (const m of MODELOS_DE_CARD)
      for (let i = 0; i < QUANTOS_EXEMPLOS; i++) {
        const e = exemplo(m, i);
        expect(aplicarLimites(e)).toEqual(e);
        expect(e.link).toBe('');
      }
  });
  it('são neutros (sem linguagem de campanha nem partido)', () => {
    const todos = MODELOS_DE_CARD.flatMap((m) => Array.from({ length: QUANTOS_EXEMPLOS }, (_, i) => Object.values(exemplo(m, i)).join(' ')));
    expect(acharPartidario(todos.join('\n'))).toEqual([]);
  });
  it('próximo sábado cai num sábado', () => {
    const d = proximoSabado(new Date(2026, 10, 5));
    expect(d).toBe('2026-11-07');
    expect(proximoSabado(new Date(2026, 10, 7))).toBe('2026-11-14');
  });
});
