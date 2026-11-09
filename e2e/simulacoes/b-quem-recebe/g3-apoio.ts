// Apoio do G3 (golpista e texto honesto barrado por engano). Só desenvolvimento.
// Personagens fictícios: cidade "Vila Alegre", organizações neutras.

import { appendFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { codificar } from '../../../src/ferramentas/evento/formato';
import type { Evento } from '../../../src/ferramentas/evento/validar';
import { linkDoEvento, SAIDAS } from './aparelhos';
import { preencherDiaBr } from './dia-apoio';

export type CampoFluxo = 'titulo' | 'organizacao' | 'texto' | 'local';
export type CampoLink = 'titulo' | 'organizacao' | 'descricao' | 'local';
export const CAMPOS_FLUXO: CampoFluxo[] = ['titulo', 'organizacao', 'texto', 'local'];
export const CAMPO_LINK: Record<CampoFluxo, CampoLink> = { titulo: 'titulo', organizacao: 'organizacao', texto: 'descricao', local: 'local' };

export interface Tentativa {
  id: string;
  grupo: string;
  texto: string;
  /** golpe = o site deveria barrar; honesto = o site não deveria barrar. */
  papel: 'golpe' | 'honesto';
  nota?: string;
}

const u = (s: string) => s; // só para marcar strings com escapes de propósito

export const GOLPE: Tentativa[] = [
  // ---- PIX ----
  ['pix-cpf-pontos', 'pix', 'Chave 123.456.789-09'],
  ['pix-cpf-solto', 'pix', '12345678909'],
  ['pix-cpf-com-palavra', 'pix', 'Chave PIX 123.456.789-09'],
  ['pix-dois-pontos', 'pix', 'pix: ajuda@exemplo'],
  ['pix-chave-pix-cpf', 'pix', 'chave pix 12345678909'],
  ['pix-email', 'pix', 'caixa.da.festa@exemplo'],
  ['pix-email-com-tld', 'pix', 'caixa.da.festa@exemplo.org'],
  ['pix-email-arroba-extenso', 'pix', 'caixa da festa arroba exemplo'],
  ['pix-email-at', 'pix', 'caixa(at)exemplo'],
  ['pix-telefone', 'pix', 'Doe: 11 91234-5678'],
  ['pix-uuid', 'pix', '123e4567-e89b-12d3-a456-426614174000'],
  ['pix-aleatoria-sem-hifen', 'pix', '123e4567e89b12d3a456426614174000'],
  ['pix-aleatoria-curta', 'pix', 'Chave aleatória 7f3a9c2e1b'],
  ['pix-cnpj', 'pix', 'CNPJ 12.345.678/0001-95'],
  ['pix-espacado', 'pix', 'p i x 123456'],
  ['pix-pontilhado', 'pix', 'p.i.x do bairro'],
  ['pix-hifen', 'pix', 'p-i-x da festa'],
  ['pix-numero-1', 'pix', 'p1x da festa'],
  ['pix-acento', 'pix', 'Píx da festa'],
  ['pix-negrito-unicode', 'pix', '𝐩𝐢𝐱 da festa'],
  ['pix-circulado', 'pix', 'ⓟⓘⓧ da festa'],
  ['pix-largura-total', 'pix', 'ｐｉｘ da festa'],
  ['pix-indicador-regional', 'pix', '🇵🇮🇽 da festa'],
  ['pix-quadrado', 'pix', '🅿🅸🆇 da festa'],
  ['pix-invertido', 'pix', 'xip da festa'],
  ['pix-sinonimo-qr', 'pix', 'Ajude pelo QR do banco'],
  ['pix-valor', 'pix', 'Contribuição de R$ 20 na hora'],
  ['pix-deposito', 'pix', 'Depósito na conta 12345-6, agência 0001'],
  ['pix-ted-sem-numero', 'pix', 'Doação via transferência TED'],
  ['pix-picpay', 'pix', 'PicPay da associação'],
  ['pix-boleto', 'pix', 'Boleto no valor de 50'],
  // ---- telefone ----
  ['tel-ddd-par', 'telefone', '(11) 91234-5678'],
  ['tel-solto', 'telefone', '11912345678'],
  ['tel-mais55', 'telefone', '+55 11 9 1234 5678'],
  ['tel-sem-ddd', 'telefone', '9 1234-5678'],
  ['tel-sem-ddd-2', 'telefone', '91234-5678'],
  ['tel-fixo', 'telefone', 'ligue 3333-4444'],
  ['tel-zap', 'telefone', 'zap 11 9 1234 5678'],
  ['tel-ponto', 'telefone', '91234.5678'],
  ['tel-extenso', 'telefone', 'onze nove um dois três quatro cinco seis sete oito'],
  ['tel-extenso-hifen', 'telefone', 'nove-um-dois-três-quatro-cinco-seis-sete-oito'],
  ['tel-metade-extenso', 'telefone', 'zap 11 nove 1234 cinco678'],
  ['tel-digito-a-digito', 'telefone', '9 1 2 3 4 5 6 7 8'],
  ['tel-keycap', 'telefone', '9️⃣1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣'],
  ['tel-largura-total', 'telefone', '９１２３４５６７８'],
  ['tel-dois-grupos-e', 'telefone', 'Zap 91234 e 5678'],
  ['tel-dois-grupos-sem-palavra', 'telefone', '4 dígitos 9123 depois 4567'],
  ['tel-troca-letra-o', 'telefone', 'zap 11 9l234 5678'],
  ['tel-letra-O', 'telefone', 'zap 11 9O234-5O78'],
  ['tel-dividido-em-linhas', 'telefone', 'zap 11 912\n34 5678'],
  ['tel-arabe', 'telefone', '٩١٢٣٤٥٦٧٨'],
  ['tel-metade-agora-metade-depois', 'telefone', 'Chame no 912 34 e depois 5678'],
  ['tel-0800', 'telefone', '0800 123 4567'],
  // ---- link ----
  ['link-https', 'link', 'https://golpe.example/x'],
  ['link-www', 'link', 'www.golpe.example'],
  ['link-sem-http', 'link', 'golpe.com.br/x'],
  ['link-site-ponto-com', 'link', 'site ponto com'],
  ['link-bit-ly-barra', 'link', 'bit ly barra x'],
  ['link-bit-ly', 'link', 'bit.ly/3xyz'],
  ['link-espaco-no-meio', 'link', 'golpe . com'],
  ['link-espaco-br', 'link', 'golpe . com . br'],
  ['link-dot', 'link', 'golpe dot com'],
  ['link-colchete-ponto', 'link', 'golpe[.]com'],
  ['link-parenteses-ponto', 'link', 'golpe(.)com'],
  ['link-ponto-final-grande', 'link', 'golpe。com'],
  ['link-ponto-medio', 'link', 'golpe·com'],
  ['link-ponto-entre-aspas', 'link', 'golpe․com'],
  ['link-hxxp', 'link', 'hxxp://golpe.example'],
  ['link-barras-separadas', 'link', 'h t t p s : / / golpe.example'],
  ['link-www-largura-total', 'link', 'ｗｗｗ．golpe．com'],
  ['link-cirilico', 'link', 'golpe.cоm'],
  ['link-grego', 'link', 'golpe.cοm'],
  ['link-wa-me', 'link', 'wa.me/5511912345678'],
  ['link-t-me', 'link', 't.me/grupo_vila_alegre'],
  ['link-arroba-rede', 'link', '@coletivo_vila_alegre'],
  ['link-instagram-extenso', 'link', 'instagram arroba coletivo vila alegre'],
  ['link-sem-ponto-com-br', 'link', 'golpe com br'],
  ['link-ponto-por-extenso-br', 'link', 'golpe ponto com ponto br'],
  ['link-link-na-bio', 'link', 'Link na bio do coletivo'],
  ['link-procure-no-google', 'link', 'Procure no Google: golpe vila alegre'],
  ['link-tld-raro', 'link', 'golpe.zip'],
  ['link-tld-raro-2', 'link', 'golpe.ninja'],
  ['link-tld-raro-3', 'link', 'golpe.pizza'],
  ['link-ip', 'link', '192.168.0.10'],
  ['link-ip-porta', 'link', 'http://192.168.0.10:8080'],
  ['link-porcento', 'link', 'golpe%2Ecom'],
  ['link-mailto', 'link', 'mailto:ajuda@exemplo'],
  ['link-tel-esquema', 'link', 'tel:+5511912345678'],
  ['link-hash-url', 'link', 'golpe.example/#/x'],
  // ---- autoridade ----
  ['aut-prefeitura-informa', 'autoridade', 'Prefeitura de Vila Alegre informa'],
  ['aut-defesa-civil', 'autoridade', 'Defesa Civil: evacuação imediata'],
  ['aut-comunicado-oficial', 'autoridade', 'Comunicado oficial'],
  ['aut-governo-federal', 'autoridade', 'Governo Federal convoca'],
  ['aut-inss', 'autoridade', 'INSS: atualização cadastral'],
  ['aut-receita', 'autoridade', 'Receita Federal: regularize seu CPF'],
  ['aut-correios', 'autoridade', 'Correios: encomenda retida'],
  ['aut-urgente', 'autoridade', 'URGENTE: aviso da Prefeitura de Vila Alegre'],
  ['aut-secretaria-saude', 'autoridade', 'Secretaria de Saúde de Vila Alegre: vacinação'],
  ['aut-policia', 'autoridade', 'Polícia Militar: operação no bairro'],
  ['aut-sus', 'autoridade', 'Cadastro do SUS: confirme'],
  ['aut-banco', 'autoridade', 'Banco Central: devolução de valores'],
  // ---- html ----
  ['html-negrito', 'html', '<b>negrito</b>'],
  ['html-script', 'html', '<script>alert(1)</script>'],
  ['html-img-onerror', 'html', '<img src=x onerror=alert(1)>'],
  ['html-lt-entidade', 'html', '&lt;b&gt;oi&lt;/b&gt;'],
  ['html-numerica', 'html', '&#60;script&#62;'],
  ['html-nbsp', 'html', 'Festa&nbsp;junina'],
  ['html-lt-sozinho', 'html', 'Idade < 12 anos'],
  ['html-largura-total', 'html', '＜b＞oi＜/b＞'],
  ['html-template', 'html', '${7*7} {{7*7}}'],
  ['html-markdown-link', 'html', '[clique aqui](x)'],
  ['html-crase', 'html', '`rm -rf`'],
  // ---- invisíveis ----
  ['inv-zwsp-pix', 'invisivel', u('p​i​x')],
  ['inv-zwj-pix', 'invisivel', u('p‍i‍x')],
  ['inv-wj-pix', 'invisivel', u('p⁠i⁠x')],
  ['inv-rlo', 'invisivel', u('‮oc.epolg')],
  ['inv-rlo-texto', 'invisivel', u('Entrada gratuita ‮5002$R')],
  ['inv-isolado-pix', 'invisivel', u('⁦pix⁩ da festa')],
  ['inv-zwsp-link', 'invisivel', u('gol​pe.co​m')],
  ['inv-zwsp-www', 'invisivel', u('w​w​w golpe')],
  ['inv-zwsp-https', 'invisivel', u('ht​tps://golpe.example')],
  ['inv-hangul-filler', 'invisivel', u('pㅤiㅤx')],
  ['inv-braille-branco', 'invisivel', u('p⠀i⠀x')],
  ['inv-soft-hyphen', 'invisivel', u('p­i­x')],
  ['inv-tag-chars', 'invisivel', u('pix\u{E0041}\u{E0042}')],
  ['inv-nbsp-pix', 'invisivel', u('p i x')],
  ['inv-espaco-fino', 'invisivel', u('p i x')],
  ['inv-so-invisiveis', 'invisivel', u('​​​')],
  ['inv-so-espacos', 'invisivel', u('   ')],
  ['inv-combinante', 'invisivel', u('ṕíx́')],
  ['inv-zalgo', 'invisivel', u('Fè́̂̃̄̅̆̇sta')],
  // ---- bandeira e emoji ----
  ['bandeira-br', 'emoji', '🇧🇷 Prefeitura informa 🇧🇷'],
  ['bandeira-sozinha', 'emoji', '🇧🇷'],
  ['emoji-selo', 'emoji', '✅ Evento verificado ✅'],
  ['emoji-selo-sem-palavra', 'emoji', '✅✅✅ Selo oficial ✅✅✅'],
  ['emoji-alerta', 'emoji', '🚨 ALERTA DE GOLPE: não pague 🚨'],
  ['emoji-cadeado', 'emoji', '🔒 Página segura'],
  // ---- imita a plataforma ----
  ['plat-verificado-pelo-site', 'plataforma', 'Conteúdo verificado pelo site'],
  ['plat-conferido', 'plataforma', 'Este evento foi conferido'],
  ['plat-aviso-do-projeto', 'plataforma', 'Aviso do Projeto Comunidade'],
  ['plat-equipe', 'plataforma', 'Equipe da Comunidade'],
  ['plat-projeto-comunidade-hifen', 'plataforma', 'Projeto-Comunidade'],
  ['plat-projeto-comunidade-duplo', 'plataforma', 'Projeto  Comunidade'],
  ['plat-projeto-comunidade-pontos', 'plataforma', 'P.Comunidade'],
  ['plat-comunidade-sozinha-titulo', 'plataforma', 'Comunidade'],
  ['plat-comunidade-moderacao', 'plataforma', 'Moderação da Comunidade'],
  ['plat-aprovado-moderacao', 'plataforma', 'Evento aprovado pela moderação'],
  ['plat-selo', 'plataforma', 'Selo de verificação concedido'],
  ['plat-confirmado-pelo-site', 'plataforma', 'Confirmado pelo site'],
  ['plat-faixa-copiada', 'plataforma', 'Conteúdo criado por quem enviou este link'],
  ['plat-faixa-pagamento', 'plataforma', 'Nunca faça pagamento pedido por um evento'],
  ['plat-denunciar', 'plataforma', 'Denunciar: evento removido pelo site'],
  ['plat-site-seguro', 'plataforma', 'Site seguro, conteúdo checado'],
  ['plat-checado-equipe', 'plataforma', 'Checado pela equipe do site'],
  ['plat-removido', 'plataforma', 'Este evento foi removido após denúncia'],
  // ---- dados e fraude sem link ----
  ['dados-senha-banco', 'dados', 'Informe a senha do banco'],
  ['dados-codigo-sms', 'dados', 'Responda com o código que chegou por SMS'],
  ['dados-cpf', 'dados', 'Envie seu CPF para confirmar a vaga'],
  ['dados-confirme-dados', 'dados', 'Confirme seus dados cadastrais'],
  ['dados-atualize-cadastro', 'dados', 'Atualize seu cadastro'],
  ['dados-foto-documento', 'dados', 'Mande uma foto do documento'],
  ['dados-premio', 'dados', 'Você foi sorteado: prêmio garantido'],
  ['dados-chame-privado', 'dados', 'Chame no privado para receber'],
  ['dados-link-no-grupo', 'dados', 'Link no grupo, clique aqui'],
  ['dados-taxa-liberacao', 'dados', 'Taxa de liberação de R$ 49'],
  ['dados-pague-na-entrada', 'dados', 'Pague R$ 20 na entrada'],
].map(([id, grupo, texto]) => ({ id: id as string, grupo: grupo as string, texto: texto as string, papel: 'golpe' as const }));

/** Texto honesto: o site NÃO deveria barrar. */
export const HONESTO: Tentativa[] = [
  ['h-rua-numero', 'Rua 7, nº 1234'],
  ['h-cep', 'CEP 01234-567'],
  ['h-cep-solto', '01234-567'],
  ['h-cep-sem-hifen', 'CEP 01234567'],
  ['h-das-19h30', 'Das 19h30 às 21h'],
  ['h-bazar', 'Bazar: aceitamos doação de roupas'],
  ['h-rua-telefone', 'Rua do Telefone'],
  ['h-festa-do-pix', 'Festa do Pix da Escola'],
  ['h-sala-12', 'Sala 12, 2º andar'],
  ['h-onibus', 'Ônibus 8012'],
  ['h-data-15-11', '15/11'],
  ['h-ano', '2026'],
  ['h-dr-pedro', 'R. Dr. Pedro, 1500 – fundos'],
  ['h-ligue-se', 'Ligue-se na cultura'],
  ['h-av-brasil', 'Av. Brasil, 12.345'],
  ['h-km', 'Km 23 da estrada'],
  ['h-turma', 'Turma 2026/1'],
  ['h-salao', 'Salão da comunidade'],
  ['h-casa-lote', 'Casa 3, quadra 12, lote 7'],
  ['h-linha-metro', 'Linha 5 do metrô'],
  ['h-whatsapp-grupo', 'WhatsApp do grupo'],
  ['h-site-escola', 'site da escola'],
  ['h-cine-35', 'Cine clube 35 mm'],
  // acréscimos
  ['h-horario-sem-espaco', 'Das 19:30-21:00'],
  ['h-horario-traco', '19:30-21:00'],
  ['h-periodo-datas', '10/11-15/11'],
  ['h-dias-virgula', 'Dias 10, 11, 12, 13'],
  ['h-salas-virgula', 'Salas 101, 102, 103'],
  ['h-turmas-virgula', 'Turmas 101, 102 e 103'],
  ['h-av-pca', 'Av.das Flores, 100'],
  ['h-rua-pontinho', 'R.dos Pinheiros, 10'],
  ['h-jd-do', 'Jd.do Sol, 12'],
  ['h-data-sab-dom', 'Data: sáb/dom'],
  ['h-arroba-unidade', 'Leilão: uma arroba de gado'],
  ['h-sarau-arroba-lugar', 'Sarau @ praça da matriz'],
  ['h-hashtag', '#EncontroDosMoradores2026'],
  ['h-linha-decorativa', 'Programação ------------------------------ 19h'],
  ['h-senha-banco-alimentos', 'Distribuição de senhas no Banco de Alimentos'],
  ['h-passe-documento', 'Passe na portaria com documento com foto'],
  ['h-mostra-doc', 'Mostra Doc 2026'],
  ['h-festa-do-ted', 'Festa do Ted 2026'],
  ['h-pague-1-leve-2', 'Pague 1 leve 2'],
  ['h-taxa-r5', 'Taxa de R$ 5 para custear o lanche'],
  ['h-pagamento-3x', 'Pagamento em 3 vezes'],
  ['h-contribuicao-arroz', 'Contribuição de 2 kg de arroz'],
  ['h-comunidade-sozinha', 'Comunidade'],
  ['h-pelo-site-escola', 'Inscrições pelo site da escola'],
  ['h-oficial-projeto', 'Lançamento oficial do projeto da horta'],
  ['h-aprovado-projeto', 'Plano aprovado pelo projeto pedagógico'],
  ['h-pixar', 'Sessão de filmes da Pixar'],
  ['h-pixel-art', 'Oficina de pixel art'],
  ['h-e-comercial', 'Café & prosa'],
  ['h-porcento', '50% de desconto para idosos'],
  ['h-preco', 'Preço: R$ 12,50'],
  ['h-obs-sem-espaco', 'Obs.: traga cadeira'],
  ['h-fim-sem-espaco', 'Venha cedo.Traga uma cadeira'],
  ['h-sr-silva', 'Sr.Silva'],
  ['h-1o-2o-3o', 'Prêmios: 1º, 2º e 3º lugares'],
  ['h-vagas', 'Vagas limitadas: 30 pessoas'],
  ['h-ate-10-11', 'Inscrições até 10/11'],
  ['h-anos-filmes', 'Filmes de 1980 a 1999'],
  ['h-anos-hifen', 'Mostra 2024-2026'],
  ['h-rua-15-nov', 'Rua 15 de Novembro, 1500'],
  ['h-ed-apto', 'Ed. Central, ap. 301, bloco 2'],
  ['h-barra', 'Rua da Paz, s/n'],
  ['h-aula-3x', 'Aula 3x por semana'],
  ['h-placar', 'Futebol: 2 x 1'],
  ['h-bingo-numeros', 'Bingo: cartelas de 1 a 90'],
  ['h-cartao-vacina', 'Traga o cartão de vacina'],
  ['h-codigo-sala', 'Código da sala: B12'],
  ['h-token', 'Ficha (token) de entrada'],
  ['h-whatsapp-info', 'Dúvidas: fale com a organização pelo grupo'],
  ['h-ponto-de-onibus', 'Ponto de ônibus em frente'],
  ['h-celular-silencio', 'Deixe o celular no silencioso'],
  ['h-ligar-luz', 'Ligar as luzes às 18h'],
  ['h-tel-escola', 'Tel. da escola na portaria'],
].map(([id, texto]) => ({ id: id as string, grupo: 'honesto', texto: texto as string, papel: 'honesto' as const }));

export const TODAS: Tentativa[] = [...GOLPE, ...HONESTO];

// ---------- o que a pessoa vê ----------

export interface ResultadoFluxo {
  barrou: boolean;
  mensagem: string;
  /** Passou do passo (a pessoa seguiria para o próximo). */
  passou: boolean;
}

export interface ResultadoLink {
  /** abriu = a página do evento apareceu; barrou = tela de "Não deu para abrir". */
  estado: 'abriu' | 'barrou' | 'removido' | 'outro';
  h1: string;
  mensagem: string;
  exibido?: Record<string, string>;
  faixa?: string;
}

export interface Registro {
  id: string;
  grupo: string;
  papel: string;
  texto: string;
  fluxo: Partial<Record<CampoFluxo, ResultadoFluxo>>;
  mao: Partial<Record<CampoFluxo, ResultadoLink>>;
}

const VALIDOS = { titulo: 'Sarau na praça', organizacao: 'Coletivo cultural do bairro', texto: 'Música e poesia. Traga sua cadeira.', local: 'Praça da Matriz, São Paulo, SP' };

export const eventoBase = (): Evento => ({
  titulo: VALIDOS.titulo,
  data: '2026-12-15',
  inicio: '19:00',
  fim: '',
  local: VALIDOS.local,
  descricao: VALIDOS.texto,
  organizacao: VALIDOS.organizacao,
});

/** Lê o erro visível do campo, se houver. */
async function erroDe(page: Page, campo: CampoFluxo): Promise<string> {
  const e = page.locator(`#fluxo-${campo}-erro:not([hidden])`);
  if ((await e.count()) === 0) return '';
  return ((await e.first().innerText()) || '').trim();
}

const tituloPasso = async (page: Page) => (await page.getByRole('heading', { level: 1 }).first().innerText()).trim();

/**
 * Texto que cita órgão público (Prefeitura, Defesa Civil…) abre o painel modal `dialog#fluxo-orgao` ao tocar em
 * Continuar. Fecha com "Mudar o texto" (como quem desiste) e diz se abriu, para o roteiro seguir sem ficar preso no modal.
 */
async function fecharPainelDoOrgao(page: Page): Promise<boolean> {
  const orgao = page.locator('dialog#fluxo-orgao');
  if (!(await orgao.isVisible())) return false;
  await orgao.getByRole('button', { name: 'Mudar o texto' }).click();
  return true;
}

/** Passo 1 com os campos válidos, vindo da porta "Divulgar um evento". */
export async function irAoPasso1(page: Page): Promise<void> {
  await page.goto('./');
  await page.getByRole('link', { name: /Divulgar um evento/ }).click();
  await page.locator('#fluxo-titulo').waitFor();
  await page.locator('#fluxo-titulo').fill(VALIDOS.titulo);
  await page.locator('#fluxo-organizacao').fill(VALIDOS.organizacao);
  await page.locator('#fluxo-texto').fill(VALIDOS.texto);
}

/** Tenta o texto em cada campo do fluxo e devolve o que a pessoa veria. */
export async function tentarNoFluxo(page: Page, texto: string, campos: CampoFluxo[] = CAMPOS_FLUXO): Promise<Partial<Record<CampoFluxo, ResultadoFluxo>>> {
  const saida: Partial<Record<CampoFluxo, ResultadoFluxo>> = {};
  await irAoPasso1(page);
  for (const campo of campos.filter((c) => c !== 'local')) {
    await page.locator(`#fluxo-${campo}`).fill(texto);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForTimeout(150);
    const painelDoOrgao = await fecharPainelDoOrgao(page);
    const msg = await erroDe(page, campo);
    const outros: string[] = [];
    for (const o of ['titulo', 'organizacao', 'texto'] as const) if (o !== campo) {
      const m = await erroDe(page, o);
      if (m) outros.push(`${o}: ${m}`);
    }
    const passo = await tituloPasso(page);
    const passou = /Passo 2 de 3/.test(passo);
    saida[campo] = { barrou: !!msg, mensagem: msg || (painelDoOrgao ? '(abriu o painel "fala em nome de um órgão público?")' : outros.length ? `(campo sem erro; outros: ${outros.join(' | ')})` : ''), passou };
    if (passou) {
      await page.getByRole('button', { name: 'Voltar' }).first().click();
      await page.locator('#fluxo-titulo').waitFor();
    }
    await page.locator(`#fluxo-${campo}`).fill(VALIDOS[campo]);
  }
  if (campos.includes('local')) {
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForTimeout(150);
    if (/Passo 2 de 3/.test(await tituloPasso(page))) {
      await preencherDiaBr(page, '15/12/2026');
      await page.locator('#fluxo-hora').fill('19:00');
      await page.locator('#fluxo-local').fill(texto);
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.waitForTimeout(150);
      const painelDoOrgao = await fecharPainelDoOrgao(page);
      const msg = await erroDe(page, 'local');
      const passou = /Passo 3 de 3/.test(await tituloPasso(page));
      saida.local = { barrou: !!msg, mensagem: msg || (painelDoOrgao ? '(abriu o painel "fala em nome de um órgão público?")' : ''), passou };
    } else {
      saida.local = { barrou: false, mensagem: '(não chegou ao passo 2)', passou: false };
    }
  }
  return saida;
}

/** Monta o link à mão (sem passar pela validação do fluxo) e abre como quem recebe. */
export async function abrirLinkAMao(page: Page, baseURL: string, campo: CampoLink, texto: string): Promise<ResultadoLink & { dados: string }> {
  const ev = eventoBase();
  ev[campo] = texto;
  const dados = await codificar(ev, { comprimir: false });
  await page.goto('about:blank');
  await page.goto(linkDoEvento(baseURL, dados));
  await page.waitForFunction(() => {
    const h = document.querySelector('main h1');
    return !!h && h.textContent !== 'Abrindo o evento…' && h.textContent !== 'Carregando…';
  });
  const r = await page.evaluate(() => {
    const t = (s: string) => document.querySelector(s)?.textContent?.trim() ?? '';
    const h1 = t('main h1');
    const abriu = !!document.querySelector('[data-titulo]');
    const msg = [...document.querySelectorAll('main p')].map((p) => p.textContent?.trim() ?? '').join(' | ');
    const exib: Record<string, string> = abriu
      ? { titulo: t('[data-titulo]'), organizacao: document.querySelector<HTMLElement>('[data-organizacao]')?.hidden ? '' : t('[data-organizacao]'), local: t('[data-local]'), descricao: document.querySelector<HTMLElement>('[data-descricao]')?.hidden ? '' : t('[data-descricao]') }
      : {};
    return { abriu, h1, msg, exib, faixa: t('#ev-faixa') };
  });
  const estado: ResultadoLink['estado'] = r.abriu ? 'abriu' : r.h1 === 'Não deu para abrir este evento' ? 'barrou' : /removid/i.test(r.h1) ? 'removido' : 'outro';
  return { estado, h1: r.h1, mensagem: r.abriu ? '' : r.msg, exibido: r.exib, faixa: r.faixa, dados };
}

/** Tradução de campo do fluxo para campo do link. */
export const guardar = (r: Registro): void => {
  appendFileSync(`${SAIDAS}/g3-tentativas.jsonl`, JSON.stringify(r) + '\n');
};

/** Mostra caracteres invisíveis como \uXXXX para o relatório. */
export const visivel = (s: string): string =>
  Array.from(s)
    .map((c) => (/[\p{Cf}\p{Zs}\p{Cc}⠀ㅤ]/u.test(c) && c !== ' ' ? `\\u{${c.codePointAt(0)!.toString(16).toUpperCase()}}` : c))
    .join('');
