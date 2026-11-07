// G3, varredura em Node: as MESMAS funções que o navegador usa (errosDoPasso no fluxo; codificar + decodificar na
// página do evento), sem abrir navegador. Grava .saidas/g3-varredura.json. O navegador confere um recorte (g3-tentativas).
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { codificar, decodificar, MENSAGEM_DO_PROBLEMA } from '../../../src/ferramentas/evento/formato';
import { dadosNovos, errosDoPasso, exemploDoRodizio } from '../../../src/ferramentas/fluxo/estado';
import { TODAS, eventoBase, type CampoFluxo, type CampoLink } from './g3-apoio';

const CAMPO_LINK: Record<CampoFluxo, CampoLink> = { titulo: 'titulo', organizacao: 'organizacao', texto: 'descricao', local: 'local' };
const CAMPOS: CampoFluxo[] = ['titulo', 'organizacao', 'texto', 'local'];

test('varredura', async () => {
  const saida: unknown[] = [];
  for (const t of TODAS) {
    const fluxo: Record<string, { barrou: boolean; mensagem: string }> = {};
    const mao: Record<string, { estado: string; mensagem: string; exibido?: Record<string, string>; erros?: Record<string, string> }> = {};
    for (const campo of CAMPOS) {
      const d = dadosNovos('evento', exemploDoRodizio('evento', 0, new Date('2026-11-06T12:00:00')));
      d.titulo = 'Sarau na praça';
      d.organizacao = 'Coletivo cultural do bairro';
      d.texto = 'Música e poesia. Traga sua cadeira.';
      d.local = 'Praça da Matriz, São Paulo, SP';
      d.data = '2026-12-15';
      d.hora = '19:00';
      d[campo] = t.texto;
      const e = errosDoPasso(d, campo === 'local' ? 2 : 1)[campo];
      fluxo[campo] = { barrou: !!e, mensagem: e ? `Erro: ${e}` : '' };

      const ev = eventoBase();
      ev[CAMPO_LINK[campo]] = t.texto;
      const dados = await codificar(ev, { comprimir: false });
      const r = await decodificar(dados);
      if (r.ok) mao[campo] = { estado: 'abriu', mensagem: '', exibido: { titulo: r.evento.titulo, organizacao: r.evento.organizacao, local: r.evento.local, descricao: r.evento.descricao } };
      else mao[campo] = { estado: r.problema === 'recusado' ? 'barrou' : `problema:${r.problema}`, mensagem: MENSAGEM_DO_PROBLEMA[r.problema], erros: r.erros as Record<string, string> };
    }
    saida.push({ id: t.id, grupo: t.grupo, papel: t.papel, texto: t.texto, fluxo, mao });
  }
  writeFileSync(new URL('./.saidas/g3-varredura.json', import.meta.url), JSON.stringify(saida, null, 1));
});
