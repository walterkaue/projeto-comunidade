// Moderação: tira do ar um link de evento denunciado.
// Uso: grave o link num arquivo de texto FORA do git e rode
//   npm run bloquear -- --arquivo <caminho-do-arquivo> --motivo regra-<número>   (acrescente --forcar, se precisar)
//   npm run bloquear -- --arquivo <caminho-do-arquivo> --motivo pedido           (a pedido de quem criou o link)
// O número é o da regra em src/comum/regras.ts. O motivo aparece na tela do link removido (auditoria
// 05/11/2026, M7 e M8).
// O link NUNCA vai na linha de comando: ele vem do e-mail de uma pessoa desconhecida, e o shell (Bash ou
// PowerShell) executaria um "$(…)" escondido nele antes de este script ler o texto
// (docs/auditoria/2026-11-05/seguranca.md, achado A1). O arquivo pode ter o link quebrado em linhas pelo
// e-mail e o link de "editar/". Os dados precisam ter só letras sem acento, números, "-" e "_"; com qualquer
// outro sinal, o script para sem gravar.
// Se o evento não puder ser lido, o script PARA sem gravar (o bloqueio não pegaria): confira o link. Para gravar
// mesmo assim só a impressão do link exato, use --forcar.
// Grava em public/bloqueados.json só impressões (SHA-256) e o motivo, nunca o conteúdo:
// - a dos dados do link como vieram;
// - a da forma canônica do evento (src/ferramentas/evento/formato.ts, dadosCanonicos), para que escrever o
//   mesmo evento de outro jeito (marca, espaço no JSON, bits soltos no base64) não o traga de volta.
// A conta é a mesma de src/comum/entreTelas.ts (impressaoDoLink); o teste confere que batem.
// Depois: commit e push. A página do evento passa a mostrar que o link foi removido, com o motivo.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ARQUIVO = fileURLToPath(new URL('../public/bloqueados.json', import.meta.url));
const FORMATO = fileURLToPath(new URL('../src/ferramentas/evento/formato.ts', import.meta.url));
const REGRAS = fileURLToPath(new URL('../src/comum/regras.ts', import.meta.url));
const MARCA = '#/evento/';

/** Formato dos dados de um link de evento (base64url; o mesmo de ehLinkDoEvento em src/comum/entreTelas.ts). */
export const FORMATO_DOS_DADOS = /^[A-Za-z0-9_-]{3,6000}$/;

export const USO =
  'Uso: grave o link num arquivo de texto fora do git e rode  npm run bloquear -- --arquivo <caminho> --motivo regra-<número>  (ou --motivo pedido, a pedido de quem criou)';

