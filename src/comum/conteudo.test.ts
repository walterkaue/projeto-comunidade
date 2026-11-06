import { describe, expect, it } from 'vitest';
import { citaOrgaoPublico, limparTexto, MENSAGEM_DO_MOTIVO, mensagemDaRecusa, motivoDeRecusa, paraConferir } from './conteudo';
import { NOME, NOME_CURTO } from './marca';

describe('citaOrgaoPublico', () => {
  const citam = [
    'Prefeitura de Vila Alegre informa',
    'PREFEITURA',
    'Defesa Civil: evacuação imediata',
    'defesa  civil',
    'Governo Federal convoca',
    'governo do estado',
    'INSS: atualização cadastral',
    'inss',
    'Receita Federal: regularize seu CPF',
    'Receita: regularize seu CPF',
    'Polícia Militar: operação no bairro',
    'POLICIA',
    'Banco Central: devolução de valores',
    'Ministério da Saúde',
    'Ministerio',
    'Secretaria de Saúde de Vila Alegre: vacinação',
    'URGENTE: aviso da Prefeitura',
    'Reunião com a Prefeitura sobre a praça',
    'ｐｒｅｆｅｉｔｕｒａ',
    'Prefeitura​ de Vila Alegre',
  ];
  for (const t of citam) it(`cita: ${t}`, () => expect(citaOrgaoPublico(t), t).toBe(true));

  const naoCitam = [
    'Sarau na praça',
    'Associação de moradores do Bairro Novo',
    'Troca de receitas da vó',
    'Receita de bolo de fubá',
    'Mutirão de limpeza',
    'Governança do coletivo',
    'Policiamento',
    'Banco de alimentos',
    'Festa da Comunidade',
    '',
  ];
  for (const t of naoCitam) it(`não cita: ${t || '(vazio)'}`, () => expect(citaOrgaoPublico(t), t).toBe(false));

  it('não barra nada: só informa', () => {
    expect(motivoDeRecusa('Reunião com a Prefeitura sobre a praça')).toBeNull();
    expect(motivoDeRecusa('Defesa Civil: evacuação imediata')).toBeNull();
  });
});

describe('telefone disfarçado', () => {
  const recusados = [
    '11 98765 ‐ 4321',
    '98765‒4321',
    '98765−4321',
    '98765~4321',
    '98765*4321',
    '98765 | 4321',
    '98765;4321',
    'Zap 98765 e 4321',
    'Contato 9876,54321',
    '9.8.7.6.5.4.3.2.1',
    'Whats 98765 ou 4321',
    '12/11 98765 4321',
    '98765.12/11.4321',
  ];
  for (const t of recusados) {
    it(`recusa: ${t}`, () => expect(motivoDeRecusa(t)).toBe('contato'));
  }
  it('"e" só junta número com palavra de contato perto', () => {
    expect(motivoDeRecusa('Traga 12345 e 67890 itens')).toBeNull();
    expect(motivoDeRecusa('Fila 1234 e 5678')).toBeNull();
  });
});

describe('pagamento sem a palavra PIX', () => {
  for (const t of [
    'Banco Exemplo agência 1234 conta 56789-0',
    'Transferência: ag 0001 cc 123456 7',
    'Boleto ou depósito: pague R$ 30 antes. Doação via transferência TED.',
    'Conta corrente 12345-6',
    'Pagamento de R$ 20',
    'c/c 1234',
  ]) {
    it(`recusa: ${t}`, () => expect(motivoDeRecusa(t)).toBe('pix'));
  }
});

describe('evento se passando pela plataforma', () => {
  for (const t of [NOME, NOME.toUpperCase(), 'Aviso do Projeto  Comunidade', NOME_CURTO, 'comunidade!', 'Evento oficial', 'Evento VERIFICADO', 'Oficial do site', 'conteúdo verificado', 'Conferido pelo site', 'aprovada pela plataforma', 'Ok pela plataforma']) {
    it(`recusa: ${t}`, () => expect(motivoDeRecusa(t)).toBe('plataforma'));
  }
  it('sem acento e com acento valem igual', () => {
    expect(motivoDeRecusa('Evento oficiál do site')).toBe('plataforma');
  });
  it('o nome curto dentro de frase comum passa', () => {
    expect(motivoDeRecusa('Festa da Comunidade do Bairro Novo')).toBeNull();
  });
});

