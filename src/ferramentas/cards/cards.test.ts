import { describe, expect, it } from 'vitest';
import { passaContraste } from '../../comum/cor';
import { acharPartidario } from '../../../testes/neutralidade.test';
import { exemplo, ORGANIZACOES, proximoSabado, QUANTOS_EXEMPLOS, VOLTA_DO_RODIZIO } from './exemplos';
import { tamanhoReduzido, recusaDoArquivo } from './logo';
import { aplicarLimites, DEF_FORMATOS, escalaDoFormato, FORMATOS, MODELOS_DE_CARD, TAMANHO_MAXIMO } from './modelos';
import { aplicarCorLivre, PALETAS, paresDeContraste } from './paletas';
import { dataPorExtenso, horaPorExtenso, quando, textoAlternativo } from './textos';

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
    expect(r.mensagem).toBe('Essa cor é clara e difícil de ler. Nas letras, vamos usar um tom mais escuro.');
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
  const base = { link: '', modelo: 'reuniao' as const, titulo: 'Assembleia', data: '2026-03-14', hora: '19:00', local: 'Salão', texto: 'Pauta', organizacao: 'Associação' };
  it('texto alternativo descreve os campos e o QR', () => {
    const a = textoAlternativo(base, 'cartaz', true);
    expect(a).toMatch(/^Cartaz de reunião ou assembleia, para imprimir\./);
    expect(a).toContain('Título: Assembleia.');
    expect(a).toContain('código QR');
    expect(a).not.toContain('..');
  });
  it('imagem do formato Grupo, sem a palavra "card" (C-13)', () => {
    expect(DEF_FORMATOS.conversa.nome).toBe('Grupo');
    expect(DEF_FORMATOS.conversa.explicacao).toBe('Quadrado, para mandar no grupo');
    expect(textoAlternativo(base, 'conversa')).toMatch(/^Imagem de reunião ou assembleia, formato Grupo\./);
    expect(textoAlternativo(base, 'status')).toMatch(/^Imagem de reunião ou assembleia, formato Status\./);
    for (const f of FORMATOS) expect(textoAlternativo(base, f).toLowerCase()).not.toContain('card');
  });
  it('texto alternativo diz a pauta inteira', () => {
    const a = textoAlternativo({ ...base, texto: '', pauta: ['a', 'b', 'c'] }, 'status');
    expect(a).toContain('Pauta: 1. a; 2. b; 3. c.');
  });
  it('o card mostra o ano quando a data não é do ano corrente (C-09)', () => {
    const hoje = new Date(2026, 10, 6);
    expect(quando({ ...base, data: '2020-01-01' }, hoje)).toBe('quarta-feira, 1 de janeiro de 2020, às 19h');
    expect(quando({ ...base, data: '2026-03-14' }, hoje)).toBe('sábado, 14 de março, às 19h');
    expect(quando({ ...base, data: '2027-03-13' }, hoje)).toBe('sábado, 13 de março de 2027, às 19h');
  });
});

describe('modelos e limites', () => {
  it('tem 5 modelos e 3 formatos', () => {
    expect(MODELOS_DE_CARD).toHaveLength(5);
    expect(FORMATOS).toHaveLength(3);
  });
  it('corta cada campo no limite', () => {
    const r = aplicarLimites({ modelo: 'aviso', data: '', hora: '', local: '', organizacao: '', link: '', titulo: 'a'.repeat(200), texto: 'b'.repeat(500) });
    expect(r.titulo).toHaveLength(TAMANHO_MAXIMO.titulo);
    expect(r.texto).toHaveLength(140);
  });
  it('o que passa do limite corta numa palavra inteira, com reticências (B-04)', () => {
    const organizacao = 'Associação dos Moradores do Conjunto Jardim das Acácias e Arredores';
    const r = aplicarLimites({ modelo: 'evento', data: '', hora: '', local: '', organizacao, link: '', titulo: 'x', texto: '' });
    expect(r.organizacao).toBe('Associação dos Moradores do Conjunto Jardim das Acácias e…');
    expect(r.organizacao.length).toBeLessThanOrEqual(TAMANHO_MAXIMO.organizacao);
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
      const orgs = new Set(Array.from({ length: VOLTA_DO_RODIZIO }, (_, i) => exemplo(m, i).organizacao));
      expect([...orgs].sort()).toEqual([...ORGANIZACOES].sort());
      expect(exemplo(m, QUANTOS_EXEMPLOS).titulo).toBe(exemplo(m, 0).titulo);
      expect(exemplo(m, -1).titulo).toBe(exemplo(m, QUANTOS_EXEMPLOS - 1).titulo);
    }
  });
  it('na volta inteira, cada tipo aparece o mesmo tanto e cada tradição aparece (D6)', () => {
    expect(QUANTOS_EXEMPLOS).toBe(7);
    expect(VOLTA_DO_RODIZIO).toBe(21);
    const contagem = new Map<string, number>();
    for (let i = 0; i < VOLTA_DO_RODIZIO; i++) {
      const o = exemplo('evento', i).organizacao;
      contagem.set(o, (contagem.get(o) ?? 0) + 1);
    }
    expect(ORGANIZACOES).toHaveLength(9);
    const religiosas = [ORGANIZACOES[2]!, ...ORGANIZACOES.slice(7)];
    for (const o of ORGANIZACOES) expect(contagem.get(o), o).toBe(religiosas.includes(o) ? 1 : 3);
  });
  it('nenhum exemplo usa "paroquial" nem fala em dia de culto', () => {
    for (const m of MODELOS_DE_CARD)
      for (let i = 0; i < VOLTA_DO_RODIZIO; i++) {
        const t = Object.values(exemplo(m, i)).join(' ').toLowerCase();
        expect(t).not.toContain('paroquial');
        expect(t).not.toMatch(/domingo|culto|igreja|missa/);
      }
  });
  it('respeitam os limites e não têm link', () => {
    for (const m of MODELOS_DE_CARD)
      for (let i = 0; i < VOLTA_DO_RODIZIO; i++) {
        const e = exemplo(m, i);
        expect(aplicarLimites(e)).toEqual(e);
        expect(e.link).toBe('');
      }
  });
  it('são neutros (sem linguagem de campanha nem partido)', () => {
    const todos = MODELOS_DE_CARD.flatMap((m) => Array.from({ length: VOLTA_DO_RODIZIO }, (_, i) => Object.values(exemplo(m, i)).join(' ')));
    expect(acharPartidario(todos.join('\n'))).toEqual([]);
  });
  it('próximo sábado cai num sábado', () => {
    const d = proximoSabado(new Date(2026, 10, 5));
    expect(d).toBe('2026-11-07');
    expect(proximoSabado(new Date(2026, 10, 7))).toBe('2026-11-14');
  });
});
