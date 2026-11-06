// A5: Thiago (partido de direita, núcleo; iPhone grande) e Rafaela (partido de esquerda, coletivo; Android grande).
// Cada um faz as duas portas (palestra = "Divulgar um evento"; plenária = "Chamar para uma reunião"), com o MESMO
// conteúdo digitado; só a organização muda ("Núcleo de bairro" / "Coletivo de bairro", genéricas).
import { caminhoInteiro, guardarTelas, porta } from './a5-apoio';
import { test } from './sim';

const PESSOAS = [
  { nome: 'Thiago', aparelho: 'IPHONE-GRANDE', org: 'Núcleo de bairro', ordem: ['evento', 'reuniao'] as const },
  { nome: 'Rafaela', aparelho: 'AND-GRANDE', org: 'Coletivo de bairro', ordem: ['reuniao', 'evento'] as const },
];

for (const pessoa of PESSOAS) {
  test(`A5 ${pessoa.nome}: caminho inteiro nas duas portas @${pessoa.aparelho}`, async ({ page }) => {
    test.setTimeout(600_000);
    const todas: Record<string, unknown> = {};
    for (const t of pessoa.ordem) {
      const r = await caminhoInteiro(page, `${pessoa.nome}-${t}`, porta(t), pessoa.org, { completar: true, prefixoFoto: `${pessoa.nome.toLowerCase()}` });
      todas[t] = r;
    }
    guardarTelas(`a5-${pessoa.nome.toLowerCase()}-telas`, todas);
  });
}

// Controle: sorteio fixo (Math.random = 0) e exemplo intacto, as cinco portas, cada uma numa aba nova.
// Aqui o conteúdo é o mesmo nos dois aparelhos; qualquer diferença vem do aparelho.
for (const pessoa of PESSOAS) {
  test(`A5 controle ${pessoa.nome}: exemplo intacto nas cinco portas @${pessoa.aparelho}`, async ({ context }) => {
    test.setTimeout(900_000);
    await context.addInitScript(() => {
      Math.random = () => 0;
    });
    const todas: Record<string, unknown> = {};
    for (const t of ['reuniao', 'evento', 'aviso', 'resultado', 'agradecimento'] as const) {
      const p = await context.newPage();
      todas[t] = await caminhoInteiro(p, `${pessoa.nome}-controle-${t}`, porta(t), pessoa.org, { completar: false, prefixoFoto: `controle-${pessoa.nome.toLowerCase()}` });
      await p.close();
      guardarTelas(`a5-controle-${pessoa.nome.toLowerCase()}`, todas);
    }
    guardarTelas(`a5-controle-${pessoa.nome.toLowerCase()}`, todas);
  });
}
