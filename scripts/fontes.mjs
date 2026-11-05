// Gera as fontes auto-hospedadas só com os caracteres do português.
// Origem: @fontsource/atkinson-hyperlegible (licença OFL). Uso: npm run fontes  → src/comum/fontes/*.woff2
// Ficam dentro de src/ (e não em public/) para o Vite pôr hash e reescrever o caminho relativo no CSS.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import subsetFont from 'subset-font';

const require = createRequire(import.meta.url);

// ASCII visível + acentos do português + sinais usados na interface.
const CARACTERES =
  Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('') +
  'ÁÀÂÃÉÊÍÓÔÕÚÜÇáàâãéêíóôõúüç' +
  'ºª°·–—‘’“”…•×→←↑↓▲▼ ' +
  '€$%ªº°';

const BASE = '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-';
const FONTES = [
  ['atkinson-400', `${BASE}400-normal.woff2`],
  ['atkinson-700', `${BASE}700-normal.woff2`],
];

const destino = new URL('../src/comum/fontes/', import.meta.url);
mkdirSync(destino, { recursive: true });
let total = 0;
for (const [nome, arquivo] of FONTES) {
  const original = readFileSync(require.resolve(arquivo));
  const reduzida = await subsetFont(original, CARACTERES, { targetFormat: 'woff2' });
  writeFileSync(new URL(`${nome}.woff2`, destino), reduzida);
  total += reduzida.length;
  console.log(`${nome}.woff2: ${(original.length / 1024).toFixed(1)} KB → ${(reduzida.length / 1024).toFixed(1)} KB`);
}
console.log(`Total: ${(total / 1024).toFixed(1)} KB`);
