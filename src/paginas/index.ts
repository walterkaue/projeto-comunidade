// Páginas institucionais (Sobre, Termos, Privacidade, Regras de uso, Como denunciar, Contato).
// Carregadas sob demanda. Os textos ficam em textos/*.ts.

import './paginas.css';
import { EMAIL_CONTATO } from '../comum/marca';
import { lerLinkDenunciado } from '../comum/entreTelas';
import { esc, urlSegura } from '../comum/html';
import { linkPara, type NomeDaRota } from '../comum/rotas';
import type { Tela } from '../comum/tela';
import { apagarDadosDoSite } from './apagar';
import { mailtoDeDenuncia } from './denuncia';
import { paginaEmHtml } from './render';
import { PAGINAS } from './textos';

export const TITULOS: Partial<Record<NomeDaRota, string>> = Object.fromEntries(
  Object.entries(PAGINAS).map(([rota, p]) => [rota, p.titulo]),
);

const voltar = `<a class="botao botao-sec" href="${linkPara('inicio')}">Voltar ao início</a>`;

const botaoDeEmail = (href: string, texto: string) => `<a class="botao" href="${esc(urlSegura(href))}">${esc(texto)}</a>`;

function caixaDeDenuncia(link: string): string {
  if (!link) return '';
  return `<section class="caixa" aria-labelledby="den-titulo">
    <h2 id="den-titulo">Link que você quer denunciar</h2>
    <p class="link-denunciado">${esc(link)}</p>
    ${botaoDeEmail(mailtoDeDenuncia(link), 'Enviar denúncia por e-mail')}
    <p>Vai abrir o seu aplicativo de e-mail, com o link já escrito. Conte o motivo e envie.</p>
  </section>`;
}

const caixaDeContato = () => `<section class="caixa" aria-labelledby="ct-titulo">
    <h2 id="ct-titulo">Nosso e-mail</h2>
    <p class="email">${esc(EMAIL_CONTATO)}</p>
    ${botaoDeEmail(`mailto:${EMAIL_CONTATO}`, 'Escrever um e-mail')}
  </section>`;

const caixaDeApagar = () => `<section class="caixa" aria-labelledby="ap-titulo">
    <h2 id="ap-titulo">Apagar o que o site guardou</h2>
    <p>O endereço deste site é dividido com outros projetos. Por isso o botão apaga só o que é daqui: os rascunhos e preferências com nome "pc:" e a cópia do site para uso sem internet. Não mexe no resto.</p>
    <p>Depois de apagar, o site precisa de internet na próxima vez que você abrir.</p>
    <button type="button" class="botao botao-sec" data-apagar>Apagar tudo que este site guardou neste aparelho</button>
    <p class="resultado" role="status" data-resultado></p>
  </section>`;

export const tela: Tela = (raiz, rota) => {
  const pagina = PAGINAS[rota.nome] ?? PAGINAS.sobre;
  if (!pagina) return;
  let meio = '';
  if (rota.nome === 'denunciar') {
    const link = lerLinkDenunciado(rota.resto, location.href);
    meio = link ? caixaDeDenuncia(link) : '';
  }
  if (rota.nome === 'contato') meio = caixaDeContato();
  // A caixa de apagar vai depois das seções, na Privacidade.
  const depois = rota.nome === 'privacidade' ? caixaDeApagar() : '';
  const extra = rota.nome === 'denunciar' ? botaoDeEmail(mailtoDeDenuncia(''), 'Escrever denúncia por e-mail') : '';
  raiz.innerHTML = `<main class="tela pagina">
    ${paginaEmHtml(pagina, meio)}${depois}${rota.nome === 'denunciar' && !meio ? extra : ''}
    ${voltar}
  </main>`;

  const botao = raiz.querySelector<HTMLButtonElement>('[data-apagar]');
  const resultado = raiz.querySelector<HTMLElement>('[data-resultado]');
  botao?.addEventListener('click', async () => {
    botao.disabled = true;
    try {
      const r = await apagarDadosDoSite();
      if (resultado) resultado.textContent = `Pronto. Apagamos ${r.chaves} item(ns) guardado(s) e ${r.caches} cópia(s) do site.`;
    } catch {
      if (resultado) resultado.textContent = 'Não deu para apagar. Tente de novo.';
    } finally {
      botao.disabled = false;
    }
  });
};
