import { describe, expect, it } from 'vitest';
import { lerRota } from '../../comum/rotas';
import { validarEvento } from '../evento/validar';
import {
  apagarOPasso1,
  assinatura,
  atalhosDoDia,
  avisoDoExemplo,
  camposDoCard,
  camposDoExemplo,
  convocacaoDoFluxo,
  dadosDoCardPreparado,
  dadosDoEvento,
  dataBr,
  diaPorExtenso,
  enderecoDoPasso,
  errosDoPasso,
  eventoDoFluxo,
  exemploDoFluxo,
  fraseDaConfirmacao,
  lerDataBr,
  lerDestino,
  linkAindaVale,
  marcarMudanca,
  oQueFicouDeFora,
  passoAnterior,
  passoPendente,
  podePularOPasso2,
  proximoPasso,
  rotuloDeApagar,
  textoParaMandar,
  TIPOS,
  type DadosDoFluxo,
} from './estado';

const BASE = 'https://exemplo.test/projeto/';
const SABADO = new Date(2026, 10, 7); // sábado, 07/11/2026
const QUINTA = new Date(2026, 10, 5);

const reuniao = (): DadosDoFluxo => exemploDoFluxo('reuniao', 0, QUINTA);

describe('exemplos em rodízio', () => {
  it('cada porta começa preenchida, sem tela em branco', () => {
    for (const tipo of TIPOS) {
      const d = exemploDoFluxo(tipo, 3, QUINTA);
      expect(d.tipo).toBe(tipo);
      expect(d.titulo).not.toBe('');
      expect(d.organizacao).not.toBe('');
      expect(errosDoPasso(d, 1)).toEqual({});
      expect(errosDoPasso(d, 2)).toEqual({});
    }
  });

  it('gira entre os tipos de organização', () => {
    const orgs = new Set(Array.from({ length: 7 }, (_, i) => exemploDoFluxo('evento', i).organizacao));
    expect(orgs.size).toBe(7);
    expect(exemploDoFluxo('evento', 7).organizacao).toBe(exemploDoFluxo('evento', 0).organizacao);
    expect(exemploDoFluxo('evento', -1).organizacao).toBe(exemploDoFluxo('evento', 6).organizacao);
  });

  it('a reunião vem com pauta, um item por linha', () => {
    expect(reuniao().pauta.split('\n').length).toBeGreaterThan(1);
    expect(reuniao().texto).toBe('');
  });

  it('o exemplo de reunião e de evento vira link de evento válido', () => {
    for (let i = 0; i < 7; i++) {
      expect(validarEvento(eventoDoFluxo(exemploDoFluxo('reuniao', i, QUINTA))).ok).toBe(true);
      expect(validarEvento(eventoDoFluxo(exemploDoFluxo('evento', i, QUINTA))).ok).toBe(true);
    }
  });
});

describe('endereços do fluxo', () => {
  const destino = (hash: string) => lerDestino(lerRota(hash));

  it('passos levam só o tipo e o número, nunca dados', () => {
    expect(enderecoDoPasso('evento', 1)).toBe('#/fazer/evento');
    expect(enderecoDoPasso('evento', 2)).toBe('#/fazer/evento/2');
    expect(enderecoDoPasso('aviso', 'pronto')).toBe('#/fazer/aviso/pronto');
    expect(destino('#/fazer/evento')).toEqual({ tipo: 'passo', modelo: 'evento', passo: 1 });
    expect(destino('#/fazer/reuniao/3')).toEqual({ tipo: 'passo', modelo: 'reuniao', passo: 3 });
    expect(destino('#/fazer/aviso/pronto')).toEqual({ tipo: 'passo', modelo: 'aviso', passo: 'pronto' });
  });

  it('endereço estranho volta ao início ou ao passo 1', () => {
    expect(destino('#/fazer')).toEqual({ tipo: 'redirecionar', para: '#/' });
    expect(destino('#/fazer/campanha')).toEqual({ tipo: 'redirecionar', para: '#/' });
    expect(destino('#/fazer/evento/9')).toEqual({ tipo: 'redirecionar', para: '#/fazer/evento' });
    expect(destino('#/fazer/evento/2/x')).toEqual({ tipo: 'redirecionar', para: '#/' });
  });

  it('os endereços antigos levam ao ponto certo', () => {
    expect(destino('#/evento')).toEqual({ tipo: 'redirecionar', para: '#/fazer/evento' });
    expect(destino('#/reuniao')).toEqual({ tipo: 'redirecionar', para: '#/fazer/reuniao' });
    expect(destino('#/cards')).toEqual({ tipo: 'preparado' });
    expect(destino('#/evento/editar/1rABC')).toEqual({ tipo: 'editar', dados: '1rABC' });
    expect(destino('#/fazer/evento/editar/1rABC')).toEqual({ tipo: 'editar', dados: '1rABC' });
  });

  it('anda e volta entre os passos', () => {
    expect(proximoPasso(1)).toBe(2);
    expect(proximoPasso(3)).toBe('pronto');
    expect(passoAnterior('pronto')).toBe(3);
    expect(passoAnterior(1)).toBeNull();
    expect(podePularOPasso2('aviso')).toBe(true);
    expect(podePularOPasso2('agradecimento')).toBe(true);
    expect(podePularOPasso2('evento')).toBe(false);
  });
});

