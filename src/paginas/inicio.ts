// Página inicial (provisória): as três ferramentas como botões grandes e o rodapé institucional.
// Vai no pacote inicial, então fica pequena: nada de imagem, só texto e CSS.

import { NOME } from '../comum/marca';
import { esc } from '../comum/html';
import { linkPara, type NomeDaRota } from '../comum/rotas';
import type { Tela } from '../comum/tela';

interface Atalho {
  rota: NomeDaRota;
  titulo: string;
  descricao: string;
}

export const FERRAMENTAS: readonly Atalho[] = [
  { rota: 'cards', titulo: 'Cards e convites', descricao: 'Monte uma imagem para mandar no WhatsApp.' },
  { rota: 'evento', titulo: 'Evento em um link', descricao: 'Data, hora e local num link para compartilhar.' },
  { rota: 'reuniao', titulo: 'Reunião', descricao: 'Convocação, pauta e ata em PDF.' },
];

export const RODAPE: readonly { rota: NomeDaRota; titulo: string }[] = [
  { rota: 'sobre', titulo: 'Sobre' },
  { rota: 'termos', titulo: 'Termos' },
  { rota: 'privacidade', titulo: 'Privacidade' },
  { rota: 'regras', titulo: 'Regras de uso' },
  { rota: 'denunciar', titulo: 'Como denunciar' },
];

export const telaInicio: Tela = (raiz) => {
  raiz.innerHTML = `<main class="tela inicio">
    <h1 tabindex="-1">${esc(NOME)}</h1>
    <p class="inicio-lema">Ferramentas gratuitas para organizar a comunidade. Tudo é feito no seu aparelho, sem cadastro.</p>
    <nav aria-label="Ferramentas">
      <ul class="inicio-ferramentas">
        ${FERRAMENTAS.map(
          (f) => `<li><a class="botao botao-grande" href="${linkPara(f.rota)}">
            <span class="botao-titulo">${esc(f.titulo)}</span>
            <span class="botao-descricao">${esc(f.descricao)}</span>
          </a></li>`,
        ).join('')}
      </ul>
    </nav>
  </main>
  <footer class="rodape">
    <nav aria-label="Informações">
      <ul>${RODAPE.map((r) => `<li><a href="${linkPara(r.rota)}">${esc(r.titulo)}</a></li>`).join('')}</ul>
    </nav>
  </footer>`;
};
