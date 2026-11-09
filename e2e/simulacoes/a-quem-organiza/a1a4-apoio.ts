// Apoio do grupo a1a4 (Dona Cida e Mãe Iara). Só ferramentas de teste e relato; nada daqui entra no site.
import type { Locator, Page } from '@playwright/test';
import { cobertoPorFaixa, expect, foto, inspecionar, registrar, titulo, type Inspecao } from './sim';

declare global {
  interface Window {
    __avisos: string[];
  }
}

/** Anota tudo o que passa pela região de aviso (o aviso some em 5 s e o leitor de tela fala só o último). Chamar antes do goto. */
export async function vigiarAvisos(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__avisos = [];
    const ligar = () => {
      const olhar = (): boolean => {
        const el = document.getElementById('aviso-vivo');
        if (!el) return false;
        new MutationObserver(() => {
          const t = el.textContent?.trim();
          if (t) window.__avisos.push(t);
        }).observe(el, { childList: true, characterData: true, subtree: true });
        return true;
      };
      if (!olhar()) {
        const mo = new MutationObserver(() => {
          if (olhar()) mo.disconnect();
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      }
    };
    document.addEventListener('DOMContentLoaded', ligar);
  });
}

export const avisos = (page: Page) => page.evaluate(() => window.__avisos.slice());

/** Toque como pessoa. Se algo cobre o alvo e o toque não pega, registra TRAVA provável e segue com um clique direto. */
export async function toque(l: Locator, nome: string): Promise<void> {
  try {
    await l.scrollIntoViewIfNeeded({ timeout: 10_000 });
    const c = await cobertoPorFaixa(l);
    if (c.coberto) registrar('coberto', { onde: nome, ...c });
    await l.tap({ timeout: 15_000 });
  } catch (e) {
    registrar('toque-falhou', { onde: nome, erro: String(e).slice(0, 300) });
    await l.dispatchEvent('click');
  }
}

/** Digita letra por letra (apaga o que havia antes, como quem seleciona tudo e escreve por cima). */
export async function digitar(l: Locator, texto: string, atraso = 12): Promise<void> {
  await l.click();
  await l.press('Control+A');
  await l.press('Delete');
  await l.pressSequentially(texto, { delay: atraso });
  const c = await cobertoPorFaixa(l);
  if (c.coberto) registrar('coberto', { onde: `campo ${await l.getAttribute('id')}`, ...c });
}

/** Digita com erro e corrige o fim com Backspace. */
export async function digitarComErro(l: Locator, errado: string, apagar: number, certo: string): Promise<string> {
  await digitar(l, errado);
  for (let i = 0; i < apagar; i++) await l.press('Backspace');
  await l.pressSequentially(certo, { delay: 12 });
  return l.inputValue();
}

/** Inspeciona, tira foto e guarda o texto da tela. Devolve a inspeção. */
export async function tela(page: Page, nome: string, inteira = false): Promise<Inspecao> {
  const ins = await inspecionar(page, nome);
  await foto(page, nome, inteira);
  const texto = await page.locator('main').first().innerText().catch(() => '');
  registrar('textos-tela', { tela: nome, texto });
  return ins;
}

export async function valores(page: Page, ids: string[]): Promise<Record<string, string>> {
  const r: Record<string, string> = {};
  for (const id of ids) {
    const l = page.locator(`[id="${id}"]`);
    r[id] = (await l.count()) ? await l.inputValue().catch(() => '(não é campo)') : '(não existe)';
  }
  return r;
}

/** O exemplo em cinza (placeholder "Ex.: …") de cada campo: os campos dos passos 1 e 2 começam vazios. */
export async function exemplosEmCinza(page: Page, ids: string[]): Promise<Record<string, string>> {
  const r: Record<string, string> = {};
  for (const id of ids) {
    const l = page.locator(`[id="${id}"]`);
    r[id] = (await l.count()) ? ((await l.getAttribute('placeholder')) ?? '(sem exemplo em cinza)') : '(não existe)';
  }
  return r;
}

export async function naTela(l: Locator): Promise<{ top: number; bottom: number; altura: number; dentro: boolean }> {
  return l.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), altura: innerHeight, dentro: r.top >= 0 && r.bottom <= innerHeight };
  });
}

export async function estadoDoFluxo(page: Page) {
  return page.evaluate(() => ({ hash: location.hash, h1: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() ?? '' }));
}

/** O Pronto abriu e o preparo do link terminou. */
export async function esperarPronto(page: Page, agenda: boolean): Promise<void> {
  await expect(titulo(page)).toContainText('Pronto!', { timeout: 90_000 });
  if (agenda) await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…', { timeout: 90_000 });
}

export async function esperarPasso(page: Page, n: number): Promise<void> {
  await expect(titulo(page)).toContainText(`Passo ${n} de 3`, { timeout: 60_000 });
}

/** Mede os três botões do "Onde vai mandar?" e diz se cabem. */
export async function medirFormatos(page: Page): Promise<Record<string, unknown>[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.fluxo-seg-item label')].map((l) => {
      const r = l.getBoundingClientRect();
      const n = l.querySelector<HTMLElement>('.fluxo-seg-nome');
      return {
        texto: n?.textContent,
        largura: Math.round(r.width),
        altura: Math.round(r.height),
        esquerda: Math.round(r.left),
        direita: Math.round(r.right),
        telaLargura: innerWidth,
        nomeCortado: n ? n.scrollWidth > n.clientWidth + 1 : false,
      };
    }),
  );
}

/** Lê o texto do WhatsApp e confere o link. */
export function analisarTexto(texto: string): { caracteres: number; linhas: number; link: string; tamanhoDoLink: number; naoAscii: string[] } {
  const link = /Mais detalhes: (\S+)/.exec(texto)?.[1] ?? '';
  return {
    caracteres: [...texto].length,
    linhas: texto.split('\n').length,
    link,
    tamanhoDoLink: link.length,
    naoAscii: [...new Set([...texto].filter((c) => c.charCodeAt(0) > 127))],
  };
}
