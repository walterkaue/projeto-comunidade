// Moderação: tira do ar um link de evento denunciado.
// Uso: npm run bloquear -- "https://…/#/evento/…"
// Grava em public/bloqueados.json só impressões (SHA-256), nunca o conteúdo:
// - a dos dados do link como vieram;
// - a da forma canônica do evento (src/ferramentas/evento/formato.ts, dadosCanonicos), para que trocar um
//   caractere do link (marca, espaço no JSON, bits soltos no base64) não traga o evento de volta.
// A conta é a mesma de src/comum/entreTelas.ts (impressaoDoLink); o teste confere que batem.
// Depois: commit e push. A página do evento passa a mostrar "Este link foi removido após denúncia".

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ARQUIVO = fileURLToPath(new URL('../public/bloqueados.json', import.meta.url));
const FORMATO = fileURLToPath(new URL('../src/ferramentas/evento/formato.ts', import.meta.url));
const MARCA = '#/evento/';

export function dadosDoLink(link) {
  const i = link.indexOf(MARCA);
  return i < 0 ? '' : link.slice(i + MARCA.length).trim();
}

export const impressao = (dados) => createHash('sha256').update(dados).digest('hex');

/** Impressões a bloquear para estes dados: a do link e, se o evento puder ser lido, a da forma canônica. */
export async function impressoesDosDados(dados) {
  const { runnerImport } = await import('vite');
  const { module: formato } = await runnerImport(FORMATO);
  const lidas = new Set([impressao(dados)]);
  const leitura = await formato.decodificar(dados);
  if (leitura.ok) lidas.add(impressao(formato.dadosCanonicos(leitura.evento)));
  return { impressoes: [...lidas], leuOEvento: leitura.ok };
}

async function bloquear(link) {
  const dados = dadosDoLink(link);
  if (!dados) {
    console.error('Isso não parece um link de evento (falta "#/evento/").');
    process.exit(1);
  }
  const { impressoes, leuOEvento } = await impressoesDosDados(dados);
  if (!leuOEvento) console.log('Aviso: o evento não pôde ser lido; bloqueio só deste link exato.');
  const lista = JSON.parse(readFileSync(ARQUIVO, 'utf8'));
  const novas = impressoes.filter((i) => !lista.bloqueados.includes(i));
  if (novas.length === 0) {
    console.log('Esse link já estava bloqueado.');
    return;
  }
  lista.bloqueados.push(...novas);
  writeFileSync(ARQUIVO, JSON.stringify(lista, null, 2) + '\n');
  console.log(`Bloqueado (${novas.length} impressão(ões)). Agora faça commit e push.`);
}

const executadoDireto = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (executadoDireto && process.argv[2]) await bloquear(process.argv[2]);
