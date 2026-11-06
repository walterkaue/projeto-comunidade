// Copia, reduzidas, as fotos que provam achados para docs/auditoria/2026-11-06/fotos/b-*.png.
// Uso, da raiz: node e2e/simulacoes/b-quem-recebe/fotos-relatorio.mjs
// Reduz pelo próprio Chromium do Playwright (sem biblioteca de imagem a mais).

import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const DESTINO = fileURLToPath(new URL('../../../docs/auditoria/2026-11-06/fotos/', import.meta.url));
mkdirSync(DESTINO, { recursive: true });

// [origem (relativa a esta pasta), destino, largura final, altura máxima da origem a manter (corte embaixo)]
const FOTOS = [
  ['.fotos/g3-pronto-autoridade-previa.png', 'b-01-autoridade-previa', 300],
  ['.fotos/g4-AND-FRACO-evento-sp-19h-texto200.png', 'b-02-faixa-cortada-200', 300],
  ['.fotos/g2-b4gr-ponto-no-fim.png', 'b-03-ponto-no-fim', 640],
  ['.saidas/g2-cartaz-pior-p1.png', 'b-04-cartaz-corta-local', 420],
  ['.fotos/r-folha-AND-DEITADO-Abrir-no-Google-Agenda.png', 'b-05-folha-deitado-200', 480],
  ['.fotos/g3-pagina-telefone-em-linhas.png', 'b-06-telefone-em-linhas', 300, 2000],
  ['.fotos/g3-pagina-faixa-copiada.png', 'b-07-faixa-copiada', 300, 1500],
  ['.fotos/g3-erro-horario-traco.png', 'b-08-erro-horario-traco', 300],
  ['.fotos/g3-erro-pelo-site-da-escola.png', 'b-10-erro-site-da-escola', 300],
  ['.fotos/g4-criar-outro-1.png', 'b-12-criar-outro', 300, 1700],
  ['.saidas/g4-card-reuniao-longa.png', 'b-13-pauta-cortada-card', 360],
  ['.fotos/g2-b4ff-so-uma-letra-trocada-meio.png', 'b-17-letra-trocada', 640],
  ['.fotos/g4-b6-pagina-golpe.png', 'b-20-golpe-documentos', 300],
  ['.fotos/g1-b1-webview-compartilhar.png', 'b-21-compartilhar-webview', 300],
];

const tamanho = (buf) => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
for (const [origem, nome, largura, alturaMax] of FOTOS) {
  const buf = readFileSync(AQUI + origem);
  const { w, h } = tamanho(buf);
  const escala = largura / w;
  const altura = Math.round(Math.min(h, alturaMax ?? h) * escala);
  await pagina.setViewportSize({ width: largura, height: altura });
  await pagina.setContent(
    `<body style="margin:0;overflow:hidden"><img style="display:block;width:${largura}px" src="data:image/png;base64,${buf.toString('base64')}"></body>`,
  );
  await pagina.locator('img').evaluate((img) => img.decode());
  await pagina.screenshot({ path: `${DESTINO}${nome}.png`, clip: { x: 0, y: 0, width: largura, height: altura } });
  console.log(nome, `${largura}×${altura}`);
}
await navegador.close();
