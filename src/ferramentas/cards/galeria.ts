// Galeria para revisão visual: todos os modelos × formatos × paletas, em miniatura.
// Só se chega por "#/cards/galeria" (não há botão na interface). Desenha aos poucos, para não travar.

import { esc } from '../../comum/html';
import { nivelDoAparelho } from '../../comum/nivel';
import { linkPara } from '../../comum/rotas';
import { desenharCard, FAMILIA, tamanhoDoCanvas } from './desenho';
import { exemplo } from './exemplos';
import { DEF_FORMATOS, DEF_MODELOS, FORMATOS, MODELOS_DE_CARD } from './modelos';
import { PALETAS } from './paletas';
import { textoAlternativo } from './textos';

const ESCALA = 0.25;

export function telaGaleria(raiz: HTMLElement): () => void {
  raiz.innerHTML = `<main class="tela cards-galeria">
    <h1 tabindex="-1">Galeria dos cards</h1>
    <p>Todos os modelos, formatos e paletas, em miniatura, para revisão visual.</p>
    <p><a href="${esc(linkPara('inicio'))}">Voltar ao início</a></p>
    <div id="galeria-lista"></div>
  </main>`;
  const lista = raiz.querySelector<HTMLElement>('#galeria-lista')!;
  const tarefas: (() => void)[] = [];
  const leve = nivelDoAparelho() === 'leve';

  MODELOS_DE_CARD.forEach((modelo, i) => {
    const sec = document.createElement('section');
    sec.innerHTML = `<h2>${esc(DEF_MODELOS[modelo].nome)}</h2>`;
    const dados = exemplo(modelo, i);
    for (const formato of FORMATOS) {
      const h3 = document.createElement('h3');
      h3.textContent = DEF_FORMATOS[formato].nome;
      sec.append(h3);
      const faixa = document.createElement('div');
      faixa.className = 'cards-galeria-faixa';
      for (const paleta of PALETAS) {
        const fig = document.createElement('figure');
        const canvas = document.createElement('canvas');
        const { largura, altura } = tamanhoDoCanvas(formato, ESCALA);
        canvas.width = largura;
        canvas.height = altura;
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', `${paleta.nome}. ${textoAlternativo(dados, formato)}`);
        const legenda = document.createElement('figcaption');
        legenda.textContent = paleta.nome;
        fig.append(canvas, legenda);
        faixa.append(fig);
        tarefas.push(() => {
          const ctx = canvas.getContext('2d');
          if (ctx) desenharCard(ctx, dados, formato, paleta, { escala: ESCALA, rodape: true });
        });
      }
      sec.append(faixa);
    }
    lista.append(sec);
  });

  let parado = false;
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  void (async () => {
    try {
      await Promise.all([document.fonts.load(`700 40px ${FAMILIA}`), document.fonts.load(`400 40px ${FAMILIA}`)]);
    } catch {
      // segue com a fonte do sistema
    }
    const passo = () => {
      if (parado) return;
      const lote = leve ? 2 : 6;
      for (let n = 0; n < lote && tarefas.length; n++) tarefas.shift()!();
      if (tarefas.length) temporizador = setTimeout(passo, 0);
    };
    passo();
  })();

  return () => {
    parado = true;
    if (temporizador) clearTimeout(temporizador);
  };
}
