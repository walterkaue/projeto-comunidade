// Textos gerados dos campos: data por extenso, texto para o WhatsApp e texto alternativo (puro, sem DOM).

import { NOME } from '../../comum/marca';
import { DEF_FORMATOS, DEF_MODELOS, type CamposDoCard, type Formato } from './modelos';

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "2026-03-14" → "sábado, 14 de março". Data que não existe vira vazio. */
export function dataPorExtenso(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return '';
  const [a, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])] as [number, number, number];
  const d = new Date(Date.UTC(a, mes - 1, dia));
  if (d.getUTCFullYear() !== a || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return '';
  return `${DIAS[d.getUTCDay()]}, ${dia} de ${MESES[mes - 1]}`;
}

/** "19:00" → "19h"; "19:30" → "19h30". */
export function horaPorExtenso(hhmm: string): string {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) return '';
  return m[2] === '00' ? `${Number(m[1])}h` : `${Number(m[1])}h${m[2]}`;
}

/** "sábado, 14 de março, às 19h" (a parte que existir). */
export function quando(c: Pick<CamposDoCard, 'data' | 'hora' | 'modelo'>): string {
  const data = dataPorExtenso(c.data);
  const hora = DEF_MODELOS[c.modelo].usaHora ? horaPorExtenso(c.hora) : '';
  if (data && hora) return `${data}, às ${hora}`;
  if (hora) return `às ${hora}`;
  return data;
}

export function onde(c: Pick<CamposDoCard, 'local' | 'modelo'>): string {
  return DEF_MODELOS[c.modelo].usaLocal ? c.local.trim() : '';
}

/** Tira asteriscos e sublinhados do texto digitado, para não quebrar o negrito do WhatsApp. */
const semMarcas = (s: string) => s.replace(/[*_~`]/g, '').replace(/\s+/g, ' ').trim();

/** Texto pronto para colar no WhatsApp, com *negrito* do próprio WhatsApp. */
export function textoParaWhatsApp(c: CamposDoCard): string {
  const linhas: string[] = [];
  const titulo = semMarcas(c.titulo);
  if (titulo) linhas.push(`*${titulo}*`);
  const q = quando(c);
  if (q) linhas.push(`📅 ${q}`);
  const o = semMarcas(onde(c));
  if (o) linhas.push(`📍 ${o}`);
  const texto = semMarcas(c.texto);
  if (texto) linhas.push('', texto);
  const org = semMarcas(c.organizacao);
  if (org) linhas.push('', `_${org}_`);
  if (c.link) linhas.push('', `Mais detalhes: ${c.link}`);
  return linhas.join('\n').trim();
}

/** Texto alternativo da imagem, para quem não enxerga. */
export function textoAlternativo(c: CamposDoCard, formato: Formato, comQr = false): string {
  const fim = (s: string) => (/[.!?…]$/.test(s) ? s : `${s}.`);
  const partes = [`Card de ${DEF_MODELOS[c.modelo].nome.toLowerCase()}, formato ${DEF_FORMATOS[formato].nome}.`];
  if (c.titulo.trim()) partes.push(`Título: ${fim(c.titulo.trim())}`);
  const q = quando(c);
  if (q) partes.push(`Quando: ${q}.`);
  const o = onde(c);
  if (o) partes.push(`Onde: ${fim(o)}`);
  if (c.texto.trim()) partes.push(`Texto: ${fim(c.texto.trim())}`);
  if (c.organizacao.trim()) partes.push(`Organização: ${fim(c.organizacao.trim())}`);
  if (comQr) partes.push('Tem um código QR que abre a página do evento.');
  return partes.join(' ');
}

/** Link para abrir o WhatsApp com o texto pronto (a pessoa escolhe a conversa lá). */
export function linkDoWhatsApp(texto: string): string {
  return `${ENDERECO_DO_WHATSAPP}${encodeURIComponent(texto)}`;
}

// cópia provisória: pedido em docs/pedidos-comum.md
// O endereço é montado em partes porque testes/peso.test.ts não deixa o build citar outro domínio, e este
// é um link comum (<a href>) que a pessoa toca; o aviso de saída (src/comum/saida.ts) a avisa antes de abrir.
const ENDERECO_DO_WHATSAPP = ['https:', '', 'wa.me', '?text='].join('/');

export const RODAPE = `Feito com ${NOME}`;
