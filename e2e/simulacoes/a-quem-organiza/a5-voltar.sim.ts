// A5: "Mudar algo", "Fazer outro", Voltar do navegador (page.goBack) e o Pronto só com o obrigatório, nos dois aparelhos.
import { preencherObrigatoriosVazios } from '../obrigatorios';
import { continuar, exemploDoPasso1, inspecionar, irParaOInicio, passo1, passo2, porta, tocarNaPorta } from './a5-apoio';
import { expect, foto, partilhas, registrar, tocar, test, titulo } from './sim';

const PESSOAS = [
  { nome: 'Thiago', aparelho: 'IPHONE-GRANDE', org: 'Núcleo de bairro' },
  { nome: 'Rafaela', aparelho: 'AND-GRANDE', org: 'Coletivo de bairro' },
];

for (const pessoa of PESSOAS) {
  for (const tipo of ['evento', 'reuniao'] as const) {
    test(`A5 ${pessoa.nome}: mudar algo, fazer outro e voltar (${tipo}) @${pessoa.aparelho}`, async ({ page }) => {
      test.setTimeout(900_000);
      const p = porta(tipo);
      const nota = (o: string, d: Record<string, unknown>) => registrar('navegacao', { pessoa: pessoa.nome, porta: tipo, o, ...d });
      const campo = (id: string) => page.locator(id).inputValue();
      const paletaMarcada = () => page.evaluate(() => (document.querySelector('input[name="fluxo-paleta"]:checked') as HTMLInputElement).value);
      await irParaOInicio(page);
      await tocarNaPorta(page, p);
      nota('exemplo inicial', await exemploDoPasso1(page));
      await passo1(page, p, pessoa.org);
      await continuar(page, 'Passo 2 de 3');
      await passo2(page, p);

      // Voltar do navegador no passo 2: o passo 1 mantém o que foi digitado? E o passo 2 digitado, volta?
      await page.goBack();
      await expect(titulo(page)).toContainText('Passo 1 de 3');
      nota('goBack passo2->1', { titulo: await campo('#fluxo-titulo'), org: await campo('#fluxo-organizacao'), url: page.url().split('#')[1] });
      await foto(page, `${tipo} goBack no passo 1`);
      await page.goForward();
      await expect(titulo(page)).toContainText('Passo 2 de 3');
      nota('goForward 1->2', { local: await campo('#fluxo-local'), hora: await campo('#fluxo-hora'), dia: await campo('#fluxo-data') });

      await continuar(page, 'Passo 3 de 3');
      // Escolhe outra cor no passo 3 (a quinta), como alguém que mexe.
      await tocar(page.locator('input[name="fluxo-paleta"]').nth(4));
      nota('paleta escolhida', { paleta: await paletaMarcada() });
      await page.goBack();
      await expect(titulo(page)).toContainText('Passo 2 de 3');
      nota('goBack passo3->2', { local: await campo('#fluxo-local') });
      await page.goForward();
      await expect(titulo(page)).toContainText('Passo 3 de 3');
      nota('goForward 2->3', { paleta: await paletaMarcada() });

      await tocar(page.getByRole('button', { name: 'Ficou bom' }));
      await expect(titulo(page)).toContainText('Pronto!');
      await page.waitForTimeout(400);
      await page.goBack();
      nota('goBack Pronto', { titulo: await titulo(page).innerText() });
      await page.goForward();
      await expect(titulo(page)).toContainText('Pronto!');

      // Mudar algo: volta ao passo 1; o que fica?
      await tocar(page.locator('#fluxo-mudar'));
      await expect(titulo(page)).toContainText('Passo 1 de 3');
      nota('Mudar algo', { titulo: await campo('#fluxo-titulo'), org: await campo('#fluxo-organizacao'), url: page.url().split('#')[1] });
      await foto(page, `${tipo} depois de Mudar algo`);
      await continuar(page, 'Passo 2 de 3');
      nota('Mudar algo passo2', { local: await campo('#fluxo-local'), dia: await campo('#fluxo-data') });
      await continuar(page, 'Passo 3 de 3');
      nota('Mudar algo passo3', { paleta: await paletaMarcada() });
      await tocar(page.getByRole('button', { name: 'Ficou bom' }));
      await expect(titulo(page)).toContainText('Pronto!');
      await page.goBack();
      nota('goBack depois de Mudar algo', { titulo: await titulo(page).innerText() });
      await page.goForward();
      await expect(titulo(page)).toContainText('Pronto!');

      // Fazer outro: volta ao início.
      await tocar(page.locator('#fluxo-outro'));
      await expect(titulo(page)).toHaveText('O que você quer fazer?');
      nota('Fazer outro: início', { url: page.url().split('#')[1] ?? '' });
      await page.goBack();
      nota('goBack depois de Fazer outro', { titulo: await titulo(page).innerText().catch(() => '?'), url: page.url().split('#')[1] ?? '' });
    });

    test(`A5 ${pessoa.nome}: só o obrigatório, sem aviso de exemplo e Fazer outro traz o próximo (${tipo}) @${pessoa.aparelho}`, async ({ page }) => {
      test.setTimeout(900_000);
      const p = porta(tipo);
      const nota = (o: string, d: Record<string, unknown>) => registrar('navegacao', { pessoa: pessoa.nome, porta: tipo, o, ...d });
      await irParaOInicio(page);
      await tocarNaPorta(page, p);
      // Os campos começam vazios; o exemplo é o cinza de dentro. Escreve só o obrigatório.
      const ex1 = await exemploDoPasso1(page);
      await preencherObrigatoriosVazios(page, p, 1);
      await continuar(page, 'Passo 2 de 3');
      await preencherObrigatoriosVazios(page, p, 2);
      await continuar(page, 'Passo 3 de 3');
      await tocar(page.getByRole('button', { name: 'Ficou bom' }));
      await expect(titulo(page)).toContainText('Pronto!');
      if (p.agenda) await expect(page.locator('#fluxo-link-estado')).not.toHaveText('Preparando o link…');
      await page.waitForTimeout(500);
      nota('aviso do exemplo no Pronto', { avisoDoExemplo: await page.locator('#fluxo-aviso-exemplo').count() }); // 0: não existe mais
      // O painel não abre mais por causa do exemplo; só se faltar o link ou houver órgão público.
      const antes = (await partilhas(page)).length;
      await tocar(page.locator('#fluxo-mandar'));
      const painel = await page.locator('#fluxo-confirma').isVisible();
      nota('painel', { abriu: painel, texto: painel ? await page.locator('#fluxo-confirma').innerText() : null, botoes: painel ? await page.locator('#fluxo-confirma button').allInnerTexts() : [] });
      if (painel) {
        await foto(page, `${tipo} painel`);
        await inspecionar(page, `${tipo} painel`);
        await tocar(page.getByRole('button', { name: 'Mandar mesmo assim' }));
      }
      await expect.poll(async () => (await partilhas(page)).length).toBe(antes + 1);
      nota('texto mandado só com o obrigatório', { texto: (await partilhas(page))[antes]!.texto });

      // Mudar algo (de baixo), Voltar do navegador e seguir de novo.
      await tocar(page.locator('#fluxo-mudar'));
      await expect(titulo(page)).toContainText('Passo 1 de 3');
      await page.goBack();
      nota('goBack depois do Mudar algo', { titulo: await titulo(page).innerText() });
      await page.goForward();
      await continuar(page, 'Passo 2 de 3');
      await continuar(page, 'Passo 3 de 3');
      await tocar(page.getByRole('button', { name: 'Ficou bom' }));
      await expect(titulo(page)).toContainText('Pronto!');

      // Fazer outro e tocar na mesma porta de novo: vem o próximo do rodízio?
      await tocar(page.locator('#fluxo-outro'));
      await expect(titulo(page)).toHaveText('O que você quer fazer?');
      await tocarNaPorta(page, p);
      const ex2 = await exemploDoPasso1(page);
      nota('Fazer outro traz o próximo', { antes: ex1, depois: ex2, mudou: ex1.titulo !== ex2.titulo });
      // Voltando ao início SEM Fazer outro: o exemplo continua o mesmo?
      await tocar(page.getByRole('button', { name: 'Voltar' }));
      await expect(titulo(page)).toHaveText('O que você quer fazer?');
      await tocarNaPorta(page, p);
      nota('voltar ao início e tocar de novo', { mesmo: (await exemploDoPasso1(page)).titulo === ex2.titulo });
    });
  }
}
