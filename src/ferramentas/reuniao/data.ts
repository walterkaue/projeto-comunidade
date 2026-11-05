// Datas e horas em texto (puro, sem fuso: lê "AAAA-MM-DD" e "HH:MM" como estão).

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "2026-11-12" → "quinta-feira, 12/11/2026". Data inválida volta vazia. */
export function dataPorExtenso(data: string): string {
  const m = DATA.exec(data);
  if (!m) return '';
  const [, a, me, d] = m;
  const t = new Date(Date.UTC(Number(a), Number(me) - 1, Number(d)));
  if (t.getUTCFullYear() !== Number(a) || t.getUTCMonth() !== Number(me) - 1 || t.getUTCDate() !== Number(d)) return '';
  return `${DIAS[t.getUTCDay()]}, ${d}/${me}/${a}`;
}

/** "2026-11-12" → "12/11/2026". Inválida volta vazia. */
export function dataCurta(data: string): string {
  return dataPorExtenso(data) ? data.split('-').reverse().join('/') : '';
}

/** "19:00" → "19h00". Inválida volta vazia. */
export function horaEmTexto(hora: string): string {
  return HORA.test(hora) ? hora.replace(':', 'h') : '';
}

/** Tira espaços repetidos e das pontas; troca quebras de linha por espaço. */
export function umaLinha(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}
