// Peças puras das telas do fluxo (sem DOM): paleta, miniatura, avisos, agendador do redesenho.
// O que depende do navegador fica em previa.ts, passos.ts e pronto.ts.

import { mensagemDoResultado, type Resultado } from '../../comum/compartilhar';
import { dadosDoLinkDoEvento } from '../../comum/entreTelas';
import type { Nivel } from '../../comum/nivel';
import { linkPara } from '../../comum/rotas';
import { DEF_FORMATOS, nomeDoArquivo, type Formato } from '../cards/modelos';
import { aplicarCorLivre, PALETA_PADRAO, paletaPorId, type Paleta } from '../cards/paletas';
import { textoAlternativo } from '../cards/textos';
import { camposDoCard, camposDoPasso2, type CampoDoFluxo, type DadosDoFluxo, type Tipo } from './estado';

/** A paleta que o card usa: a cor livre (com o contraste já ajustado) ou uma das seis. */
export function paletaDoFluxo(d: Pick<DadosDoFluxo, 'paletaId' | 'corLivre'>): Paleta {
  if (d.paletaId === 'livre') return aplicarCorLivre(d.corLivre).paleta ?? PALETA_PADRAO;
  return paletaPorId(d.paletaId);
}

export const ALTURA_DA_MINIATURA = 96;

/** Escala que deixa o card com `altura` px de CSS (vezes a densidade, para ficar nítido). */
export function escalaDaMiniatura(formato: Formato, altura = ALTURA_DA_MINIATURA, densidade = 2): number {
  return (altura * densidade) / DEF_FORMATOS[formato].altura;
}

/** Espera antes de redesenhar enquanto a pessoa digita (aparelho leve espera mais). */
export const esperaDoRedesenho = (nivel: Nivel): number => (nivel === 'leve' ? 900 : 450);

/** Campos de cada passo, na ordem da tela. */
export function camposDoPasso(tipo: Tipo, passo: 1 | 2): CampoDoFluxo[] {
  if (passo === 2) return [...camposDoPasso2(tipo)];
  return ['titulo', 'organizacao', tipo === 'reuniao' ? 'pauta' : 'texto'];
}

/** "Confira 1 campo." / "Confira 3 campos." */
export const avisoDeErros = (n: number): string => `Confira ${n} ${n === 1 ? 'campo' : 'campos'}.`;

/** Aviso depois de "Mandar no WhatsApp". Vazio = a pessoa cancelou, não avisar. */
export function avisoDoCompartilhamento(r: Resultado): string {
  if (r === 'copiado') return 'Texto copiado. Baixe a imagem e mande junto no WhatsApp.';
  if (r === 'falhou') return 'Não deu para abrir o menu. Use Baixar a imagem e Copiar só o texto.';
  return mensagemDoResultado(r);
}

export const MENSAGEM_DO_LINK_GRANDE = 'O link ficou grande demais. Encurte a pauta ou o texto em Mudar algo.';
/**
 * O toque num botão do Pronto precisa antes perguntar? Sim enquanto algum campo for do exemplo e a pessoa ainda
 * não confirmou nesta visita ao Pronto (quem monta a tela guarda o "já confirmou"; visita nova começa sem ele).
 */
export const precisaConfirmar = (camposDoExemplo: readonly unknown[], jaConfirmou: boolean): boolean =>
  camposDoExemplo.length > 0 && !jaConfirmou;

/** Ids do `aria-describedby`: o aviso do exemplo primeiro (se houver), depois as dicas do próprio botão. */
export const idsDaDescricao = (temAviso: boolean, ...dicas: string[]): string =>
  [...(temAviso ? ['fluxo-aviso-exemplo'] : []), ...dicas].join(' ');

export const MENSAGEM_LINK_COM_EXEMPLO = 'O link é criado quando você trocar o exemplo pelo seu.';
export const MENSAGEM_LINK_REMOVIDO = 'Um evento igual a este foi removido do site. O link não vai abrir.';
export const MENSAGEM_SEM_LINK = 'Não deu para criar o link do evento. Confira o texto em Mudar algo.';

/**
 * Endereço interno da página do evento ("#/evento/<dados>"). `base` é o endereço DESTE site (location.href ou
 * enderecoDoSite()), nunca o próprio link: só passa link que seja deste site. Os dados só passam se forem de um
 * link deste site (letras sem acento, números, "-" e "_"), então o endereço relativo é seguro sem urlSegura
 * (que barraria o "#"). Sem link válido, volta vazio.
 */
export function enderecoDaPaginaDoEvento(link: string, base: string): string {
  const dados = dadosDoLinkDoEvento(link, base);
  return dados ? linkPara('evento', dados) : '';
}

export const nomeDoArquivoDoFluxo = (d: Pick<DadosDoFluxo, 'tipo' | 'formato'>, formato: Formato = d.formato): string =>
  nomeDoArquivo(d.tipo, formato);

/** Texto alternativo do card desenhado. */
export const descricaoDaImagem = (d: DadosDoFluxo, formato: Formato, link = '', comQr = false): string =>
  textoAlternativo(camposDoCard(d, link), formato, comQr);

export interface Agendador {
  agendar(): void;
  cancelar(): void;
}

/** Roda `acao` depois de `espera` ms sem novo pedido (cada pedido novo reinicia a contagem). */
export function criarAgendador(espera: number, acao: () => void): Agendador {
  let t: ReturnType<typeof setTimeout> | undefined;
  return {
    agendar() {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        t = undefined;
        acao();
      }, espera);
    },
    cancelar() {
      if (t) clearTimeout(t);
      t = undefined;
    },
  };
}
