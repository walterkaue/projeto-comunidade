import type { NomeDaRota } from '../../comum/rotas';
import { contato } from './contato';
import { denunciar } from './denunciar';
import { privacidade } from './privacidade';
import { regras } from './regras';
import { sobre } from './sobre';
import { termos } from './termos';
import type { Pagina } from './tipos';

export const PAGINAS: Partial<Record<NomeDaRota, Pagina>> = { sobre, termos, privacidade, regras, denunciar, contato };
