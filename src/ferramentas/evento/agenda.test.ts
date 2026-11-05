import { describe, expect, it } from 'vitest';
import {
  dataPorExtenso,
  dobrarLinha,
  escaparIcs,
  gerarIcs,
  hrefExterno,
  horariosDaAgenda,
  horarioPorExtenso,
  linkDoGoogleAgenda,
  linkDoMapa,
  nomeDoArquivoIcs,
} from './agenda';
import type { Evento } from './validar';

const e: Evento = {
  titulo: 'Mutirão de limpeza',
  data: '2026-11-14',
  inicio: '08:30',
  fim: '12:00',
  local: 'Praça central, Rua das Flores, 120',
  descricao: 'Traga luvas; sacos, e água.\nTem café.',
  organizacao: 'Associação de moradores',
};

describe('data e hora por extenso', () => {
  it('data', () => {
    expect(dataPorExtenso('2026-11-14')).toBe('sábado, 14 de novembro de 2026');
    expect(dataPorExtenso('2026-12-01')).toBe('terça-feira, 1 de dezembro de 2026');
    expect(dataPorExtenso('2028-02-29')).toBe('terça-feira, 29 de fevereiro de 2028');
    expect(dataPorExtenso('2026-01-04')).toBe('domingo, 4 de janeiro de 2026');
  });
  it('data estranha volta como veio', () => {
    expect(dataPorExtenso('lixo')).toBe('lixo');
  });
  it('horário', () => {
    expect(horarioPorExtenso('08:30', '12:00')).toBe('das 8h30 às 12h');
    expect(horarioPorExtenso('19:00', '')).toBe('às 19h');
    expect(horarioPorExtenso('00:05', '23:59')).toBe('das 0h05 às 23h59');
  });
});

describe('mapa', () => {
  it('é a busca do Google Maps com o local codificado', () => {
    expect(linkDoMapa('Praça central, Rua das Flores, 120')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Pra%C3%A7a%20central%2C%20Rua%20das%20Flores%2C%20120',
    );
  });
  it('não deixa o texto escapar do parâmetro', () => {
    const url = new URL(linkDoMapa('a&b=c#d?e/f'));
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/search/');
    expect([...url.searchParams.keys()]).toEqual(['api', 'query']);
    expect(url.searchParams.get('query')).toBe('a&b=c#d?e/f');
    expect(url.hash).toBe('');
  });
});

describe('horários da agenda', () => {
  it('com fim', () => {
    expect(horariosDaAgenda(e)).toEqual({ inicio: '20261114T083000', fim: '20261114T120000' });
  });
  it('sem fim, dura 1 hora', () => {
    expect(horariosDaAgenda({ ...e, fim: '' })).toEqual({ inicio: '20261114T083000', fim: '20261114T093000' });
  });
  it('sem fim, passando da meia-noite vira o dia seguinte (e o ano)', () => {
    expect(horariosDaAgenda({ data: '2026-12-31', inicio: '23:30', fim: '' })).toEqual({ inicio: '20261231T233000', fim: '20270101T003000' });
  });
});

describe('Google Agenda', () => {
  it('monta o link com os campos codificados', () => {
    const url = new URL(linkDoGoogleAgenda(e));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('Mutirão de limpeza');
    expect(url.searchParams.get('dates')).toBe('20261114T083000/20261114T120000');
    expect(url.searchParams.get('location')).toBe(e.local);
    expect(url.searchParams.get('details')).toBe('Traga luvas; sacos, e água.\nTem café.\n\nOrganização: Associação de moradores');
    expect([...url.searchParams.keys()]).toEqual(['action', 'text', 'dates', 'location', 'details']);
  });
  it('texto com & # = não cria parâmetros novos', () => {
    const url = new URL(linkDoGoogleAgenda({ ...e, titulo: 'a&dates=1&x=2#y', descricao: '' , organizacao: '' }));
    expect([...url.searchParams.keys()]).toEqual(['action', 'text', 'dates', 'location', 'details']);
    expect(url.searchParams.get('text')).toBe('a&dates=1&x=2#y');
  });
});