describe('datas no formato brasileiro', () => {
  it('lê o que a pessoa escreve', () => {
    expect(lerDataBr('14/11/2026', QUINTA)).toBe('2026-11-14');
    expect(lerDataBr('14/11/26', QUINTA)).toBe('2026-11-14');
    expect(lerDataBr('14112026', QUINTA)).toBe('2026-11-14');
    expect(lerDataBr('1411', QUINTA)).toBe('2026-11-14');
    expect(lerDataBr(' 4-1 ', QUINTA)).toBe('2027-01-04'); // sem ano e já passou: ano que vem
    expect(lerDataBr('5/11', QUINTA)).toBe('2026-11-05'); // hoje
    expect(lerDataBr('', QUINTA)).toBe('');
    expect(lerDataBr('31/02/2026', QUINTA)).toBeNull();
    expect(lerDataBr('amanhã', QUINTA)).toBeNull();
    expect(lerDataBr('14/11/1990', QUINTA)).toBeNull();
  });

  it('mostra no formato brasileiro', () => {
    expect(dataBr('2026-11-14')).toBe('14/11/2026');
    expect(dataBr('2026-02-30')).toBe('');
    expect(diaPorExtenso('2026-11-14')).toBe('sábado, 14/11/2026');
  });

  it('atalhos: hoje, amanhã e o próximo sábado', () => {
    expect(atalhosDoDia(QUINTA)).toEqual([
      { rotulo: 'Hoje', data: '2026-11-05' },
      { rotulo: 'Amanhã', data: '2026-11-06' },
      { rotulo: 'Próximo sábado', data: '2026-11-07' },
    ]);
    expect(atalhosDoDia(SABADO)[2]!.data).toBe('2026-11-14');
  });
});

describe('o que falta em cada passo', () => {
  it('passo 1: título e, na reunião, a pauta', () => {
    expect(errosDoPasso({ ...reuniao(), titulo: ' ' }, 1).titulo).toBe('escreva o título.');
    expect(errosDoPasso({ ...reuniao(), pauta: '\n \n' }, 1).pauta).toMatch(/pauta/);
    expect(errosDoPasso({ ...exemploDoFluxo('aviso', 0), titulo: '' }, 1).titulo).toBeDefined();
  });

  it('passo 2: reunião e evento precisam de dia, hora e local; aviso não', () => {
    const e = errosDoPasso({ ...reuniao(), data: '', hora: '', local: '' }, 2);
    expect(Object.keys(e).sort()).toEqual(['data', 'hora', 'local']);
    expect(errosDoPasso({ ...exemploDoFluxo('aviso', 0), data: '' }, 2)).toEqual({});
  });

  it('reunião e evento passam pela mesma regra do link (sem telefone, link nem PIX)', () => {
    const ev = exemploDoFluxo('evento', 0, QUINTA);
    expect(errosDoPasso({ ...ev, texto: 'Ligue 11 98765-4321' }, 1).texto).toBeDefined();
    expect(errosDoPasso({ ...ev, titulo: 'Veja www.golpe.com' }, 1).titulo).toBeDefined();
    expect(errosDoPasso({ ...reuniao(), pauta: 'Contas\nPIX: chave@exemplo.com' }, 1).pauta).toBeDefined();
    expect(errosDoPasso({ ...ev, local: 'Rua A, fone 11 98765-4321' }, 2).local).toBeDefined();
    // Card que não vira link (aviso) não passa pela regra do link: é a imagem da própria pessoa.
    expect(errosDoPasso({ ...exemploDoFluxo('aviso', 0), texto: 'Ligue 11 98765-4321' }, 1)).toEqual({});
  });

  it('o erro do passo 2 não aparece no passo 1', () => {
    expect(errosDoPasso({ ...reuniao(), data: '' }, 1)).toEqual({});
  });
});