describe('endereços', () => {
  for (const t of ['golpe.bet', 'golpe.rio', 'golpe.news', 'golpe.ong', 'golpe.social', 'golpe.wiki', 'golpe.xyzw', 'bit,ly/abc123', 'golpe . c o m', 'golpe . b r', 'golpe.chat']) {
    it(`recusa: ${t}`, () => expect(motivoDeRecusa(t)).toBe('link'));
  }
});

describe('texto legítimo passa', () => {
  for (const t of [
    'Praça Central, Rua das Flores, 120 - Centro',
    'Sala 3, 2º andar',
    'das 9h às 12h',
    'Assembleia de 2026',
    'Reunião dia 21/11 às 19h',
    'Traga 2 kg de alimento',
    'Conta com a presença de todos',
    'Nossa conta: 30 pessoas confirmadas',
    'Mutirão de limpeza da praça',
    'CEP 01234-567',
    'Associação de moradores do Bairro Novo',
    'Ponto de ônibus 4512',
    '14/11/2026 - 19:30',
    '19:30, 20:00 e 21:00',
    'Traga doc de identidade, 2 vias',
    'Exercício 2026/2027',
    'Entrada: R$ 10,50',
  ]) {
    it(`passa: ${t}`, () => expect(motivoDeRecusa(t), t).toBeNull());
  }
});

describe('limparTexto: normalização', () => {
  const composto = 'Reunião';
  const decomposto = 'Reunião';
  const comZwj = 'Reuni‍ão';
  const zwjNoAcento = 'Reunia‍̃o';
  it('composto, decomposto e com ZWJ dão a mesma forma', () => {
    for (const t of [composto, decomposto, comZwj, zwjNoAcento]) expect(limparTexto(t)).toBe(composto);
  });
  it('ZWJ fica só entre dois emoji', () => {
    expect(limparTexto('👨‍👩‍👧 festa')).toBe('👨‍👩‍👧 festa');
    expect(limparTexto('a‍👨')).toBe('a👨');
    expect(limparTexto('👨‍b')).toBe('👨b');
  });
  it('no máximo 2 marcas combinantes seguidas', () => {
    const marcas = '́'.repeat(30);
    expect(limparTexto(`a${marcas}b`)).toBe('á́b');
    expect(limparTexto(`.${marcas}b`)).toBe('.́́b');
    expect(limparTexto('á')).toBe('á');
  });
});

describe('paraConferir', () => {
  it('tira acento e põe em minúsculas', () => expect(paraConferir('ÁGÊNCIA')).toBe('agencia'));
});

describe('oficial sem falar do site passa', () => {
  it('textos comuns com "oficial"', () => {
    for (const t of ['Lançamento oficial da feira', 'Assembleia geral, com a abertura oficial às 19h', 'Local oficial: salão paroquial']) {
      expect(motivoDeRecusa(t), t).toBeNull();
    }
  });
});

describe('pedido de senha, cartão, código ou documento', () => {
  it('recusa', () => {
    for (const x of [
      'Só recebe a cesta quem mandar antes, por mensagem ao organizador, o número do cartão do banco e a senha.',
      'Informe a senha do banco na inscrição',
      'Precisamos da foto do cartão de crédito',
      'Passe o código que chegar por SMS',
      'Mande seu CPF para garantir a vaga',
      'Envie o documento antes do evento',
      'Confirme com o código de segurança do cartão',
    ]) {
      expect(motivoDeRecusa(x), x).toBe('dados');
    }
    // Com a palavra PIX, já cai na regra de pagamento.
    expect(motivoDeRecusa('Senha do pix para a rifa')).not.toBeNull();
  });

  it('textos comuns passam', () => {
    for (const x of [
      'Distribuição de senhas na entrada a partir das 8h',
      'Retire sua senha de atendimento no balcão',
      'Traga documento com foto',
      'Leve o cartão do SUS e o cartão de vacina',
      'Traga o número do cartão do SUS',
      'Oficina: como criar senha segura no celular',
      'Envie sua dúvida antes da reunião',
      'Inscrições com documento na secretaria',
    ]) {
      expect(motivoDeRecusa(x), x).toBeNull();
    }
  });
});

