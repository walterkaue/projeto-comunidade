// Gera pelo próprio fluxo (como quem cria faria) os links que a simulação B usa, com a organização trocada.
// Grava links.json nesta pasta: só os dados depois de "#/evento/" (o endereço muda com a porta).
// Rodar sozinho: npx playwright test --config e2e/simulacoes/b-quem-recebe/playwright.config.ts 00-links

import { writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { esperarOPronto, expect, linkNoTexto, mandar, PORTAS, test, titulo } from '../../apoio';
import { PASTA } from './aparelhos';
import { preencherDiaBr } from './dia-apoio';

interface Pedido {
  chave: string;
  tipo: 'reuniao' | 'evento';
  titulo: string;
  organizacao: string;
  /** Pauta (reunião, um item por linha) ou texto curto (evento). */
  corpo: string;
  data: string; // dd/mm/aaaa
  hora: string; // hh:mm
  local: string;
}

// Pauta longa no limite do fluxo: o passo 1 recusa mais de 400 letras no total.
const LONGA = [
  'Abertura e leitura da pauta',
  'Prestação de contas do semestre',
  'Reforma do salão: orçamentos recebidos',
  'Calendário de mutirões até o fim do ano',
  'Festa de fim de ano: comissão e data',
  'Horta comunitária: divisão dos canteiros',
  'Segurança na saída da escola à noite',
  'Iluminação da praça e pedido à prefeitura',
  'Eleição da nova coordenação',
  'Informes gerais',
  'Encerramento',
].join('\n');

export const PEDIDOS: Pedido[] = [
  { chave: 'reuniao-sindicato', tipo: 'reuniao', titulo: 'Assembleia da categoria', organizacao: 'Sindicato da categoria', corpo: 'Reajuste do ano\nPlano de saúde\nInformes', data: '21/11/2026', hora: '19:00', local: 'Salão da sede, Rua das Flores, 120, Centro' },
  { chave: 'reuniao-moradores', tipo: 'reuniao', titulo: 'Reunião da associação', organizacao: 'Associação de Moradores do bairro', corpo: 'Buracos da rua de baixo\nFesta junina\nInformes', data: '14/11/2026', hora: '19:30', local: 'Escola estadual do bairro, Rua 7, nº 1234' },
  { chave: 'reuniao-longa', tipo: 'reuniao', titulo: 'Assembleia geral ordinária', organizacao: 'Associação de Moradores do bairro', corpo: LONGA, data: '28/11/2026', hora: '19:00', local: 'Salão comunitário, Av. Central, 500, fundos' },
  { chave: 'evento-sp-19h', tipo: 'evento', titulo: 'Sarau na praça', organizacao: 'Coletivo cultural do bairro', corpo: 'Música, poesia e roda de conversa. Traga sua cadeira.', data: '21/11/2026', hora: '19:00', local: 'Praça da Matriz, São Paulo, SP' },
  { chave: 'evento-mutirao', tipo: 'evento', titulo: 'Mutirão de limpeza do córrego', organizacao: 'Grupo da horta comunitária', corpo: 'Leve luva e garrafa de água. Saída em frente à padaria.', data: '15/11/2026', hora: '08:00', local: 'Rua do Córrego, 45' },
  { chave: 'evento-bazar', tipo: 'evento', titulo: 'Bazar beneficente', organizacao: 'Grupo de mães da escola', corpo: 'Roupas, livros e brinquedos a preço baixo.', data: '22/11/2026', hora: '09:00', local: 'Pátio da escola municipal, Rua da Paz, 300' },
];

/** Toca em Continuar e espera o passo seguinte; se um campo for recusado, falha com a mensagem dele. */
async function continuar(page: Page, botao: string, proximo: string, p: Pedido): Promise<void> {
  await page.getByRole('button', { name: botao }).click();
  await page.waitForTimeout(300);
  // Texto que cita órgão público (a pauta longa fala em "prefeitura") abre o painel do órgão: "Seguir assim" continua.
  const orgao = page.locator('dialog#fluxo-orgao');
  if (await orgao.isVisible()) await orgao.getByRole('button', { name: 'Seguir assim' }).click();
  const erros =await page.locator('.campo-erro:not([hidden])').allInnerTexts();
  if (erros.length) throw new Error(`${p.chave}: recusado no fluxo: ${erros.join(' | ')}`);
  await expect(titulo(page)).toContainText(proximo);
}

async function preencher(page: Page, p: Pedido): Promise<string> {
  await page.goto('./');
  await expect(titulo(page)).toHaveText('O que você quer fazer?');
  const porta = PORTAS.find((x) => x.tipo === p.tipo)!;
  await page.getByRole('link', { name: new RegExp(porta.verbo) }).click();
  await expect(titulo(page)).toContainText('Passo 1 de 3');
  await page.locator('#fluxo-titulo').fill(p.titulo);
  await page.locator('#fluxo-organizacao').fill(p.organizacao);
  await page.locator(p.tipo === 'reuniao' ? '#fluxo-pauta' : '#fluxo-texto').fill(p.corpo);
  await continuar(page, 'Continuar', 'Passo 2 de 3', p);
  await preencherDiaBr(page, p.data);
  await page.locator('#fluxo-hora').fill(p.hora);
  await page.locator('#fluxo-local').fill(p.local);
  await continuar(page, 'Continuar', 'Passo 3 de 3', p);
  await page.getByRole('button', { name: 'Ficou bom' }).click();
  await esperarOPronto(page, porta);
  const texto = await mandar(page);
  const link = linkNoTexto(texto);
  expect(link, `link de ${p.chave}`).toMatch(/#\/evento\/[A-Za-z0-9_-]+$/);
  return link;
}

test('gera os links da simulação B pelo fluxo', async ({ page }) => {
  const saida: Record<string, { tipo: string; titulo: string; organizacao: string; data: string; hora: string; local: string; dados: string; caracteresDoLink: number }> = {};
  for (const p of PEDIDOS) {
    const link = await preencher(page, p);
    const dados = link.slice(link.indexOf('#/evento/') + '#/evento/'.length);
    saida[p.chave] = { tipo: p.tipo, titulo: p.titulo, organizacao: p.organizacao, data: p.data, hora: p.hora, local: p.local, dados, caracteresDoLink: link.length };
  }
  writeFileSync(`${PASTA}links.json`, JSON.stringify(saida, null, 2) + '\n');
});
