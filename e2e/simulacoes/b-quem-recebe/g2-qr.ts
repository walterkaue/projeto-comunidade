// Rasteriza uma página de PDF (mupdf) e decodifica o QR (jsQR). Só desenvolvimento.
import { writeFileSync } from 'node:fs';
import * as mupdf from 'mupdf';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';

export interface LeituraDoQr {
  texto: string | null;
  /** Lado do QR (sem margem) em mm na folha, pelos cantos achados. */
  ladoMm: number | null;
  paginas: number;
  escala: number;
}

/** Página `n` (0 = primeira) do PDF → PNG em `caminhoPng`, e a leitura do QR. `escala` 4 ≈ 288 dpi. */
export function lerQrDoPdf(pdf: Buffer, caminhoPng: string, n = 0, escala = 4): LeituraDoQr {
  const doc = mupdf.Document.openDocument(pdf, 'application/pdf');
  const paginas = doc.countPages();
  const pg = doc.loadPage(n);
  const pix = pg.toPixmap(mupdf.Matrix.scale(escala, escala), mupdf.ColorSpace.DeviceRGB, false, true);
  const png = pix.asPNG();
  writeFileSync(caminhoPng, png);
  const img = PNG.sync.read(Buffer.from(png));
  const r = jsQR(new Uint8ClampedArray(img.data), img.width, img.height, { inversionAttempts: 'attemptBoth' });
  if (!r) return { texto: null, ladoMm: null, paginas, escala };
  const { topLeftCorner: a, topRightCorner: b } = r.location;
  const px = Math.hypot(b.x - a.x, b.y - a.y);
  // 1 pt = 1/72 pol; 1 pol = 25,4 mm; o pixmap tem `escala` px por pt.
  return { texto: r.data, ladoMm: Math.round(((px / escala) * 25.4) / 72 * 10) / 10, paginas, escala };
}
