// Criação do evento: formulário em `#/evento`. Valida (mesma regra da leitura), gera o link e mostra
// as saídas. Nada é guardado no aparelho nem enviado: os dados ficam só dentro do link.

import { avisar } from '../../comum/aviso';
import { linkDoCard } from '../../comum/entreTelas';
import { campoAreaDeTexto, campoTexto, limparErro, limparTodosOsErros, mostrarErro } from '../../comum/formulario';
import { esc } from '../../comum/html';
import { NOME } from '../../comum/marca';
import { linkPara } from '../../comum/rotas';
import type { Limpeza } from '../../comum/tela';
import { abrirEvento } from './abrir';
import { LINK_IDEAL, LINK_MAXIMO, codificar, linkCompleto } from './formato';
import { enderecoDoSite, ligarCompartilhar, ligarQr } from './partes';
import { CAMPOS, LIMITES, validarEvento, type Evento } from './validar';

const idDoCampo = (c: (typeof CAMPOS)[number]) => `ev-${c}`;

function formularioHtml(v: Partial<Evento>, nota: string): string {
  return `<main class="tela evento">
    <h1 tabindex="-1">Evento em um link</h1>
    ${nota ? `<p class="evento-regra" role="status">${esc(nota)}</p>` : ''}
    <p>Preencha os campos e gere um link para mandar no WhatsApp. Quem abrir o link vê a página do evento. Os dados ficam dentro do próprio link: o ${esc(NOME)} não guarda nada.</p>
    <p class="evento-regra">Por segurança, não aceitamos link, telefone, e-mail nem PIX nos campos.</p>

    <form class="evento-form" novalidate data-form>
      ${campoTexto({ id: idDoCampo('titulo'), rotulo: 'Título', obrigatorio: true, maximo: LIMITES.titulo, valor: v.titulo, dica: `Até ${LIMITES.titulo} letras. Ex.: Mutirão de limpeza da praça.` })}
      ${campoTexto({ id: idDoCampo('data'), rotulo: 'Data', tipo: 'date', obrigatorio: true, valor: v.data })}
      ${campoTexto({ id: idDoCampo('inicio'), rotulo: 'Hora de início', tipo: 'time', obrigatorio: true, valor: v.inicio })}
      ${campoTexto({ id: idDoCampo('fim'), rotulo: 'Hora de fim', tipo: 'time', valor: v.fim, dica: 'Se não souber, deixe em branco.' })}
      ${campoTexto({ id: idDoCampo('local'), rotulo: 'Local', obrigatorio: true, maximo: LIMITES.local, valor: v.local, dica: 'Escreva o endereço como se fosse procurar no mapa.', autocomplete: 'off' })}
      ${campoAreaDeTexto({ id: idDoCampo('descricao'), rotulo: 'Descrição', maximo: LIMITES.descricao, linhas: 5, valor: v.descricao, dica: `Até ${LIMITES.descricao} letras. O que vai acontecer e o que levar.` })}
      ${campoTexto({ id: idDoCampo('organizacao'), rotulo: 'Organização', maximo: LIMITES.organizacao, valor: v.organizacao, dica: 'Quem está chamando. Ex.: Associação de moradores do Bairro Novo.', autocomplete: 'off' })}
      <button class="botao" type="submit">Gerar link</button>
    </form>

    <section class="evento-pronto" tabindex="-1" aria-labelledby="ev-h-pronto" data-pronto hidden>
      <h2 id="ev-h-pronto">Seu link está pronto</h2>
      <div class="campo">
        <label class="campo-rotulo" for="ev-link">Link do evento</label>
        <input class="campo-entrada" id="ev-link" type="text" readonly data-link aria-describedby="ev-tamanho">
        <p class="campo-dica" id="ev-tamanho" data-tamanho></p>
      </div>
      <button class="botao" type="button" data-copiar>Copiar link</button>
      <button class="botao botao-sec" type="button" data-compartilhar>Compartilhar</button>
      <a class="botao botao-sec" data-ver href="#">Ver a página do evento</a>
      <button class="botao botao-sec" type="button" data-qr aria-expanded="false" aria-controls="ev-qr-area">QR do link</button>
      <div class="evento-qr-area" id="ev-qr-area" data-qr-area hidden></div>
      <a class="botao botao-sec" data-card href="#">Fazer o card deste evento</a>
    </section>
    <a class="botao botao-sec" href="${esc(linkPara('inicio'))}">Voltar ao início</a>
  </main>`;
}

