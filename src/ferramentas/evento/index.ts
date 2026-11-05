// Ferramenta 2: evento em um link. Carregada sob demanda (src/main.ts).
//   #/evento/<dados>          → página do evento (links que já circulam abrem igual)
// Criar o evento ("#/evento") e "criar outro a partir deste" ("#/evento/editar/<dados>") agora são o fluxo único
// (src/ferramentas/fluxo, docs/produto.md 7.6), que usa a validação (validar.ts), o formato (formato.ts) e a
// conferência da lista de bloqueio (abrir.ts) daqui. Os dados ficam depois do # e nunca vão para servidor.

import type { Tela } from '../../comum/tela';
import './evento.css';
import { telaPagina } from './pagina';

export const tela: Tela = (raiz, rota) => telaPagina(raiz, rota.resto);
