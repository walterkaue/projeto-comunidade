// Motor de desenho dos cards: um só desenho para os 5 modelos e os 3 formatos.
// Tudo em coordenadas lógicas (1080 de largura); o canvas real é multiplicado pela escala.
// Só mexe no canvas que recebe; não lê nem grava nada fora dele.

import { desenharQr, type Matriz } from '../../comum/qr';
import { quebrarTexto } from '../../comum/texto';
import { linhasDaPauta } from './pauta';
import { DEF_FORMATOS, DEF_MODELOS, type CamposDoCard, type Formato, type ModeloDeCard } from './modelos';
import type { Paleta } from './paletas';
import { RODAPE, onde, quando } from './textos';

export const FAMILIA = '"Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export interface OpcoesDeDesenho {
  /** Multiplicador do tamanho do canvas (1 = tamanho lógico). */
  escala: number;
  /** Logo já reduzido (canvas ou imagem). */
  logo?: { fonte: CanvasImageSource; largura: number; altura: number };
  /** Matriz do QR; só o cartaz desenha. */
  qr?: Matriz;
  /** Rodapé "Feito com …". */
  rodape: boolean;
}

interface Config {
  faixa: number;
  titulo: number;
  tituloLinhas: number;
  corpo: number;
  corpoLinhas: number;
  rotulo: number;
  info: number;
  rodapeAltura: number;
  qr: number;
}

const CONFIG: Record<Formato, Config> = {
  status: { faixa: 300, titulo: 124, tituloLinhas: 6, corpo: 54, corpoLinhas: 6, rotulo: 32, info: 60, rodapeAltura: 230, qr: 0 },
  conversa: { faixa: 190, titulo: 100, tituloLinhas: 3, corpo: 44, corpoLinhas: 4, rotulo: 28, info: 48, rodapeAltura: 220, qr: 0 },
  cartaz: { faixa: 240, titulo: 112, tituloLinhas: 4, corpo: 48, corpoLinhas: 5, rotulo: 30, info: 54, rodapeAltura: 330, qr: 290 },
};

const MARGEM = 72;

/** Tamanho em pixels do canvas para o formato e a escala. */
export function tamanhoDoCanvas(formato: Formato, escala: number): { largura: number; altura: number } {
  const f = DEF_FORMATOS[formato];
  return { largura: Math.round(f.largura * escala), altura: Math.round(f.altura * escala) };
}

const fonte = (peso: 400 | 700, px: number) => `${peso} ${Math.round(px)}px ${FAMILIA}`;

/** Esconde só o que passou do limite de linhas com reticências (usa o `quebrarTexto` comum). */
function linhasDe(ctx: CanvasRenderingContext2D, texto: string, largura: number, max: number): string[] {
  return quebrarTexto((s) => ctx.measureText(s).width, texto, largura, max);
}

interface Bloco {
  rotulo?: string;
  linhas: string[];
  tamanho: number;
  peso: 400 | 700;
  cor: 'texto' | 'suave';
  /** Altura de cada linha. */
  passo: number;
  /** Espaço antes do bloco. */
  antes: number;
  /** O texto ainda passou do limite no menor tamanho e ficou com "…". */
  cortado?: boolean;
}

/** Piso da letra do local no cartaz e da organização no rodapé, em fração do tamanho de partida. */
const PISO = 0.6;

interface Ajuste {
  tamanho: number;
  linhas: string[];
  cortado: boolean;
}

/** Diminui a letra (de `inicio` até `piso`) até o texto caber em `maxLinhas`; no piso, corta com "…". */
function ajustarAoLimite(ctx: CanvasRenderingContext2D, texto: string, peso: 400 | 700, inicio: number, piso: number, largura: number, maxLinhas: number): Ajuste {
  const medir = (s: string) => ctx.measureText(s).width;
  const menor = Math.min(inicio, piso);
  let tamanho = inicio;
  for (;;) {
    ctx.font = fonte(peso, tamanho);
    const todas = quebrarTexto(medir, texto, largura);
    if (todas.length <= maxLinhas) return { tamanho, linhas: todas, cortado: false };
    if (tamanho <= menor + 1e-9) return { tamanho, linhas: quebrarTexto(medir, texto, largura, maxLinhas), cortado: true };
    tamanho = Math.max(menor, tamanho * 0.95);
  }
}

