// Ferramenta 3: reunião com convocação, pauta e ata. Carregada sob demanda (src/main.ts).
// Duas partes na mesma tela: Convocação e Ata. O rascunho da ata fica só na memória da aba (rascunho.ts).
// Presença e ata nunca vão para link nem para o armazenamento do aparelho: saem só por impressão/PDF ou cópia.

import './reuniao.css';
import { avisar } from '../../comum/aviso';
import { ehLinkDoEvento, TAMANHO_MAXIMO } from '../../comum/entreTelas';
import { compartilhar, mensagemDoResultado } from '../../comum/compartilhar';
import { campoAreaDeTexto, campoTexto, limparTodosOsErros, mostrarErro } from '../../comum/formulario';
import { esc } from '../../comum/html';
import type { Tela } from '../../comum/tela';
import {
  encaminhamentoVazio,
  faltasDaAta,
  htmlDaAta,
  MAXIMOS,
  pontosDaPauta,
  pontoVazio,
  textoDaAta,
  type Ata,
} from './ata';
import {
  cardEncurtado,
  enderecoDoCard,
  faltasDaConvocacao,
  MAXIMO_PAUTA,
  moverItem,
  textoDaConvocacao,
  tirarItem,
} from './convocacao';
import { apagarAta, apagarConvocacao, ligarAvisoDeSaidaDaAta, rascunho } from './rascunho';

type Parte = 'convocacao' | 'ata';
type NomeDaLista = 'pauta' | 'pontos' | 'encaminhamentos';

const CAMPOS_CONVOCACAO = ['organizacao', 'data', 'hora', 'local', 'link'] as const;
const CAMPOS_ATA = ['organizacao', 'data', 'local', 'inicio', 'fim', 'presentes'] as const;

// Parte aberta: também fica só na memória, para voltar onde a pessoa estava.
let parteAberta: Parte = 'convocacao';