function lerCampos(form: HTMLElement): Record<string, string> {
  const r: Record<string, string> = {};
  for (const c of CAMPOS) r[c] = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${idDoCampo(c)}`)?.value ?? '';
  return r;
}

function desenhar(raiz: HTMLElement, inicial: Partial<Evento>, vivo: () => boolean, nota = ''): void {
  raiz.innerHTML = formularioHtml(inicial, nota);
  const $ = <T extends HTMLElement>(sel: string): T => {
    const el = raiz.querySelector<T>(sel);
    if (!el) throw new Error(`faltou ${sel}`);
    return el;
  };
  const form = $<HTMLFormElement>('[data-form]');
  const pronto = $('[data-pronto]');
  const campoLink = $<HTMLInputElement>('[data-link]');
  const areaQr = $('[data-qr-area]');
  let atual: { link: string; evento: Evento } = { link: '', evento: {} as Evento };

  ligarCompartilhar($<HTMLButtonElement>('[data-compartilhar]'), () => atual);
  const reiniciarQr = ligarQr($<HTMLButtonElement>('[data-qr]'), areaQr, () => atual.link, vivo);

  let tentativa = 0;

  // Mexeu num campo: o erro dele some e o link pronto (que já é de antes da mudança) sai da tela.
  form.addEventListener('input', (ev) => {
    const id = (ev.target as HTMLElement | null)?.id;
    if (id) limparErro(form, id);
    if (!pronto.hidden) {
      pronto.hidden = true;
      reiniciarQr();
      atual = { link: '', evento: {} as Evento };
    }
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const minha = ++tentativa;
    limparTodosOsErros(form);
    const r = validarEvento(lerCampos(form));
    if (!r.ok) {
      pronto.hidden = true;
      for (const c of CAMPOS) {
        const m = r.erros[c];
        if (m) mostrarErro(form, idDoCampo(c), m);
      }
      avisar('Confira os campos com erro.');
      return;
    }
    const dados = await codificar(r.evento);
    if (!vivo() || minha !== tentativa) return;
    const link = linkCompleto(dados, enderecoDoSite());
    if (link.length > LINK_MAXIMO) {
      pronto.hidden = true;
      mostrarErro(form, idDoCampo('descricao'), 'O link ficou grande demais. Encurte a descrição ou o local.');
      avisar('O link ficou grande demais.');
      return;
    }
    atual = { link, evento: r.evento };
    campoLink.value = link;
    $('[data-tamanho]').textContent =
      link.length > LINK_IDEAL
        ? `O link tem ${link.length} caracteres e ficou comprido: pode ser cortado em algumas conversas. Encurte a descrição para diminuir.`
        : `O link tem ${link.length} caracteres.`;
    $('[data-ver]').setAttribute('href', linkPara('evento', dados));
    $('[data-card]').setAttribute(
      'href',
      linkDoCard({
        modelo: 'evento',
        titulo: r.evento.titulo,
        data: r.evento.data,
        hora: r.evento.inicio,
        local: r.evento.local,
        texto: r.evento.descricao,
        organizacao: r.evento.organizacao,
        link,
      }),
    );
    reiniciarQr();
    pronto.hidden = false;
    pronto.focus();
    avisar('Link pronto.');
  });

  $('[data-copiar]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(atual.link);
      avisar('Link copiado.');
    } catch {
      campoLink.focus();
      campoLink.select();
      avisar('Não deu para copiar sozinho. O link está selecionado: copie pelo menu do teclado.');
    }
  });
  campoLink.addEventListener('focus', () => campoLink.select());
}

/** Tela `#/evento` (formulário) ou `#/evento/editar/<dados>` (formulário já preenchido com o evento do link). */
export function telaCriar(raiz: HTMLElement, aEditar?: string): Limpeza {
  let aberta = true;
  const vivo = () => aberta;
  if (!aEditar) {
    desenhar(raiz, {}, vivo);
    return () => {
      aberta = false;
    };
  }
  raiz.innerHTML = `<main class="tela evento" aria-busy="true"><h1 tabindex="-1">Evento em um link</h1><p role="status">Abrindo os dados do evento…</p></main>`;
  void abrirEvento(aEditar)
    .then((r) => {
      if (!vivo()) return;
      if (r.estado === 'ok') {
        desenhar(raiz, r.evento, vivo, 'Dados do evento carregados. Mude o que quiser e gere um novo link.');
      } else if (r.estado === 'bloqueado') {
        desenhar(raiz, {}, vivo, 'Este link foi removido após denúncia e não pode ser usado como modelo.');
      } else {
        desenhar(raiz, {}, vivo, 'Não deu para abrir os dados desse link. Preencha o formulário do começo.');
      }
      raiz.querySelector<HTMLElement>('h1')?.focus();
    })
    .catch(() => {
      if (!vivo()) return;
      desenhar(raiz, {}, vivo, 'Não deu para abrir os dados desse link. Preencha o formulário do começo.');
      raiz.querySelector<HTMLElement>('h1')?.focus();
    });
  return () => {
    aberta = false;
  };
}
