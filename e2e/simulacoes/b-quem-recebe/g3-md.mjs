// Gera as tabelas do relato a partir de .saidas/g3-varredura.json. Uso: node g3-md.mjs > tabelas.md
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const v = JSON.parse(readFileSync(fileURLToPath(new URL('./.saidas/g3-varredura.json', import.meta.url)), 'utf8'));
const C = ['titulo', 'organizacao', 'texto', 'local'];
const mot = (m) => { const x = (m || '').toLowerCase(); return x.includes('telefone, e-mail') ? 'contato' : x.includes('link ou endereço') ? 'link' : ['chave pix', 'palavra pix', 'pagamento, chave', 'pedido de pagamento', 'código ou chave'].some((k) => x.includes(k)) ? 'pix' : ['dizer que é do site', 'nome deste site', 'aviso do site'].some((k) => x.includes(k)) ? 'plataforma' : ['senha, dados', 'senha, cartão'].some((k) => x.includes(k)) ? 'dados' : x.includes('sinais <') ? 'html' : x.includes('preencha') ? 'vazio' : '?'; };
const vis = (s) => Array.from(s).map((c) => { const n = c.codePointAt(0); return (n < 32 || (n > 126 && !/[\p{L}\p{N}\p{P}\p{S}\p{M}]/u.test(c))) ? `‹U+${n.toString(16).toUpperCase()}›` : c; }).join('').replace(/\|/g, '\|').replace(/\n/g, '⏎');
const mostra = (t) => (t.mao.titulo.estado === 'abriu' ? 'abre: texto puro, sob a faixa' : t.mao.titulo.estado === 'barrou' ? 'tela "Não deu para abrir"' : '?');
for (const papel of ['golpe', 'honesto']) {
  console.log(`\n### ${papel === 'golpe' ? 'Golpista' : 'Texto honesto'}\n`);
  console.log('Fluxo: motivo da recusa em título / organização / texto / local ("-" = passa). Mão: link montado à mão, abre ou não, nos mesmos 4 campos (B = barrou).\n');
  console.log('| id | texto | fluxo | mão | quem recebe |\n|---|---|---|---|---|');
  for (const t of v.filter((x) => x.papel === papel)) {
    const f = C.map((c) => (t.fluxo[c].barrou ? mot(t.fluxo[c].mensagem) : '-'));
    const todosIguais = f.every((x) => x === f[0]);
    const m = C.map((c) => (t.mao[c].estado === 'abriu' ? '-' : 'B')).join('');
    const quem = f.every((x) => x !== '-') ? (papel === 'golpe' ? 'não chega' : 'não chega (falso positivo)') : f.every((x) => x === '-') ? 'abre' : 'abre só em alguns campos';
    console.log(`| ${t.id} | ${vis(t.texto)} | ${todosIguais ? f[0] + ' (4)' : f.join('/')} | ${m === 'BBBB' ? 'BBBB' : m === '----' ? 'passa' : m} | ${quem} |`);
  }
}
