// Páginas institucionais (Sobre, Termos, Privacidade, Regras de uso, Como denunciar, Contato). Carregadas sob demanda.
// Os textos serão escritos numa sessão própria; por enquanto, todas mostram o aviso de construção.

import { EMAIL_CONTATO } from '../comum/marca';
import { esc } from '../comum/html';
import { linkPara, type NomeDaRota } from '../comum/rotas';
import type { Tela } from '../comum/tela';

export const TITULOS: Partial<Record<NomeDaRota, string>> = {
  sobre: 'Sobre',
  termos: 'Termos de uso',
  privacidade: 'Privacidade',
  regras: 'Regras de uso',
  denunciar: 'Como denunciar',
  contato: 'Contato',
};

export const tela: Tela = (raiz, rota) => {
  const titulo = TITULOS[rota.nome] ?? 'Página';
  raiz.innerHTML = `<main class="tela">
    <h1 tabindex="-1">${esc(titulo)}</h1>
    <p>Este texto ainda está sendo escrito.</p>
    <p>Dúvidas ou denúncias: <a href="mailto:${EMAIL_CONTATO}">${EMAIL_CONTATO}</a></p>
    <a class="botao botao-sec" href="${linkPara('inicio')}">Voltar ao início</a>
  </main>`;
};
