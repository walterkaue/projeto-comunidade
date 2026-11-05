// Ferramenta 2: evento em um link. Carregada sob demanda (src/main.ts).
//   #/evento                  → formulário
//   #/evento/editar/<dados>   → formulário já preenchido com um evento (para criar outro parecido)
//   #/evento/<dados>          → página do evento
// Os dados ficam depois do # e nunca vão para servidor. Formato em formato.ts, regras em validar.ts.

import type { Tela } from '../../comum/tela';
import { telaCriar } from './criar';
import './evento.css';
import { telaPagina } from './pagina';

const EDITAR = 'editar/';

export const tela: Tela = (raiz, rota) => {
  const resto = rota.resto;
  if (!resto) return telaCriar(raiz);
  if (resto.startsWith(EDITAR)) return telaCriar(raiz, resto.slice(EDITAR.length));
  return telaPagina(raiz, resto);
};
