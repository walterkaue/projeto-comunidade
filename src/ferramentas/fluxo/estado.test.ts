import { describe, expect, it } from 'vitest';
import { lerRota } from '../../comum/rotas';
import { validarEvento } from '../evento/validar';
import {
  apagarOPasso1,
  AVISO_DIA_PASSADO,
  avisoDasLetrasDaPauta,
  camposComOrgao,
  confirmarOrgao,
  copiaDoPasso1,
  devolverOPasso1,
  diaJaPassou,
  lembreteDoDia,
  letrasQueFaltamNaPauta,
  PERGUNTA_DO_ORGAO,
  precisaPerguntarDoOrgao,
  perguntarDoOrgaoNoPronto,
  confirmarOrgaoNoPronto,
  passo1Vazio,
  avisoDeApagar,
  ROTULO_DESFAZER,
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
  fraseDoLinkNoPronto,
  notaEDicaDoPasso,
  NOTA_DO_LINK,
  avisoDoLinkNoPronto,
  FRASE_DO_LINK_ORIGINAL,
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

  it('usa o índice cru: a pauta gira a cada 7 e dá a volta, também para trás', () => {
    const pauta = (i: number) => exemploDoFluxo('reuniao', i, QUINTA).pauta;
    expect(pauta(7)).toBe(pauta(0));
    expect(pauta(15)).toBe(pauta(1));
    expect(pauta(-1)).toBe(pauta(6));
    expect(new Set(Array.from({ length: 7 }, (_, i) => pauta(i))).size).toBe(7);
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
  it('o card da reunião leva a pauta em itens, sem "Pauta:" nem número, e o texto vazio', () => {
    const c = camposDoCard(reuniao());
    expect(c.pauta).toEqual(['Limpeza do córrego', 'Horário da coleta de lixo', 'Contas do ano']);
    expect(c.texto).toBe('');
    expect(c.modelo).toBe('reuniao');
    expect(camposDoCard({ ...reuniao(), pauta: ' Um \n\n Dois ' }).pauta).toEqual(['Um', 'Dois']);
  });

  it('os outros tipos não levam pauta no card', () => {
    expect(camposDoCard(exemploDoFluxo('evento', 0, QUINTA)).pauta).toBeUndefined();
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
    expect(errosDoPasso({ ...reuniao(), pauta: muitos }, 1).pauta).toMatch(/^a pauta passou \d+ letras\. Encurte um assunto ou tire algum\.$/);
    expect(errosDoPasso({ ...reuniao(), pauta: muitos }, 1).pauta).not.toMatch(/400/);
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

  it('o card preparado guarda o link original; sem mudança ele vale, com mudança não', () => {
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
    expect(d.link).toBe(link);
    expect(d.assinaturaDoLink).toBe(assinatura(d));
    expect(linkAindaVale(d)).toBe(true);
    expect(d.origem).toBe('link');
    d.titulo = 'Outro título';
    expect(linkAindaVale(d)).toBe(false);
  });

  it('o card preparado sem link não inventa um', () => {
    const d = dadosDoCardPreparado({ modelo: 'evento', titulo: 'Mutirão' })!;
    expect(d.link).toBe('');
    expect(linkAindaVale(d)).toBe(false);
  });

  it('sem nada preparado, não abre nada', () => {
    expect(dadosDoCardPreparado({})).toBeNull();
  });

  it('criar outro a partir de um evento', () => {
    const d = dadosDoEvento(ev, link, BASE);
    expect(d).toMatchObject({ tipo: 'evento', titulo: 'Festa', hora: '18:00', texto: 'Traga um prato', origem: 'link', ficouDeFora: '' });
    expect(linkAindaVale(d)).toBe(true);
    expect(assinatura(d)).toBe(d.assinaturaDoLink);
  });

  it('criar outro, sem mudança, mantém o link original mesmo com hora de fim, quebra de linha e descrição longa', () => {
    const longo = { ...ev, fim: '20:00', descricao: `Linha um\nLinha dois ${'x'.repeat(200)}` };
    const d = dadosDoEvento(longo, link, BASE);
    expect(d.link).toBe(link);
    expect(linkAindaVale(d)).toBe(true);
    d.titulo = 'Outra festa';
    expect(linkAindaVale(d)).toBe(false);
  });

  it('link que não é do próprio site não é reaproveitado', () => {
    expect(dadosDoEvento(ev, 'https://outro.test/#/evento/1rABC', BASE).link).toBe('');
  });

  it('diz o que ficou de fora, só a parte que vale', () => {
    const longa = 'x'.repeat(200);
    expect(oQueFicouDeFora(ev)).toBe('');
    expect(oQueFicouDeFora({ ...ev, fim: '20:00' })).toBe('A hora de fim não cabe na imagem. Sem mudança, o link continua levando o evento inteiro.');
    expect(oQueFicouDeFora({ ...ev, descricao: longa })).toBe('Parte da descrição não cabe na imagem. Sem mudança, o link continua levando o evento inteiro.');
    expect(oQueFicouDeFora({ ...ev, fim: '20:00', descricao: longa })).toBe(
      'A hora de fim e parte da descrição não cabem na imagem. Sem mudança, o link continua levando o evento inteiro.',
    );
    expect(dadosDoEvento({ ...ev, fim: '20:00' }, link, BASE).ficouDeFora).toMatch(/hora de fim/);
  });
});

describe('link original e notas de dados de link', () => {
  const link = `${BASE}#/evento/1rABCdef`;
  const ev = { titulo: 'Festa', data: '2026-11-14', inicio: '18:00', fim: '20:00', local: 'Quadra', descricao: 'Traga um prato', organizacao: 'Coletivo' };

  it('card preparado de tipo sem agenda não guarda o link', () => {
    const d = dadosDoCardPreparado({ modelo: 'aviso', titulo: 'Aviso', link })!;
    expect(d.link).toBe('');
  });

  it('a frase do Pronto diz "mesmo link" só enquanto o link original vale', () => {
    const d = dadosDoEvento(ev, link, BASE);
    expect(fraseDoLinkNoPronto(d)).toBe(FRASE_DO_LINK_ORIGINAL);
    d.titulo = 'Outra festa';
    expect(fraseDoLinkNoPronto(d)).toBe(avisoDoLinkNoPronto('evento'));
    // Link que o Pronto gerou depois de uma mudança não é o original.
    d.link = 'x';
    d.assinaturaDoLink = assinatura(d);
    d.linkOriginal = false;
    expect(fraseDoLinkNoPronto(d)).toBe(avisoDoLinkNoPronto('evento'));
    expect(fraseDoLinkNoPronto(exemploDoFluxo('evento', 0, QUINTA))).toBe(avisoDoLinkNoPronto('evento'));
  });

  it('nota e dica do passo: link no passo 1 troca a dica; no 3 vem acima dela; no 2 e sem link, só a dica', () => {
    const doLink = { origem: 'link' as const, ficouDeFora: 'Algo ficou.' };
    const p1 = notaEDicaDoPasso(doLink, 1);
    expect(p1).toEqual({ nota: `${NOTA_DO_LINK} Algo ficou.`, dica: '' });
    const p3 = notaEDicaDoPasso(doLink, 3);
    expect(p3.nota).toBe(NOTA_DO_LINK);
    expect(p3.dica).toMatch(/Escolha onde vai mandar/);
    const p2 = notaEDicaDoPasso(doLink, 2);
    expect(p2.nota).toBe('');
    expect(p2.dica).not.toBe('');
    for (const passo of [1, 2, 3] as const) {
      const sem = notaEDicaDoPasso({ origem: 'pessoa', ficouDeFora: '' }, passo);
      expect(sem.nota).toBe('');
      expect(sem.dica).not.toBe('');
    }
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

describe('contador de letras da pauta (A-02, B-19)', () => {
  // "Pauta:" (6) + "\n1. " (4) por item + letras do item
  const comFalta = (falta: number) => {
    const total = 400 - 6 - 16 - falta; // 4 itens de até 120 letras
    // palavras curtas: letra repetida sem parar seria barrada como "código comprido"
    const item = (n: number) => `${'lua '.repeat(40).slice(0, n - 1)}a`;
    return [0, 1, 2, 3].map((i) => item(Math.floor(total / 4) + (i < total % 4 ? 1 : 0))).join('\n');
  };

  it('conta o que falta para o limite da descrição do link', () => {
    expect(letrasQueFaltamNaPauta('')).toBe(394);
    expect(letrasQueFaltamNaPauta(comFalta(10))).toBe(10);
    expect(letrasQueFaltamNaPauta(comFalta(0))).toBe(0);
    expect(letrasQueFaltamNaPauta(comFalta(-3))).toBe(-3);
  });

  it('vazio enquanto faltam mais de 50; depois, quanto falta', () => {
    expect(avisoDasLetrasDaPauta(comFalta(51))).toBe('');
    expect(avisoDasLetrasDaPauta(comFalta(50))).toBe('Faltam 50 letras.');
    expect(avisoDasLetrasDaPauta(comFalta(2))).toBe('Faltam 2 letras.');
    expect(avisoDasLetrasDaPauta(comFalta(1))).toBe('Falta 1 letra.');
  });

  it('no limite e acima dele', () => {
    expect(avisoDasLetrasDaPauta(comFalta(0))).toBe('Chegou no limite.');
    expect(avisoDasLetrasDaPauta(comFalta(-1))).toBe('Passou 1 letra.');
    expect(avisoDasLetrasDaPauta(comFalta(-7))).toBe('Passou 7 letras.');
  });

  it('o erro do passo 1 diz quantas letras passou, em minúscula e sem falar em 400', () => {
    expect(errosDoPasso({ ...reuniao(), pauta: comFalta(-7) }, 1).pauta).toBe('a pauta passou 7 letras. Encurte um assunto ou tire algum.');
    expect(errosDoPasso({ ...reuniao(), pauta: comFalta(-1) }, 1).pauta).toBe('a pauta passou 1 letra. Encurte um assunto ou tire algum.');
    expect(errosDoPasso({ ...reuniao(), pauta: comFalta(0) }, 1).pauta).toBeUndefined();
  });
});

describe('quebra de linha no texto livre (A-09)', () => {
  const texto = (t: string) => textoParaMandar({ ...exemploDoFluxo('evento', 0, QUINTA), texto: t, organizacao: '' });

  it('mantém a quebra de linha e os emojis', () => {
    expect(texto('Venha com sua família 🙏\nTeremos roupas, livros e bolo 🎉😊')).toContain(
      '\n\nVenha com sua família 🙏\nTeremos roupas, livros e bolo 🎉😊',
    );
  });

  it('três linhas em branco seguidas viram uma só', () => {
    const t = texto('Primeira parte\n\n\n\nSegunda parte');
    expect(t).toContain('Primeira parte\n\nSegunda parte');
    expect(t).not.toMatch(/\n\n\n/);
  });

  it('junta espaços e tabulações e tira os das pontas de cada linha', () => {
    expect(texto('  Um   dois\t\ttrês  \r\n   quatro   ')).toContain('Um dois três\nquatro');
  });

  it('título, local e itens da pauta seguem numa linha só', () => {
    const t = textoParaMandar({ ...exemploDoFluxo('evento', 0, QUINTA), titulo: 'Festa\nda   rua', local: 'Praça\nCentral' });
    expect(t).toContain('*Festa da rua*');
    expect(t).toContain('📍 Praça Central');
    const r = textoParaMandar({ ...reuniao(), pauta: 'Um   assunto\nOutro' });
    expect(r).toContain('1. Um assunto\n2. Outro');
  });
});

describe('lembrete do dia (D4)', () => {
  it('reunião e evento com o dia e a hora do exemplo: pede para conferir', () => {
    expect(lembreteDoDia(exemploDoFluxo('evento', 0, QUINTA), QUINTA)).toBe('Confira o dia: sábado, 7 de novembro, às 9h30.');
    expect(lembreteDoDia(exemploDoFluxo('reuniao', 0, QUINTA), QUINTA)).toBe('Confira o dia: sábado, 7 de novembro, às 19h.');
  });

  it('mudou o dia ou a hora: some', () => {
    expect(lembreteDoDia({ ...exemploDoFluxo('evento', 0, QUINTA), data: '2026-11-14' }, QUINTA)).toBe('');
    expect(lembreteDoDia({ ...exemploDoFluxo('evento', 0, QUINTA), hora: '10:00' }, QUINTA)).toBe('');
  });

  it('sem exemplo (aviso, ou dados sem a cópia) não há lembrete', () => {
    expect(lembreteDoDia(exemploDoFluxo('aviso', 0, QUINTA), QUINTA)).toBe('');
    const semExemplo = { ...exemploDoFluxo('evento', 0, QUINTA) };
    delete semExemplo.diaDoExemplo;
    expect(lembreteDoDia(semExemplo, QUINTA)).toBe('');
  });

  it('o dia do exemplo não sai em camposDoExemplo, evento, assinatura, texto nem card', () => {
    const d = exemploDoFluxo('evento', 0, QUINTA);
    expect(camposDoExemplo(d)).not.toContain('data');
    expect(d.diaDoExemplo).toEqual({ data: '2026-11-07', hora: '09:30' });
    const mudado = { ...d, data: '2026-12-01', hora: '08:00', diaDoExemplo: { data: '1999-01-02', hora: '03:04' } };
    const saidas = [JSON.stringify(eventoDoFluxo(mudado)), assinatura(mudado), textoParaMandar(mudado), JSON.stringify(camposDoCard(mudado))].join('\n');
    expect(saidas).not.toContain('1999');
    expect(saidas).not.toContain('03:04');
    expect(Object.keys(eventoDoFluxo(mudado)).sort()).toEqual(['data', 'descricao', 'fim', 'inicio', 'local', 'organizacao', 'titulo']);
  });
});

describe('órgão público (D1)', () => {
  const base = () => ({ ...exemploDoFluxo('evento', 0, QUINTA), organizacao: 'Associação de moradores', local: 'Quadra do bairro' });

  it('a pergunta é a do plano', () => {
    expect(PERGUNTA_DO_ORGAO).toBe(
      'Este convite fala em nome de um órgão público? O site não é para comunicado oficial, e fingir ser órgão público é contra as regras.',
    );
  });

  it('sem órgão citado, não pergunta', () => {
    const d = { ...base(), titulo: 'Festa da rua', texto: 'Traga um prato' };
    expect(camposComOrgao(d, 1)).toEqual([]);
    expect(precisaPerguntarDoOrgao(d, 1)).toBe(false);
    expect(precisaPerguntarDoOrgao(d, 2)).toBe(false);
  });

  it('passo 1: título, organização e texto; passo 2: só o local', () => {
    const d = { ...base(), titulo: 'Reunião com a Prefeitura', organizacao: 'Secretaria de Obras', texto: 'Fala da Prefeitura', local: 'Prefeitura Regional' };
    expect(camposComOrgao(d, 1)).toEqual(['titulo', 'organizacao', 'texto']);
    expect(camposComOrgao(d, 2)).toEqual(['local']);
    expect(precisaPerguntarDoOrgao(d, 1)).toBe(true);
    expect(precisaPerguntarDoOrgao(d, 2)).toBe(true);
  });

  it('na reunião, o passo 1 olha a pauta e não o texto; aviso não tem local', () => {
    const r = { ...exemploDoFluxo('reuniao', 0, QUINTA), pauta: 'Conversa com a Prefeitura\nContas' };
    expect(camposComOrgao(r, 1)).toEqual(['pauta']);
    const a = { ...exemploDoFluxo('aviso', 0, QUINTA), local: 'Prefeitura' };
    expect(camposComOrgao(a, 2)).toEqual([]);
  });

  it('depois de confirmar, não pergunta de novo para o mesmo texto; texto novo que cita, pergunta', () => {
    const d = { ...base(), titulo: 'Reunião com a Prefeitura', texto: 'Traga um prato' };
    expect(precisaPerguntarDoOrgao(d, 1)).toBe(true);
    confirmarOrgao(d, 1);
    expect(precisaPerguntarDoOrgao(d, 1)).toBe(false);
    confirmarOrgao(d, 1);
    expect(d.orgaoConfirmado).toHaveLength(1);
    d.titulo = 'Reunião com a Prefeitura de novo';
    expect(precisaPerguntarDoOrgao(d, 1)).toBe(true);
    d.titulo = 'Reunião com a Prefeitura';
    expect(precisaPerguntarDoOrgao(d, 1)).toBe(false);
    d.texto = 'A Prefeitura vai ouvir';
    expect(precisaPerguntarDoOrgao(d, 1)).toBe(true);
  });

  it('confirmar o passo 1 não confirma o 2', () => {
    const d = { ...base(), titulo: 'Reunião com a Prefeitura', local: 'Prefeitura Regional' };
    confirmarOrgao(d, 1);
    expect(precisaPerguntarDoOrgao(d, 2)).toBe(true);
  });

  it('vale para todo tipo e toda organização', () => {
    for (const tipo of TIPOS) {
      const d = { ...exemploDoFluxo(tipo, 3, QUINTA), titulo: 'Ofício da Secretaria de Saúde', organizacao: 'Coletivo cultural' };
      expect(precisaPerguntarDoOrgao(d, 1), tipo).toBe(true);
    }
  });

  it('o que foi confirmado nunca entra no evento, na assinatura, no texto, no card nem na convocação', () => {
    const d = { ...base(), titulo: 'Reunião com a Prefeitura', texto: 'Traga um prato' };
    const saidas = (x: DadosDoFluxo) => [
      JSON.stringify(eventoDoFluxo(x)),
      assinatura(x),
      textoParaMandar(x, 'https://exemplo.test/#/evento/x'),
      JSON.stringify(camposDoCard(x)),
      JSON.stringify(convocacaoDoFluxo(x)),
    ];
    const antes = saidas(d);
    confirmarOrgao(d, 1);
    expect(d.orgaoConfirmado).toHaveLength(1);
    expect(saidas(d)).toEqual(antes);
    expect(saidas(d).join('\n')).not.toContain('orgaoConfirmado');
  });
});

describe('órgão público no Pronto de dados de link', () => {
  const base = () => ({ ...exemploDoFluxo('evento', 0, QUINTA), organizacao: 'Associação de moradores', local: 'Quadra do bairro' });
  it('só pergunta para origem link, nos dois passos pulados; confirmar vale pelos dois', () => {
    const d: DadosDoFluxo = { ...base(), origem: 'link', titulo: 'Reunião com a Prefeitura', local: 'Prefeitura Regional' };
    expect(perguntarDoOrgaoNoPronto(d)).toBe(true);
    confirmarOrgaoNoPronto(d);
    expect(perguntarDoOrgaoNoPronto(d)).toBe(false);
    expect(precisaPerguntarDoOrgao(d, 1) || precisaPerguntarDoOrgao(d, 2)).toBe(false);
  });
  it('quem passou pelos passos (origem que não é link) não é perguntado de novo no Pronto', () => {
    const d: DadosDoFluxo = { ...base(), origem: 'pessoa', titulo: 'Reunião com a Prefeitura' };
    expect(perguntarDoOrgaoNoPronto(d)).toBe(false);
  });
  it('dados de link sem órgão citado não perguntam', () => {
    expect(perguntarDoOrgaoNoPronto({ ...base(), origem: 'link', titulo: 'Mutirão da horta' })).toBe(false);
  });
});

describe('Desfazer: prazo e passo vazio', () => {
  const base = () => exemploDoFluxo('evento', 0, QUINTA);
  it('o aviso diz o prazo; sem cópia, não fala em Desfazer', () => {
    expect(avisoDeApagar(true, true)).toBe('Exemplo apagado. Para trazer de volta, toque em Desfazer em até 10 segundos.');
    expect(avisoDeApagar(false, true)).toBe('Tudo apagado. Para trazer de volta, toque em Desfazer em até 10 segundos.');
    expect(avisoDeApagar(false, false)).toBe('Tudo apagado.');
  });
  it('passo 1 vazio: título, organização, texto e pauta sem nada (ou só espaços)', () => {
    expect(passo1Vazio({ ...base(), titulo: ' ', organizacao: '', texto: '', pauta: '', local: '' })).toBe(true);
    expect(passo1Vazio({ ...base(), titulo: '', organizacao: '', texto: 'x', pauta: '' })).toBe(false);
  });
  it('o local do exemplo, que o apagar também limpa, conta: há o que desfazer', () => {
    const d = { ...base(), titulo: '', organizacao: '', texto: '', pauta: '' };
    expect(passo1Vazio(d)).toBe(false);
    expect(passo1Vazio({ ...d, local: '' })).toBe(true);
    expect(passo1Vazio({ ...d, local: 'Rua das Flores, 10' })).toBe(true);
  });
});

describe('Desfazer o apagar (D7)', () => {
  it('o rótulo é "Desfazer"', () => expect(ROTULO_DESFAZER).toBe('Desfazer'));

  it('devolve título, organização, texto, local e origem de antes do Apagar', () => {
    const d = exemploDoFluxo('evento', 0, QUINTA);
    const antes = structuredClone(d);
    const copia = copiaDoPasso1(d);
    apagarOPasso1(d);
    marcarMudanca(d);
    expect([d.titulo, d.organizacao, d.texto, d.local]).toEqual(['', '', '', '']);
    expect(d.origem).toBe('pessoa');
    devolverOPasso1(d, copia);
    expect(d).toEqual(antes);
  });

  it('devolve a pauta da reunião', () => {
    const d = reuniao();
    const pauta = d.pauta;
    const copia = copiaDoPasso1(d);
    apagarOPasso1(d);
    expect(d.pauta).toBe('');
    devolverOPasso1(d, copia);
    expect(d.pauta).toBe(pauta);
  });

  it('a cópia não muda se os dados mudarem depois', () => {
    const d = reuniao();
    const copia = copiaDoPasso1(d);
    d.titulo = 'Outro';
    expect(copia.titulo).not.toBe('Outro');
  });
});

describe('dia que já passou (C-09)', () => {
  it('antes de hoje passou; hoje e depois, não', () => {
    expect(diaJaPassou('2026-11-04', QUINTA)).toBe(true);
    expect(diaJaPassou('2026-11-05', QUINTA)).toBe(false);
    expect(diaJaPassou('2026-11-06', QUINTA)).toBe(false);
    expect(diaJaPassou('2025-12-31', QUINTA)).toBe(true);
  });

  it('usa a data local: hoje às 23h59 ainda não passou', () => {
    expect(diaJaPassou('2026-11-05', new Date(2026, 10, 5, 23, 59))).toBe(false);
    expect(diaJaPassou('2026-11-05', new Date(2026, 10, 6, 0, 1))).toBe(true);
  });

  it('vazio ou inválido não passou, e não bloqueia nada', () => {
    expect(diaJaPassou('', QUINTA)).toBe(false);
    expect(diaJaPassou('2026-02-31', QUINTA)).toBe(false);
    expect(errosDoPasso({ ...reuniao(), data: '2020-01-01' }, 2)).toEqual({});
  });

  it('o aviso é o do plano', () => expect(AVISO_DIA_PASSADO).toBe('Esse dia já passou. Está certo?'));
});

describe('palavras da tela (D9)', () => {
  it('o que ficou de fora fala em imagem, não em card', () => {
    const e = { fim: '20:00', descricao: 'x'.repeat(500) };
    for (const t of [oQueFicouDeFora(e), oQueFicouDeFora({ ...e, descricao: 'x' }), oQueFicouDeFora({ ...e, fim: '' })]) {
      expect(t).toContain('na imagem');
      expect(t).not.toMatch(/card/i);
    }
  });
});
