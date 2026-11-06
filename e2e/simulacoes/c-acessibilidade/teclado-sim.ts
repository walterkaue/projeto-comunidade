// Ajuda dos personagens C1 e C5: navegar só por teclado, medir o foco e registrar o que o leitor leria.
import type { Page } from '@playwright/test';
import { anotar, focado, lerAnuncios, arvore } from './apoio-sim';

export interface MedidaFoco {
  id: string;
  quem: string;
  outline: string;
  sombra: string;
  /** Algo desenhado além do outline próprio (sombra, borda do rótulo vizinho). */
  visivel: boolean;
  cobertoPor: string; // vazio se nada cobre o centro visível
  x: number;
  y: number;
  w: number;
  h: number;
  foraDaTela: boolean;
}

/** Mede o foco atual: contorno, sombra, e se alguma coisa fixa cobre o elemento (WCAG 2.4.11). */
export async function medirFoco(page: Page): Promise<MedidaFoco> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return { id: '', quem: 'body', outline: '', sombra: '', visivel: false, cobertoPor: '', x: 0, y: 0, w: 0, h: 0, foraDaTela: false };
    // Rádio escondido: o contorno vai no rótulo que vem depois.
    let alvo: HTMLElement = el;
    const cs0 = getComputedStyle(el);
    const escondido = el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox') && (el.getBoundingClientRect().width < 4 || cs0.opacity === '0' || cs0.position === 'absolute');
    let rotulo: HTMLElement | null = null;
    if (escondido) {
      rotulo = (el.labels?.[0] as HTMLElement) ?? null;
      if (rotulo && el.getBoundingClientRect().width < 4 && rotulo) alvo = rotulo;
    }
    const cs = getComputedStyle(alvo);
    const csr = rotulo ? getComputedStyle(rotulo) : cs;
    const r = alvo.getBoundingClientRect();
    const outline = `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} +${cs.outlineOffset}`;
    const outlineRotulo = rotulo ? `${csr.outlineStyle} ${csr.outlineWidth} ${csr.outlineColor} +${csr.outlineOffset}` : '';
    const sombra = cs.boxShadow === 'none' ? '' : cs.boxShadow;
    const ow = parseFloat(cs.outlineWidth) || 0;
    const orw = rotulo ? parseFloat(csr.outlineWidth) || 0 : 0;
    const visivel = (cs.outlineStyle !== 'none' && ow > 0) || (rotulo !== null && csr.outlineStyle !== 'none' && orw > 0) || !!sombra;
    // O que cobre? Pontos na área visível do elemento.
    const vx0 = Math.max(0, r.left), vx1 = Math.min(innerWidth, r.right), vy0 = Math.max(0, r.top), vy1 = Math.min(innerHeight, r.bottom);
    let cobertoPor = '';
    if (vx1 > vx0 && vy1 > vy0) {
      const pts = [[0.5, 0.5], [0.15, 0.5], [0.85, 0.5], [0.5, 0.15], [0.5, 0.85]];
      let cobertos = 0;
      let quem = '';
      for (const [fx, fy] of pts) {
        const topo = document.elementFromPoint(vx0 + (vx1 - vx0) * fx!, vy0 + (vy1 - vy0) * fy!);
        if (topo && topo !== el && !el.contains(topo) && !alvo.contains(topo) && !topo.contains(el)) {
          cobertos++;
          quem = (topo.id ? '#' + topo.id : topo.tagName.toLowerCase()) + '.' + String(topo.className).slice(0, 30);
        }
      }
      if (cobertos) cobertoPor = `${quem} (${cobertos}/5 pontos)`;
    }
    const foraDaTela = r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth;
    return {
      id: el.id,
      quem: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
      outline: outline + (outlineRotulo ? ` | rótulo: ${outlineRotulo}` : ''),
      sombra,
      visivel,
      cobertoPor,
      x: Math.round(r.left),
      y: Math.round(r.top),
      w: Math.round(r.width),
      h: Math.round(r.height),
      foraDaTela,
    };
  });
}

export interface Parada {
  n: number;
  leitura: string;
  medida: MedidaFoco;
  y: number;
}

