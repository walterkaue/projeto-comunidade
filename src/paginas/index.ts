// Páginas institucionais (Sobre, Termos, Privacidade, Regras de uso, Como denunciar, Contato).
// Carregadas sob demanda. Os textos ficam em textos/*.ts.

import './paginas.css';
import { EMAIL_CONTATO } from '../comum/marca';
import { lerLinkDenunciado } from '../comum/entreTelas';
import { esc, urlSegura } from '../comum/html';
import { linkPara, type NomeDaRota } from '../comum/rotas';
import type { Tela } from '../comum/tela';
import { apagarDadosDoSite } from './apagar';
import { avisar } from '../comum/aviso';
import { htmlDoFormulario, ligarFormulario } from './formularioDenuncia';
import { paginaEmHtml } from './render';
import { PAGINAS } from './textos';

export const TITULOS: Partial<Record<NomeDaRota, string>> = Object.fromEntries(
  Object.entries(PAGINAS).map(([rota, p]) => [rota, p.titulo]),
);

const voltar = `<a class="botao botao-sec" href="${linkPara('inicio')}">Voltar ao início</a>`;

const botaoDeEmail = (href: string, texto: string) => `<a class="botao" href="${esc(urlSegura(href))}">${esc(texto)}</a>`;

const avisoDeLinkInvalido = `<p class="caixa" role="note">Não reconhecemos este link como de um evento deste site. Diga no formulário onde está o conteúdo.</p>`;

const caixaDeContato = () => `<section class="caixa" aria-labelledby="ct-titulo">
    <h2 id="ct-titulo">Nosso e-mail</h2>
    <p class="email">${esc(EMAIL_CONTATO)}</p>
    ${botaoDeEmail(`mailto:${EMAIL_CONTATO}`, 'Escrever um e-mail')}
    <button type="button" class="botao botao-sec" data-copiar-email>Copiar o endereço</button>
    <p>Se o botão não abrir o seu e-mail, copie o endereço e escreva de onde quiser.</p>
  </section>`;

const caixaDeApagar = () => `<section class="caixa" aria-labelledby="ap-titulo">
    <h2 id="ap-titulo">Apagar o que o site guardou</h2>
    <p>O endereço deste site é dividido com outros projetos. Por isso o botão apaga só o que é daqui: os rascunhos e preferências com nome "pc:" e a cópia do site para uso sem internet. Não mexe no resto.</p>
    <p>Depois de apagar, o site precisa de internet na próxima vez que você abrir. O uso sem internet volta aos poucos, só para o que você abrir.</p>
    <button type="button" class="botao botao-sec" data-apagar>Apagar tudo que este site guardou neste aparelho</button>
    <p class="resultado" role="status" data-resultado></p>
  </section>`;

export const tela: Tela = (raiz, rota) => {
  const pagina = PAGINAS[rota.nome] ?? PAGINAS.sobre;
  if (!pagina) return;
  let meio = '';
  let link = '';
  if (rota.nome === 'denunciar') {
    link = lerLinkDenunciado(rota.resto, location.href);
    meio = (rota.resto && !link ? avisoDeLinkInvalido : '') + htmlDoFormulario(link);
  }
  if (rota.nome === 'contato') meio = caixaDeContato();
  // A caixa de apagar vai depois das seções, na Privacidade.
  const depois = rota.nome === 'privacidade' ? caixaDeApagar() : '';
  raiz.innerHTML = `<main class="tela pagina">
    ${paginaEmHtml(pagina, meio)}${depois}
    ${voltar}
  </main>`;

  const copiar = async (texto: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      avisar(ok);
    } catch {
      avisar('Não deu para copiar. Toque e segure no texto para selecionar e copiar.');
    }
  };
  if (rota.nome === 'denunciar') ligarFormulario(raiz, link);
  raiz.querySelector('[data-copiar-email]')?.addEventListener('click', () => void copiar(EMAIL_CONTATO, 'Endereço copiado.'));

  const botao = raiz.querySelector<HTMLButtonElement>('[data-apagar]');
  const resultado = raiz.querySelector<HTMLElement>('[data-resultado]');
  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
  botao?.addEventListener('click', async () => {
    if (botao.getAttribute('aria-disabled') === 'true') return;
    if (resultado) resultado.textContent = '';
    botao.setAttribute('aria-disabled', 'true');
    try {
      const r = await apagarDadosDoSite();
      const msg = `Pronto. Apagamos ${plural(r.chaves, 'item guardado', 'itens guardados')} e ${plural(r.caches, 'cópia do site', 'cópias do site')}.`;
      if (resultado) resultado.textContent = msg;
    } catch {
      if (resultado) resultado.textContent = 'Não deu para apagar. Tente de novo.';
    } finally {
      botao.removeAttribute('aria-disabled');
    }
  });
};
