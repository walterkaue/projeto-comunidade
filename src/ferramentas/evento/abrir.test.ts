// B-03: link com ponto, vírgula, parêntese, "%20Obrigada!" ou "%0A" colado no fim abre o evento certo, sem
// deixar o que veio depois entrar no evento nem escapar da lista de bloqueio.

import { describe, expect, it } from 'vitest';
import { abrirEvento, SOBRA_MAXIMA, sobraAceitavel } from './abrir';
import { codificar, dadosCanonicos, decodificar } from './formato';
import { validarEvento, type Evento } from './validar';

const bom: Evento = {
  titulo: 'Mutirão de limpeza da praça',
  data: '2026-11-14',
  inicio: '08:30',
  fim: '12:00',
  local: 'Praça central, Rua das Flores, 120',
  descricao: 'Traga luvas e sacos.',
  organizacao: 'Associação de moradores',
};
const sempre = (e: Evento): Evento => {
  const r = validarEvento(e);
  if (!r.ok) throw new Error('evento do teste inválido');
  return r.evento;
};

// Resto de mensagem colado no fim: abre.
const INOFENSIVOS = ['.', ')', ',', '%20Obrigada!', '%0A', ' ', '.%20Valeu,%20at%C3%A9%20amanh%C3%A3!'];
// Conteúdo que o evento não aceita, texto comprido ou escape quebrado: não abre, porque a página ainda repassa o
// endereço inteiro no QR e no "Compartilhar" (revisão de privacidade de 06/11/2026).
const COM_CONTEUDO = [
  '%20pix%2012345678909',
  // Telefone que o filtro deixaria passar: na sobra, nenhum algarismo nem @.
  '.%20Zap%2011%2098765%20--%204321',
  '%20%40coletivo',
  '?x=1',
  '.%20Chame%20no%20zap%2011%2098765-4321',
  '%20golpe.com',
  '%20Projeto%20Comunidade%20conferiu',
  '%20' + 'Obrigada'.repeat(6),
  '%E0%A4%A',
];
const SUFIXOS = [...INOFENSIVOS, ...COM_CONTEUDO];
const SEM_MOTIVO = { tipo: 'sem-motivo' } as const;
const BLOQUEADO = { estado: 'bloqueado', motivo: SEM_MOTIVO };

/** Dependências de mentira: guarda o que foi perguntado à lista e bloqueia o que estiver nela. */
function deps(...bloqueados: string[]) {
  const perguntas: string[][] = [];
  return {
    perguntas,
    bloqueado: async (d: string[]) => {
      perguntas.push(d);
      return d.some((x) => bloqueados.includes(x)) ? SEM_MOTIVO : null;
    },
    ler: decodificar,
  };
}

describe('abrirEvento: lixo colado no fim do link', () => {
  for (const sufixo of INOFENSIVOS) {
    it(`abre com ${JSON.stringify(sufixo)} e devolve os dados limpos`, async () => {
      const dados = await codificar(sempre(bom));
      const r = await abrirEvento(dados + sufixo, deps());
      expect(r).toEqual({ estado: 'ok', evento: sempre(bom), dados });
    });

    it(`abre o comprimido com ${JSON.stringify(sufixo)}`, async () => {
      const dados = await codificar(sempre(bom), { comprimir: true });
      const r = await abrirEvento(dados + sufixo, deps());
      expect(r).toEqual({ estado: 'ok', evento: sempre(bom), dados });
    });
  }

  for (const sufixo of COM_CONTEUDO) {
    it(`não abre com ${JSON.stringify(sufixo)} no fim`, async () => {
      for (const comprimir of [false, true]) {
        const dados = await codificar(sempre(bom), { comprimir });
        expect(await abrirEvento(dados + sufixo, deps())).toEqual({ estado: 'problema', problema: 'malformado' });
      }
    });
  }

  it('o limite do que pode sobrar no fim', () => {
    expect(sobraAceitavel('')).toBe(true);
    const cabe = ' ' + 'oi '.repeat(SOBRA_MAXIMA).slice(0, SOBRA_MAXIMA - 1);
    expect(Array.from(cabe).length).toBe(SOBRA_MAXIMA);
    expect(sobraAceitavel(encodeURIComponent(cabe))).toBe(true);
    expect(sobraAceitavel(encodeURIComponent(cabe + 'x'))).toBe(false);
  });

  for (const sufixo of SUFIXOS) {
    it(`continua bloqueado com ${JSON.stringify(sufixo)} (pela impressão do link limpo)`, async () => {
      const dados = await codificar(sempre(bom));
      expect(await abrirEvento(dados + sufixo, deps(dados))).toEqual(BLOQUEADO);
      const z = await codificar(sempre(bom), { comprimir: true });
      expect(await abrirEvento(z + sufixo, deps(z))).toEqual(BLOQUEADO);
    });

    it(`continua bloqueado com ${JSON.stringify(sufixo)} (pela forma canônica)`, async () => {
      const canonico = dadosCanonicos(sempre(bom));
      const simples = await codificar(sempre(bom), { comprimir: false });
      const z = await codificar(sempre(bom), { comprimir: true });
      for (const d of [simples, z]) {
        expect(await abrirEvento(d + sufixo, deps(canonico))).toEqual(BLOQUEADO);
      }
    });
  }

  it('o texto depois do corte nunca entra no evento', async () => {
    const dados = await codificar(sempre(bom));
    for (const sufixo of SUFIXOS) {
      const r = await abrirEvento(dados + sufixo, deps());
      if (r.estado === 'ok') expect(r.evento).toEqual(sempre(bom));
      expect(JSON.stringify(r)).not.toMatch(/pix|12345678909|98765|golpe|Obrigada|Valeu/);
    }
  });

  it('sufixo que é base64url válido não traz conteúdo novo', async () => {
    const dados = await codificar(sempre(bom));
    for (const sufixo of ['-', 'abc', '_x', 'AAAA']) {
      const r = await abrirEvento(dados + sufixo, deps());
      if (r.estado === 'ok') expect(r.evento).toEqual(sempre(bom));
      else expect(r.estado).toBe('problema');
    }
  });

  it('dados só de lixo dão problema malformado', async () => {
    for (const lixo of ['%20', '.', '(1rABC', '']) {
      expect(await abrirEvento(lixo, deps())).toEqual({ estado: 'problema', problema: 'malformado' });
    }
  });

  it('a lista só recebe texto no formato base64url, nunca o sufixo', async () => {
    const d = deps();
    const dados = await codificar(sempre(bom), { comprimir: true });
    for (const sufixo of SUFIXOS) await abrirEvento(dados + sufixo, d);
    expect(d.perguntas.length).toBe(SUFIXOS.length);
    for (const p of d.perguntas.flat()) expect(p).toMatch(/^[A-Za-z0-9_-]*$/);
  });
});

describe('golpe mais parecido: link bloqueado com lixo no fim', () => {
  it('continua bloqueado', async () => {
    const e = sempre({ ...bom, titulo: 'Sorteio da praça' });
    const L = await codificar(e, { comprimir: false });
    const Lz = await codificar(e, { comprimir: true });
    for (const sufixo of ['.', '%0A', ')']) {
      expect(await abrirEvento(L + sufixo, deps(L))).toEqual(BLOQUEADO);
    }
    expect(await abrirEvento(Lz + '.', deps(Lz))).toEqual(BLOQUEADO);
    expect(await abrirEvento(Lz + '.', deps(dadosCanonicos(e)))).toEqual(BLOQUEADO);
  });
});