/** Aperta Tab até o foco chegar em `seletor` (ou `max` toques). Devolve todas as paradas. */
export async function tabAte(page: Page, seletor: string, o: { max?: number; voltar?: boolean; arquivo?: string; trilha?: Parada[] } = {}): Promise<{ achou: boolean; paradas: Parada[] }> {
  const max = o.max ?? 40;
  const paradas: Parada[] = [];
  for (let i = 1; i <= max; i++) {
    if (await page.evaluate((s) => !!document.activeElement && document.activeElement.matches(s), seletor)) {
      if (i === 1) return { achou: true, paradas };
    }
    await page.keyboard.press(o.voltar ? 'Shift+Tab' : 'Tab');
    const medida = await medirFoco(page);
    const parada: Parada = { n: i, leitura: await focado(page), medida, y: medida.y };
    paradas.push(parada);
    o.trilha?.push(parada);
    if (o.arquivo) {
      anotar(o.arquivo, `- Tab ${i}: ${parada.leitura} | contorno: ${medida.outline}${medida.sombra ? ' | sombra: ' + medida.sombra : ''}${medida.visivel ? '' : ' | SEM INDICADOR'}${medida.cobertoPor ? ' | COBERTO POR ' + medida.cobertoPor : ''}${medida.foraDaTela ? ' | FORA DA TELA' : ''} (y=${medida.y})`);
    }
    if (await page.evaluate((s) => !!document.activeElement && document.activeElement.matches(s), seletor)) return { achou: true, paradas };
  }
  return { achou: false, paradas };
}

/** Vai por Tab até o campo, apaga o que tem e digita. */
export async function digitar(page: Page, seletor: string, texto: string, o: { arquivo?: string; trilha?: Parada[] } = {}): Promise<boolean> {
  const r = await tabAte(page, seletor, { arquivo: o.arquivo, trilha: o.trilha });
  if (!r.achou) return false;
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type(texto);
  return true;
}

/** Relê a tela como o TalkBack: guarda a árvore e devolve só as linhas, para anotar. */
export async function lerTela(page: Page, nome: string, arquivo: string): Promise<string> {
  const a = await arvore(page, nome);
  const anun = await lerAnuncios(page);
  anotar(arquivo, `\n### ${nome}\nFoco depois da troca: ${await focado(page)}\nAvisos vivos desde a última leitura (${anun.length}): ${anun.length ? anun.map((x) => JSON.stringify(x)).join(' ; ') : 'nenhum'}\nÁrvore em .saida/arvore-${nome}.yml`);
  return a;
}

/** Itens focáveis na ordem do DOM cujo lugar na tela volta para cima (ordem de foco ≠ ordem visual). Ignora o que é fixo. */
export async function ordemVisual(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const els = [...document.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])')].filter((e) => {
      const r = e.getBoundingClientRect();
      const lab = e instanceof HTMLInputElement && (e.type === 'radio' || e.type === 'checkbox') ? (e.labels?.[0] ?? e) : e;
      const rr = lab.getBoundingClientRect();
      return (r.width > 0 || rr.width > 0) && !e.closest('[hidden],[inert],dialog:not([open])') && getComputedStyle(e).visibility !== 'hidden';
    });
    const fixo = (e: HTMLElement) => { for (let p: HTMLElement | null = e; p; p = p.parentElement) if (getComputedStyle(p).position === 'fixed' || getComputedStyle(p).position === 'sticky') return true; return false; };
    const ach: string[] = [];
    let ant: { nome: string; y: number } | null = null;
    for (const e of els) {
      if (fixo(e)) continue;
      const lab = e instanceof HTMLInputElement && (e.type === 'radio' || e.type === 'checkbox') ? (e.labels?.[0] ?? e) : e;
      const y = lab.getBoundingClientRect().top + scrollY;
      const nome = (e.getAttribute('aria-label') || e.textContent || e.id || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
      if (ant && y < ant.y - 20) ach.push(`"${ant.nome}" (y=${Math.round(ant.y)}) → "${nome}" (y=${Math.round(y)})`);
      ant = { nome, y };
    }
    return ach;
  });
}