export const tela: Tela = (raiz) => {
  ligarAvisoDeSaidaDaAta();
  const base = document.createElement('main');
  base.className = 'tela reuniao-tela';
  raiz.replaceChildren(base);

  base.innerHTML = `<h1 tabindex="-1">Reunião: convocação, pauta e ata</h1>
    <p class="reuniao-intro">Chame o pessoal para a reunião e registre o que foi decidido. Tudo é feito neste aparelho.</p>
    <nav class="reuniao-partes" aria-label="Partes da reunião">
      <button type="button" class="botao botao-sec" data-acao="parte" data-parte="convocacao">Convocação</button>
      <button type="button" class="botao botao-sec" data-acao="parte" data-parte="ata">Ata</button>
    </nav>
    <div id="painel"></div>
    <div id="ata-saida"></div>`;

  const painel = base.querySelector<HTMLElement>('#painel')!;
  const saidaDaAta = base.querySelector<HTMLElement>('#ata-saida')!;

  function marcarParte(): void {
    base.querySelectorAll<HTMLElement>('[data-acao="parte"]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.parte === parteAberta));
    });
  }

  function limparSaidas(): void {
    const havia = saidaDaAta.innerHTML !== '' || !!painel.querySelector('#conv-saida:not(:empty)');
    if (havia) avisar('O que foi gerado deixou de valer. Gere de novo.');
    saidaDaAta.innerHTML = '';
    base.classList.remove('imprimindo-ata');
    painel.querySelector<HTMLElement>('#conv-saida')?.replaceChildren();
  }

  function desenhar(focoId = ''): void {
    saidaDaAta.innerHTML = '';
    base.classList.remove('imprimindo-ata');
    painel.innerHTML = parteAberta === 'convocacao' ? htmlDaConvocacao() : htmlDaAtaForm();
    marcarParte();
    if (focoId) painel.querySelector<HTMLElement>(`[id="${focoId}"]`)?.focus();
  }

  // ---------- lista (pauta, pontos, encaminhamentos) ----------

  function obter(nome: NomeDaLista): unknown[] {
    return nome === 'pauta' ? rascunho.convocacao.pauta : rascunho.ata[nome];
  }
  function trocar(nome: NomeDaLista, nova: unknown[]): void {
    if (nome === 'pauta') rascunho.convocacao.pauta = nova as string[];
    else if (nome === 'pontos') rascunho.ata.pontos = nova as Ata['pontos'];
    else rascunho.ata.encaminhamentos = nova as Ata['encaminhamentos'];
  }
  const limite = (nome: NomeDaLista) =>
    nome === 'pauta' ? MAXIMO_PAUTA : nome === 'pontos' ? MAXIMOS.pontos : MAXIMOS.encaminhamentos;
  const idDoPrimeiroCampo = (nome: NomeDaLista, i: number) =>
    nome === 'pauta' ? `conv-pauta-${i}` : nome === 'pontos' ? `ata-pontos-${i}-titulo` : `ata-encaminhamentos-${i}-oque`;
  const novoItem = (nome: NomeDaLista): unknown =>
    nome === 'pauta' ? '' : nome === 'pontos' ? pontoVazio() : encaminhamentoVazio();

  function agirNaLista(acao: string, nome: NomeDaLista, i: number): void {
    const lista = obter(nome);
    if (acao === 'acrescentar') {
      if (lista.length >= limite(nome)) return avisar(`Chegou ao limite de ${limite(nome)} itens.`);
      trocar(nome, [...lista, novoItem(nome)]);
      desenhar(idDoPrimeiroCampo(nome, lista.length));
      avisar(`Item ${lista.length + 1} acrescentado.`);
    } else if (acao === 'tirar') {
      trocar(nome, tirarItem(lista, i));
      const resto = lista.length - 1;
      desenhar(resto > 0 ? idDoPrimeiroCampo(nome, Math.min(i, resto - 1)) : `acrescentar-${nome}`);
      avisar(`Item ${i + 1} tirado.`);
    } else {
      const passo = acao === 'subir' ? -1 : 1;
      const destino = i + passo;
      if (destino < 0 || destino >= lista.length) return;
      trocar(nome, moverItem(lista, i, passo));
      desenhar();
      const mesmo = painel.querySelector<HTMLButtonElement>(`[id="${nome}-${destino}-${acao}"]`);
      const outro = painel.querySelector<HTMLButtonElement>(`[id="${nome}-${destino}-${acao === 'subir' ? 'descer' : 'subir'}"]`);
      (mesmo && !mesmo.disabled ? mesmo : outro)?.focus();
      avisar(`Item movido para a posição ${destino + 1}.`);
    }
  }

  // ---------- entrada de texto (sem redesenhar a tela) ----------

  base.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (!el.id || el.id === 'conv-texto') return;
    const nome = el.dataset.lista as NomeDaLista | undefined;
    if (nome) {
      const i = Number(el.dataset.i);
      const lista = obter(nome);
      if (nome === 'pauta') lista[i] = el.value;
      else (lista[i] as Record<string, string>)[el.dataset.k!] = el.value;
    } else if (el.id.startsWith('conv-') && (CAMPOS_CONVOCACAO as readonly string[]).includes(el.id.slice(5))) {
      (rascunho.convocacao as unknown as Record<string, string>)[el.id.slice(5)] = el.value;
    } else if (el.id.startsWith('ata-') && (CAMPOS_ATA as readonly string[]).includes(el.id.slice(4))) {
      (rascunho.ata as unknown as Record<string, string>)[el.id.slice(4)] = el.value;
    } else return;
    if (el.hasAttribute('aria-invalid')) {
      el.removeAttribute('aria-invalid');
      const erro = base.querySelector<HTMLElement>(`[id="${el.id}-erro"]`);
      if (erro) {
        erro.textContent = '';
        erro.hidden = true;
      }
    }
    // O que já foi gerado deixou de valer.
    limparSaidas();
  });

  // ---------- cliques ----------

  base.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-acao]');
    if (!b) return;
    const acao = b.dataset.acao!;
    const nome = b.dataset.lista as NomeDaLista | undefined;
    if (nome && ['acrescentar', 'subir', 'descer', 'tirar'].includes(acao)) return agirNaLista(acao, nome, Number(b.dataset.i));
    switch (acao) {
      case 'parte':
        parteAberta = b.dataset.parte as Parte;
        desenhar();
        avisar(parteAberta === 'ata' ? 'Parte aberta: Ata.' : 'Parte aberta: Convocação.');
        painel.querySelector<HTMLElement>('h2')?.focus();
        break;
      case 'gerar-conv':
        void gerarConvocacao();
        break;
      case 'copiar-conv':
        void copiarTexto(painel.querySelector<HTMLTextAreaElement>('#conv-texto')?.value ?? '');
        break;
      case 'compartilhar-conv': {
        const texto = painel.querySelector<HTMLTextAreaElement>('#conv-texto')?.value ?? '';
        void compartilhar({ texto, titulo: 'Convocação para reunião' }).then((r) => avisar(mensagemDoResultado(r)));
        break;
      }
      case 'limpar-conv':
        if (confirm('Limpar a convocação inteira?')) {
          apagarConvocacao();
          desenhar('conv-organizacao');
          avisar('Convocação limpa.');
        }
        break;
      case 'usar-pauta':
        usarPautaDaConvocacao();
        break;
      case 'ver-ata':
        if (montarAta()) {
          avisar('A ata está pronta, logo abaixo dos botões.');
          saidaDaAta.querySelector<HTMLElement>('h2')?.focus();
        }
        break;
      case 'imprimir-ata':
        if (montarAta()) window.print();
        break;
      case 'copiar-ata':
        if (faltasAvisadas()) void copiarTexto(textoDaAta(rascunho.ata));
        break;
      case 'apagar-ata':
        if (confirm('Apagar a ata inteira? Não dá para desfazer.')) {
          apagarAta();
          desenhar('ata-organizacao');
          avisar('Ata apagada.');
        }
        break;
    }
  });

  // ---------- convocação ----------

  async function gerarConvocacao(): Promise<void> {
    const c = rascunho.convocacao;
    limparTodosOsErros(painel);
    const faltas = faltasDaConvocacao(c);
    const link = c.link.trim();
    const linkRuim = link !== '' && (link.length > TAMANHO_MAXIMO.link || !ehLinkDoEvento(link, location.href));
    // mostrarErro leva o foco ao primeiro campo com erro; vai do último ao primeiro para terminar no primeiro.
    const erros = [
      ...faltas.map((f) => ({ id: `conv-${f.campo}`, texto: f.mensagem })),
      ...(linkRuim ? [{ id: 'conv-link', texto: 'este link não é de um evento feito neste site. Cole o link que a ferramenta Evento gerou ou deixe em branco.' }] : []),
    ];
    if (erros.length) {
      [...erros].reverse().forEach((er) => mostrarErro(painel, er.id, er.texto));
      avisar(`Faltam informações: ${erros.length} ${erros.length === 1 ? 'campo' : 'campos'} para corrigir.`);
      return;
    }
    const texto = textoDaConvocacao(c, link);
    const card = enderecoDoCard(c, link);
    const saida = painel.querySelector<HTMLElement>('#conv-saida')!;
    saida.innerHTML = `<h3 tabindex="-1">Texto para o WhatsApp</h3>
      ${campoAreaDeTexto({ id: 'conv-texto', rotulo: 'Texto pronto', dica: 'Você pode mudar o texto antes de copiar ou enviar.', valor: texto, linhas: 14 })}
      <div class="reuniao-botoes">
        <button type="button" class="botao" data-acao="copiar-conv">Copiar texto</button>
        <button type="button" class="botao botao-sec" data-acao="compartilhar-conv">Compartilhar texto</button>
        <a class="botao botao-sec" href="${esc(card)}">Fazer o card da convocação</a>
      </div>`;
    avisar(`Texto da convocação pronto, logo abaixo.${cardEncurtado(c) ? ' No card, a pauta ou o nome da organização saem mais curtos.' : ''}`);
    saida.querySelector<HTMLElement>('h3')?.focus();
  }

  async function copiarTexto(texto: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      avisar('Texto copiado. Cole onde quiser.');
    } catch {
      avisar('Não deu para copiar. Selecione o texto e copie pelo menu do aparelho.');
    }
  }

  // ---------- ata ----------

  function faltasAvisadas(): boolean {
    limparTodosOsErros(painel);
    const faltas = faltasDaAta(rascunho.ata);
    if (!faltas.length) return true;
    [...faltas].reverse().forEach((f) => mostrarErro(painel, `ata-${f.campo}`, f.mensagem));
    avisar(`Faltam informações: ${faltas.length} ${faltas.length === 1 ? 'campo' : 'campos'} para corrigir.`);
    return false;
  }

  /** Desenha a ata pronta (a folha que sai na impressão). */
  function montarAta(): boolean {
    if (!faltasAvisadas()) return false;
    saidaDaAta.innerHTML = `<h2 class="ata-titulo-tela" tabindex="-1">Ata pronta</h2>
      <article class="ata-folha" aria-label="Ata pronta">${htmlDaAta(rascunho.ata)}</article>`;
    base.classList.add('imprimindo-ata');
    return true;
  }

  function usarPautaDaConvocacao(): void {
    const pontos = pontosDaPauta(rascunho.convocacao.pauta);
    if (!pontos.length) return avisar('A convocação ainda não tem pauta.');
    const temTexto = rascunho.ata.pontos.some((p) => p.titulo.trim() || p.discutido.trim() || p.decidido.trim());
    if (temTexto && !confirm('Trocar os pontos da ata pela pauta da convocação? O que você escreveu neles será perdido.')) return;
    rascunho.ata.pontos = pontos;
    desenhar('ata-pontos-0-titulo');
    avisar('Pauta da convocação copiada para a ata.');
  }

  // ---------- HTML dos painéis ----------

  function botoesDoItem(nome: NomeDaLista, i: number, total: number, rotulo: string): string {
    const b = (acao: string, texto: string, off: boolean) =>
      `<button type="button" class="botao botao-sec" id="${nome}-${i}-${acao}" data-acao="${acao}" data-lista="${nome}" data-i="${i}"${off ? ' disabled' : ''} aria-label="${esc(texto)} ${esc(rotulo)}">${texto}</button>`;
    return `<div class="item-botoes">${b('subir', 'Subir', i === 0)}${b('descer', 'Descer', i === total - 1)}${b('tirar', 'Tirar', false)}</div>`;
  }

  function htmlDaConvocacao(): string {
    const c = rascunho.convocacao;
    const itens = c.pauta
      .map(
        (t, i) => `<li class="item">
          <label class="campo-rotulo" for="conv-pauta-${i}">Item ${i + 1}</label>
          <input class="campo-entrada" type="text" autocomplete="off" id="conv-pauta-${i}" data-lista="pauta" data-i="${i}" maxlength="120" value="${esc(t)}"${i === 0 ? ' aria-describedby="conv-pauta-erro"' : ''}>
          ${botoesDoItem('pauta', i, c.pauta.length, `item ${i + 1}`)}
        </li>`,
      )
      .join('');
    return `<section aria-labelledby="titulo-conv">
      <h2 id="titulo-conv" tabindex="-1">Convocação</h2>
      <p>Preencha e gere o texto para o WhatsApp. Se quiser, faça também o card da convocação.</p>
      ${campoTexto({ id: 'conv-organizacao', rotulo: 'Organização', obrigatorio: true, valor: c.organizacao, maximo: 80, autocomplete: 'off' })}
      ${campoTexto({ id: 'conv-data', rotulo: 'Data', tipo: 'date', obrigatorio: true, valor: c.data })}
      ${campoTexto({ id: 'conv-hora', rotulo: 'Hora', tipo: 'time', obrigatorio: true, valor: c.hora })}
      ${campoTexto({ id: 'conv-local', rotulo: 'Local', obrigatorio: true, valor: c.local, maximo: 120, autocomplete: 'off' })}
      <fieldset class="campo campo-grupo" id="conv-pauta" aria-describedby="conv-pauta-dica conv-pauta-erro">
        <legend class="campo-rotulo">Pauta <span class="campo-obrig">(obrigatório)</span></legend>
        <p class="campo-dica" id="conv-pauta-dica">Um assunto por item. Use Subir e Descer para mudar a ordem.</p>
        <ol class="reuniao-itens">${itens}</ol>
        <button type="button" class="botao botao-sec" id="acrescentar-pauta" data-acao="acrescentar" data-lista="pauta">Acrescentar item</button>
        <p class="campo-erro" id="conv-pauta-erro" hidden></p>
      </fieldset>
      ${campoTexto({ id: 'conv-link', rotulo: 'Link de um evento (se tiver)', tipo: 'url', valor: c.link, dica: 'Só vale o link de um evento feito neste site.', autocomplete: 'off' })}
      <div class="reuniao-botoes">
        <button type="button" class="botao" data-acao="gerar-conv">Gerar o texto</button>
        <button type="button" class="botao botao-sec" data-acao="limpar-conv">Limpar</button>
      </div>
      <div id="conv-saida" class="reuniao-saida"></div>
      <p class="reuniao-nota">O que você digita aqui fica só nesta aba e some ao fechar.</p>
    </section>`;
  }

  function pontoHtml(a: Ata, i: number): string {
    const p = a.pontos[i]!;
    const n = i + 1;
    return `<li class="item item-ponto">
      <label class="campo-rotulo" for="ata-pontos-${i}-titulo">Ponto ${n}: assunto</label>
      <input class="campo-entrada" type="text" autocomplete="off" id="ata-pontos-${i}-titulo" data-lista="pontos" data-i="${i}" data-k="titulo" maxlength="120" value="${esc(p.titulo)}">
      <label class="campo-rotulo" for="ata-pontos-${i}-discutido">Ponto ${n}: o que foi discutido</label>
      <textarea class="campo-entrada campo-area" rows="3" autocomplete="off" id="ata-pontos-${i}-discutido" data-lista="pontos" data-i="${i}" data-k="discutido" maxlength="${MAXIMOS.texto}">${esc(p.discutido)}</textarea>
      <label class="campo-rotulo" for="ata-pontos-${i}-decidido">Ponto ${n}: o que foi decidido</label>
      <textarea class="campo-entrada campo-area" rows="3" autocomplete="off" id="ata-pontos-${i}-decidido" data-lista="pontos" data-i="${i}" data-k="decidido" maxlength="${MAXIMOS.texto}">${esc(p.decidido)}</textarea>
      ${botoesDoItem('pontos', i, a.pontos.length, `o ponto ${n}`)}
    </li>`;
  }

  function encaminhamentoHtml(a: Ata, i: number): string {
    const e = a.encaminhamentos[i]!;
    const n = i + 1;
    const campo = (k: string, rotulo: string, tipo: string, valor: string, max = 120) =>
      `<label class="campo-rotulo" for="ata-encaminhamentos-${i}-${k}">${rotulo} (encaminhamento ${n})</label>
      <input class="campo-entrada" type="${tipo}" autocomplete="off" id="ata-encaminhamentos-${i}-${k}" data-lista="encaminhamentos" data-i="${i}" data-k="${k}"${tipo === 'text' ? ` maxlength="${max}"` : ''} value="${esc(valor)}">`;
    return `<li class="item item-ponto">
      ${campo('oque', 'O quê', 'text', e.oque, 200)}
      ${campo('quem', 'Quem', 'text', e.quem)}
      ${campo('ate', 'Até quando', 'date', e.ate)}
      <div class="item-botoes"><button type="button" class="botao botao-sec" id="encaminhamentos-${i}-tirar" data-acao="tirar" data-lista="encaminhamentos" data-i="${i}" aria-label="Tirar o encaminhamento ${n}">Tirar</button></div>
    </li>`;
  }

  function htmlDaAtaForm(): string {
    const a = rascunho.ata;
    return `<section aria-labelledby="titulo-ata">
      <h2 id="titulo-ata" tabindex="-1">Ata</h2>
      <div class="reuniao-aviso" role="note">
        <p><strong>O rascunho some ao fechar.</strong> A ata fica só na memória desta aba. Ao terminar, salve o PDF ou copie o texto.</p>
        <p>A lista de presença pode mostrar a que grupos as pessoas pertencem. Por isso ela nunca vira link e não sai deste aparelho.</p>
      </div>
      <p class="reuniao-nota">A ata é um modelo. Ela não substitui o que o estatuto da organização exige.</p>
      ${campoTexto({ id: 'ata-organizacao', rotulo: 'Organização', obrigatorio: true, valor: a.organizacao, maximo: 80, autocomplete: 'off' })}
      ${campoTexto({ id: 'ata-data', rotulo: 'Data', tipo: 'date', obrigatorio: true, valor: a.data })}
      ${campoTexto({ id: 'ata-local', rotulo: 'Local', valor: a.local, maximo: 120, autocomplete: 'off' })}
      ${campoTexto({ id: 'ata-inicio', rotulo: 'Hora de início', tipo: 'time', valor: a.inicio })}
      ${campoTexto({ id: 'ata-fim', rotulo: 'Hora do fim', tipo: 'time', valor: a.fim })}
      ${campoAreaDeTexto({ id: 'ata-presentes', rotulo: 'Presentes', dica: 'Um nome por linha.', valor: a.presentes, autocomplete: 'off', linhas: 6, maximo: MAXIMOS.presentes })}
      <h3>Pauta e decisões</h3>
      <button type="button" class="botao botao-sec" data-acao="usar-pauta">Usar a pauta da convocação</button>
      <ol class="reuniao-itens">${a.pontos.map((_, i) => pontoHtml(a, i)).join('')}</ol>
      <button type="button" class="botao botao-sec" id="acrescentar-pontos" data-acao="acrescentar" data-lista="pontos">Acrescentar ponto</button>
      <h3>Encaminhamentos</h3>
      <p class="campo-dica">O que ficou combinado: o quê, quem faz e até quando.</p>
      <ol class="reuniao-itens">${a.encaminhamentos.map((_, i) => encaminhamentoHtml(a, i)).join('')}</ol>
      <button type="button" class="botao botao-sec" id="acrescentar-encaminhamentos" data-acao="acrescentar" data-lista="encaminhamentos">Acrescentar encaminhamento</button>
      <h3>Guardar a ata</h3>
      <div class="reuniao-botoes">
        <button type="button" class="botao" data-acao="imprimir-ata">Imprimir ou salvar em PDF</button>
        <button type="button" class="botao botao-sec" data-acao="copiar-ata">Copiar o texto</button>
        <button type="button" class="botao botao-sec" data-acao="ver-ata">Ver a ata pronta</button>
        <button type="button" class="botao botao-sec" data-acao="apagar-ata">Apagar a ata</button>
      </div>
      <p class="reuniao-nota">No celular, em “Imprimir”, escolha “Salvar como PDF”.</p>
    </section>`;
  }

  desenhar();
};
