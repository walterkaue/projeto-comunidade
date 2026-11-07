// Página inicial: "O que você quer fazer?" com as cinco portas (docs/produto.md 7.6) e o rodapé institucional.
// Vai no pacote inicial, então fica pequena: nada de imagem, só texto e CSS. Não importa nada de src/ferramentas/.

import { NOME } from '../comum/marca';
import { icone, type NomeDoIcone } from '../comum/icones';
import './inicio.css';
import { esc } from '../comum/html';
import { linkPara, type NomeDaRota } from '../comum/rotas';
import type { Tela } from '../comum/tela';

// Cópia leve de PORTAS em src/ferramentas/fluxo/estado.ts (o início não pode importar de src/ferramentas/).
// Se os textos mudarem lá, mude aqui também.
export const PORTAS: readonly { tipo: string; verbo: string; exemplos: string }[] = [
  { tipo: 'reuniao', verbo: 'Chamar para uma reunião', exemplos: 'Assembleia, encontro, plenária' },
  { tipo: 'evento', verbo: 'Divulgar um evento', exemplos: 'Mutirão, festa, culto, ato, curso' },
  { tipo: 'aviso', verbo: 'Dar um aviso', exemplos: 'Mudança, lembrete, recado' },
  { tipo: 'resultado', verbo: 'Contar uma conquista', exemplos: 'O que o grupo conseguiu' },
  { tipo: 'agradecimento', verbo: 'Agradecer', exemplos: 'A quem ajudou' },
];

// Hierarquia: a reunião em destaque, evento e aviso em largura cheia, conquista e agradecimento lado a lado.
const PESO: Record<string, string> = { reuniao: 'reuniao', evento: 'larga', aviso: 'larga' };

export const RODAPE: readonly { rota: NomeDaRota; titulo: string }[] = [
  { rota: 'sobre', titulo: 'Sobre' },
  { rota: 'termos', titulo: 'Termos' },
  { rota: 'privacidade', titulo: 'Privacidade' },
  { rota: 'regras', titulo: 'Regras de uso' },
  { rota: 'denunciar', titulo: 'Como denunciar' },
  { rota: 'contato', titulo: 'Contato' },
];

const MARCA_CINCO_PONTOS = `<svg class="ini-marca-icone" viewBox="0 0 22 22" width="22" height="22" aria-hidden="true" focusable="false">
      <circle cx="11" cy="4.5" r="3.2" class="ini-ponto-reuniao"/><circle cx="17.2" cy="9" r="3.2" class="ini-ponto-evento"/>
      <circle cx="14.8" cy="16.5" r="3.2" class="ini-ponto-aviso"/><circle cx="7.2" cy="16.5" r="3.2" class="ini-ponto-resultado"/>
      <circle cx="4.8" cy="9" r="3.2" class="ini-ponto-agradecimento"/></svg>`;

const porta = (p: (typeof PORTAS)[number]): string => {
  const peso = PESO[p.tipo] ?? 'meia';
  const tipo = p.tipo as NomeDoIcone;
  const quadro = peso === 'reuniao' ? 'icone-quadro-gg' : peso === 'larga' ? 'icone-quadro-g' : '';
  const fim =
    peso === 'reuniao'
      ? `<span class="porta-seta">${icone('direita')}</span>`
      : peso === 'larga'
        ? icone('chevron', { classe: 'porta-chevron' })
        : '';
  return `<li class="ini-item ini-item-${peso}"><a class="porta porta-${peso}" data-porta="${p.tipo}" href="${linkPara('fazer', p.tipo)}">
            <span class="icone-quadro ${quadro}">${icone(tipo, { tamanho: peso === 'meia' ? 24 : 28, traco: 2.25 })}</span>
            <span class="porta-texto">
              <span class="porta-verbo">${esc(p.verbo)}</span>
              <span class="porta-exemplos">${esc(p.exemplos)}</span>
            </span>${fim}
          </a></li>`;
};

export const telaInicio: Tela = (raiz) => {
  raiz.innerHTML = `<div class="faixa-cores" aria-hidden="true"></div>
  <main class="tela ini">
    <p class="ini-marca">${MARCA_CINCO_PONTOS}<span>${esc(NOME)}</span></p>
    <h1 tabindex="-1">O que você quer fazer?</h1>
    <p class="ini-lema">Em 1 minuto você tem a imagem, o texto e o link para o WhatsApp. Sem cadastro.</p>
    <nav aria-label="O que fazer">
      <ul class="ini-portas">
        ${PORTAS.map(porta).join('')}
      </ul>
    </nav>
    <a class="botao botao-sec ini-ata" data-porta="reuniao" href="${linkPara('ata')}">
      <span class="icone-quadro icone-quadro-claro icone-quadro-p">${icone('ata', { tamanho: 18 })}</span>
      <span class="ini-ata-texto">Depois da reunião: fazer a ata</span>
      ${icone('chevron', { classe: 'porta-chevron' })}
    </a>
  </main>
  <footer class="rodape">
    <nav aria-label="Informações">
      <ul>${RODAPE.map((r) => `<li><a href="${linkPara(r.rota)}">${esc(r.titulo)}</a></li>`).join('')}</ul>
    </nav>
  </footer>`;
};
