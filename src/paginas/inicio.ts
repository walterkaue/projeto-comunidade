// Página inicial: "O que você quer fazer?" com as cinco portas (docs/produto.md 7.6) e o rodapé institucional.
// Vai no pacote inicial, então fica pequena: nada de imagem, só texto e CSS. Não importa nada de src/ferramentas/.

import { NOME } from '../comum/marca';
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

// Ícones de traço (24x24), desenhados aqui: sem biblioteca. Só enfeite, por isso aria-hidden.
const ICONES: Record<string, string> = {
  reuniao:
    '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 14.5c3 0 7 1.5 7 5.5"/>',
  evento: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  aviso: '<path d="M3 10v4h4l8 5V5l-8 5H3zM18 9a4 4 0 0 1 0 6"/>',
  resultado: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8"/>',
  agradecimento: '<path d="M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20z"/>',
};

const icone = (tipo: string): string =>
  `<svg class="porta-icone" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONES[tipo] ?? ''}</svg>`;

// Hierarquia: a reunião em destaque, evento e aviso em largura cheia, conquista e agradecimento lado a lado.
const PESO: Record<string, string> = { reuniao: 'destaque', evento: 'larga', aviso: 'larga' };

export const RODAPE: readonly { rota: NomeDaRota; titulo: string }[] = [
  { rota: 'sobre', titulo: 'Sobre' },
  { rota: 'termos', titulo: 'Termos' },
  { rota: 'privacidade', titulo: 'Privacidade' },
  { rota: 'regras', titulo: 'Regras de uso' },
  { rota: 'denunciar', titulo: 'Como denunciar' },
  { rota: 'contato', titulo: 'Contato' },
];

export const telaInicio: Tela = (raiz) => {
  raiz.innerHTML = `<main class="tela inicio">
    <p class="inicio-nome">${esc(NOME)}</p>
    <h1 tabindex="-1">O que você quer fazer?</h1>
    <p class="inicio-lema">Em 1 minuto você tem a imagem, o texto e o link para o WhatsApp. Sem cadastro.</p>
    <nav aria-label="O que fazer">
      <ul class="inicio-portas">
        ${PORTAS.map(
          (p) => `<li class="porta-${PESO[p.tipo] ?? 'meia'}"><a class="botao botao-grande" href="${linkPara('fazer', p.tipo)}">
            ${icone(p.tipo)}
            <span class="porta-texto">
              <span class="botao-titulo">${esc(p.verbo)}</span>
              <span class="botao-descricao">${esc(p.exemplos)}</span>
            </span>
          </a></li>`,
        ).join('')}
      </ul>
    </nav>
    <a class="botao botao-sec inicio-ata" href="${linkPara('ata')}">Depois da reunião: fazer a ata</a>
  </main>
  <footer class="rodape">
    <nav aria-label="Informações">
      <ul>${RODAPE.map((r) => `<li><a href="${linkPara(r.rota)}">${esc(r.titulo)}</a></li>`).join('')}</ul>
    </nav>
  </footer>`;
};
