// Cara nova da página do evento e da tela de link removido (docs/visual.md, seção 7). O projeto não tem DOM nos
// testes: a marcação é conferida no HTML que pagina.ts monta, e o texto, tirando as marcas.

import { describe, expect, it } from 'vitest';
import { NOME } from '../../comum/marca';
import { quandoNaPagina } from './agenda';
import { FAIXA_FORTE, faixaInicio, htmlDaMensagem, htmlDaPagina, htmlDoRemovido, partirQuando, SUFIXO_DO_HORARIO } from './pagina';
import { textosDoRemovido } from './removido';
import type { Evento } from './validar';

const e: Evento = {
  titulo: 'Mutirão de limpeza da praça',
  data: '2026-11-14',
  inicio: '08:30',
  fim: '12:00',
  local: 'Praça central, Rua das Flores, 120',
  descricao: '',
  organizacao: 'Associação de moradores',
};
const html = htmlDaPagina(e, 'dados', '#/denunciar/x', 'Copiar o link');
const texto = (h: string) => h.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const abertura = (h: string, marca: string) => new RegExp(`<[a-z0-9]+ [^>]*${marca}[^>]*>`).exec(h)?.[0] ?? '';

describe('página do evento: marcação', () => {
  it('todas as telas levam data-porta="evento" e a faixa de cinco cores', () => {
    const removido = htmlDoRemovido(textosDoRemovido({ tipo: 'pedido' }));
    for (const h of [html, removido, htmlDaMensagem('Abrindo o evento…', 'Conferindo o link.', true), htmlDaMensagem('Erro', 'Texto.')]) {
      expect(h).toContain('<main class="tela evento" data-porta="evento"');
      expect(h).toContain('<div class="faixa-cores" aria-hidden="true"></div>');
    }
  });

  it('a faixa do evento vem antes de tudo e é aviso de atenção com ícone aria-hidden', () => {
    expect(html.indexOf('faixa-cores')).toBeLessThan(html.indexOf('evento-faixa'));
    expect(html.indexOf('evento-faixa')).toBeLessThan(html.indexOf('evento-convite'));
    expect(html.indexOf('evento-faixa')).toBeLessThan(html.indexOf('<h1'));
    expect(abertura(html, 'evento-faixa')).toContain('aviso-atencao');
    expect(abertura(html, 'evento-faixa')).toContain('aria-label="Aviso sobre este conteúdo"');
    expect(html).toMatch(/<aside[^>]*>\s*<svg class="icone aviso-icone"[^>]*aria-hidden="true"/);
    expect(html).toContain('<div class="aviso-corpo">');
  });

  it('o texto da faixa é o de hoje e a última frase está em negrito', () => {
    const p = /<p id="ev-faixa">(.*?)<\/p>/.exec(html)?.[1] ?? '';
    expect(texto(p)).toBe(
      `Conteúdo criado por quem enviou este link. O ${NOME} não confere nem guarda este conteúdo. Nunca faça pagamento nem mande documentos pedidos por um evento.`,
    );
    expect(p).toContain(`<strong>${FAIXA_FORTE}</strong>`);
    expect(p.endsWith('</strong>')).toBe(true);
    expect(faixaInicio(NOME)).not.toContain('Nunca');
    expect(html).toContain('aria-describedby="ev-faixa"');
  });

  it('"Denunciar" é link dentro da faixa, sublinhado e de 48 px', () => {
    const faixa = /<aside[\s\S]*?<\/aside>/.exec(html)?.[0] ?? '';
    expect(faixa).toContain('class="evento-denunciar link-acao link-tinta" href="#/denunciar/x">Denunciar</a>');
  });

  it('"Convite" fica fora do h1, com o quadradinho de calendário aria-hidden', () => {
    expect(html).toMatch(/<p class="evento-convite"><span class="icone-quadro icone-quadro-p"><svg[^>]*width="18"[^>]*aria-hidden="true"/);
    expect(texto(/<p class="evento-convite">.*?<\/p>/.exec(html)?.[0] ?? '')).toBe('Convite');
    expect(html).not.toMatch(/<h1[^>]*>[^<]*Convite/);
  });

  it('Quando e Onde: rótulo com ícone aria-hidden em cima, valor em dd', () => {
    expect(html).toMatch(/<dt><svg[^>]*aria-hidden="true"[^>]*>.*?<\/svg><span>Quando<\/span><\/dt><dd data-quando><\/dd>/);
    expect(html).toMatch(/<dt><svg[^>]*aria-hidden="true"[^>]*>.*?<\/svg><span>Onde<\/span><\/dt><dd data-local><\/dd>/);
  });

  it('o sufixo do horário fica fora do negrito e o texto inteiro não muda', () => {
    const q = quandoNaPagina(e);
    const { forte, sufixo } = partirQuando(q);
    expect(sufixo).toBe(SUFIXO_DO_HORARIO);
    expect(forte + sufixo).toBe(q);
    expect(forte).not.toContain('horário do local');
    expect(partirQuando('sem sufixo')).toEqual({ forte: 'sem sufixo', sufixo: '' });
  });

  it('"Ver no mapa" é terciário, com ícone de local, e mantém aria-label e target', () => {
    const mapa = /<a class="botao botao-ter" data-mapa[\s\S]*?<\/a>/.exec(html)?.[0] ?? '';
    expect(mapa).toContain('aria-label="Ver no mapa (abre o Google Maps em outro site)"');
    expect(mapa).toContain('target="_blank"');
    expect(mapa).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(texto(mapa)).toBe('Ver no mapa');
  });

  it('em cada seção o primeiro botão é principal e os outros são terciários com ícone', () => {
    const secoes = html.split('<section').slice(1);
    expect(secoes).toHaveLength(3);
    for (const s of secoes) {
      expect(s).toMatch(/<h2 id="[^"]+">/);
      const botoes = [...s.matchAll(/<(?:a|button) class="(botao[^"]*)"/g)].map((m) => m[1]);
      expect(botoes[0]).toBe('botao');
      for (const b of botoes.slice(1)) expect(b).toBe('botao botao-ter');
    }
    const [agenda, compartilhar, mais] = secoes as [string, string, string];
    expect(agenda).toContain('data-ics>Baixar arquivo para a agenda');
    expect(compartilhar).toContain('data-compartilhar>Copiar o link');
    expect(mais).toMatch(/<a class="botao" href="[^"]*" data-fazer-card>Fazer a imagem deste evento<\/a>/);
    for (const rotulo of ['Abrir no Google Agenda', 'QR do link', 'Criar outro evento a partir deste', 'Denunciar este evento', `Conhecer o ${NOME}`]) {
      expect(html).toMatch(new RegExp(`botao-ter"[^>]*><svg[^>]*aria-hidden="true"[^>]*>.*?</svg>${rotulo}</`));
    }
  });

  it('aria-labels, data-* e destinos de hoje continuam', () => {
    expect(html).toContain('aria-label="Abrir no Google Agenda (abre outro site)"');
    expect(html).toContain('data-destino="o Google Agenda"');
    expect(html).toContain('data-destino="o mapa"');
    expect(html).toContain('aria-expanded="false" aria-controls="ev-qr-area"');
  });
});