describe('o que sai', () => {
  it('o card da reunião leva a pauta em uma linha', () => {
    const c = camposDoCard(reuniao());
    expect(c.texto).toBe('Pauta: Limpeza do córrego; Horário da coleta de lixo; Contas do ano');
    expect(c.modelo).toBe('reuniao');
  });

  it('aviso não leva hora nem local no card', () => {
    const c = camposDoCard({ ...exemploDoFluxo('aviso', 0), hora: '10:00', local: 'Praça' });
    expect(c.hora).toBe('');
    expect(c.local).toBe('');
  });

  it('o texto da reunião tem a pauta numerada e o link do evento', () => {
    const t = textoParaMandar(reuniao(), `${BASE}#/evento/1rABC`);
    expect(t).toContain('*Pauta*\n1. Limpeza do córrego\n2. Horário da coleta de lixo');
    expect(t).toContain(`Mais detalhes: ${BASE}#/evento/1rABC`);
    expect(t.startsWith('*Assembleia geral de moradores*')).toBe(true);
  });

  it('sem link, o texto não fala em link', () => {
    expect(textoParaMandar(exemploDoFluxo('agradecimento', 0))).not.toMatch(/Mais detalhes/);
  });

  it('o asterisco digitado não quebra o negrito', () => {
    expect(textoParaMandar({ ...exemploDoFluxo('aviso', 0), titulo: '*Oi*' }).split('\n')[0]).toBe('*Oi*');
  });

  it('a descrição do link da reunião é a pauta numerada, inteira (sem corte com "…")', () => {
    const e = eventoDoFluxo(reuniao());
    expect(e.descricao).toBe('Pauta:\n1. Limpeza do córrego\n2. Horário da coleta de lixo\n3. Contas do ano');
    expect(validarEvento(e).ok).toBe(true);
    const muitos = Array.from({ length: 20 }, (_, i) => `Assunto comprido número ${i + 1} da pauta`).join('\n');
    expect(eventoDoFluxo({ ...reuniao(), pauta: muitos }).descricao).not.toContain('…');
  });

  it('pauta que não cabe no link vira erro no campo Pauta, com a regra dita', () => {
    const muitos = Array.from({ length: 20 }, (_, i) => `Assunto comprido número ${i + 1} da pauta`).join('\n');
    expect(errosDoPasso({ ...reuniao(), pauta: muitos }, 1).pauta).toBe(
      'a pauta ficou longa para o link: use até 400 letras no total.',
    );
    expect(errosDoPasso(reuniao(), 1)).toEqual({});
  });

  it('o erro copiado do evento fala em "a pauta" ou "o texto", não em "a descrição"', () => {
    const pauta = errosDoPasso({ ...reuniao(), pauta: 'Contas\nPIX: chave@exemplo.com' }, 1).pauta!;
    expect(pauta).not.toMatch(/descrição/);
    expect(pauta).toMatch(/a pauta/);
    const texto = errosDoPasso({ ...exemploDoFluxo('evento', 0, QUINTA), texto: 'Ligue 11 98765-4321' }, 1).texto!;
    expect(texto).not.toMatch(/descrição/);
    expect(texto).toMatch(/o texto/);
  });
});

describe('dados que chegam de outra tela', () => {
  const link = `${BASE}#/evento/1rABCdef`;
  const ev = { titulo: 'Festa', data: '2026-11-14', inicio: '18:00', fim: '', local: 'Quadra', descricao: 'Traga um prato', organizacao: 'Coletivo' };

  it('o card preparado nunca reaproveita o link (o texto chega cortado e sem hora de fim)', () => {
    const d = dadosDoCardPreparado({
      modelo: 'evento',
      titulo: 'Mutirão',
      data: '2026-11-14',
      hora: '09:00',
      local: 'Praça',
      texto: 'Traga luvas',
      organizacao: 'Associação',
      link,
    })!;
    expect(d.link).toBe('');
    expect(d.assinaturaDoLink).toBe('');
    expect(linkAindaVale(d)).toBe(false);
    expect(d.origem).toBe('link');
  });

  it('sem nada preparado, não abre nada', () => {
    expect(dadosDoCardPreparado({})).toBeNull();
  });

  it('criar outro a partir de um evento', () => {
    const d = dadosDoEvento(ev, link, BASE);
    expect(d).toMatchObject({ tipo: 'evento', titulo: 'Festa', hora: '18:00', texto: 'Traga um prato', origem: 'link', ficouDeFora: '' });
    expect(linkAindaVale(d)).toBe(true);
    // Descrição maior que o texto do card ou hora de fim: o link de antes não descreve o que sai; gera outro.
    expect(linkAindaVale(dadosDoEvento({ ...ev, fim: '20:00' }, link, BASE))).toBe(false);
    expect(linkAindaVale(dadosDoEvento({ ...ev, descricao: 'x'.repeat(200) }, link, BASE))).toBe(false);
    expect(assinatura(d)).toBe(d.assinaturaDoLink);
  });

  it('diz o que ficou de fora, só a parte que vale', () => {
    const longa = 'x'.repeat(200);
    expect(oQueFicouDeFora(ev)).toBe('');
    expect(oQueFicouDeFora({ ...ev, fim: '20:00' })).toBe('A hora de fim não cabe aqui e ficou de fora.');
    expect(oQueFicouDeFora({ ...ev, descricao: longa })).toBe('Parte da descrição não cabe aqui e ficou de fora.');
    expect(oQueFicouDeFora({ ...ev, fim: '20:00', descricao: longa })).toBe(
      'A hora de fim e parte da descrição não cabem aqui e ficaram de fora.',
    );
    expect(dadosDoEvento({ ...ev, fim: '20:00' }, link, BASE).ficouDeFora).toMatch(/hora de fim/);
  });
});

