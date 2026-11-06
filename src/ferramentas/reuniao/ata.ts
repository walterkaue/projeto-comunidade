// Ata da reunião (puro, sem DOM): modelo, texto para copiar e HTML para imprimir.
// A ata nunca vira link e nunca é guardada no aparelho (ver rascunho.ts).

import { esc } from '../../comum/html';
import { pautaPreenchida } from './convocacao';
import { dataCurta, dataPorExtenso, horaEmTexto, umaLinha } from './data';

export interface Ponto {
  titulo: string;
  discutido: string;
  decidido: string;
}

export interface Encaminhamento {
  oque: string;
  quem: string;
  /** AAAA-MM-DD */
  ate: string;
}

export interface Ata {
  organizacao: string;
  data: string;
  local: string;
  inicio: string;
  fim: string;
  /** Um nome por linha. */
  presentes: string;
  pontos: Ponto[];
  encaminhamentos: Encaminhamento[];
}

export const AVISO_DO_MODELO = 'Esta ata é um modelo. Ela não substitui o que o estatuto da organização exige.';

/** Rodapé de cada página do PDF (reuniao.css, @page @bottom-center: o texto lá precisa ser igual). */
export const RODAPE_DO_PDF = 'Modelo de ata gratuito. Não substitui o que o estatuto da organização exige.';

/**
 * Perto de "Copiar o texto" (auditoria de segurança, B9): no Windows e em alguns teclados de celular, o que se copia
 * fica guardado e pode ir para a nuvem. A ata tem a lista de presença.
 */
export const AVISO_AO_COPIAR_A_ATA = 'O texto copiado pode ficar no histórico da área de transferência do aparelho.';

export const MAXIMOS = { pontos: 30, encaminhamentos: 30, presentes: 6000, texto: 3000 } as const;

export const pontoVazio = (titulo = ''): Ponto => ({ titulo, discutido: '', decidido: '' });
export const encaminhamentoVazio = (): Encaminhamento => ({ oque: '', quem: '', ate: '' });

export function ataVazia(): Ata {
  return { organizacao: '', data: '', local: '', inicio: '', fim: '', presentes: '', pontos: [pontoVazio()], encaminhamentos: [] };
}

/** Pontos da ata a partir da pauta da convocação (só os itens preenchidos). */
export function pontosDaPauta(pauta: readonly string[]): Ponto[] {
  return pautaPreenchida(pauta).map((t) => pontoVazio(t));
}

/** Nomes dos presentes: um por linha, sem linhas vazias. Nomes iguais ficam (podem ser pessoas diferentes). */
export function listaDePresentes(presentes: string): string[] {
  return presentes.split(/\r?\n/).map(umaLinha).filter(Boolean);
}

/** Há alguma coisa digitada? Serve para o aviso de saída e para o botão Apagar. */
export function temConteudo(a: Ata): boolean {
  const base = [a.organizacao, a.data, a.local, a.inicio, a.fim, a.presentes];
  return (
    base.some((v) => v.trim() !== '') ||
    a.pontos.some((p) => p.titulo.trim() || p.discutido.trim() || p.decidido.trim()) ||
    a.encaminhamentos.some((e) => e.oque.trim() || e.quem.trim() || e.ate.trim())
  );
}

export interface FaltaDaAta {
  campo: 'organizacao' | 'data';
  mensagem: string;
}

/** O mínimo para gerar a ata. O resto é opcional. */
export function faltasDaAta(a: Ata): FaltaDaAta[] {
  const f: FaltaDaAta[] = [];
  if (!umaLinha(a.organizacao)) f.push({ campo: 'organizacao', mensagem: 'escreva o nome da organização.' });
  if (!dataPorExtenso(a.data)) f.push({ campo: 'data', mensagem: 'escolha a data da reunião.' });
  return f;
}

/** A ata já limpa: só o que foi preenchido, pronta para virar texto e HTML. */
export interface AtaLimpa {
  organizacao: string;
  data: string;
  local: string;
  horario: string;
  presentes: string[];
  pontos: { numero: number; titulo: string; discutido: string; decidido: string }[];
  encaminhamentos: { oque: string; quem: string; ate: string }[];
}

const paragrafos = (s: string) =>
  s
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');

