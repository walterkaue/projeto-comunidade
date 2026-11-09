// Ata da reunião ("Depois da reunião", rota #/ata). Carregada sob demanda (src/main.ts).
// A convocação é feita pelo fluxo (#/fazer/reuniao); aqui fica só a ata. O rascunho vive só na memória da aba (rascunho.ts).
// Presença e ata nunca vão para link nem para o armazenamento do aparelho: saem só por impressão/PDF ou cópia.

import './reuniao.css';
import { avisar } from '../../comum/aviso';
import { ATRIBUTOS_SEM_CORRETOR, campoAreaDeTexto, campoTexto, limparTodosOsErros, mostrarErro } from '../../comum/formulario';
import { esc } from '../../comum/html';
import { icone } from '../../comum/icones';
import { linkPara } from '../../comum/rotas';
import type { Tela } from '../../comum/tela';
import {
  AVISO_AO_COPIAR_A_ATA,
  encaminhamentoVazio,
  faltasDaAta,
  htmlDaAta,
  MAXIMOS,
  pontosDaPauta,
  pontoVazio,
  textoDaAta,
  type Ata,
} from './ata';
import { moverItem, tirarItem } from './convocacao';
import { exemploDeOrganizacao, sorteioDoRodizio } from '../cards/exemplos';
import { apagarAta, apagarConvocacao, ligarAvisoDeSaidaDaAta, rascunho } from './rascunho';

type NomeDaLista = 'pontos' | 'encaminhamentos';

const CAMPOS_ATA = ['organizacao', 'data', 'local', 'inicio', 'fim', 'presentes'] as const;