function montarBlocos(ctx: CanvasRenderingContext2D, c: CamposDoCard, formato: Formato, k: number, largura: number): Bloco[] {
  const cfg = CONFIG[formato];
  const blocos: Bloco[] = [];
  const titulo = c.titulo.trim();
  if (titulo) {
    const t = cfg.titulo * k;
    ctx.font = fonte(700, t);
    blocos.push({ linhas: linhasDe(ctx, titulo, largura, cfg.tituloLinhas), tamanho: t, peso: 700, cor: 'texto', passo: t * 1.12, antes: 0 });
  }
  const info = cfg.info * k;
  const q = quando(c);
  if (q) {
    ctx.font = fonte(700, info);
    blocos.push({ rotulo: 'QUANDO', linhas: linhasDe(ctx, q, largura, 2), tamanho: info, peso: 700, cor: 'texto', passo: info * 1.2, antes: 56 * k });
  }
  const o = onde(c);
  if (o && formato === 'cartaz') {
    // No cartaz o endereço não pode ser cortado: a letra diminui até caber em 3 linhas.
    const a = ajustarAoLimite(ctx, o, 700, info, cfg.info * PISO, largura, 3);
    blocos.push({ rotulo: 'ONDE', linhas: a.linhas, tamanho: a.tamanho, peso: 700, cor: 'texto', passo: a.tamanho * 1.2, antes: 40 * k, cortado: a.cortado });
  } else if (o) {
    ctx.font = fonte(700, info);
    blocos.push({ rotulo: 'ONDE', linhas: linhasDe(ctx, o, largura, 2), tamanho: info, peso: 700, cor: 'texto', passo: info * 1.2, antes: 40 * k });
  }
  const itens = (c.pauta ?? []).filter((t) => t.trim() !== '');
  if (itens.length > 0) {
    const t = cfg.corpo * k;
    ctx.font = fonte(400, t);
    const p = linhasDaPauta((s) => ctx.measureText(s).width, itens, largura, cfg.corpoLinhas + 1);
    blocos.push({ rotulo: 'PAUTA', linhas: p.linhas, tamanho: t, peso: 400, cor: 'texto', passo: t * 1.35, antes: 56 * k });
  }
  const texto = c.texto.trim();
  if (texto) {
    const t = cfg.corpo * k;
    ctx.font = fonte(400, t);
    blocos.push({ linhas: linhasDe(ctx, texto, largura, cfg.corpoLinhas), tamanho: t, peso: 400, cor: 'suave', passo: t * 1.4, antes: 56 * k });
  }
  return blocos;
}

/** Maior largura entre as palavras do título, na fonte do título com a letra `t`. */
function palavraMaisLargaDoTitulo(ctx: CanvasRenderingContext2D, titulo: string, t: number): number {
  ctx.font = fonte(700, t);
  return titulo.split(/\s+/).reduce((m, p) => Math.max(m, p ? ctx.measureText(p).width : 0), 0);
}

/**
 * Escolhe o fator `k` da letra: o maior (de 1,3 até 0,55) em que o título não parte palavra e os blocos
 * cabem na altura. Puro em relação ao canvas (só mede texto).
 */
export function escolherTamanho(ctx: CanvasRenderingContext2D, c: CamposDoCard, formato: Formato, larguraTexto: number, areaAltura: number): { k: number; blocos: Bloco[] } {
  const cfg = CONFIG[formato];
  const titulo = c.titulo.trim();
  let k = 1.3;
  let blocos: Bloco[] = [];
  for (let t = 1.3; t >= 0.55 - 1e-9; t -= 0.05) {
    k = t;
    blocos = montarBlocos(ctx, c, formato, k, larguraTexto);
    const palavraCabe = !titulo || palavraMaisLargaDoTitulo(ctx, titulo, cfg.titulo * k) <= larguraTexto;
    if (palavraCabe && alturaDosBlocos(blocos, cfg.rotulo, k) + 40 <= areaAltura) break;
  }
  return { k, blocos };
}

const AREA_TOPO = (formato: Formato) => CONFIG[formato].faixa + 70;
const AREA_ALTURA = (formato: Formato) => DEF_FORMATOS[formato].altura - CONFIG[formato].rodapeAltura - AREA_TOPO(formato) - 30;

/** Organização no rodapé: 42 px, 2 linhas; no cartaz a letra diminui até caber sem "…". */
function organizacaoNoRodape(ctx: CanvasRenderingContext2D, org: string, formato: Formato, largura: number): Ajuste {
  return ajustarAoLimite(ctx, org, 700, 42, formato === 'cartaz' ? 42 * PISO : 42, largura, 2);
}

