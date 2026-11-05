// Nível do aparelho: 'leve' (aparelho simples ou economia de dados) ou 'normal'. As ferramentas usam isso
// para, por exemplo, não pré-carregar nada e gerar imagem menor. Só lê o que o navegador conta; nada é enviado.

export type Nivel = 'leve' | 'normal';

/** O que o navegador conta do aparelho. Campo ausente = o navegador não diz (iPhone, Firefox). */
export interface Sinais {
  nucleos?: number;
  memoriaGB?: number;
  economiaDeDados?: boolean;
  /** 'slow-2g' | '2g' | '3g' | '4g' */
  tipoDeRede?: string;
}

/** Leve: economia de dados, rede 2G, até 4 núcleos ou até 2 GB de memória. O resto é normal. */
export function nivelInicial(s: Sinais): Nivel {
  if (s.economiaDeDados) return 'leve';
  if (s.tipoDeRede === 'slow-2g' || s.tipoDeRede === '2g') return 'leve';
  if (s.nucleos !== undefined && s.nucleos <= 4) return 'leve';
  if (s.memoriaGB !== undefined && s.memoriaGB <= 2) return 'leve';
  return 'normal';
}

type NavegadorComSinais = {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

export function sinaisDoAparelho(nav: NavegadorComSinais | undefined = typeof navigator === 'undefined' ? undefined : navigator): Sinais {
  if (!nav) return {};
  return {
    nucleos: nav.hardwareConcurrency || undefined,
    memoriaGB: nav.deviceMemory,
    economiaDeDados: nav.connection?.saveData,
    tipoDeRede: nav.connection?.effectiveType,
  };
}

export function nivelDoAparelho(): Nivel {
  return nivelInicial(sinaisDoAparelho());
}