export const tela: Tela = (raiz) => {
  ligarAvisoDeSaidaDaAta();
  const base = document.createElement('main');
  base.className = 'tela reuniao-tela';
  base.dataset.porta = 'reuniao';
  // Corretor ortográfico desligado na tela toda (os campos também levam o atributo): o corretor "avançado"
  // do Chrome e o do Edge mandam o texto para fora, e a lista de presença não pode sair do aparelho.
  base.spellcheck = false;
  raiz.replaceChildren(base);

  // Exemplo cinza do campo Organização: rodízio dos exemplos, fixo enquanto a tela está aberta.
  const exemploOrg = exemploDeOrganizacao(sorteioDoRodizio());

  // O h1 tem as duas partes juntas: o leitor de tela ouve "Depois da reunião: a ata" (o texto de antes; a maiúscula de "A ata" vem do CSS, ::first-letter). O aria-label fixa o nome: sem ele, o Chrome lia "reunião : a ata" por causa do span escondido.
  base.innerHTML = `<header class="reuniao-topo">
      <h1 tabindex="-1" aria-label="Depois da reunião: a ata"><span class="ata-antes"><span class="icone-quadro icone-quadro-p">${icone('ata', { tamanho: 18 })}</span> <span>Depois da reunião<span class="so-leitor">:</span></span></span> <span class="ata-titulo-h1">a ata</span></h1>
      <p class="reuniao-intro">Escreva o que foi decidido. A ata fica só neste aparelho.</p>
    </header>
    <div id="painel"></div>
    <div id="ata-saida"></div>
    <a class="botao botao-sec" href="${linkPara('inicio')}">Voltar ao início</a>`;

  const painel = base.querySelector<HTMLElement>('#painel')!;
  const saidaDaAta = base.querySelector<HTMLElement>('#ata-saida')!;

  function limparSaidas(): void {
    if (saidaDaAta.innerHTML !== '') avisar('O que foi gerado deixou de valer. Gere de novo.');
    saidaDaAta.innerHTML = '';
    base.classList.remove('imprimindo-ata');
  }

  function desenhar(focoId = ''): void {
    saidaDaAta.innerHTML = '';
    base.classList.remove('imprimindo-ata');
    painel.innerHTML = htmlDaAtaForm();
    if (focoId) painel.querySelector<HTMLElement>(`[id="${focoId}"]`)?.focus();
  }

  // ---------- lista (pontos e encaminhamentos) ----------

  function obter(nome: NomeDaLista): unknown[] {
    return rascunho.ata[nome];
  }
  function trocar(nome: NomeDaLista, nova: unknown[]): void {
    if (nome === 'pontos') rascunho.ata.pontos = nova as Ata['pontos'];
    else rascunho.ata.encaminhamentos = nova as Ata['encaminhamentos'];
  }
  const limite = (nome: NomeDaLista) =>
    nome === 'pontos' ? MAXIMOS.pontos : MAXIMOS.encaminhamentos;
  const idDoPrimeiroCampo = (nome: NomeDaLista, i: number) =>
    nome === 'pontos' ? `ata-pontos-${i}-titulo` : `ata-encaminhamentos-${i}-oque`;
  const novoItem = (nome: NomeDaLista): unknown =>
    nome === 'pontos' ? pontoVazio() : encaminhamentoVazio();

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
    if (!el.id) return;
    const nome = el.dataset.lista as NomeDaLista | undefined;
    if (nome) {
      const i = Number(el.dataset.i);
      const lista = obter(nome);
      (lista[i] as Record<string, string>)[el.dataset.k!] = el.value;
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
          // A pauta que veio do fluxo também some: "Usar a pauta da reunião" não volta depois de apagar.
          apagarConvocacao();
          desenhar('ata-organizacao');
          avisar('Ata apagada.');
        }
        break;
    }
  });

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
    if (!pontos.length) return avisar('A reunião ainda não tem pauta.');
    const temTexto = rascunho.ata.pontos.some((p) => p.titulo.trim() || p.discutido.trim() || p.decidido.trim());
    if (temTexto && !confirm('Trocar os pontos da ata pela pauta da reunião? O que você escreveu neles será perdido.')) return;
    rascunho.ata.pontos = pontos;
    desenhar('ata-pontos-0-titulo');
    avisar('Pauta da reunião copiada para a ata.');
  }

  // ---------- HTML dos painéis ----------

  function botoesDoItem(nome: NomeDaLista, i: number, total: number, rotulo: string): string {
    const b = (acao: string, texto: string, off: boolean) =>
      `<button type="button" class="botao botao-sec" id="${nome}-${i}-${acao}" data-acao="${acao}" data-lista="${nome}" data-i="${i}"${off ? ' disabled' : ''} aria-label="${esc(texto)} ${esc(rotulo)}">${texto}</button>`;
    return `<div class="item-botoes">${b('subir', 'Subir', i === 0)}${b('descer', 'Descer', i === total - 1)}${b('tirar', 'Tirar', false)}</div>`;
  }

  function pontoHtml(a: Ata, i: number): string {
    const p = a.pontos[i]!;
    const n = i + 1;
    return `<li class="item item-ponto">
      <label class="campo-rotulo" for="ata-pontos-${i}-titulo">Ponto ${n}: assunto</label>
      <input class="campo-entrada" type="text" autocomplete="off"${ATRIBUTOS_SEM_CORRETOR} id="ata-pontos-${i}-titulo" data-lista="pontos" data-i="${i}" data-k="titulo" maxlength="120" value="${esc(p.titulo)}">
      <label class="campo-rotulo" for="ata-pontos-${i}-discutido">Ponto ${n}: o que foi discutido</label>
      <textarea class="campo-entrada campo-area" rows="3" autocomplete="off"${ATRIBUTOS_SEM_CORRETOR} id="ata-pontos-${i}-discutido" data-lista="pontos" data-i="${i}" data-k="discutido" maxlength="${MAXIMOS.texto}">${esc(p.discutido)}</textarea>
      <label class="campo-rotulo" for="ata-pontos-${i}-decidido">Ponto ${n}: o que foi decidido</label>
      <textarea class="campo-entrada campo-area" rows="3" autocomplete="off"${ATRIBUTOS_SEM_CORRETOR} id="ata-pontos-${i}-decidido" data-lista="pontos" data-i="${i}" data-k="decidido" maxlength="${MAXIMOS.texto}">${esc(p.decidido)}</textarea>
      ${botoesDoItem('pontos', i, a.pontos.length, `o ponto ${n}`)}
    </li>`;
  }

  function encaminhamentoHtml(a: Ata, i: number): string {
    const e = a.encaminhamentos[i]!;
    const n = i + 1;
    const campo = (k: string, rotulo: string, tipo: string, valor: string, max = 120) =>
      `<label class="campo-rotulo" for="ata-encaminhamentos-${i}-${k}">${rotulo} (combinado ${n})</label>
      <input class="campo-entrada" type="${tipo}" autocomplete="off"${ATRIBUTOS_SEM_CORRETOR} id="ata-encaminhamentos-${i}-${k}" data-lista="encaminhamentos" data-i="${i}" data-k="${k}"${tipo === 'text' ? ` maxlength="${max}"` : ''} value="${esc(valor)}">`;
    return `<li class="item item-ponto">
      ${campo('oque', 'O quê', 'text', e.oque, 200)}
      ${campo('quem', 'Quem', 'text', e.quem)}
      ${campo('ate', 'Até quando', 'date', e.ate)}
      <div class="item-botoes"><button type="button" class="botao botao-sec" id="encaminhamentos-${i}-tirar" data-acao="tirar" data-lista="encaminhamentos" data-i="${i}" aria-label="Tirar o combinado ${n}">Tirar</button></div>
    </li>`;
  }

  function htmlDaAtaForm(): string {
    const a = rascunho.ata;
    return `<section aria-labelledby="titulo-ata">
      <h2 id="titulo-ata">Ata</h2>
      <div class="cartao reuniao-avisos" role="note">
        <div class="reuniao-aviso">${icone('relogio', { classe: 'reuniao-aviso-icone' })}<p><strong>O rascunho some ao fechar.</strong> A ata fica só na memória desta aba. Ao terminar, salve o PDF ou copie o texto.</p></div>
        <div class="reuniao-aviso">${icone('pessoas', { classe: 'reuniao-aviso-icone' })}<p>A lista de presença pode mostrar a que organização cada pessoa pertence. Ela fica só neste aparelho. Mande o PDF só para quem precisa dele.</p></div>
        <div class="reuniao-aviso">${icone('cadeado', { classe: 'reuniao-aviso-icone' })}<p>O corretor ortográfico do navegador fica desligado aqui. O teclado do celular ainda pode aprender as palavras digitadas.</p></div>
      </div>
      <p class="reuniao-nota reuniao-estatuto">${icone('livro', { classe: 'reuniao-aviso-icone' })}<span>A ata é um modelo. Ela não substitui o que o estatuto da organização exige. Confira no estatuto quem convoca, o quórum e quem assina.</span></p>
      ${campoTexto({ id: 'ata-organizacao', rotulo: 'Organização', obrigatorio: true, exemplo: exemploOrg, valor: a.organizacao, maximo: 80, autocomplete: 'off', semCorretor: true })}
      ${campoTexto({ id: 'ata-data', rotulo: 'Data', tipo: 'date', obrigatorio: true, valor: a.data })}
      ${campoTexto({ id: 'ata-local', rotulo: 'Local', valor: a.local, maximo: 120, autocomplete: 'off', semCorretor: true })}
      ${campoTexto({ id: 'ata-inicio', rotulo: 'Hora de início', tipo: 'time', valor: a.inicio })}
      ${campoTexto({ id: 'ata-fim', rotulo: 'Hora do fim', tipo: 'time', valor: a.fim })}
      ${campoAreaDeTexto({ id: 'ata-presentes', rotulo: 'Presentes', dica: 'Um nome por linha.', valor: a.presentes, autocomplete: 'off', semCorretor: true, linhas: 6, maximo: MAXIMOS.presentes })}
      <h3>Pauta e decisões</h3>
      ${pontosDaPauta(rascunho.convocacao.pauta).length ? '<button type="button" class="botao botao-sec" data-acao="usar-pauta">Usar a pauta da reunião</button>' : ''}
      <ol class="reuniao-itens">${a.pontos.map((_, i) => pontoHtml(a, i)).join('')}</ol>
      <button type="button" class="botao botao-sec" id="acrescentar-pontos" data-acao="acrescentar" data-lista="pontos">Acrescentar ponto</button>
      <h3>O que ficou combinado</h3>
      <p class="campo-dica">O quê, quem faz e até quando.</p>
      <ol class="reuniao-itens">${a.encaminhamentos.map((_, i) => encaminhamentoHtml(a, i)).join('')}</ol>
      <button type="button" class="botao botao-sec" id="acrescentar-encaminhamentos" data-acao="acrescentar" data-lista="encaminhamentos">Acrescentar o que ficou combinado</button>
      <h3>Salvar ou copiar a ata</h3>
      <div class="reuniao-botoes">
        <button type="button" class="botao" data-acao="imprimir-ata">Salvar em PDF</button>
        <button type="button" class="botao botao-sec" data-acao="copiar-ata" aria-describedby="ata-nota-copiar">Copiar o texto</button>
        <button type="button" class="botao botao-sec" data-acao="ver-ata">Ver a ata pronta</button>
        <button type="button" class="botao botao-sec" data-acao="apagar-ata">Apagar a ata</button>
      </div>
      <p class="reuniao-nota" id="ata-nota-copiar">${AVISO_AO_COPIAR_A_ATA}</p>
      <p class="reuniao-nota">Vai abrir a janela de imprimir. Nela, escolha salvar em PDF.</p>
    </section>`;
  }

  desenhar();
};
