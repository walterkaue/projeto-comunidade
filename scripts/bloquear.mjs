// Moderação: tira do ar um link de evento denunciado.
// Uso: npm run bloquear -- "https://…/#/evento/…"
// Grava em public/bloqueados.json só a impressão (SHA-256) dos dados do link, nunca o conteúdo.
// A mesma conta está em src/comum/entreTelas.ts (impressaoDoLink); o teste confere que batem.
// Depois: commit e push. A página do evento passa a mostrar "Este link foi removido após denúncia".

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ARQUIVO = fileURLToPath(new URL('../public/bloqueados.json', import.meta.url));
const MARCA = '#/evento/';

export function dadosDoLink(link) {
  const i = link.indexOf(MARCA);
  return i < 0 ? '' : link.slice(i + MARCA.length).trim();
}

export const impressao = (dados) => createHash('sha256').update(dados).digest('hex');

const link = process.argv[2] ?? '';
if (link) {
  const dados = dadosDoLink(link);
  if (!dados) {
    console.error('Isso não parece um link de evento (falta "#/evento/").');
    process.exit(1);
  }
  const lista = JSON.parse(readFileSync(ARQUIVO, 'utf8'));
  const imp = impressao(dados);
  if (lista.bloqueados.includes(imp)) {
    console.log('Esse link já estava bloqueado.');
  } else {
    lista.bloqueados.push(imp);
    writeFileSync(ARQUIVO, JSON.stringify(lista, null, 2) + '\n');
    console.log(`Bloqueado (${imp.slice(0, 12)}…). Agora faça commit e push.`);
  }
}
