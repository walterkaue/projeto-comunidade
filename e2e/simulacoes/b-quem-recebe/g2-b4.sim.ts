// G2 / B4 Luana: abre o link no WhatsApp Web (computador). Links cortados, trocados, sem "#", com espaço,
// antigos, eventos que já passaram, o .ics e "Compartilhar este link" sem menu.
// O teste não fica vermelho por achado: anota em .saidas/g2-log.jsonl e guarda foto de cada tela.

import { readFileSync } from 'node:fs';
import { test, type Page } from '@playwright/test';
import { codificar } from '../../../src/ferramentas/evento/formato';
import { abrirAparelho, cronometro, foto, medirEGuardar, salvarSaida, type NomeDoAparelho, type Sessao } from './aparelhos';
import { anotar, subirServidor, texto, type Servidor } from './g2-apoio';

const EVENTO = {
  titulo: 'Sarau na praça',
  data: '2026-11-21',
  inicio: '19:00',
  fim: '21:00',
  local: 'Praça da Matriz, São Paulo',
  descricao: 'Música, poesia e roda de conversa. Traga sua cadeira.',
  organizacao: 'Coletivo cultural do bairro',
};

interface Visto {
  nome: string;
  urlFinal: string;
  h1: string;
  texto: string;
  saidas: string[];
  ms: number;
  titulo: string;
  status: number | null;
}