describe('origem dos dados', () => {
  it('o exemplo começa como exemplo; mexer vira da pessoa; link continua link', () => {
    const d = exemploDoFluxo('evento', 0, QUINTA);
    expect(d.origem).toBe('exemplo');
    marcarMudanca(d);
    expect(d.origem).toBe('pessoa');
    marcarMudanca(d);
    expect(d.origem).toBe('pessoa');
    const l = { origem: 'link' as const };
    marcarMudanca(l);
    expect(l.origem).toBe('link');
  });

  it('o botão de apagar só fala em exemplo quando é exemplo', () => {
    expect(rotuloDeApagar('exemplo')).toBe('Apagar o exemplo');
    expect(rotuloDeApagar('pessoa')).toBe('Apagar tudo');
    expect(rotuloDeApagar('link')).toBe('Apagar tudo');
  });
});

describe('o que ainda é do exemplo', () => {
  it('o exemplo inteiro tem título, organização, texto e local marcados (pauta na reunião)', () => {
    expect(camposDoExemplo(exemploDoFluxo('evento', 0, QUINTA))).toEqual(['titulo', 'organizacao', 'texto', 'local']);
    expect(camposDoExemplo(exemploDoFluxo('reuniao', 0, QUINTA))).toEqual(['titulo', 'organizacao', 'pauta', 'local']);
    // Sem agenda, o local não conta.
    for (const tipo of ['aviso', 'resultado', 'agradecimento'] as const) {
      expect(camposDoExemplo(exemploDoFluxo(tipo, 0, QUINTA))).toEqual(['titulo', 'organizacao', 'texto']);
    }
  });

  it('o atalho do dia e a hora não tiram a marca do exemplo', () => {
    const d = exemploDoFluxo('evento', 0, QUINTA);
    const antes = camposDoExemplo(d);
    d.data = atalhosDoDia(QUINTA)[0]!.data;
    d.hora = '07:15';
    marcarMudanca(d);
    expect(d.origem).toBe('pessoa');
    expect(camposDoExemplo(d)).toEqual(antes);
  });

  it('trocar só o título deixa a organização e o local marcados', () => {
    const d = { ...exemploDoFluxo('evento', 2, QUINTA), titulo: 'Meu título' };
    expect(camposDoExemplo(d)).toEqual(['organizacao', 'texto', 'local']);
  });

  it('compara sem os espaços das pontas; campo vazio não é do exemplo', () => {
    const ex = exemploDoFluxo('evento', 0, QUINTA);
    expect(camposDoExemplo({ ...ex, titulo: `  ${ex.titulo}  ` })).toContain('titulo');
    expect(camposDoExemplo({ ...ex, titulo: '', local: '   ' })).toEqual(['organizacao', 'texto']);
  });

  it('dados de link não têm cópia do exemplo e nunca são marcados', () => {
    const d = dadosDoEvento(
      { titulo: 'Festa', data: '2026-11-14', inicio: '18:00', fim: '', local: 'Praça', descricao: 'Traga um prato', organizacao: 'Grupo' },
      '',
      BASE,
    );
    expect(d.doExemplo).toBeUndefined();
    expect(camposDoExemplo(d)).toEqual([]);
  });

  it('organização do catálogo conta como do exemplo mesmo sem a cópia (link antigo, digitada à mão)', () => {
    const base = { ...exemploDoFluxo('evento', 0, QUINTA), titulo: 'Festa da rua', texto: 'Traga um prato', local: 'Rua das Flores, 10' };
    delete base.doExemplo;
    const org = exemploDoFluxo('evento', 0, QUINTA).organizacao;
    expect(camposDoExemplo({ ...base, organizacao: org })).toEqual(['organizacao']);
    expect(camposDoExemplo({ ...base, organizacao: `  ${org.toUpperCase()} ` })).toEqual(['organizacao']);
    expect(camposDoExemplo({ ...base, organizacao: `${org} Sul` })).toEqual([]);
  });

  it('a frase do aviso lista os campos, com "e" no fim e singular ou plural certo', () => {
    expect(avisoDoExemplo([])).toBe('');
    expect(avisoDoExemplo(['local'])).toBe('O local ainda é do exemplo. Troque pelo que for seu em Mudar algo.');
    expect(avisoDoExemplo(['organizacao'])).toBe('A organização ainda é do exemplo. Troque pelo que for seu em Mudar algo.');
    expect(avisoDoExemplo(['organizacao', 'local'])).toBe('A organização e o local ainda são do exemplo. Troque pelo que for seu em Mudar algo.');
    expect(avisoDoExemplo(['titulo', 'organizacao', 'pauta', 'local'])).toBe(
      'O título, a organização, a pauta e o local ainda são do exemplo. Troque pelo que for seu em Mudar algo.',
    );
  });

  it('a frase da confirmação', () => {
    expect(fraseDaConfirmacao(['organizacao', 'local'])).toBe('Isto ainda tem partes do exemplo: organização e local.');
    expect(fraseDaConfirmacao(['titulo'])).toBe('Isto ainda tem partes do exemplo: título.');
    expect(fraseDaConfirmacao(['titulo', 'organizacao', 'texto'])).toBe('Isto ainda tem partes do exemplo: título, organização e texto.');
  });

  it('"Apagar" limpa o local só quando ele ainda é o do exemplo; dia e hora ficam', () => {
    const d = exemploDoFluxo('evento', 0, QUINTA);
    const { data, hora } = d;
    apagarOPasso1(d);
    expect([d.titulo, d.organizacao, d.texto, d.pauta, d.local]).toEqual(['', '', '', '', '']);
    expect([d.data, d.hora]).toEqual([data, hora]);
    const e = { ...exemploDoFluxo('evento', 0, QUINTA), local: 'Rua das Flores, 10' };
    apagarOPasso1(e);
    expect(e.local).toBe('Rua das Flores, 10');
  });

  it('a cópia do exemplo não vaza para o evento, a assinatura nem o texto', () => {
    for (const tipo of ['reuniao', 'evento'] as const) {
      const d = exemploDoFluxo(tipo, 4, QUINTA);
      const ex = { ...d.doExemplo! };
      Object.assign(d, { titulo: 'Novo título', organizacao: 'Nova org', texto: 'Novo texto', pauta: 'Novo assunto', local: 'Novo local' });
      const saidas = [
        JSON.stringify(eventoDoFluxo(d)),
        assinatura(d),
        textoParaMandar(d, 'https://exemplo.test/#/evento/x'),
        JSON.stringify(camposDoCard(d)),
        JSON.stringify(convocacaoDoFluxo(d)),
      ].join('\n');
      for (const valor of [ex.titulo, ex.organizacao, ex.local]) expect(saidas).not.toContain(valor);
      expect(Object.keys(eventoDoFluxo(d)).sort()).toEqual(['data', 'descricao', 'fim', 'inicio', 'local', 'organizacao', 'titulo']);
    }
  });
});

describe('passo pendente (endereço de passo aberto direto)', () => {
  it('dados completos: pode abrir qualquer passo', () => {
    for (const p of [1, 2, 3, 'pronto'] as const) expect(passoPendente(reuniao(), p)).toBeNull();
  });

  it('falta o título: manda ao passo 1, menos para quem já está nele', () => {
    const d = { ...reuniao(), titulo: '' };
    expect(passoPendente(d, 1)).toBeNull();
    expect(passoPendente(d, 2)).toBe(1);
    expect(passoPendente(d, 'pronto')).toBe(1);
  });

  it('falta o dia: o passo 1 e o 2 abrem; o 3 e o Pronto mandam ao 2', () => {
    const d = { ...reuniao(), data: '' };
    expect(passoPendente(d, 2)).toBeNull();
    expect(passoPendente(d, 3)).toBe(2);
    expect(passoPendente(d, 'pronto')).toBe(2);
  });
});
