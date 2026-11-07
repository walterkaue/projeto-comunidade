// Cara nova da tela da ata (docs/visual.md, seção 7). Sem DOM no projeto: confere o código da tela e as
// funções puras. O texto dos avisos e do estatuto vem da análise jurídica e não pode mudar nem uma palavra.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { campoTexto } from '../../comum/formulario';
import { ORGANIZACOES, VOLTA_DO_RODIZIO } from '../cards/exemplos';
import { cortarLimpo, exemploDeOrganizacao, MAXIMO_DO_EXEMPLO, NOMES_CURTOS, nomesSemCurto } from './exemploOrg';

const pasta = dirname(fileURLToPath(import.meta.url));
const codigo = readFileSync(join(pasta, 'index.ts'), 'utf8');
const css = readFileSync(join(pasta, 'reuniao.css'), 'utf8');

/** Texto de uma linha de aviso, sem as marcas em volta. */
const textoDe = (html: string) => html.replace(/\$\{icone\([^)]*\)\}/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

describe('topo e título', () => {
  it('a tela marca a porta da reunião', () => {
    expect(codigo).toContain("base.dataset.porta = 'reuniao'");
  });

  it('o h1 tem as duas partes, na ordem, e continua focável', () => {
    // O aria-label fixa o nome lido ("Depois da reunião: a ata"), igual ao texto do h1.
    const h1 = codigo.match(/<h1 tabindex="-1" aria-label="Depois da reunião: a ata">([\s\S]*?)<\/h1>/)?.[1] ?? '';
    expect(h1).not.toBe('');
    expect(h1.indexOf('Depois da reunião')).toBeGreaterThan(-1);
    expect(h1.indexOf('a ata')).toBeGreaterThan(h1.indexOf('Depois da reunião'));
    expect(textoDe(h1)).toBe('Depois da reunião: a ata');
    expect(h1).toContain("icone('ata', { tamanho: 18 })");
    expect(h1).toContain('icone-quadro icone-quadro-p');
  });

  it('a frase de hoje continua igual, no topo', () => {
    expect(codigo).toContain('<p class="reuniao-intro">Escreva o que foi decidido. A ata fica só neste aparelho.</p>');
    expect(css).toMatch(/\.reuniao-topo\s*{[^}]*var\(--cor-clara\)[^}]*border-radius: 0 0 24px 24px/);
  });
});

describe('avisos e estatuto (texto igual ao de antes)', () => {
  const avisos = [...codigo.matchAll(/<div class="reuniao-aviso">([\s\S]*?)<\/div>/g)].map((m) => m[1]!);

  it('são três, num cartão, com relógio, pessoas e cadeado', () => {
    expect(codigo).toContain('<div class="cartao reuniao-avisos" role="note">');
    expect(avisos).toHaveLength(3);
    expect(avisos[0]).toContain("icone('relogio'");
    expect(avisos[1]).toContain("icone('pessoas'");
    expect(avisos[2]).toContain("icone('cadeado'");
  });

  it('o texto de cada aviso é o de antes, palavra por palavra', () => {
    expect(textoDe(avisos[0]!)).toBe(
      'O rascunho some ao fechar. A ata fica só na memória desta aba. Ao terminar, salve o PDF ou copie o texto.',
    );
    expect(textoDe(avisos[1]!)).toBe(
      'A lista de presença pode mostrar a que organização cada pessoa pertence. Ela fica só neste aparelho. Mande o PDF só para quem precisa dele.',
    );
    expect(textoDe(avisos[2]!)).toBe(
      'O corretor ortográfico do navegador fica desligado aqui. O teclado do celular ainda pode aprender as palavras digitadas.',
    );
    expect(avisos[0]).toContain('<strong>O rascunho some ao fechar.</strong>');
  });

  it('o lembrete do estatuto é o de antes, com o ícone de livro', () => {
    const nota = codigo.match(/<p class="reuniao-nota reuniao-estatuto">([\s\S]*?)<\/p>/)?.[1] ?? '';
    expect(nota).toContain("icone('livro'");
    expect(textoDe(nota)).toBe(
      'A ata é um modelo. Ela não substitui o que o estatuto da organização exige. Confira no estatuto quem convoca, o quórum e quem assina.',
    );
  });

  it('os ícones vêm de icone() (aria-hidden) e nenhum aviso está só com ícone', () => {
    for (const a of avisos) expect(textoDe(a).length).toBeGreaterThan(40);
  });
});

