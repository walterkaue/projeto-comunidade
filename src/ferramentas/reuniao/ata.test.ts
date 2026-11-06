import { describe, expect, it } from 'vitest';
import {
  AVISO_AO_COPIAR_A_ATA,
  AVISO_DO_MODELO,
  ataVazia,
  faltasDaAta,
  htmlDaAta,
  listaDePresentes,
  pontosDaPauta,
  temConteudo,
  textoDaAta,
  type Ata,
} from './ata';

const ata: Ata = {
  organizacao: 'Coletivo Cultural da Praça',
  data: '2026-11-12',
  local: 'Praça central',
  inicio: '19:00',
  fim: '20:30',
  presentes: 'Ana\n\n  Bruno  \nAna\nCarla',
  pontos: [
    { titulo: 'Mutirão', discutido: 'Data e materiais.\n\nQuem leva o quê.', decidido: 'Sábado, 8h.' },
    { titulo: '', discutido: '', decidido: '' },
  ],
  encaminhamentos: [
    { oque: 'Comprar sacos de lixo', quem: 'Bruno', ate: '2026-11-14' },
    { oque: '  ', quem: 'Ninguém', ate: '' },
  ],
};

describe('modelo da ata', () => {
  it('começa vazia, com um ponto, e sem conteúdo', () => {
    const a = ataVazia();
    expect(a.pontos).toHaveLength(1);
    expect(temConteudo(a)).toBe(false);
  });
  it('percebe conteúdo em qualquer parte', () => {
    const a = ataVazia();
    a.encaminhamentos.push({ oque: '', quem: 'x', ate: '' });
    expect(temConteudo(a)).toBe(true);
  });
  it('pede só organização e data', () => {
    expect(faltasDaAta(ataVazia()).map((f) => f.campo)).toEqual(['organizacao', 'data']);
    expect(faltasDaAta(ata)).toEqual([]);
  });
  it('cria os pontos a partir da pauta', () => {
    expect(pontosDaPauta(['A', ' ', 'B']).map((p) => p.titulo)).toEqual(['A', 'B']);
  });
  it('limpa a lista de presentes', () => {
    expect(listaDePresentes(ata.presentes)).toEqual(['Ana', 'Bruno', 'Ana', 'Carla']);
  });
});

describe('texto da ata', () => {
  const t = textoDaAta(ata);
  it('tem cabeçalho', () => {
    expect(t).toContain('ATA DE REUNIÃO\nColetivo Cultural da Praça');
    expect(t).toContain('Data: quinta-feira, 12/11/2026');
    expect(t).toContain('Horário: 19h00 às 20h30');
    expect(t).toContain('Local: Praça central');
  });
  it('conta e lista os presentes', () => {
    expect(t).toContain('PRESENTES (4)\n- Ana\n- Bruno\n- Ana\n- Carla');
  });
  it('põe o que foi discutido e decidido, e pula ponto vazio', () => {
    expect(t).toContain('1. Mutirão\nDiscutido: Data e materiais.\nQuem leva o quê.\nDecidido: Sábado, 8h.');
    expect(t).not.toContain('2. ');
  });
  it('lista encaminhamentos com quem e prazo, sem perder o que não tem "o quê"', () => {
    expect(t).toContain('- Comprar sacos de lixo | Quem: Bruno | Até: 14/11/2026');
    expect(t).toContain('- (sem descrição) | Quem: Ninguém');
  });
  it('termina com o aviso de modelo, sem promessa de validade', () => {
    expect(t.endsWith(AVISO_DO_MODELO)).toBe(true);
    expect(t.toLowerCase()).not.toMatch(/válid|oficial|registr|cartório/);
  });
  it('não mostra seções vazias', () => {
    const t2 = textoDaAta({ ...ataVazia(), organizacao: 'Grupo', data: '2026-11-12' });
    expect(t2).not.toMatch(/PRESENTES|PAUTA E DECISÕES|ENCAMINHAMENTOS/);
  });
});

describe('HTML da ata', () => {
  it('escapa tudo que a pessoa digita', () => {
    const suja: Ata = {
      ...ata,
      organizacao: '<img src=x onerror=alert(1)>',
      presentes: '<script>x</script>',
      pontos: [{ titulo: '"><b>', discutido: '<i>', decidido: '&' }],
      encaminhamentos: [{ oque: '<u>', quem: "'", ate: '' }],
    };
    const h = htmlDaAta(suja);
    expect(h).not.toMatch(/<img|<script|<b>|<i>|<u>/);
    expect(h).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
  it('traz o aviso de modelo e a tabela de encaminhamentos', () => {
    const h = htmlDaAta(ata);
    expect(h).toContain(AVISO_DO_MODELO);
    expect(h).toContain('<th scope="col">Até quando</th>');
  });
});

describe('rodapé do PDF da ata', () => {
  it('o CSS de impressão leva o mesmo texto em todas as páginas', async () => {
    const { readFileSync } = await import('node:fs');
    const { RODAPE_DO_PDF } = await import('./ata');
    const css = readFileSync(new URL('./reuniao.css', import.meta.url), 'utf8');
    expect(css).toMatch(/@bottom-center/);
    expect(css).toContain(`content: '${RODAPE_DO_PDF}'`);
  });
});

// Auditoria de segurança, 05/11/2026, B9: a ata copiada leva a lista de presença para a área de transferência.
describe('aviso ao copiar a ata', () => {
  it('fala do histórico da área de transferência, sem termo técnico em inglês', () => {
    expect(AVISO_AO_COPIAR_A_ATA).toMatch(/histórico da área de transferência/);
    expect(AVISO_AO_COPIAR_A_ATA).not.toMatch(/clipboard/i);
  });
});
