import { describe, expect, it } from 'vitest';
import { limparTexto, motivoDeRecusa, paraConferir } from './conteudo';
import { NOME, NOME_CURTO } from './marca';

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