/** Abre um endereço numa aba nova, espera o fim do "Abrindo o evento…" e descreve o que a pessoa vê. */
async function abrir(sessao: Sessao, nome: string, url: string, prefixo: string): Promise<{ visto: Visto; page: Page }> {
  const page = await sessao.nova();
  const t = cronometro();
  const resp = await page.goto(url, { waitUntil: 'load' }).catch((e) => {
    anotar('g2', `${prefixo}-${nome}-goto-erro`, String(e).slice(0, 200));
    return null;
  });
  await page
    .waitForFunction(
      () => {
        const x = document.querySelector('h1');
        return !x || x.textContent !== 'Abrindo o evento…';
      },
      null,
      { timeout: 10_000 },
    )
    .catch(() => {});
  await page.waitForTimeout(300);
  const h1 = await page.getByRole('heading', { level: 1 }).first().innerText({ timeout: 1500 }).catch(() => '(sem h1)');
  const saidas = await page
    .locator('main a:visible, main button:visible')
    .evaluateAll((els) => els.map((e) => ((e as HTMLElement).innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ')).filter(Boolean))
    .catch(() => [] as string[]);
  const visto: Visto = { nome, urlFinal: page.url(), h1, texto: (await texto(page)).slice(0, 700), saidas, ms: t(), titulo: await page.title(), status: resp?.status() ?? null };
  await foto(page, `g2-${prefixo}-${nome.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`);
  anotar('g2', `${prefixo}-${nome}`, { ...visto, erros: sessao.erros.slice(-3) });
  return { visto, page };
}

function trocarUm(s: string, i: number): string {
  const novo = s[i] === 'A' ? 'B' : 'A';
  return s.slice(0, i) + novo + s.slice(i + 1);
}

type Grupo = 'cortes' | 'sem-hash' | 'espacos' | 'antigos';

function variantes(s: Servidor, dados: string, link: string): Record<Grupo, [string, string][]> {
  const meio = Math.floor(dados.length / 2);
  const ev = `${s.url}#/evento/`;
  return {
    cortes: [
      ['controle', link],
      ['cortado-metade', `${ev}${dados.slice(0, meio)}`],
      ['falta-1', `${ev}${dados.slice(0, -1)}`],
      ['falta-2', `${ev}${dados.slice(0, -2)}`],
      ['falta-3', `${ev}${dados.slice(0, -3)}`],
      ['falta-20', `${ev}${dados.slice(0, -20)}`],
      ['letra-trocada-meio', `${ev}${trocarUm(dados, meio)}`],
      ['letra-trocada-inicio', `${ev}${trocarUm(dados, 6)}`],
      ['caractere-invalido', `${ev}${dados.slice(0, 20)}!${dados.slice(21)}`],
    ],
    'sem-hash': [
      ['sem-hash-evento-barra-dados', `${s.url}evento/${dados}`],
      ['sem-hash-so-dados', `${s.url}${dados}`],
      ['hash-sem-barra', `${s.url}#evento/${dados}`],
      ['hash-so-dados', `${s.url}#${dados}`],
      ['hash-barra-so-dados', `${s.url}#/${dados}`],
      ['com-fbclid', `${s.url}?fbclid=IwAR123#/evento/${dados}`],
      ['index-html', `${s.url}index.html#/evento/${dados}`],
    ],
    espacos: [
      ['ponto-no-fim', `${link}.`],
      ['parentese-no-fim', `${link})`],
      ['espaco-no-fim', `${link} `],
      ['espaco-no-fim-e-texto', `${link} Obrigada!`],
      ['quebra-no-fim', `${link}\n`],
      ['espaco-no-meio', `${ev}${dados.slice(0, 40)} ${dados.slice(40)}`],
      ['quebra-no-meio', `${ev}${dados.slice(0, 40)}\n${dados.slice(40)}`],
      ['percent20-no-meio', `${ev}${dados.slice(0, 40)}%20${dados.slice(40)}`],
      ['percent0a-no-fim', `${link}%0A`],
      ['mais-no-meio', `${ev}${dados.slice(0, 40)}+${dados.slice(40)}`],
    ],
    antigos: [
      ['versao-mais-nova', `${ev}2${dados.slice(1)}`],
      ['sem-marca', `${ev}1${dados.slice(2)}`],
      ['evento-vazio', `${ev}`],
      ['evento-sem-dados', `${s.url}#/evento`],
      ['cards-antigo', `${s.url}#/cards`],
      ['reuniao-antigo', `${s.url}#/reuniao`],
      ['editar-antigo', `${ev}editar/${dados}`],
      ['ata-antiga', `${s.url}#/ata`],
      ['ferramenta-antiga', `${s.url}#/ferramentas/cards`],
      ['raiz-sem-caminho', `${s.origem}/#/evento/${dados}`],
    ],
  };
}

for (const [aparelho, marca] of [
  ['PC-FIREFOX', '@firefox'],
  ['PC-GRANDE', ''],
] as [NomeDoAparelho, string][]) {
  const prefixo = aparelho === 'PC-FIREFOX' ? 'b4ff' : 'b4gr';

  for (const grupo of ['cortes', 'sem-hash', 'espacos', 'antigos'] as Grupo[]) {
    test(`B4 links ${grupo} em ${aparelho} ${marca}`, async ({ browser }) => {
      test.setTimeout(480_000);
      const s: Servidor = await subirServidor();
      const sessao = await abrirAparelho(browser, aparelho, { serviceWorkers: 'block' });
      try {
        const dados = await codificar(EVENTO);
        const link = `${s.url}#/evento/${dados}`;
        const vistos = new Set<string>();
        for (const [nome, url] of variantes(s, dados, link)[grupo]) {
          const { visto, page } = await abrir(sessao, nome, url, prefixo);
          // mede (axe etc.) uma vez por tipo de tela, para não gastar tempo
          if (!vistos.has(visto.h1)) {
            vistos.add(visto.h1);
            await medirEGuardar(page, 'g2', `${prefixo}: ${nome} (${visto.h1})`);
          }
          await page.close();
        }
        anotar('g2', `${prefixo}-${grupo}-sessao`, { erros: sessao.erros, externos: sessao.externos });
      } finally {
        await sessao.fechar();
        await s.fechar();
      }
    });
  }

  test(`B4 evento que já passou, .ics e compartilhar em ${aparelho} ${marca}`, async ({ browser }) => {
    test.setTimeout(480_000);
    const s: Servidor = await subirServidor();
    const sessao = await abrirAparelho(browser, aparelho, { serviceWorkers: 'block' });
    if (aparelho === 'PC-GRANDE') await sessao.context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: s.origem }).catch(() => {});
    try {
      const casos: [string, string][] = [
        ['ontem-05-11', '2026-11-05'],
        ['ha-2-meses', '2026-09-06'],
        ['futuro-21-11', '2026-11-21'],
      ];
      for (const [nome, data] of casos) {
        const dados = await codificar({ ...EVENTO, data });
        const { visto, page } = await abrir(sessao, nome, `${s.url}#/evento/${dados}`, `${prefixo}-passado`);
        const avisaPassou = /já passou|encerrad|aconteceu|terminou|passado/i.test(visto.texto);
        anotar('g2', `${prefixo}-passado-${nome}-avisa`, { avisaPassou, quando: await page.locator('[data-quando]').innerText().catch(() => '') });
        if (nome === 'ontem-05-11') await medirEGuardar(page, 'g2', `${prefixo}: evento de ontem`);

        // .ics de verdade
        const botao = page.getByRole('button', { name: 'Baixar arquivo para a agenda' });
        const t = cronometro();
        const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10_000 }).catch(() => null), botao.click()]);
        if (dl) {
          const conteudo = readFileSync(await dl.path(), 'utf8');
          salvarSaida(`g2-${prefixo}-${nome}.ics`, conteudo);
          anotar('g2', `${prefixo}-ics-${nome}`, { arquivo: dl.suggestedFilename(), bytes: conteudo.length, ms: t() });
        } else {
          anotar('g2', `${prefixo}-ics-${nome}`, { arquivo: null, motivo: 'sem download em 10 s', tentados: await page.evaluate(() => window.__downloadsTentados) });
        }
        anotar('g2', `${prefixo}-ics-${nome}-aviso`, await page.locator('#aviso-vivo').innerText().catch(() => ''));
        await foto(page, `g2-${prefixo}-passado-${nome}-apos-ics`);

        if (nome === 'futuro-21-11') {
          const antes = await texto(page);
          await page.getByRole('button', { name: 'Compartilhar este link' }).click();
          await page.waitForTimeout(400);
          const aviso2 = await page.locator('#aviso-vivo').innerText().catch(() => '');
          const clip = await page.evaluate(() => navigator.clipboard.readText().catch((e: unknown) => `(erro: ${String(e)})`)).catch((e) => `(erro: ${String(e)})`);
          anotar('g2', `${prefixo}-compartilhar`, {
            aviso: aviso2,
            mudouATela: antes !== (await texto(page)),
            clipboard: clip,
            partilhas: await page.evaluate(() => window.__partilhas),
            temShare: await page.evaluate(() => typeof navigator.share),
          });
          await foto(page, `g2-${prefixo}-compartilhar`);
          await page.getByRole('button', { name: 'QR do link' }).click();
          await page.waitForTimeout(600);
          await medirEGuardar(page, 'g2', `${prefixo}: QR do link aberto`);
          await foto(page, `g2-${prefixo}-qr-aberto`);
          await foto(page, `g2-${prefixo}-pagina-inteira`, true);
        }
        await page.close();
      }
      anotar('g2', `${prefixo}-passado-sessao`, { erros: sessao.erros, externos: sessao.externos });
    } finally {
      await sessao.fechar();
      await s.fechar();
    }
  });
}