// ---------- simulação B de 06/11/2026 (docs/auditoria/2026-11-06/simulacao-b-quem-recebe.md) ----------

const recusa = (motivo: string, textos: string[]) => {
  for (const t of textos) it(`recusa (${motivo}): ${JSON.stringify(t)}`, () => expect(motivoDeRecusa(t), t).toBe(motivo));
};
const passa = (textos: string[]) => {
  for (const t of textos) it(`passa: ${JSON.stringify(t)}`, () => expect(motivoDeRecusa(t), t).toBeNull());
};
const barra = (textos: string[]) => {
  for (const t of textos) it(`barra: ${JSON.stringify(t)}`, () => expect(motivoDeRecusa(t), t).not.toBeNull());
};

describe('B-06: telefone partido em linhas', () => {
  recusa('contato', [
    'Chame no zap\n11\n91234\n5678',
    'zap 11 912\n34 5678',
    'Doe:\n11 9\n1234\n5678',
    // A pauta da reunião chega numerada (fluxo/estado.ts): cada pedaço do número vira um item.
    'Pauta:\n1. Chame no zap\n2. 11\n3. 91234\n4. 5678',
    'Pauta:\n1. Informes\n2. 91234\n3. 5678',
  ]);
  passa(['Pauta:\n1. Abertura\n2. Contas de 2025\n3. Eleição', 'Rua 7, 1234\n19h às 21h', 'Sala 12\n2º andar', 'Pauta:\n1. Sala 101\n2. Sala 102\n3. Sala 103']);
});

describe('B-07: imitar o site', () => {
  recusa('plataforma', [
    'Projeto-Comunidade',
    'P.Comunidade',
    'P. Comunidade',
    'P Comunidade',
    'ProjetoComunidade',
    'projeto_comunidade',
    'Aviso do Projeto–Comunidade',
    'Este evento foi conferido',
    'Este evento já foi verificado',
    'Evento aprovado pela moderação',
    'Evento aprovado',
    'Conteúdo checado',
    'Site seguro, conteúdo checado',
    'Checado pela equipe do site',
    'Aprovado pela moderação',
    'Confirmado pelo site da Comunidade',
    'Este evento foi removido após denúncia',
    'Este link foi removido a pedido de quem o criou',
    'Selo de verificação concedido',
    // A faixa, igual ou quase igual (sem pontuação, outra caixa).
    'Conteúdo criado por quem enviou este link',
    'conteudo, criado por quem enviou este link!',
    'O Projeto Comunidade não confere nem guarda este conteúdo.',
    'Nunca faça pagamento pedido por um evento',
    'Nunca faça pagamento nem confie em outro aviso',
    'Quem chama, segundo quem criou o link: Associação',
  ]);
  // A faixa nova que o B-20 propõe também é barrada (aqui, já pelo pedido de documento).
  barra(['NUNCA FAÇA PAGAMENTO NEM MANDE DOCUMENTOS']);
  passa([
    // Aviso honesto com pedaço parecido com a faixa.
    'NUNCA FAÇA PAGAMENTO',
    'Nunca faça pagamento adiantado, entrada grátis',
    'Criado por quem enviou o convite',
    'Quem enviou este link foi a Ana',
    'Evento aprovado em assembleia',
    'O evento foi aprovado pela diretoria da associação',
    'Projeto aprovado pela equipe da escola',
    'Festa da Comunidade do Bairro Novo',
    'Pão da comunidade',
    'Mutirão conferido pela associação de moradores',
  ]);
});

