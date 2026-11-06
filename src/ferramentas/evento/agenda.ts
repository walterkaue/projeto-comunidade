// Datas por extenso, mapa e agenda (puro, sem DOM). Tudo gerado no aparelho.
// Os endereços de fora (Google Maps e Google Agenda) são só links que a pessoa toca; passam pelo aviso de saída
// e levam apenas o que está no evento. Nada é enviado por conta própria.

import { esc, urlSegura } from '../../comum/html';
import type { Evento } from './validar';

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const partes = (iso: string): [number, number, number] => {
  const [a = 0, m = 0, d = 0] = iso.split('-').map(Number);
  return [a, m, d];
};

/** "2026-11-14" → "sábado, 14 de novembro de 2026". Data inválida volta como veio. */
export function dataPorExtenso(iso: string): string {
  const [a, m, d] = partes(iso);
  const dia = new Date(Date.UTC(a, m - 1, d));
  if (Number.isNaN(dia.getTime()) || !MESES[m - 1]) return iso;
  return `${DIAS[dia.getUTCDay()]}, ${d} de ${MESES[m - 1]} de ${a}`;
}

/** "19:00" → "19h"; "19:30" → "19h30". */
export function horaPorExtenso(hora: string): string {
  const [h = '', m = ''] = hora.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

/** O evento termina depois da meia-noite (fim menor que o início). */
export const passaDaMeiaNoite = (inicio: string, fim: string): boolean => Boolean(fim) && fim < inicio;

/** "das 19h às 21h", "das 22h às 2h do dia seguinte" ou "às 19h" (sem hora de fim). */
export function horarioPorExtenso(inicio: string, fim: string): string {
  if (!fim) return `às ${horaPorExtenso(inicio)}`;
  const dia = passaDaMeiaNoite(inicio, fim) ? ' do dia seguinte' : '';
  return `das ${horaPorExtenso(inicio)} às ${horaPorExtenso(fim)}${dia}`;
}

// ---------- mapa ----------

/** Busca do local no Google Maps. O único dado enviado, quando a pessoa toca, é o texto do local. */
export function linkDoMapa(local: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(local)}`;
}

// ---------- horários ----------

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** Soma minutos a uma data e hora (sem fuso: é a hora do relógio do lugar do evento). */
function somar(data: string, hora: string, minutosAMais: number): { data: string; hora: string } {
  const [a, m, d] = partes(data);
  const [h = 0, min = 0] = hora.split(':').map(Number);
  const t = new Date(Date.UTC(a, m - 1, d, h, min + minutosAMais));
  return {
    data: `${t.getUTCFullYear()}-${doisDigitos(t.getUTCMonth() + 1)}-${doisDigitos(t.getUTCDate())}`,
    hora: `${doisDigitos(t.getUTCHours())}:${doisDigitos(t.getUTCMinutes())}`,
  };
}

const compacto = (data: string, hora: string): string => `${data.replace(/-/g, '')}T${hora.replace(':', '')}00`;

/** Início e fim no formato de agenda (AAAAMMDDTHHMMSS). Sem hora de fim, o evento dura 1 hora; fim menor que o início é no dia seguinte. */
export function horariosDaAgenda(e: Pick<Evento, 'data' | 'inicio' | 'fim'>): { inicio: string; fim: string } {
  const fim = !e.fim ? somar(e.data, e.inicio, 60) : passaDaMeiaNoite(e.inicio, e.fim) ? somar(e.data, e.fim, 24 * 60) : { data: e.data, hora: e.fim };
  return { inicio: compacto(e.data, e.inicio), fim: compacto(fim.data, fim.hora) };
}

/** O texto de "Quando" na página: data, hora e a lembrança de que a hora é a do local (B-18). */
export function quandoNaPagina(e: Pick<Evento, 'data' | 'inicio' | 'fim'>): string {
  return `${dataPorExtenso(e.data)}, ${horarioPorExtenso(e.inicio, e.fim)} (horário do local do evento)`;
}

/** O evento já terminou pelo relógio de quem abre (fim, ou início + 1 hora sem fim; B-22). */
export function jaPassou(e: Pick<Evento, 'data' | 'inicio' | 'fim'>, agora: Date): boolean {
  const f = horariosDaAgenda(e).fim;
  const n = (de: number, ate: number) => Number(f.slice(de, ate));
  const termino = new Date(n(0, 4), n(4, 6) - 1, n(6, 8), n(9, 11), n(11, 13));
  return !Number.isNaN(termino.getTime()) && agora.getTime() >= termino.getTime();
}

/** O que vai como descrição na agenda: o texto do evento e, se houver, a organização. */
function descricaoDaAgenda(e: Evento): string {
  // Mesma frase da página (auditoria 05/11/2026, M6): o site não confere quem chama.
  return [e.descricao, e.organizacao ? `Quem chama, segundo quem criou o link: ${e.organizacao}` : ''].filter(Boolean).join('\n\n');
}

// ---------- Google Agenda ----------

export function linkDoGoogleAgenda(e: Evento): string {
  const h = horariosDaAgenda(e);
  const p = [
    ['action', 'TEMPLATE'],
    ['text', e.titulo],
    ['dates', `${h.inicio}/${h.fim}`],
    ['location', e.local],
    ['details', descricaoDaAgenda(e)],
  ];
  return `https://calendar.google.com/calendar/render?${p.map(([k, v]) => `${k}=${encodeURIComponent(v ?? '')}`).join('&')}`;
}

