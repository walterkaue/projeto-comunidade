# Brief comum dos grupos da simulação "a quem organiza"

Sessão de **teste e relato**. NÃO mude o site (`src/`, `public/`, `index.html`, `package.json`, `playwright.config.ts` da raiz, `e2e/apoio.ts`, `e2e/*.spec.ts`). NÃO mude os arquivos comuns desta pasta (`sim.ts`, `aparelhos.ts`, `playwright.config.ts`, `fumaca.sim.ts`, este BRIEF). Você só cria arquivos com o SEU prefixo nesta pasta (`e2e/simulacoes/a-quem-organiza/<prefixo>-*.sim.ts` e, se precisar, `<prefixo>-apoio.ts` e `.fixtures/<prefixo>-*`). Não faça commit.

## Leia
- `CLAUDE.md` (já chega sozinho), `docs/produto.md` seção 7.6 (fluxo único) e seção 4 (neutralidade).
- `docs/proximos-passos.md`, seção "Pendências pequenas da revisão": o que já está lá NÃO é achado novo (só se a simulação mostrar que é pior).
- `e2e/simulacoes/a-quem-organiza/sim.ts` e `aparelhos.ts` (a base pronta) e `e2e/apoio.ts` (PORTAS, conferirTela, abrirPorta, irAteOPronto — pode importar).
- O código do fluxo para achar seletores: `src/ferramentas/fluxo/` (`passos.ts`, `pronto.ts`, `index.ts`, `memoria.ts`), exemplos em `src/ferramentas/cards/exemplos.ts`, ata em `src/ferramentas/reuniao/ata.ts`. Leia só o que precisar.

## Como rodar
O servidor (build de produção, `vite preview`) JÁ está aberto pela sessão principal em http://localhost:4181. Não abra outro. Rode SEMPRE da raiz do worktree assim (Git Bash):

```
SIM_SERVIDOR_PRONTO=1 SIM_GRUPO=<prefixo> npx playwright test --config e2e/simulacoes/a-quem-organiza/playwright.config.ts <prefixo>- --workers 2
```

- Cada aparelho é um projeto do Playwright. O teste escolhe o aparelho pela etiqueta no título: `test('A1 Dona Cida: caminho inteiro @AND-FRACO', ...)`. Um teste por aparelho; para dois aparelhos, dois testes.
- Opções por teste: `test.use({ compartilhar: 'ausente' | 'cancela' | 'sem-arquivo' | 'sim', letra200: true, semDownload: true })` dentro de um `test.describe`. `cpu` e `rede` já vêm do aparelho (só no Chromium).
- Do `sim.ts`: `test`, `expect`, `tocar` (toque no celular, clique no PC), `foto(page, nome, inteira?)`, `cronometro(personagem).marca(etapa)`, `inspecionar(page, tela)` (axe, rolagem lateral, alvos < 48 px ou colados, texto cortado, fora da tela; não falha, devolve e registra), `cobertoPorFaixa(locator)`, `partilhas(page)`, `copias(page)`, `salvarPartilhado(page, 'card.png')` (o PNG que foi para o menu de compartilhar), `baixarPor(botao, 'nome.png')`, `salvarPdf(page, 'cartaz.pdf')` (Chromium; depois de tocar em imprimir), `salvarTexto(nome, texto)`, `registrar(nome, dados)`.
- Tudo o que sai fica em `.saidas/<teste--aparelho>/` e `.fotos/<teste--aparelho>/` (fora do git).
- Os testes da simulação NÃO devem falhar por achado: registre e siga. Use `expect` só para o que o roteiro precisa para continuar (ex.: o Pronto abriu). Se o caminho trava de verdade, isso é achado TRAVA: registre, tire foto e termine o teste.
- Chame `inspecionar` e `foto` em cada tela (início, passo 1, 2, 3, Pronto, painel do exemplo, ata...). Marque o cronômetro em cada passo, e a etapa final se chama exatamente `mandar-no-whatsapp` (o toque que manda de verdade, depois de confirmar o painel se ele abrir).
- Faça o personagem agir como pessoa: digite com `pressSequentially` nos campos principais (não só `fill`), toque nos atalhos ("Próximo sábado"), erre e corrija quando o roteiro pedir.

## O que olhar em cada tela
1. Consegue terminar sem ajuda? Onde hesitaria (dois botões parecidos, palavra difícil, aviso que assusta, exemplo esquecido)?
2. Foto.
3. Erro no console (fica em `.saidas/erros-console.jsonl`), axe e rolagem lateral.
4. Alvo < 48 px ou colado; algo atrás da barra fixa ou da miniatura; texto cortado ou com reticências que esconde informação.
5. O que sai: OLHE o PNG do card com a ferramenta Read (texto estourando, acento, emoji, caixa alta, contraste, logo); leia o texto do WhatsApp e o link (conte os caracteres); abra o .ics se houver; salve o cartaz A4 em PDF (Chromium) e OLHE com Read.
6. Tempo de cada passo.
7. Neutralidade: palavra, cor, ícone ou exemplo que pareça ter lado.
8. Em todos: "Mudar algo" e "Fazer outro" no Pronto (o que se perde, o que fica); Voltar do navegador (`page.goBack()`) no meio dos passos e no Pronto; o painel "Isto ainda tem partes do exemplo" é entendido ou parece erro?

## Reprodução
Cada candidato a TRAVA ou ATRAPALHA tem de se reproduzir **duas vezes** (rode de novo com `--repeat-each 2` ou um segundo teste). Diga quantas vezes reproduziu. O que não reproduziu, descarte ou marque como "não reproduziu".

## Gravidades
- TRAVA: não consegue terminar, ou manda algo errado para o grupo.
- ATRAPALHA: consegue, mas erra, demora ou desconfia.
- MELHORIA: oportunidade.
- SÓ NO APARELHO: a emulação não mostra; diga ao Kauê o que olhar no celular.
Se a sugestão mexe em regra do `docs/produto.md` (conta, guardar dado, o que vai no link, neutralidade, IA, WhatsApp), diga qual e marque "pede decisão". Nunca sugira conta, banco, IA no site ou API do WhatsApp sem essa marca.

## Entrega (sua resposta final, em português, sem enfeite)
1. Tabela: personagem × aparelho → terminou? tempo total até `mandar-no-whatsapp` (e de cada passo)? onde travou?
2. Lista de achados, cada um com: personagem, aparelho, tela/passo, o que aconteceu, o que era esperado, gravidade proposta, quantas vezes reproduziu, evidência (caminho da foto em `.fotos/...` ou do arquivo em `.saidas/...`, ou do trace), sugestão.
3. As 3 a 5 fotos que melhor provam os achados (caminhos).
4. O que a emulação não mostrou e o Kauê precisa olhar no celular.
5. Os arquivos que você criou e o comando para rodar.
Não escreva o relatório final; a sessão principal junta tudo.
