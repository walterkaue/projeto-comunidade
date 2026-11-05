// Formulário de denúncia: descrição obrigatória e revisão antes de enviar (docs/produto.md 4.1).
// Nada é guardado nem enviado pelo site: o texto fica só na tela até a pessoa escolher como mandar o e-mail.

import { avisar } from '../comum/aviso';
import { campoAreaDeTexto, campoEscolha, limparTodosOsErros, mostrarErro } from '../comum/formulario';
import { esc, urlSegura } from '../comum/html';
import { EMAIL_CONTATO } from '../comum/marca';
import {
  LIMITES_DA_DENUNCIA,
  TIPOS_DE_PROBLEMA,
  gmailDeDenuncia,
  mailtoDeDenuncia,
  textoParaCopiar,
  validarDenuncia,
  type Denuncia,
  type ErrosDaDenuncia,
} from './denuncia';

/** Link de evento leva o conteúdo dentro e pode ser enorme: na tela, só o começo (o inteiro vai no e-mail). */
export function linkResumido(link: string, maximo = 60): string {
  return link.length <= maximo ? link : `${link.slice(0, maximo)}…`;
}

/** HTML do formulário. Com link, ele aparece como texto e não precisa dizer onde está o conteúdo. */
export function htmlDoFormulario(link: string): string {
  return `<section class="caixa denuncia" aria-labelledby="den-titulo">
    <h2 id="den-titulo">Fazer a denúncia</h2>
    ${link ? `<p>Link denunciado (o endereço inteiro vai no e-mail):</p><p class="link-denunciado">${esc(linkResumido(link))}</p>` : ''}
    <form data-denuncia novalidate>
      ${
        link
          ? ''
          : campoAreaDeTexto({
              id: 'den-onde',
              rotulo: 'Onde está o conteúdo',
              obrigatorio: true,
              dica: 'Cole o link ou descreva onde você viu.',
              maximo: LIMITES_DA_DENUNCIA.onde,
              linhas: 2,
              autocomplete: 'off',
            })
      }
      ${campoEscolha({ id: 'den-tipo', rotulo: 'Tipo de problema', obrigatorio: true, opcoes: TIPOS_DE_PROBLEMA })}
      ${campoAreaDeTexto({
        id: 'den-descricao',
        rotulo: 'O que há de errado',
        obrigatorio: true,
        dica: `Conte em poucas frases o que fere as Regras de uso. Se for mentira comprovada, cole o link da checagem ou da decisão da Justiça. Não precisa dar seu nome. Até ${LIMITES_DA_DENUNCIA.descricao} letras.`,
        maximo: LIMITES_DA_DENUNCIA.descricao,
        linhas: 5,
        autocomplete: 'off',
      })}
      <button class="botao" type="submit">Revisar a denúncia</button>
    </form>
    <div data-revisao hidden></div>
  </section>`;
}

function htmlDaRevisao(d: Denuncia): string {
  return `<h3 id="den-revisao" tabindex="-1">Confira antes de enviar</h3>
    <p>Este é o e-mail que vai para <strong>${esc(EMAIL_CONTATO)}</strong>. O site não guarda nada. Para mudar algo, toque em "Corrigir", no fim.</p>
    <div class="campo">
      <label class="campo-rotulo" for="den-texto">Texto da denúncia</label>
      <textarea class="campo-entrada campo-area" id="den-texto" rows="9" readonly>${esc(textoParaCopiar(d))}</textarea>
    </div>
    <h3>Escolha como enviar</h3>
    <a class="botao" href="${esc(urlSegura(mailtoDeDenuncia(d)))}">Enviar pelo aplicativo de e-mail</a>
    <a class="botao botao-sec" href="${esc(urlSegura(gmailDeDenuncia(d)))}" target="_blank" rel="noopener noreferrer" aria-label="Enviar pelo Gmail no navegador (abre outro site)">Enviar pelo Gmail no navegador</a>
    <p>No Gmail pelo navegador, o texto vai dentro do endereço da página e fica no histórico do navegador. Se preferir que não fique, use o aplicativo de e-mail ou copie o texto.</p>
    <p>Se nenhum dos dois abrir, copie o texto e mande de qualquer e-mail para <strong>${esc(EMAIL_CONTATO)}</strong>.</p>
    <button type="button" class="botao botao-sec" data-copiar-denuncia>Copiar o texto</button>
    <button type="button" class="botao botao-sec" data-corrigir>Corrigir</button>`;
}

/** Liga o formulário: valida, mostra a revisão e os jeitos de enviar. */
export function ligarFormulario(raiz: HTMLElement, link: string): void {
  const form = raiz.querySelector<HTMLFormElement>('[data-denuncia]');
  const revisao = raiz.querySelector<HTMLElement>('[data-revisao]');
  if (!form || !revisao) return;
  const valor = (id: string) => form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`#${id}`)?.value ?? '';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    limparTodosOsErros(form);
    const d: Denuncia = { link, onde: valor('den-onde'), tipo: valor('den-tipo'), descricao: valor('den-descricao') };
    const erros: ErrosDaDenuncia = validarDenuncia(d);
    // mostrarErro leva o foco ao primeiro campo com erro; vai do último ao primeiro para terminar no de cima.
    const ordem = ['den-descricao', 'den-tipo', 'den-onde'] as const;
    let algum = false;
    for (const id of ordem) {
      const msg = erros[id.slice(4) as keyof ErrosDaDenuncia];
      if (msg) {
        mostrarErro(form, id, msg);
        algum = true;
      }
    }
    if (algum) {
      avisar('Confira os campos marcados.');
      return;
    }
    revisao.innerHTML = htmlDaRevisao(d);
    form.hidden = true;
    revisao.hidden = false;
    revisao.querySelector<HTMLElement>('#den-revisao')?.focus();

    revisao.querySelector('[data-corrigir]')?.addEventListener('click', () => {
      revisao.hidden = true;
      revisao.innerHTML = '';
      form.hidden = false;
      form.querySelector<HTMLElement>('input, select, textarea')?.focus();
      avisar('Formulário de volta. Mude o que quiser e revise de novo.');
    });
    revisao.querySelector('[data-copiar-denuncia]')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(textoParaCopiar(d));
        avisar('Texto copiado. Cole no seu e-mail e envie.');
      } catch {
        avisar('Não deu para copiar. Toque e segure no texto para selecionar e copiar.');
      }
    });
  });
}
