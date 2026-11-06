// Imprime a varredura (.saidas/g3-varredura.json) como tabela. Uso: node e2e/simulacoes/b-quem-recebe/g3-tabela.mjs [golpe|honesto]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('./.saidas/', import.meta.url));
const v = JSON.parse(readFileSync(`${dir}g3-varredura.json`, 'utf8'));
const C = ['titulo', 'organizacao', 'texto', 'local'];
const motivo = (m) => {
  const x = (m || '').toLowerCase();
  if (!x) return '';
  if (x.includes('telefone, e-mail')) return 'contato';
  if (x.includes('link ou endereço')) return 'link';
  if (x.includes('chave pix')) return 'pix';
  if (x.includes('dizer que é do site')) return 'plataforma';
  if (x.includes('senha, dados de cartão')) return 'dados';
  if (x.includes('sinais < e >')) return 'html';
  if (x.includes('preencha') || x.includes('escreva o')) return 'vazio';
  return x.slice(0, 30);
};
const vis = (s) => Array.from(s).map((c) => (c.codePointAt(0) > 126 && !/[p{L}p{N}p{P}p{S}]/u.test(c) || c.codePointAt(0) < 32 ? "<U+" + c.codePointAt(0).toString(16) + ">" : c)).join("");
const papel = process.argv[2];
for (const t of v.filter((x) => !papel || x.papel === papel)) {
  const f = C.map((c) => (t.fluxo[c].barrou ? motivo(t.fluxo[c].mensagem) : '-')).join('/');
  const m = C.map((c) => (t.mao[c].estado === 'abriu' ? '-' : 'B')).join('');
  console.log(`${t.id.padEnd(30)} F:${f.padEnd(36)} M:${m}  ${vis(t.texto).slice(0, 55)}`);
}
