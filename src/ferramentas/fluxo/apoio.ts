// Peças puras das telas do fluxo (sem DOM): paleta, miniatura, avisos, agendador do redesenho.
// O que depende do navegador fica em previa.ts, passos.ts e pronto.ts.

import { mensagemDoResultado, type Resultado } from '../../comum/compartilhar';
import type { NomeDoIcone } from '../../comum/icones';
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

/** Ícone de cada formato no passo 3: celular (Status), conversa (Grupo) e impressora (Cartaz). */
export const ICONE_DO_FORMATO: Record<Formato, NomeDoIcone> = { status: 'celular', conversa: 'conversa', cartaz: 'imprimir' };

export const ALTURA_DA_MINIATURA = 54;

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
  if (r === 'texto') return 'A imagem não foi junto. Toque em Baixar a imagem e mande no WhatsApp.';
  if (r === 'copiado') return 'Texto copiado. Baixe a imagem e mande junto no WhatsApp.';
  if (r === 'falhou') return 'Não deu para abrir o menu. Use Baixar a imagem e Copiar só o texto.';
  return mensagemDoResultado(r);
}

/** O aparelho tem menu de compartilhar? É a mesma condição com que `compartilhar` cai na cópia do texto. */
export const temMenuDeCompartilhar = (nav: { share?: unknown } = navigator): boolean => typeof nav.share === 'function';

/** Dica embaixo de "Mandar no WhatsApp", conforme o aparelho e o formato escolhido. */
export function dicaDoMandar(formato: Formato, temMenu: boolean): string {
  if (!temMenu) return 'Copia o texto. Depois, baixe a imagem e mande as duas no WhatsApp.';
  if (formato === 'status') return 'Abre o menu do celular. Escolha o WhatsApp e depois o seu status.';
  return 'Abre o menu do celular. Escolha o WhatsApp e a conversa.';
}

export const MENSAGEM_DE_BAIXAR = 'Se a imagem não aparecer em Downloads ou na galeria, abra este site no Chrome ou no Safari.';

/** Nota embaixo de "Imprimir cartaz": o que o cartaz corta com "…". Vazio = não corta nada. */
export function notaDoCorte(cortes: readonly ('local' | 'organizacao')[]): string {
  const local = cortes.includes('local');
  const org = cortes.includes('organizacao');
  if (local && org) return 'O cartaz corta o endereço e o nome da organização. Encurte os dois.';
  if (local) return 'O cartaz corta o endereço. Encurte o local.';
  if (org) return 'O cartaz corta o nome da organização. Encurte a organização.';
  return '';
}

export const MENSAGEM_DO_LINK_GRANDE = 'O link ficou grande demais. Encurte a pauta ou o texto em Mudar algo.';
/**
 * O toque num botão do Pronto precisa antes perguntar? Sim se a mensagem vai sem o link (e a pessoa ainda não
 * confirmou isso) ou se falta a pergunta do órgão público (dados de link).
 */
export const precisaConfirmar = (semLink: boolean, orgao: boolean): boolean => semLink || orgao;

export const AVISO_SEM_LINK_NO_PAINEL = 'A mensagem vai sem o link do evento.';

/** Frase do painel de confirmação: a pergunta do órgão (se houver) e o aviso do link que falta. */
export const frasePainel = (semLink: boolean, perguntaDoOrgao = ''): string =>
  [perguntaDoOrgao, semLink ? AVISO_SEM_LINK_NO_PAINEL : ''].filter(Boolean).join(' ');

/** "Tentar de novo" só é o primeiro botão do painel quando a falta de rede é o único motivo. */
export const soFaltaARede = (semRede: boolean, semLink: boolean, orgao: boolean): boolean => semRede && semLink && !orgao;

export const AVISO_FAZER_OUTRO = 'Fazer outro apaga tudo o que você escreveu neste aparelho.';

export const MENSAGEM_LINK_REMOVIDO = 'Um evento igual a este foi removido do site. O link não vai abrir.';
export const MENSAGEM_SEM_LINK = 'Não deu para criar o link do evento. Confira o texto em Mudar algo.';
export const MENSAGEM_SEM_INTERNET = 'Sem internet: o link do evento não foi criado. Toque em Tentar de novo quando a rede voltar.';

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

/** Começo do nome da prévia dos passos 1 e 2 quando ela usa o exemplo em algum campo vazio. */
export const PREVIA_COM_EXEMPLO = 'Prévia com exemplo nos campos vazios.';

/** Nome (aria-label) da prévia: com exemplo no que falta (usaExemplo), avisa antes de descrever, para não parecer dado da pessoa. */
export const nomeDaPrevia = (descricao: string, usaExemplo: boolean): string => (usaExemplo ? `${PREVIA_COM_EXEMPLO} ${descricao}` : descricao);