/**
 * O que o cartaz ainda corta com "…" mesmo no menor tamanho de letra (a tela Pronto avisa).
 * `comQr`: o rodapé divide a largura com o QR.
 */
export function cortesDoCartaz(ctx: CanvasRenderingContext2D, c: CamposDoCard, comQr: boolean): ('local' | 'organizacao')[] {
  const cfg = CONFIG.cartaz;
  const larguraTexto = DEF_FORMATOS.cartaz.largura - MARGEM * 2;
  const cortes: ('local' | 'organizacao')[] = [];
  const { blocos } = escolherTamanho(ctx, c, 'cartaz', larguraTexto, AREA_ALTURA('cartaz'));
  if (blocos.some((b) => b.rotulo === 'ONDE' && b.cortado)) cortes.push('local');
  const org = c.organizacao.trim();
  if (org && organizacaoNoRodape(ctx, org, 'cartaz', comQr ? larguraTexto - cfg.qr - 40 : larguraTexto).cortado) cortes.push('organizacao');
  return cortes;
}

function alturaDosBlocos(blocos: Bloco[], rotulo: number, k: number): number {
  let h = 0;
  for (const b of blocos) {
    h += b.antes + b.linhas.length * b.passo;
    if (b.rotulo) h += rotulo * k * 1.5;
  }
  return h;
}

/** Retângulo com cantos redondos (aparelhos antigos não têm roundRect: cai para o retângulo reto). */
function retangulo(ctx: CanvasRenderingContext2D, x: number, y: number, l: number, a: number, r: number): void {
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, l, a, r);
  else ctx.rect(x, y, l, a);
}

/** Ícone simples de cada modelo (decorativo: o nome do modelo está escrito na faixa). */
function icone(ctx: CanvasRenderingContext2D, modelo: ModeloDeCard, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  switch (modelo) {
    case 'reuniao':
      for (const dx of [-r * 0.7, 0, r * 0.7]) {
        ctx.moveTo(cx + dx + r * 0.42, cy);
        ctx.arc(cx + dx, cy, r * 0.42, 0, Math.PI * 2);
      }
      break;
    case 'evento':
      retangulo(ctx, cx - r, cy - r * 0.8, r * 2, r * 1.8, r * 0.2);
      ctx.moveTo(cx - r, cy - r * 0.2);
      ctx.lineTo(cx + r, cy - r * 0.2);
      break;
    case 'aviso':
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 1.05, cy + r * 0.85);
      ctx.lineTo(cx - r * 1.05, cy + r * 0.85);
      ctx.closePath();
      break;
    case 'resultado':
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        const raio = i % 2 === 0 ? r * 1.1 : r * 0.48;
        ctx[i === 0 ? 'moveTo' : 'lineTo'](cx + Math.cos(ang) * raio, cy + Math.sin(ang) * raio);
      }
      ctx.closePath();
      break;
    case 'agradecimento':
      ctx.moveTo(cx, cy + r * 0.9);
      ctx.bezierCurveTo(cx - r * 1.6, cy - r * 0.2, cx - r * 0.7, cy - r * 1.1, cx, cy - r * 0.35);
      ctx.bezierCurveTo(cx + r * 0.7, cy - r * 1.1, cx + r * 1.6, cy - r * 0.2, cx, cy + r * 0.9);
      ctx.closePath();
      break;
  }
}