describe('arquivo .ics', () => {
  const agora = new Date('2026-11-05T12:34:56.789Z');
  const ics = gerarIcs(e, agora);
  // Desdobra as linhas para ler (RFC 5545: CRLF + espaço continua a linha).
  const linhas = ics.replace(/\r\n /g, '').split('\r\n');

  it('estrutura mínima, com CRLF e fim de linha final', () => {
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
    expect(linhas[0]).toBe('BEGIN:VCALENDAR');
    expect(linhas).toContain('VERSION:2.0');
    expect(linhas).toContain('BEGIN:VEVENT');
    expect(linhas).toContain('END:VEVENT');
    expect(linhas.at(-2)).toBe('END:VCALENDAR');
    expect(linhas.at(-1)).toBe('');
  });

  it('campos do evento', () => {
    expect(linhas).toContain('DTSTART:20261114T083000');
    expect(linhas).toContain('DTEND:20261114T120000');
    expect(linhas).toContain('DTSTAMP:20261105T123456Z');
    expect(linhas).toContain('SUMMARY:Mutirão de limpeza');
    expect(linhas).toContain('LOCATION:Praça central\\, Rua das Flores\\, 120');
    expect(linhas).toContain('DESCRIPTION:Traga luvas\\; sacos\\, e água.\\nTem café.\\n\\nOrganização: Associação de moradores');
    expect(linhas.find((l) => l.startsWith('UID:'))).toMatch(/^UID:[0-9a-f]{8}-20261114@comunidade$/);
  });

  it('o mesmo evento tem sempre o mesmo UID', () => {
    const uid = (x: string) => x.split('\r\n').find((l) => l.startsWith('UID:'));
    expect(uid(gerarIcs(e, new Date(0)))).toBe(uid(gerarIcs(e, agora)));
    expect(uid(gerarIcs({ ...e, titulo: 'Outro' }, agora))).not.toBe(uid(ics));
  });

  it('nenhuma linha passa de 75 bytes e texto longo é dobrado sem partir letra', () => {
    const longo = gerarIcs({ ...e, descricao: 'ação 🎉 '.repeat(50).trim() }, agora);
    const enc = new TextEncoder();
    for (const l of longo.split('\r\n')) expect(enc.encode(l).length, l).toBeLessThanOrEqual(75);
    const inteiro = longo.replace(/\r\n /g, '').split('\r\n').find((l) => l.startsWith('DESCRIPTION:')) ?? '';
    expect(inteiro).toContain('ação 🎉 ação 🎉');
    expect(inteiro).not.toContain('�');
  });

  it('texto não consegue criar linha nova no arquivo', () => {
    const mal = gerarIcs({ ...e, titulo: 'x\r\nEND:VEVENT\r\nBEGIN:VEVENT', descricao: 'a\nATTENDEE:mailto:x@y' }, agora);
    const l = mal.replace(/\r\n /g, '').split('\r\n');
    expect(l.filter((x) => x === 'END:VEVENT')).toHaveLength(1);
    expect(l.some((x) => x.startsWith('ATTENDEE'))).toBe(false);
  });

  it('sem descrição nem organização, não escreve DESCRIPTION', () => {
    expect(gerarIcs({ ...e, descricao: '', organizacao: '' }, agora)).not.toContain('DESCRIPTION');
  });
});

describe('escaparIcs e dobrarLinha', () => {
  it('escapa barra, ponto e vírgula, vírgula e quebra de linha', () => {
    expect(escaparIcs('a\\b;c,d\ne\r\nf')).toBe('a\\\\b\\;c\\,d\\ne\\nf');
  });
  it('linha curta não é dobrada', () => {
    expect(dobrarLinha('SUMMARY:oi')).toEqual(['SUMMARY:oi']);
  });
  it('dobra com espaço no começo das continuações', () => {
    const p = dobrarLinha('X'.repeat(160));
    expect(p).toHaveLength(3);
    expect(p[0]).toHaveLength(75);
    expect(p[1]).toBe(' ' + 'X'.repeat(74));
    expect(p.join('').replace(/ /g, '')).toBe('X'.repeat(160));
  });
});

describe('nome do arquivo e href', () => {
  it('nome do arquivo sem acento nem símbolo', () => {
    expect(nomeDoArquivoIcs('Mutirão de limpeza da praça!')).toBe('mutirao-de-limpeza-da-praca.ics');
    expect(nomeDoArquivoIcs('🎉🎉')).toBe('evento.ics');
    expect(nomeDoArquivoIcs('../../etc/passwd')).toBe('etc-passwd.ics');
  });
  it('href externo passa por esc(urlSegura)', () => {
    expect(hrefExterno(linkDoMapa('a"b<c'))).toBe('https://www.google.com/maps/search/?api=1&amp;query=a%22b%3Cc');
    expect(hrefExterno('javascript:alert(1)')).toBe('#');
  });
});
