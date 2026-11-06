// Apoio do grupo a6: gera os arquivos de logo de teste em .fixtures/ (fora do git).
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync, crc32 as crcNode } from 'node:zlib';
import { randomBytes } from 'node:crypto';
import type { Page } from '@playwright/test';
import { PASTA } from './sim';

export const FIXTURES = join(PASTA, '.fixtures');

function crc32(buf: Buffer): number {
  if (typeof crcNode === 'function') return crcNode(buf);
  let c, crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]!) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function bloco(tipo: string, dados: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo) >>> 0);
  return Buffer.concat([len, corpo, crc]);
}

/** PNG RGBA de ruído (não comprime): lado x lado. */
export function pngRuido(lado: number): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const linhas = Buffer.alloc((lado * 4 + 1) * lado);
  for (let y = 0; y < lado; y++) {
    const ini = y * (lado * 4 + 1);
    linhas[ini] = 0;
    randomBytes(lado * 4).copy(linhas, ini + 1);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    bloco('IHDR', ihdr),
    bloco('IDAT', deflateSync(linhas, { level: 0 })),
    bloco('IEND', Buffer.alloc(0)),
  ]);
}

/** Injeta um APP1 EXIF com Orientation=6 logo depois do SOI. */
export function comExifOrientacao6(jpg: Buffer): Buffer {
  const tiff = Buffer.from([
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, // MM, 42, offset 8
    0x00, 0x01, // 1 entrada
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x06, 0x00, 0x00, // Orientation SHORT = 6
    0x00, 0x00, 0x00, 0x00, // próximo IFD
  ]);
  const conteudo = Buffer.concat([Buffer.from('Exif\0\0', 'ascii'), tiff]);
  const cab = Buffer.from([0xff, 0xe1, 0, 0]);
  cab.writeUInt16BE(conteudo.length + 2, 2);
  return Buffer.concat([jpg.subarray(0, 2), cab, conteudo, jpg.subarray(2)]);
}

/** Desenha a imagem "CIMA" 800x600 como o sensor gravou (girada), exporta JPG pelo navegador e injeta o EXIF. */
async function jpgDeitado(page: Page): Promise<Buffer> {
  const b64 = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 800;
    c.height = 600;
    const x = c.getContext('2d')!;
    x.fillStyle = '#1b5e20';
    x.fillRect(0, 0, 800, 600);
    // O que a pessoa vê (retrato 600x800, "CIMA" em pé) girado 90° anti-horário no sensor.
    x.translate(0, 600);
    x.rotate(-Math.PI / 2);
    x.fillStyle = '#ffffff';
    x.font = 'bold 140px sans-serif';
    x.textAlign = 'center';
    x.fillText('CIMA', 300, 300);
    x.beginPath();
    x.moveTo(300, 40);
    x.lineTo(380, 160);
    x.lineTo(220, 160);
    x.fill();
    x.fillStyle = '#ffeb3b';
    x.fillRect(0, 700, 600, 100); // faixa amarela = base
    const blob: Blob = await new Promise((ok) => c.toBlob((b) => ok(b!), 'image/jpeg', 0.9));
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (const v of buf) s += String.fromCharCode(v);
    return btoa(s);
  });
  return comExifOrientacao6(Buffer.from(b64, 'base64'));
}

export interface Arquivos {
  png5mb: string;
  jpgExif6: string;
  svgComTamanho: string;
  svgSemTamanho: string;
  txtComoPng: string;
  pdf: string;
}

export async function gerarFixtures(page: Page): Promise<Arquivos> {
  mkdirSync(FIXTURES, { recursive: true });
  const f = (n: string) => join(FIXTURES, `a6-${n}`);
  const a: Arquivos = {
    png5mb: f('ruido-5mb.png'),
    jpgExif6: f('deitado-exif6.jpg'),
    svgComTamanho: f('logo-com-tamanho.svg'),
    svgSemTamanho: f('logo-sem-tamanho.svg'),
    txtComoPng: f('texto-disfarcado.png'),
    pdf: f('documento.pdf'),
  };
  if (!existsSync(a.png5mb)) writeFileSync(a.png5mb, pngRuido(1100));
  if (!existsSync(a.jpgExif6)) writeFileSync(a.jpgExif6, await jpgDeitado(page));
  const miolo = `<rect width="200" height="100" fill="#0d47a1"/><circle cx="50" cy="50" r="35" fill="#ffca28"/><text x="100" y="62" font-size="36" font-family="sans-serif" fill="#fff">ONG</text>`;
  writeFileSync(a.svgComTamanho, `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">${miolo}</svg>`);
  writeFileSync(a.svgSemTamanho, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">${miolo}</svg>`);
  writeFileSync(a.txtComoPng, 'Isto é só um texto, não uma imagem.\n');
  writeFileSync(a.pdf, '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
  return a;
}