describe('B-08: horário, período e lista não são telefone', () => {
  passa([
    '19:30-21:00',
    'Das 19:30-21:00',
    '10/11-15/11',
    'De 10/11/2026-15/11/2026',
    'Dias 10, 11, 12, 13',
    'Salas 101, 102, 103',
    'Dias 10, 17, 24, 31',
    'Anos 2024, 2025, 2026',
    'Mesas 1, 2, 3, 4, 5, 6, 7, 8',
  ]);
  describe('golpe mais parecido continua barrado', () => {
    recusa('contato', [
      // Com palavra de contato, vale a regra de antes.
      'Ligue 23:45-23:59',
      'Chame 10/11-15/11',
      'Zap 10, 11, 12, 13',
      'Contato: 19:30-21:00',
      // Lista fora de ordem, com salto grande ou com números de tamanhos diferentes.
      'Doe: 11, 91234, 5678',
      'Doe 12, 34, 56, 78',
      'Doe 91, 23, 45, 67',
      'Doe 912, 345, 678',
      // Número em volta da faixa ou da lista continua contando.
      'Salas 101, 102, 103 11 91234-5678',
      '19:30-21:00 91234-5678',
      // CEP sem hífen continua barrado (a mensagem diz o que fazer).
      'CEP 01234567',
    ]);
  });
});

describe('B-09: Doc, Ted, hashtag e linha de traços', () => {
  passa([
    'Mostra Doc 2026',
    'Festa do Ted 2026',
    'Doc 50 anos',
    '#EncontroDosMoradores2026',
    '#FestaJunina',
    '#EncontroDosMoradoresDoBairroNovoDaVila2026',
    'Programação ------------------------------ 19h',
    '==============================',
  ]);
  describe('golpe mais parecido continua barrado', () => {
    recusa('pix', [
      'Doação via TED 12345-6',
      'TED R$ 50',
      'Doc de R$ 30',
      'Doc 12345-6',
      '#a1b2c3d4e5f6g7h8i9j0',
      '#chave7f3a9c2e1b4d5e6f',
      '------------------------------golpe',
    ]);
    recusa('contato', ['-----------1-2-3-4-5-6-7-8-9----------']);
    barra(['Doc 0001 123456', '#123e4567e89b12d3a456426614174000', '#7f3a9c2e1b4d5e6f7a8b']);
  });
});

describe('B-10: site de outro dono, senha de atendimento e documento com foto', () => {
  passa([
    'Inscrições pelo site da escola',
    'Lançamento oficial do projeto da horta',
    'Distribuição de senhas no Banco de Alimentos',
    'Banco de sangue: senha na recepção',
    'Passe na portaria com documento com foto',
    'Passem na secretaria com o documento',
  ]);
  describe('golpe mais parecido continua barrado', () => {
    recusa('plataforma', [
      'Confirmado pelo site',
      'Inscrições pelo site do projeto',
      'Evento oficial do projeto',
      'Oficial do Projeto Comunidade',
      'Lançamento oficial do projeto comunidade',
      'Ok pela plataforma',
    ]);
    recusa('dados', [
      'Senha do Banco do Brasil',
      'Senha do banco',
      'Informe a senha do Banco de Alimentos',
      'Passe no privado com documento',
      'Passe na portaria com documento e CPF',
      'Passe o documento com foto pelo privado',
      'Envie o documento com foto',
      'Mande uma foto do documento',
      'Passe seu CPF na portaria',
    ]);
  });
});

describe('B-14: barra entre palavras não é link', () => {
  passa(['Data: sáb/dom', 'Data: seg/qua/sex', 'sáb/dom']);
  recusa('link', ['data:image/png;base64,iVBORw0', 'data:,oi', 'DATA : TEXT / plain', 'data:application/x-sh']);
});

describe('B-27: letras de bandeira e de enfeite', () => {
  recusa('pix', ['🇵🇮🇽 da festa', '🅿🅸🆇 da festa', '🅟🅘🅧', '🄟🄘🄧', '⒫⒤⒳', '🅿️🅸️🆇️']);
  recusa('link', ['golpe.🅲🅾🅼', 'golpe.🄲🄾🄼']);
  passa(['🇧🇷 Festa junina 🇧🇷', 'Viva o Brasil.🇧🇷', 'Doação de sangue tipo 🅰️ e 🅾️', '🅿️ Estacionamento ao lado']);
});