/** Desenha o card inteiro no canvas (o tamanho do canvas já deve ser `tamanhoDoCanvas`). */
export function desenharCard(ctx: CanvasRenderingContext2D, c: CamposDoCard, formato: Formato, paleta: Paleta, op: OpcoesDeDesenho): void {
  const def = DEF_FORMATOS[formato];
  const cfg = CONFIG[formato];
  const W = def.largura;
  const H = def.altura;
  const larguraTexto = W - MARGEM * 2;

  ctx.save();
  ctx.setTransform(op.escala, 0, 0, op.escala, 0, 0);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // fundo e faixa
  ctx.fillStyle = paleta.fundo;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = paleta.destaque;
  ctx.fillRect(0, 0, W, cfg.faixa);

  // faixa: ícone + nome do modelo
  const modelo = DEF_MODELOS[c.modelo];
  const ladoLogo = cfg.faixa - 70;
  const temLogo = !!op.logo;
  const r = 34;
  ctx.fillStyle = paleta.sobreDestaque;
  ctx.strokeStyle = paleta.sobreDestaque;
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  icone(ctx, c.modelo, MARGEM + r + 6, cfg.faixa / 2, r);
  if (c.modelo === 'evento') ctx.stroke();
  else if (c.modelo === 'aviso') {
    ctx.fill();
    ctx.fillStyle = paleta.destaque;
    ctx.font = fonte(700, 40);
    ctx.textAlign = 'center';
    ctx.fillText('!', MARGEM + r + 6, cfg.faixa / 2 + 26);
    ctx.textAlign = 'left';
    ctx.fillStyle = paleta.sobreDestaque;
  } else ctx.fill();
  ctx.fillStyle = paleta.sobreDestaque;
  ctx.font = fonte(700, 46);
  ctx.fillText(modelo.faixa, MARGEM + r * 2 + 36, cfg.faixa / 2 + 16);

  // logo, num quadrado branco à direita da faixa
  if (op.logo && temLogo) {
    const x = W - MARGEM - ladoLogo;
    const y = (cfg.faixa - ladoLogo) / 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    retangulo(ctx, x, y, ladoLogo, ladoLogo, 18);
    ctx.fill();
    const pad = 14;
    const caixa = ladoLogo - pad * 2;
    const f = Math.min(caixa / op.logo.largura, caixa / op.logo.altura);
    const lw = op.logo.largura * f;
    const lh = op.logo.altura * f;
    ctx.drawImage(op.logo.fonte, x + pad + (caixa - lw) / 2, y + pad + (caixa - lh) / 2, lw, lh);
  }

  // rodapé: reserva o espaço (QR no cartaz)
  const comQr = formato === 'cartaz' && !!op.qr;
  const rodapeTopo = H - cfg.rodapeAltura;
  const areaTopo = AREA_TOPO(formato);
  const areaAltura = AREA_ALTURA(formato);

  // conteúdo: encolhe até caber (e até a palavra mais longa do título caber numa linha)
  const { k, blocos } = escolherTamanho(ctx, c, formato, larguraTexto, areaAltura);
  const conteudo = alturaDosBlocos(blocos, cfg.rotulo, k) + 40;
  // Conteúdo centrado na área livre, mas sempre perto do topo no Status para não ficar flutuando.
  const sobra = Math.max(0, areaAltura - conteudo);
  let y = areaTopo + (formato === 'status' ? Math.min(sobra / 2, 140) : sobra / 3);

  // barrinha de destaque
  ctx.fillStyle = paleta.acento;
  ctx.fillRect(MARGEM, y, 140, 12);
  y += 40;

  blocos.forEach((b) => {
    y += b.antes;
    if (b.rotulo) {
      ctx.font = fonte(700, cfg.rotulo * k);
      ctx.fillStyle = paleta.acento;
      ctx.fillText(b.rotulo, MARGEM, y + cfg.rotulo * k);
      y += cfg.rotulo * k * 1.5;
    }
    ctx.font = fonte(b.peso, b.tamanho);
    ctx.fillStyle = b.cor === 'texto' ? paleta.texto : paleta.suave;
    for (const linha of b.linhas) {
      ctx.fillText(linha, MARGEM, y + b.tamanho * 0.95);
      y += b.passo;
    }
  });

  // linha e rodapé
  ctx.fillStyle = paleta.acento;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(MARGEM, rodapeTopo, W - MARGEM * 2, 3);
  ctx.globalAlpha = 1;

  const larguraRodape = comQr ? W - MARGEM * 2 - cfg.qr - 40 : W - MARGEM * 2;
  let yr = rodapeTopo + 40;
  const org = c.organizacao.trim();
  if (org) {
    const a = organizacaoNoRodape(ctx, org, formato, larguraRodape);
    ctx.font = fonte(700, a.tamanho);
    ctx.fillStyle = paleta.texto;
    for (const l of a.linhas) {
      yr += a.tamanho * 1.1;
      ctx.fillText(l, MARGEM, yr);
      yr += 8;
    }
  }
  if (comQr) {
    ctx.font = fonte(400, 30);
    ctx.fillStyle = paleta.suave;
    for (const l of linhasDe(ctx, 'Aponte a câmera do celular para ver os detalhes.', larguraRodape, 3)) {
      yr += 42;
      ctx.fillText(l, MARGEM, yr);
    }
  }
  if (op.rodape) {
    ctx.font = fonte(400, 28);
    ctx.fillStyle = paleta.suave;
    ctx.fillText(RODAPE, MARGEM, H - 40);
  }
  if (comQr && op.qr) {
    const lado = cfg.qr;
    desenharQr(ctx, op.qr, W - MARGEM - lado, rodapeTopo + 36, lado);
  }

  ctx.restore();
}
