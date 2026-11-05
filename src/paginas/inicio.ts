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
          (p) => `<li><a class="botao botao-grande" href="${linkPara('fazer', p.tipo)}">
            <span class="botao-titulo">${esc(p.verbo)}</span>
            <span class="botao-descricao">${esc(p.exemplos)}</span>
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