// ---------- arquivo .ics (RFC 5545) ----------

/** Escape de texto do RFC 5545: barra, ponto e vírgula, vírgula e quebra de linha. */
export function escaparIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n?|\n/g, '\\n');
}

/** Dobra a linha em até 75 bytes (UTF-8), sem partir um caractere; as seguintes começam com um espaço. */
export function dobrarLinha(linha: string): string[] {
  const enc = new TextEncoder();
  const saida: string[] = [];
  let atual = '';
  let bytes = 0;
  for (const ch of Array.from(linha)) {
    const n = enc.encode(ch).length;
    const limite = saida.length === 0 ? 75 : 74;
    if (bytes + n > limite) {
      saida.push(saida.length === 0 ? atual : ` ${atual}`);
      atual = '';
      bytes = 0;
    }
    atual += ch;
    bytes += n;
  }
  saida.push(saida.length === 0 ? atual : ` ${atual}`);
  return saida;
}

/** Identificador estável do evento (o mesmo evento gera o mesmo UID). FNV-1a, não é segurança. */
function uid(e: Evento): string {
  let h = 0x811c9dc5;
  for (const ch of [e.titulo, e.data, e.inicio, e.local].join('|')) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${h.toString(16).padStart(8, '0')}-${e.data.replace(/-/g, '')}@comunidade`;
}

const carimbo = (d: Date): string => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Conteúdo do arquivo .ics (linhas separadas por CRLF). Horário "flutuante": vale a hora do relógio de quem abre. */
export function gerarIcs(e: Evento, agora: Date = new Date()): string {
  const h = horariosDaAgenda(e);
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Projeto Comunidade//Evento em um link//pt-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid(e)}`,
    `DTSTAMP:${carimbo(agora)}`,
    `DTSTART:${h.inicio}`,
    `DTEND:${h.fim}`,
    `SUMMARY:${escaparIcs(e.titulo)}`,
    `LOCATION:${escaparIcs(e.local)}`,
  ];
  const descricao = descricaoDaAgenda(e);
  if (descricao) linhas.push(`DESCRIPTION:${escaparIcs(descricao)}`);
  linhas.push('END:VEVENT', 'END:VCALENDAR');
  return linhas.flatMap(dobrarLinha).join('\r\n') + '\r\n';
}

/** Nome do arquivo .ics: letras e números do título, sem acento. */
export function nomeDoArquivoIcs(titulo: string): string {
  const base = titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return `${base || 'evento'}.ics`;
}

// ---------- hrefs ----------

/** href de link externo montado por nós: sempre `esc(urlSegura(...))`. */
export const hrefExterno = (endereco: string): string => esc(urlSegura(endereco));