describe('D2: a palavra Pix continua barrada, mesmo sem chave', () => {
  recusa('pix', ['Festa do Pix da Escola', 'P.I.X', 'p-i-x da festa', 'p i x', 'Pix']);
  it('a mensagem diz para trocar a palavra', () => {
    expect(mensagemDaRecusa('Festa do Pix da Escola', 'pix')).toBe('o site não aceita a palavra Pix, nem em nome de evento. Troque a palavra.');
  });
});

describe('mensagens de recusa (WCAG 3.3.3)', () => {
  it('nenhuma acusa golpe, e cada uma traz o que trocar com exemplo', () => {
    for (const [motivo, m] of Object.entries(MENSAGEM_DO_MOTIVO)) {
      expect(m, motivo).not.toMatch(/golpe/i);
      expect(m, motivo).toMatch(/(Tire|Escreva|coloque|separe|diga)/);
      expect(m, motivo).toMatch(/(como em|escreva) "/);
    }
  });
  const mensagem = (texto: string): string => {
    const motivo = motivoDeRecusa(texto);
    expect(motivo, texto).not.toBeNull();
    return mensagemDaRecusa(texto, motivo!);
  };
  it('exemplo certo para cada caso', () => {
    const casos: [string, string][] = [
      ['Das 19:30/21:00', 'Se for horário, escreva 19h30 às 21h.'],
      ['CEP 01234567', 'Escreva o CEP com hífen ou tire o CEP, como em "CEP 01234-567".'],
      ['Feira 10/11-15/11 2026', 'Se for período, escreva "de 10/11 a 15/11".'],
      ['Sarau @ praça da matriz', 'Se o @ quer dizer "em", escreva a palavra, como em "Sarau na praça".'],
      ['Distribuição de senhas no Banco do Brasil', 'troque a palavra senha por ficha, como em "Retire a ficha".'],
      ['Ficha (token) de entrada', 'troque a palavra token por ficha.'],
      ['Mande seu CPF', 'escreva "traga documento com foto".'],
      ['Pague R$ 20 na entrada', 'Se for preço, escreva só o valor, como em "Entrada: 10 reais".'],
      ['Pague pelo PicPay', 'o site não aceita a palavra PicPay'],
      ['Mutirao-de-limpeza-da-praca-central-do-bairro', 'Se é nome com hífens, separe com espaço'],
      ['Conteúdo criado por quem enviou este link', 'o site já mostra o aviso no alto da página do evento.'],
      ['Inscrições pelo site', 'diga de quem, como em "site da escola".'],
      ['Av.das Flores, 100', 'coloque um espaço, como em "Av. das Flores".'],
      ['Idade < 12 anos', 'sinais de menor e maior (< >)'],
      ['Festa&nbsp;junina', 'como em "Pão e café".'],
      ['Ligue 11 91234-5678', 'escreva "fale com a organização pelo grupo".'],
    ];
    for (const [texto, trecho] of casos) expect(mensagem(texto), texto).toContain(trecho);
  });
  it('o exemplo só aparece quando resolve, e nunca ensina a partir número nem a disfarçar endereço', () => {
    // O horário não é a causa: o telefone é.
    expect(mensagem('Atendimento 19:30, ligue 11 2222 3333')).not.toMatch(/horário/);
    expect(mensagem('Ligue 11 91234-5678 às 19:30')).not.toMatch(/horário/);
    expect(mensagem('Sarau às 19:30 com fulano@x.org')).not.toMatch(/horário/);
    // Nenhuma dica de lista ou de "separe com e" para número.
    for (const t of ['Doe: 11, 98765, 4321', 'Fale: 11, 98765, 4321', 'Doe 912, 345, 678', 'Turmas 1001, 2001, 3001']) {
      expect(mensagem(t), t).not.toMatch(/separe|lista|"e"/);
    }
    // E-mail e @ de rede social não recebem a dica do "em".
    expect(mensagem('fulano@gmail')).not.toMatch(/"em"/);
    expect(mensagem('@coletivo_vila_alegre')).not.toMatch(/"em"/);
    // Endereço com final de site em minúscula não recebe a dica do espaço ("golpe. com").
    expect(mensagem('golpe.com')).not.toMatch(/espaço/);
    expect(mensagem('Data: sab/dom 10/11 golpe.com')).toMatch(/Tire o endereço\.$/);
    // Quem pede a senha não recebe a dica da ficha; código por SMS não recebe a do documento.
    expect(mensagem('Informe a senha do banco')).not.toMatch(/ficha/);
    expect(mensagem('Responda com o código que chegou por SMS')).not.toMatch(/documento com foto/);
    // CEP só com a palavra CEP: "91234567" pode ser telefone.
    expect(mensagem('Doe 91234567')).not.toMatch(/CEP/);
    // Sem palavra de contato, a dica de chamar a organização não aparece ("Matrícula 12345678").
    expect(mensagem('Matrícula 12345678')).toMatch(/Tire esse trecho\.$/);
  });
  it('as mensagens são curtas (letra grande em 360 px)', () => {
    for (const [motivo, m] of Object.entries(MENSAGEM_DO_MOTIVO)) expect(m.split(/\s+/).length, motivo).toBeLessThanOrEqual(30);
  });
});

describe('revisão de 06/11/2026: golpes que a mudança tinha soltado continuam barrados', () => {
  describe('site, plataforma e projeto: o próprio site não é "outro dono"', () => {
    recusa('plataforma', [
      'Oficial da plataforma do site',
      'Confirme pelo site da moderação',
      'Oficial do site do evento',
      'Verificado pelo site do evento',
      'Inscrição verificada pelo site do evento',
      'Ingresso confirmado pelo site do evento',
      'Inscrições pelo site do projeto e retire o ingresso',
      'Inscrição confirmada pelo site do projeto até sexta',
      'Oficial do projeto hoje',
      'Verificado pelo projeto hoje',
      'Oficial do site do projeto social',
      'Evento conferido em nosso site',
      'Evento conferido no nosso site',
      'Evento aprovado na nossa plataforma',
    ]);
    // Dizer que um site, a plataforma ou a moderação conferiu conta com qualquer dono, como na main
    // ("da casa" quer dizer "nosso"; segunda passada da revisão de privacidade).
    recusa('plataforma', [
      'Evento aprovado pelo site da escola',
      'Evento aprovado pela moderação da escola',
      'Verificado pelo site da escola',
      'Resultado oficial do site da escola',
      'Aprovado pelo site da casa',
      'Conferido pela plataforma da rede',
      'Verificado pelo site da casa',
      'Ingresso garantido pela plataforma da casa',
      'Evento aprovado pelo sistema da casa',
    ]);
    passa(['Inscrições pelo site da escola', 'Lançamento oficial do projeto da horta']);
    // Pedido de pagamento por site: barrado pela regra de pagamento, que vem antes.
    recusa('pix', ['Pague pelo site da plataforma', 'Pague pelo site do sistema', 'Pague pelo site do evento', 'Pague pelo site do projeto hoje']);
  });
  describe('"passe com documento" só vale para lugar de ir', () => {
    recusa('dados', [
      'Passe no meu pv com documento',
      'Passe em meu chat com documento',
      'Passe no meu zap com documento e foto',
      'Passe na conversa com documento',
      'Passe pelo Telegram com documento',
      'Passe no zapzap com documento com foto',
      'Passe pelo wpp com documento',
      'Passe nas mensagens com documento',
      'Passe no Instagram com documento',
      'Passe pelo e-mail com documento com foto',
      'Passe aqui com documento e selfie',
      'Passe la com documento e foto do rosto',
      'Passe na portaria com documento e selfie',
    ]);
    passa(['Passe pela recepção com documento', 'Passem na sede com seu documento com foto']);
  });
  describe('TED e DOC com valor sem R$', () => {
    recusa('pix', ['Doação via TED de 200', 'Faça uma TED de 150 reais para garantir a vaga', 'Valor da TED: 150', 'Doc de 300 para reservar', 'Contribua: DOC 999']);
    passa(['Mostra Doc 2026-2027', 'Mostra Doc 2026-27', 'Festa do Ted 2026']);
  });
  describe('faixa e lista não separam o número dos vizinhos', () => {
    recusa('contato', [
      '(11) 98 1, 4, 7 - 2603',
      'Informações 11 912, 915, 921',
      'Wpp (11) 2, 3, 4, 5 - 6, 7, 8, 9',
      '(11) 9 12:34-23:45',
      'Fale com a gente: (11) 23:45-23:59',
      'Disque 23:45-23:59',
      'Wpp 23:45-23:59',
      'Fale: 11 98765 e 4321',
    ]);
  });
  describe('lista honesta: tamanhos crescentes e um número por linha', () => {
    passa(['Dias 8, 9, 10, 11, 12', 'Mesas 98, 99, 100, 101', 'Preços\n10\n20\n30\n40\n50', 'Mesas\n101\n102\n103\n104']);
    recusa('contato', ['Doe\n11\n91234\n5678', 'Mesas\n101\n102\n103\n91234']);
  });
  describe('"p/" e "p." são "para", não o nome do site', () => {
    passa(['Mutirão p/ comunidade', 'Apoio p/ Comunidade Verde', 'Festa p. comunidade']);
    recusa('plataforma', ['P.Comunidade', 'P. Comunidade', 'PComunidade', 'P-Comunidade']);
  });
  describe('Pix com outros separadores e em versalete', () => {
    recusa('pix', ['p+i+x', 'p,i,x', 'p~i~x', 'p–i–x', 'p—i—x', 'P/I/X', 'p | i | x', '🇵 🇮 🇽', 'ᴘɪx da festa']);
  });
  describe('hashtag não esconde chave aleatória', () => {
    barra(['#deadbeef-1234-5678-9abc-def012345678']);
  });
  describe('segunda passada da revisão de privacidade', () => {
    recusa('link', ['Acesse golpe. com', 'golpe. net', 'Veja golpe. br']);
    passa(['Feira. Com todos', 'Chegou o dia. Venha cedo']);
    recusa('dados', [
      'Passe na sala virtual com documento',
      'Passe na sala do Zoom com documento com foto',
      'Passe na portaria virtual com documento',
      'Passe na secretaria online com documento',
      'Passe na sala do Telegram com documento',
      'Passe na sede pelo e-mail com documento',
    ]);
    recusa('pix', [
      'Doe pelo site da organização',
      'Compre o ingresso pelo site da escola',
      'Contribuição pelo site da associação',
      'Pague no site da organização',
      'Pagamento via site da escola',
      'Pague através do site da organização',
      'Pague pela página do evento',
    ]);
    recusa('plataforma', [
      '🅿 Comunidade',
      'Р Comunidade',
      'p comunidade',
      'p-comunidade',
      'Р.Comunidade',
      '🅿.Comunidade',
      'Conteúdo criado por quem enviou',
      'Criado por quem enviou o link. O site não confere.',
    ]);
    recusa('contato', ['Zap 11 98765 -- 4321', 'Ligue 11 98765 / / 4321']);
    it('as dicas não ensinam a driblar', () => {
      const m = (t: string) => mensagemDaRecusa(t, motivoDeRecusa(t)!);
      expect(m('Aprovado pelo site')).not.toMatch(/diga de quem/);
      for (const t of ['Acesse golpe.Com', 'Acesse golpe.Online', 'Acesse golpe.Net/abc', 'Vamos.Com todos']) expect(m(t), t).not.toMatch(/espaço/);
      expect(m('Chave 7d9f2c1a-3b4e-4f6a-9c8d-1e2f3a4b5c6d')).not.toMatch(/hífens/);
      expect(m('Fale: 11 9876:5432')).not.toMatch(/horário/);
      expect(m('Fale: 11 23:45-23:59')).not.toMatch(/horário/);
      expect(m('Contato: 10/11-15/11')).not.toMatch(/período/);
    });
  });
  describe('conferência com a versão da main (roteiro do revisor de privacidade)', () => {
    recusa('pix', ['p\ni\nx', 'Pague pela plataforma da organização', 'Faça o pagamento pelo site da organização', 'Contribua pelo app da associação']);
    recusa('plataforma', ['Proj. Comunidade', 'Proje Comunidade']);
    passa(['Inscrições pelo site da organização', 'Projeção comunitária', 'Projetor na comunidade']);
  });
});