describe('tela de link removido: marcação', () => {
  for (const motivo of [{ tipo: 'pedido' }, { tipo: 'regra', regra: 5 }] as Parameters<typeof textosDoRemovido>[0][]) {
    it(`o texto de hoje vai num aviso de atenção (${motivo.tipo})`, () => {
      const t = textosDoRemovido(motivo);
      const h = htmlDoRemovido(t);
      const aviso = /<div class="aviso-atencao[^"]*">[\s\S]*?<\/div>\s*<\/div>/.exec(h)?.[0] ?? '';
      expect(aviso).toMatch(/<svg class="icone aviso-icone"[^>]*aria-hidden="true"/);
      expect(aviso).toContain('<p><strong>Ele não está mais disponível.</strong></p>');
      const ps = [...aviso.matchAll(/<p>(.*?)<\/p>/g)].map((m) => texto(m[1]!));
      expect(ps).toHaveLength(t.paragrafos.length);
      ps.forEach((p, i) => expect(p.replaceAll('&#39;', "'").replaceAll('&amp;', '&')).toBe(t.paragrafos[i]));
      expect(h).toContain('<a class="botao" href="#/regras">Ver as Regras de uso</a>');
      expect(h.match(/botao botao-sec/g)).toHaveLength(2);
    });
  }
});