export function limparAta(a: Ata): AtaLimpa {
  const inicio = horaEmTexto(a.inicio);
  const fim = horaEmTexto(a.fim);
  const horario = inicio && fim ? `${inicio} às ${fim}` : inicio ? `início às ${inicio}` : fim ? `término às ${fim}` : '';
  return {
    organizacao: umaLinha(a.organizacao),
    data: dataPorExtenso(a.data),
    local: umaLinha(a.local),
    horario,
    presentes: listaDePresentes(a.presentes),
    pontos: a.pontos
      .filter((p) => umaLinha(p.titulo) || p.discutido.trim() || p.decidido.trim())
      .map((p, i) => ({
        numero: i + 1,
        titulo: umaLinha(p.titulo) || `Ponto ${i + 1}`,
        discutido: paragrafos(p.discutido),
        decidido: paragrafos(p.decidido),
      })),
    encaminhamentos: a.encaminhamentos
      .filter((e) => umaLinha(e.oque) || umaLinha(e.quem) || dataCurta(e.ate))
      .map((e) => ({ oque: umaLinha(e.oque) || '(sem descrição)', quem: umaLinha(e.quem), ate: dataCurta(e.ate) })),
  };
}

/** Texto simples da ata, para copiar e colar. */
export function textoDaAta(a: Ata): string {
  const l = limparAta(a);
  const s: string[] = ['ATA DE REUNIÃO', l.organizacao, ''];
  s.push(`Data: ${l.data}`);
  if (l.local) s.push(`Local: ${l.local}`);
  if (l.horario) s.push(`Horário: ${l.horario}`);
  if (l.presentes.length) s.push('', `PRESENTES (${l.presentes.length})`, ...l.presentes.map((n) => `- ${n}`));
  if (l.pontos.length) {
    s.push('', 'PAUTA E DECISÕES');
    for (const p of l.pontos) {
      s.push('', `${p.numero}. ${p.titulo}`);
      if (p.discutido) s.push(`Discutido: ${p.discutido}`);
      if (p.decidido) s.push(`Decidido: ${p.decidido}`);
    }
  }
  if (l.encaminhamentos.length) {
    s.push('', 'ENCAMINHAMENTOS');
    for (const e of l.encaminhamentos) {
      s.push(`- ${e.oque}${e.quem ? ` | Quem: ${e.quem}` : ''}${e.ate ? ` | Até: ${e.ate}` : ''}`);
    }
  }
  s.push('', AVISO_DO_MODELO);
  return s.join('\n');
}

const emParagrafos = (s: string) =>
  s
    .split('\n')
    .map((p) => `<p>${esc(p)}</p>`)
    .join('');

/** HTML da ata para a tela e para a impressão. Todo texto passa por esc. */
export function htmlDaAta(a: Ata): string {
  const l = limparAta(a);
  const dados = (
    [
      ['Data', l.data],
      ['Local', l.local],
      ['Horário', l.horario],
    ] as const
  )
    .filter(([, v]) => v)
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
    .join('');
  const presentes = l.presentes.length
    ? `<section class="ata-bloco"><h3>Presentes (${l.presentes.length})</h3><ul>${l.presentes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></section>`
    : '';
  const pontos = l.pontos.length
    ? `<section class="ata-bloco"><h3>Pauta e decisões</h3>${l.pontos
        .map(
          (p) =>
            `<article class="ata-ponto"><h4>${p.numero}. ${esc(p.titulo)}</h4>${
              p.discutido ? `<div class="ata-trecho"><strong>Discutido</strong>${emParagrafos(p.discutido)}</div>` : ''
            }${p.decidido ? `<div class="ata-trecho"><strong>Decidido</strong>${emParagrafos(p.decidido)}</div>` : ''}</article>`,
        )
        .join('')}</section>`
    : '';
  const enc = l.encaminhamentos.length
    ? `<section class="ata-bloco"><h3>Encaminhamentos</h3><table><thead><tr><th scope="col">O quê</th><th scope="col">Quem</th><th scope="col">Até quando</th></tr></thead><tbody>${l.encaminhamentos
        .map((e) => `<tr><td>${esc(e.oque)}</td><td>${esc(e.quem)}</td><td>${esc(e.ate)}</td></tr>`)
        .join('')}</tbody></table></section>`
    : '';
  return `<header><p class="ata-tipo">Ata de reunião</p><h3 class="ata-org">${esc(l.organizacao)}</h3><dl class="ata-dados">${dados}</dl></header>${presentes}${pontos}${enc}<p class="ata-aviso">${esc(AVISO_DO_MODELO)}</p>`;
}
