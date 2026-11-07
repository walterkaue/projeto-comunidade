// Apoio dos testes do fluxo: os campos dos passos 1 e 2 começam vazios (o exemplo é só o texto em cinza dentro do
// campo), então cada teste precisa preencher. Aqui ficam os dados de teste e os passos de preencher.

import { expect, type Page } from '@playwright/test';
import type { Porta } from './apoio';

/** Organização fictícia e neutra. */
export const ORGANIZACAO_DE_TESTE = 'Associação de Moradores Jardim das Acácias';

/** O que a "pessoa" escreve nos testes. Nada aqui é igual a um exemplo do rodízio. */
export const DADOS = {
  titulo: 'Mutirão da horta nova',
  organizacao: ORGANIZACAO_DE_TESTE,
  texto: 'Traga uma cadeira e um prato',
  pauta: 'Contas do ano\nCalendário de visitas',
  dia: '14/11/2026',
  /** O mesmo dia no campo de calendário (type="date" guarda AAAA-MM-DD). */
  diaIso: '2026-11-14',
  hora: '18:30',
  local: 'Salão da associação, Rua dos Ipês, 12',
} as const;

export interface Quais {
  /** Escrever a organização (opcional no fluxo). Padrão: sim. */
  organizacao?: boolean;
  /** Escrever o texto curto (opcional; não existe na reunião). Padrão: sim. */
  texto?: boolean;
}

/** Passo 1: escreve título, organização e texto (ou pauta, na reunião). */
export async function preencherPasso1(page: Page, porta: Pick<Porta, 'tipo'>, quais: Quais = {}): Promise<void> {
  await page.locator('#fluxo-titulo').fill(DADOS.titulo);
  if (quais.organizacao !== false) await page.locator('#fluxo-organizacao').fill(DADOS.organizacao);
  if (porta.tipo === 'reuniao') await page.locator('#fluxo-pauta').fill(DADOS.pauta);
  else if (quais.texto !== false) await page.locator('#fluxo-texto').fill(DADOS.texto);
}

/** Escreve o dia: no campo de calendário vai AAAA-MM-DD; no campo de texto de reserva, dd/mm/aaaa. */
export async function preencherDia(page: Page): Promise<void> {
  const campo = page.locator('#fluxo-data');
  const calendario = (await campo.getAttribute('type')) === 'date';
  await campo.fill(calendario ? DADOS.diaIso : DADOS.dia);
}

/** Passo 2: dia, hora e local (só reunião e evento; aviso, conquista e agradecimento não precisam de nada). */
export async function preencherPasso2(page: Page, porta: Pick<Porta, 'agenda'>): Promise<void> {
  if (!porta.agenda) return;
  await preencherDia(page);
  await page.locator('#fluxo-hora').fill(DADOS.hora);
  await page.locator('#fluxo-local').fill(DADOS.local);
}

/** Só os obrigatórios que ainda estão vazios (o que `irAteOPronto` faz sozinho). Não mexe no que a pessoa já escreveu. */
export async function preencherObrigatoriosVazios(page: Page, porta: Pick<Porta, 'tipo' | 'agenda'>, passo: 1 | 2): Promise<void> {
  const seVazio = async (id: string, valor: string): Promise<void> => {
    const campo = page.locator(id);
    if ((await campo.count()) && (await campo.inputValue()) === '') await campo.fill(valor);
  };
  if (passo === 1) {
    await seVazio('#fluxo-titulo', DADOS.titulo);
    if (porta.tipo === 'reuniao') await seVazio('#fluxo-pauta', DADOS.pauta);
  } else if (porta.agenda) {
    await seVazio('#fluxo-data', DADOS.diaIso);
    await seVazio('#fluxo-hora', DADOS.hora);
    await seVazio('#fluxo-local', DADOS.local);
  }
}

/** Os exemplos que os campos da tela mostram em cinza (sem o "Ex.:"), uma linha por item. */
export async function exemplosDosCampos(page: Page, ids: readonly string[]): Promise<string[]> {
  const todos: string[] = [];
  for (const id of ids) {
    const p = await page.locator(id).getAttribute('placeholder');
    expect(p, `${id} tem placeholder`).toMatch(/^Ex\.: ./);
    todos.push(...p!.replace(/^Ex\.:\s*/, '').split('\n').map((l) => l.trim()).filter(Boolean));
  }
  return todos;
}

/** Os campos do passo 1 que têm exemplo em cinza, para a porta. */
export const camposDoPasso1 = (porta: Pick<Porta, 'tipo'>): string[] => [
  '#fluxo-titulo',
  '#fluxo-organizacao',
  porta.tipo === 'reuniao' ? '#fluxo-pauta' : '#fluxo-texto',
];