export function dadosDoLink(link) {
  // E-mail costuma quebrar link comprido em linhas: junta só as quebras de linha (e o espaço que vem junto).
  const junto = link.replace(/[ \t]*\r?\n[ \t]*/g, '');
  const i = junto.indexOf(MARCA);
  if (i < 0) return '';
  // Corta no primeiro sinal fora do formato dos dados (ponto, parêntese, espaço, "%20Obrigada!"), como o site.
  const resto = junto.slice(i + MARCA.length).replace(/^editar\//, '');
  return /^[A-Za-z0-9_-]*/.exec(resto)[0];
}

/** Os dados têm o formato de um link do site? Qualquer outro sinal ("$", "(", "'", ";") é recusado. */
export const dadosValidos = (dados) => FORMATO_DOS_DADOS.test(dados);

/** O motivo tem o formato certo? "regra-N" com N de 1 até o número de regras, ou "pedido". */
export function motivoValido(motivo, quantasRegras) {
  if (motivo === 'pedido') return true;
  const r = /^regra-([1-9]\d?)$/.exec(motivo ?? '');
  return Boolean(r) && Number(r[1]) <= quantasRegras;
}

/**
 * Lê os argumentos. O link só pode vir de arquivo (--arquivo <caminho>); qualquer outro texto solto conta
 * como "sobra" e faz o script parar, para ninguém voltar a pôr o link na linha de comando.
 */
export function lerArgumentos(argumentos) {
  const r = { arquivo: '', motivo: '', forcar: false, sobra: [] };
  for (let i = 0; i < argumentos.length; i++) {
    const a = argumentos[i];
    if (a === '--forcar') r.forcar = true;
    else if (a === '--arquivo') r.arquivo = argumentos[++i] ?? '';
    else if (a === '--motivo') r.motivo = argumentos[++i] ?? '';
    else r.sobra.push(a);
  }
  return r;
}

/**
 * A lista com as impressões novas, cada uma com o motivo ({ "h": impressão, "motivo": "regra-5" }). Itens
 * antigos (só a impressão, em texto) ficam como estão. Pura: não lê nem grava arquivo.
 */
export function novaLista(lista, impressoes, motivo) {
  const ja = new Set(
    lista.bloqueados
      .map((i) => (typeof i === 'string' ? i : i?.h))
      .filter((h) => typeof h === 'string')
      .map((h) => h.toLowerCase()),
  );
  const novas = impressoes.filter((i) => !ja.has(i.toLowerCase()));
  return { lista: { ...lista, bloqueados: [...lista.bloqueados, ...novas.map((h) => ({ h, motivo }))] }, novas: novas.length };
}

export const impressao = (dados) => createHash('sha256').update(dados).digest('hex');

/**
 * Impressões a bloquear para estes dados: a do link e, se o evento puder ser lido, a da forma canônica.
 * `quando` (data e hora de início, já validadas) serve para a pessoa conferir que é o evento certo; nenhum
 * texto livre do evento é mostrado.
 */
export async function impressoesDosDados(dados) {
  const { runnerImport } = await import('vite');
  const { module: formato } = await runnerImport(FORMATO);
  const lidas = new Set([impressao(dados)]);
  const leitura = await formato.decodificar(dados);
  if (leitura.ok) lidas.add(impressao(formato.dadosCanonicos(leitura.evento)));
  const quando = leitura.ok ? `${leitura.evento.data}, ${leitura.evento.inicio}` : '';
  return { impressoes: [...lidas], leuOEvento: leitura.ok, quando };
}

function parar(...linhas) {
  for (const l of linhas) console.error(l);
  process.exit(1);
}

async function bloquear(link, motivo, forcar) {
  const dados = dadosDoLink(link);
  if (!dados) parar('Isso não parece um link de evento (falta "#/evento/"). Nada foi gravado.');
  if (!dadosValidos(dados)) {
    parar(
      'Depois de "#/evento/", o link só pode ter letras sem acento, números, - e _.',
      'Este tem outros sinais, então não é um link do site. Nada foi gravado.',
      'Não use esse link em nenhum comando: ele pode ter sido montado para rodar algo no computador.',
    );
  }
  const { impressoes, leuOEvento, quando } = await impressoesDosDados(dados);
  if (!leuOEvento && !forcar) {
    parar(
      'O evento deste link não pôde ser lido, então o bloqueio não pegaria. Nada foi gravado.',
      'Confira se o link está inteiro. Para gravar mesmo assim só este link exato, use --forcar.',
    );
  }
  if (leuOEvento) console.log(`Evento lido: ${quando}. Confira se é a data e a hora do evento denunciado.`);
  else console.log('Aviso: o evento não pôde ser lido; bloqueio só deste link exato (--forcar).');
  const { lista, novas } = novaLista(JSON.parse(readFileSync(ARQUIVO, 'utf8')), impressoes, motivo);
  if (novas === 0) {
    console.log('Esse link já estava bloqueado.');
    return;
  }
  writeFileSync(ARQUIVO, JSON.stringify(lista, null, 2) + '\n');
  console.log(`Bloqueado (${novas} impressão(ões), motivo ${motivo}). Agora faça commit e push.`);
}

const executadoDireto = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (executadoDireto) {
  const { arquivo, motivo, forcar, sobra } = lerArgumentos(process.argv.slice(2));
  if (sobra.length) {
    parar('Por segurança, o link não vai na linha de comando (o shell pode executar parte dele).', USO);
  }
  if (!arquivo) parar(USO);
  const { runnerImport } = await import('vite');
  const { module: regras } = await runnerImport(REGRAS);
  const quantas = regras.REGRAS_DE_USO.length;
  if (!motivoValido(motivo, quantas)) {
    parar(`Diga o motivo: --motivo regra-<número> (1 a ${quantas}, src/comum/regras.ts) ou --motivo pedido. Nada foi gravado.`, USO);
  }
  let texto = '';
  try {
    texto = readFileSync(arquivo, 'utf8');
  } catch {
    parar(`Não deu para ler o arquivo "${arquivo}".`, USO);
  }
  await bloquear(texto, motivo, forcar);
}
