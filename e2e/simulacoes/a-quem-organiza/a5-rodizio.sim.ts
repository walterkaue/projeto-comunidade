// A5: o rodízio dos exemplos (o exemplo é o cinza 'Ex.: …' dos campos, que começam vazios). memoria.ts: contador `proximo` começa ao acaso (0..6) a cada carga da aba e anda um
// a cada exemplo novo (qualquer porta compartilha o mesmo contador); "Fazer outro" apaga os dados e o próximo exemplo
// é o seguinte. Contagem: 30 aberturas por porta com aba nova; mais a sequência com "Fazer outro" e o "voltar ao início
// e tocar de novo" na mesma aba.
import { preencherObrigatoriosVazios } from '../obrigatorios';
import { exemploDoPasso1, irParaOInicio, PORTAS, TIPOS, tipoDaOrg, tocarNaPorta } from './a5-apoio';
import { expect, registrar, tocar, test, titulo } from './sim';

const APARELHOS = ['AND-GRANDE', 'IPHONE-GRANDE'];
// O iPhone (WebKit) fica muito lento com a máquina cheia: o rodízio é JS igual nos dois, então ele faz uma amostra menor.
const QUANTAS: Record<string, number> = { 'AND-GRANDE': 30, 'IPHONE-GRANDE': 10 };

for (const aparelho of APARELHOS) {
  test(`A5 rodízio: aberturas por porta @${aparelho}`, async ({ context }) => {
    const ABERTURAS = QUANTAS[aparelho]!;
    test.setTimeout(900_000);
    const tabela: Record<string, Record<string, number>> = {};
    const primeiros: Record<string, string[]> = {};
    for (const p of PORTAS) {
      tabela[p.tipo] = Object.fromEntries(TIPOS.map(([t]) => [t, 0]));
      primeiros[p.tipo] = [];
      for (let i = 0; i < ABERTURAS; i++) {
        const page = await context.newPage();
        await irParaOInicio(page);
        await tocarNaPorta(page, p);
        const e = await exemploDoPasso1(page);
        tabela[p.tipo]![e.tipo] = (tabela[p.tipo]![e.tipo] ?? 0) + 1;
        primeiros[p.tipo]!.push(e.tipo);
        await page.close();
      }
    }
    registrar('rodizio', { metodo: 'aba-nova', aberturas: ABERTURAS, tabela, primeiros });
  });

  test(`A5 rodízio na mesma aba (voltar ao início e tocar; Fazer outro) @${aparelho}`, async ({ page }) => {
    test.setTimeout(900_000);
    const resultado: Record<string, { voltandoAoInicio: string[]; fazerOutro: string[]; titulosFazerOutro: string[] }> = {};
    for (const p of PORTAS) {
      await irParaOInicio(page);
      await tocarNaPorta(page, p);
      const voltando: string[] = [];
      for (let i = 0; i < 6; i++) {
        voltando.push((await exemploDoPasso1(page)).tipo);
        await tocar(page.getByRole('button', { name: 'Voltar' }));
        await expect(titulo(page)).toHaveText('O que você quer fazer?');
        await tocarNaPorta(page, p);
      }
      const outro: string[] = [];
      const titulos: string[] = [];
      for (let i = 0; i < (aparelho === 'AND-GRANDE' ? 14 : 7); i++) {
        const e = await exemploDoPasso1(page);
        outro.push(e.tipo);
        titulos.push(e.titulo);
        // Os campos começam vazios: escreve só o obrigatório para poder seguir.
        await preencherObrigatoriosVazios(page, p, 1);
        await tocar(page.getByRole('button', { name: 'Continuar' }));
        await expect(titulo(page)).toContainText('Passo 2 de 3');
        await preencherObrigatoriosVazios(page, p, 2);
        await tocar(page.getByRole('button', { name: 'Continuar' }));
        await expect(titulo(page)).toContainText('Passo 3 de 3');
        await tocar(page.getByRole('button', { name: 'Ficou bom' }));
        await expect(titulo(page)).toContainText('Pronto!');
        await tocar(page.getByRole('button', { name: 'Fazer outro' }));
        await expect(titulo(page)).toHaveText('O que você quer fazer?');
        await tocarNaPorta(page, p);
      }
      resultado[p.tipo] = { voltandoAoInicio: voltando, fazerOutro: outro, titulosFazerOutro: titulos };
    }
    registrar('rodizio-mesma-aba', { resultado, nota: 'tipoDaOrg=' + tipoDaOrg('Núcleo de Bairro X') });
  });
}
