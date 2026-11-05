// Moderação: tira do ar um link de evento denunciado.
// Uso: npm run bloquear -- "https://…/#/evento/…"   (aceita também o link de "editar/" e link quebrado em linhas)
// Se o evento não puder ser lido, o script PARA sem gravar (o bloqueio não pegaria): confira o link. Para gravar
// mesmo assim só a impressão do link exato, use --forcar.
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
  // E-mail costuma quebrar link comprido em linhas: junta tudo antes de ler.
  const junto = link.replace(/\s+/g, '');
  const i = junto.indexOf(MARCA);
  if (i < 0) return '';
  return junto.slice(i + MARCA.length).replace(/^editar\//, '');
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

async function bloquear(link, forcar) {
  const dados = dadosDoLink(link);
  if (!dados) {
    console.error('Isso não parece um link de evento (falta "#/evento/").');
    process.exit(1);
  }
  const { impressoes, leuOEvento } = await impressoesDosDados(dados);
  if (!leuOEvento && !forcar) {
    console.error('O evento deste link não pôde ser lido, então o bloqueio não pegaria. Nada foi gravado.');
    console.error('Confira se o link está inteiro. Para gravar mesmo assim só este link exato, use --forcar.');
    process.exit(1);
  }
  if (!leuOEvento) console.log('Aviso: o evento não pôde ser lido; bloqueio só deste link exato (--forcar).');
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
const argumentos = process.argv.slice(2);
const link = argumentos.filter((a) => a !== '--forcar').join('');
if (executadoDireto && link) await bloquear(link, argumentos.includes('--forcar'));