describe('campos', () => {
  it('nenhum rótulo escrito à mão com "(obrigatório)"', () => {
    expect(codigo).not.toContain('(obrigatório)');
    expect(codigo).not.toContain('campo-obrig');
  });

  it('Organização leva exemplo em cinza e continua começando com o valor do rascunho', () => {
    expect(codigo).toMatch(/rotulo: 'Organização', obrigatorio: true, exemplo: exemploOrg, valor: a\.organizacao/);
  });

  it('o campo gerado: placeholder "Ex.: …", valor vazio por padrão, obrigatório só com aria-required', () => {
    const html = campoTexto({ id: 'ata-organizacao', rotulo: 'Organização', obrigatorio: true, exemplo: exemploDeOrganizacao(0), valor: '' });
    expect(html).toMatch(/placeholder="Ex\.: [^"]+"/);
    expect(html).toContain('value=""');
    expect(html).toContain('aria-required="true"');
    expect(html).not.toContain('(obrigatório)');
    expect(html).not.toContain('(opcional)');
  });

  it('campos que não são obrigatórios ganham "(opcional)"', () => {
    expect(campoTexto({ id: 'ata-local', rotulo: 'Local' })).toContain('(opcional)');
  });

  it('Data usa o calendário do celular', () => {
    expect(codigo).toMatch(/rotulo: 'Data', tipo: 'date'/);
  });
});

describe('exemplo da organização', () => {
  it('em todo o rodízio, vem do catálogo, é curto e sem palavra solta no fim', () => {
    for (let i = 0; i < VOLTA_DO_RODIZIO; i++) {
      const e = exemploDeOrganizacao(i);
      expect(e.length, e).toBeLessThanOrEqual(MAXIMO_DO_EXEMPLO);
      expect(e.length, e).toBeGreaterThan(5);
      expect(Object.values(NOMES_CURTOS), e).toContain(e);
      expect(e).not.toMatch(/\s(de|do|da|dos|das|e)$/i);
    }
  });

  it('todo nome do catálogo tem nome curto escrito à mão, de até 28 letras', () => {
    expect(nomesSemCurto()).toEqual([]);
    for (const curto of Object.values(NOMES_CURTOS)) expect(curto.length, curto).toBeLessThanOrEqual(MAXIMO_DO_EXEMPLO);
    expect(Object.keys(NOMES_CURTOS).sort()).toEqual([...ORGANIZACOES].sort());
  });

  it('os três grupos religiosos têm o mesmo tratamento: só o nome inventado, nenhum cortado no meio', () => {
    expect(NOMES_CURTOS['Grupo de Oração Flor do Pomar']).toBe('Grupo Flor do Pomar');
    expect(NOMES_CURTOS['Casa de Matriz Africana Pé de Jaca Dourado']).toBe('Casa Pé de Jaca Dourado');
    expect(NOMES_CURTOS['Centro Espírita Lume do Vale Cheiroso']).toBe('Centro Lume do Vale');
  });

  it('corta nas palavras inteiras', () => {
    expect(cortarLimpo('Associação de Moradores Vila Cantinho Sereno')).toBe('Associação de Moradores Vila');
    expect(cortarLimpo('Sindicato dos Metalúrgicos Vale das Pedras Mansas')).toBe('Sindicato dos Metalúrgicos');
    expect(cortarLimpo('Coletivo Palco Aberto')).toBe('Coletivo Palco Aberto');
    expect(cortarLimpo('Palavracompridademais'.repeat(3))).toHaveLength(63);
  });
});

describe('CSS', () => {
  it('"A ata" aparece com maiúscula na tela (o texto do h1 continua "a ata")', () => {
    expect(css).toMatch(/\.ata-titulo-h1::first-letter\s*\{\s*text-transform:\s*uppercase/);
    expect(css).toMatch(/\.ata-titulo-h1\s*\{\s*display:\s*block/);
  });

  it('sem nomes antigos', () => {
    expect(css).not.toMatch(/--destaque|--sobre-destaque|--porta-fundo|--porta-texto|--porta-desc/);
  });

  it('sem altura fixa que corte texto', () => {
    const linhasComAltura = css.split('\n').filter((l) => /(^|[\s;{])(height|max-height):\s*[\d.]+(px|rem)/.test(l) && !/1px/.test(l));
    expect(linhasComAltura).toEqual([]);
  });

  it('alto contraste: topo e cartão com borda CanvasText', () => {
    expect(css).toMatch(/forced-colors: active[\s\S]*\.reuniao-topo[\s\S]*CanvasText/);
  });
});
