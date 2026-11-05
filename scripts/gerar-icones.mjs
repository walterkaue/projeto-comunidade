// Gera os ícones PNG do app (PWA) e a imagem de prévia (og.png) a partir do desenho do favicon, com o Chrome sem janela.
// Uso: node scripts/gerar-icones.mjs   (rode de novo só se o favicon mudar; os PNGs vão no commit)
// Precisa do Chrome ou do Edge instalados. Caminho diferente: CHROME=/caminho/do/chrome node scripts/gerar-icones.mjs
// Dica: rode `npm run fontes` antes, a imagem de prévia usa a fonte gerada.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DESTINO = join(RAIZ, 'public', 'icones');

const CHROMES = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = CHROMES.find((c) => existsSync(c));
if (!chrome) throw new Error('Chrome não encontrado. Defina CHROME=/caminho/do/chrome.');

// O desenho do favicon: fundo grafite e três círculos brancos (um grupo de pessoas).
// Só muda a moldura de cada ícone.
const favicon = readFileSync(join(RAIZ, 'public', 'favicon.svg'), 'utf8');
const miolo = favicon.match(/<circle[\s\S]*<\/svg>/)[0].replace('</svg>', '');
const COR = favicon.match(/fill="(#[0-9a-f]{6})"/i)[1];

/** canto arredondado (ícone comum) ou quadrado cheio (iPhone e "maskable", que o sistema recorta). */
const svg = ({ cantos, escala }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
  `<rect width="64" height="64" ${cantos ? 'rx="14"' : ''} fill="${COR}"/>` +
  `<g transform="translate(32 32) scale(${escala}) translate(-32 -32)">${miolo}</g></svg>`;

const ICONES = [
  { nome: 'icone-192.png', lado: 192, cantos: true, escala: 1 },
  { nome: 'icone-512.png', lado: 512, cantos: true, escala: 1 },
  // "maskable": o Android recorta em círculo ou gota; o desenho fica dentro da zona segura (80% do centro).
  { nome: 'icone-maskable-512.png', lado: 512, cantos: false, escala: 0.8 },
  // iPhone: quadrado cheio, sem transparência; o sistema arredonda os cantos.
  { nome: 'apple-touch-icon.png', lado: 180, cantos: false, escala: 0.9 },
];

const dado = (f) => 'data:font/woff2;base64,' + readFileSync(join(RAIZ, 'src', 'comum', 'fontes', f)).toString('base64');
const FONTE_700 = dado('atkinson-700.woff2');
const FONTE_400 = dado('atkinson-400.woff2');

// Imagem de prévia do WhatsApp e redes (1200×630, bem abaixo de 300 KB).
const og = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:A;font-weight:700;src:url('${FONTE_700}')}
@font-face{font-family:A;font-weight:400;src:url('${FONTE_400}')}
html,body{margin:0;width:1200px;height:630px;background:#fbfaf7;font-family:A,system-ui,sans-serif;color:#1d232a}
.c{box-sizing:border-box;width:1200px;height:630px;padding:0 90px;display:flex;align-items:center;gap:64px;border-bottom:18px solid #1d232a}
.i{width:240px;height:240px;flex:none}
h1{margin:0;font-size:96px;line-height:1.05;font-weight:700}
p{margin:20px 0 0;font-size:38px;line-height:1.25;font-weight:400}
</style></head><body><div class="c">
<img class="i" src="data:image/svg+xml;base64,${Buffer.from(svg({ cantos: true, escala: 1 })).toString('base64')}">
<div><h1>Projeto Comunidade</h1><p>Ferramentas gratuitas para a comunidade</p></div>
</div></body></html>`;

function capturar(htmlTexto, nomeHtml, saida, largura, altura, extra = []) {
  const html = join(tmp, nomeHtml);
  writeFileSync(html, htmlTexto);
  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--default-background-color=00000000',
    ...extra,
    `--window-size=${largura},${altura}`,
    `--screenshot=${saida}`,
    `file:///${html.replace(/\\/g, '/')}`,
  ], { stdio: 'ignore' });
}

mkdirSync(DESTINO, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'icones-'));
try {
  for (const i of ICONES) {
    const pagina =
      `<!doctype html><html><body style="margin:0;background:transparent">` +
      `<img src="data:image/svg+xml;base64,${Buffer.from(svg(i)).toString('base64')}" width="${i.lado}" height="${i.lado}" style="display:block"></body></html>`;
    capturar(pagina, `${i.nome}.html`, join(DESTINO, i.nome), i.lado, i.lado);
    console.log(`public/icones/${i.nome} (${i.lado}×${i.lado})`);
  }
  capturar(og, 'og.html', join(RAIZ, 'public', 'og.png'), 1200, 630, ['--virtual-time-budget=3000']);
  console.log('public/og.png (1200×630)');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
