// Junta .saidas/g3-tentativas.jsonl (uma linha por rodada) em g3-tentativas.json e imprime as tabelas.
// Uso: node e2e/simulacoes/b-quem-recebe/g3-resumir.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pasta = fileURLToPath(new URL('./.saidas/', import.meta.url));
const linhas = readFileSync(`${pasta}g3-tentativas.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const por = new Map();
for (const r of linhas) {
  if (!por.has(r.id)) por.set(r.id, []);
  por.get(r.id).push(r);
}
const CAMPOS = ['titulo', 'organizacao', 'texto', 'local'];
const motivo = (m) => {
  const x = (m || '').toLowerCase();
  if (!x) return '';
  if (x.includes('telefone, e-mail')) return 'contato';
  if (x.includes('link ou endereço')) return 'link';
  // Mensagens antigas e as de 06/11/2026 (correção B-08 a B-10, D2 e WCAG 3.3.3).
  if (['chave pix', 'palavra pix', 'palavra picpay', 'pagamento, chave', 'pedido de pagamento', 'código ou chave'].some((k) => x.includes(k))) return 'pix';
  if (['dizer que é do site', 'nome deste site', 'aviso do site'].some((k) => x.includes(k))) return 'plataforma';
  if (['senha, dados de cartão', 'senha, cartão'].some((k) => x.includes(k))) return 'dados';
  if (['sinais < e >', 'sinais de menor', 'códigos com &'].some((k) => x.includes(k))) return 'html';
  if (x.includes('preencha') || x.includes('escreva o')) return 'vazio';
  return x.slice(0, 40);
};
const celF = (r, c) => {
  const f = r.fluxo?.[c];
  return f ? (f.barrou ? `B:${motivo(f.mensagem)}` : 'passa') : '?';
};
const celM = (r, c) => {
  const f = r.mao?.[c];
  if (!f) return '?';
  return f.estado === 'abriu' ? 'passa' : f.estado === 'barrou' ? 'B' : f.estado;
};
const tudo = [];
for (const [id, rs] of por) {
  const a = rs[0];
  const sig = (r) => CAMPOS.map((c) => celF(r, c) + '|' + celM(r, c)).join(';');
  const igual = rs.every((r) => sig(r) === sig(a));
  const exibidoIgual = rs.every((r) => JSON.stringify(r.mao) === JSON.stringify(a.mao));
  tudo.push({ id, grupo: a.grupo, papel: a.papel, texto: a.texto, rodadas: rs.length, reproduziu: igual && exibidoIgual, fluxo: a.fluxo, mao: a.mao, erroDoTeste: rs.map((r) => r.erroDoTeste).filter(Boolean) });
}
writeFileSync(`${pasta}g3-tentativas.json`, JSON.stringify(tudo, null, 2));
const esc = (s) => s.replace(/\|/g, '\\|').replace(/\n/g, '\\n');
const vis = (s) => Array.from(s).map((c) => (/[\p{Cf}\p{Cc}⠀ㅤ  ]/u.test(c) ? `\\u{${c.codePointAt(0).toString(16)}}` : c)).join('');
for (const papel of ['golpe', 'honesto']) {
  console.log(`\n### ${papel}\n`);
  console.log('| id | texto | fluxo tit/org/txt/local | mão tit/org/desc/local | rep |');
  console.log('|---|---|---|---|---|');
  for (const t of tudo.filter((x) => x.papel === papel)) {
    const f = CAMPOS.map((c) => celF(t, c)).join(' / ');
    const m = CAMPOS.map((c) => celM(t, c)).join(' / ');
    console.log(`| ${t.id} | ${esc(vis(t.texto))} | ${f} | ${m} | ${t.reproduziu ? 'sim' : 'NAO'}${t.erroDoTeste.length ? ' ERRO' : ''} |`);
  }
}
