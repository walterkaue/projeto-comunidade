# Revisão do fluxo único: segurança, privacidade e neutralidade, 05/11/2026

> Só leitura: nenhum código foi alterado.
> Versão revisada: `main` no commit `14f1ad6`. `npm test`: 45 arquivos, 592 testes passando.
> Escopo: só o que o fluxo único mudou (commits `a1697c0` a `14f1ad6`). Isso inclui `src/ferramentas/fluxo/`, as rotas novas e antigas (`src/comum/rotas.ts`, `src/main.ts`), a passagem do Evento para o fluxo, a ponte para a ata e a ata em `#/ata`, e os exemplos (`src/ferramentas/cards/exemplos.ts`).
> Regras de referência: `CLAUDE.md`, `docs/produto.md` v0.7 (seções 3, 4, 7.3 e 7.6) e `docs/auditoria/2026-11-05/seguranca.md` (chamado aqui de "auditoria de segurança").

## Resumo

| Classe | Quantos | Quais |
|---|---|---|
| Crítico | 0 | — |
| Alto | 0 | — |
| Médio | 3 | M1 a M3 |
| Baixo | 7 | B1 a B7 |

A base do fluxo está boa. O que a pessoa escreve fica só na memória da aba, e o endereço leva só o tipo e o passo. A ata recebe a pauta pela memória e nada dela volta para o link. Não achei injeção de HTML nas telas novas. Os endereços antigos levam ao lugar certo, e os que trazem dados de evento passam pela lista de bloqueio. Os exemplos não têm nome de pessoa nem nada de partido.

Os três pontos médios:

- **M1:** o aviso "Você ainda está com o exemplo" não impede mandar o exemplo, e some cedo demais.
- **M2:** as cópias que os botões do próprio site fazem de um evento escapam da lista de bloqueio.
- **M3:** a pauta da reunião vai sempre no link e no QR do cartaz, e nada avisa isso antes de a pessoa escrever.

## Situação das correções

| Achado | Situação |
|---|---|
| M1 | Corrigido em 06/11/2026 (ver abaixo) |
| M2 | Aberto (bloqueia a divulgação) |
| M3 | Corrigido em 06/11/2026, sem "Mandar sem o link" (ver abaixo) |
| B1 a B7 | Abertos |

### Correções de 06/11/2026 (M1 e M3)

Feitas na pasta do fluxo. Revisadas pelo `revisor`, pelo `revisor-acessibilidade` e pelo `revisor-privacidade-neutralidade`, com os achados deles já aplicados. `npm test`: 45 arquivos, 610 testes passando.

**M1:**
- Os dados guardam, na memória da aba, os campos do exemplo de onde a pessoa partiu (`doExemplo`). Esses campos nunca entram no evento, na assinatura nem no texto.
- `camposDoExemplo` confere campo a campo: título, organização, texto ou pauta, e local. Dia e hora não contam.
- A organização também conta como do exemplo quando é igual a uma das organizações fictícias do catálogo (`ORGANIZACOES`). Isso cobre um link antigo e o exemplo digitado à mão.
- O Pronto diz quais campos ainda são do exemplo, e o "Mandar" e o "Copiar o link" apontam para esse aviso.
- Mandar, Baixar, Copiar o texto, Copiar o link e Imprimir abrem antes um painel na própria tela, com "Mudar algo" e "<Ação> mesmo assim". O painel não usa `window.confirm`, porque o menu de compartilhar precisa vir do toque. O foco vai para "Mudar algo", e o Esc fecha o painel. Uma confirmação vale para a visita inteira ao Pronto.
- Sem link do evento enquanto o título ou a organização forem do exemplo. Por isso também não há QR nem "Mais detalhes".
- "Apagar o exemplo" limpa também o local do exemplo.

**M3:**
- No passo 1 da reunião, um aviso visível antes dos campos: "Título, local e pauta vão no link do convite, e quem receber pode repassar. Não escreva nome de pessoa nem assunto que só o grupo pode saber."
- A dica da pauta passa a ser "Um assunto por linha. Sem nome de pessoa."
- Na reunião, a dica do local pede para não pôr o nome de quem mora, se for numa casa.
- No Pronto da reunião, "O QR do cartaz abre a pauta inteira." aparece junto de Imprimir, só quando há link e QR.

**Ficou de fora, de propósito:**
- "Fazer a ata" com o exemplo não pede confirmação: a ata é local e editável.
- "Mandar sem o link" e o cartaz de reunião sem QR esperam o beta.

**Decisão do Kauê em aberto:** o título do exemplo também trava o link. Um sindicato que mantém "Assembleia da categoria" como título fica sem link até trocar. A revisão de privacidade sugere travar só pela organização, e deixar o título no aviso e no painel.

**Conferido no navegador** (servidor `dev`), por script, com o painel do navegador oculto:
- o aviso com a lista dos campos;
- a falta de link com o exemplo e o link depois de trocar título e organização;
- o painel abrindo depois da dica de cada botão, com o foco em "Mudar algo", o Esc e a confirmação única;
- a nota do QR;
- o aviso novo do passo 1.

Falta ver o desenho a 360 px e testar o leitor de tela no aparelho.

## O que bloqueia o beta

As duas correções são pequenas e ficam quase todas na pasta do fluxo.

1. **M1:** quem testa pela primeira vez toca até o fim para ver o que acontece. Com 4 toques, o exemplo sai num grupo de verdade, com link no nosso domínio.
2. **M3:** o beta vai ter reuniões reais. Um nome de pessoa na pauta de um sindicato ou de uma igreja revela filiação, que é dado sensível (`docs/produto.md` 5). Esse nome vai para um link que se repassa e para o QR de um cartaz no mural. A correção é um texto de dica.

## O que bloqueia a divulgação

Tudo o que bloqueia o beta, e mais:

3. **M2:** com mais gente usando, um evento denunciado tende a circular em cópias. Hoje o bloqueio não alcança essas cópias.

Os baixos não bloqueiam nada. Vale fazer B1 e B3 junto de M2, porque mexem nas mesmas telas.

---

## Achados

### M1 · Médio · O aviso do exemplo não impede mandar o exemplo, e some cedo demais

**Onde:**
- `src/ferramentas/fluxo/estado.ts:225-227` (`marcarMudanca`: a origem vira "pessoa" na primeira mudança);
- `src/ferramentas/fluxo/passos.ts:149-152` e `:199` (qualquer letra em qualquer campo dos passos 1 e 2 chama `mudou`), `:219` (o atalho do dia também chama), `:228` ("Apagar o exemplo" limpa só o passo 1);
- `src/ferramentas/fluxo/pronto.ts:41` (o aviso é um parágrafo comum) e `:46` (o botão "Mandar" não aponta para o aviso);
- `src/ferramentas/fluxo/link.ts:31-46` (o link do evento é gerado também para o exemplo).

**Cenários:**
1. **Exemplo inteiro.** Continuar, Continuar, Ficou bom, Mandar no WhatsApp: 4 toques. O aviso aparece no Pronto, mas nenhum botão pede confirmação. O link é gerado. Ele abre no nosso domínio uma página com "Quem chama, segundo quem criou o link: Associação de Moradores Jardim das Flores", no próximo sábado, às 9h30, na "Praça central".
2. **Exemplo pela metade.** Basta tocar em "Próximo sábado" (que já é o dia do exemplo), mexer na hora ou trocar só o título para a origem virar "pessoa" e o aviso sumir. A organização, o local e o texto do exemplo saem como se fossem da pessoa.
3. **"Apagar o exemplo".** O botão limpa título, organização, texto e pauta. Na reunião e no evento, o dia, a hora e o local do exemplo continuam no passo 2, e o aviso já não aparece.
4. **Leitor de tela.** O aviso fica num parágrafo depois do título. O botão "Mandar" só aponta para a dica "Abre o menu do celular" (`aria-describedby`), e não para o aviso.

**Efeito:** um convite falso chega a um grupo real, em nome de uma organização que parece existir (B5), com "Feito com Projeto Comunidade" e um link no nosso domínio. Gente pode ir a um lugar à toa. Um dos exemplos é uma oficina para crianças de 6 a 12 anos. Por engano, isso se parece com a regra 9 ("fingir ser outra pessoa, organização ou órgão público").

**Correção proposta** (tudo em `src/ferramentas/fluxo/`):
- Guardar junto dos dados, na memória da aba, o exemplo de onde eles partiram. Conferir campo a campo: título, organização, texto ou pauta e local. Um campo "ainda é do exemplo" enquanto estiver igual ao do exemplo. Dia e hora não contam: são escolhas que a pessoa confirma. Assim o atalho do dia deixa de apagar o aviso.
- No Pronto, enquanto algum desses campos for do exemplo:
  - o aviso diz quais são ("A organização e o local ainda são do exemplo.");
  - o botão "Mandar" aponta para o aviso (`aria-describedby`);
  - Mandar, Baixar a imagem, Copiar só o texto e Imprimir pedem confirmação: "Isto ainda tem partes do exemplo: organização e local. Mandar mesmo assim?". A saída "Mudar algo" fica à mão.
- Não gerar o link do evento enquanto o título ou a organização forem do exemplo. O link é a parte que circula e aparece no nosso domínio. No lugar dele: "O link é criado quando você trocar o exemplo pelo seu."
- "Apagar o exemplo" limpa também o local, se for o do exemplo.
- Testes em `estado.test.ts`:
  - tocar no atalho do dia não tira a marca do exemplo;
  - trocar só o título deixa a organização e o local marcados como exemplo;
  - `linkDoFluxo` não gera link quando o título ou a organização são do exemplo.

Decisão do Kauê: pedir confirmação (o proposto) ou travar os botões até a pessoa trocar o exemplo.

**Bloqueia:** beta.

### M2 · Médio · Cópias feitas pelos botões do próprio site escapam da lista de bloqueio

**Onde:**
- `src/ferramentas/fluxo/estado.ts:141-164` (`dadosDoCardPreparado` sempre descarta o link que veio do evento);
- `src/ferramentas/fluxo/estado.ts:178-200` (`dadosDoEvento` só reaproveita o link quando o texto coube inteiro e não há hora de fim);
- `src/comum/entreTelas.ts:44-47` (`limpar` junta espaços e quebras de linha e corta em 140 letras com "…");
- `src/ferramentas/fluxo/link.ts:31-46` (sem link de antes, o Pronto gera um novo);
- `src/ferramentas/evento/formato.ts` (`dadosCanonicos`);
- `scripts/bloquear.mjs` (grava a impressão do link e a da forma canônica, só isso).

**O que mudou:**

| Botão na página do evento | Antes do fluxo | Agora |
|---|---|---|
| "Fazer o card deste evento" | O QR do cartaz levava o link original | Sempre gera um link novo. O texto chega com as quebras de linha juntadas, cortado em 140 letras, e sem a hora de fim |
| "Criar outro evento a partir deste" | Abria todos os campos. Sem mudança, saía a mesma forma canônica | Corta a descrição em 140 letras e tira a hora de fim |

A cópia vira **outro evento**, com outra impressão e outra forma canônica, sempre que o evento tem:
- hora de fim;
- quebra de linha na descrição (toda reunião: a pauta vem numerada, um item por linha);
- mais de 140 letras na descrição.

**Cenário:** um evento com golpe presencial ("leve RG e cartão do banco ao endereço X") circula. Várias pessoas tocam em "Fazer o card deste evento" e mandam o card com o texto do Pronto, que leva o link novo. Quem modera bloqueia o link denunciado. As cópias seguem abrindo, e quem moderou nem sabe que elas existem.

A auditoria de segurança (B1) já dizia que mudar o texto gera outro link. A diferença é que agora o próprio site faz a mudança, sem a pessoa querer.

**Correção proposta** (as duas partes):
- **No fluxo** (`src/ferramentas/fluxo/estado.ts`): "Fazer o card" guarda o link original e a assinatura dos dados como chegaram, como `dadosDoEvento` já faz. Enquanto a pessoa não mudar nada, o Pronto usa o link original. O QR e o texto levam ao evento inteiro, que é o que pode ser denunciado. O card é um resumo; a página do evento mostra o resto. Mudou algum campo, sai um link novo, como hoje.
- **No script** (`scripts/bloquear.mjs`, fora da pasta do fluxo: vai para a sessão de correções): ao bloquear, gravar também a impressão das cópias que o site faria sem mudança. São duas: a de "Fazer o card" (texto como sai de `conferirDadosDoCard`, sem hora de fim) e a de "Criar outro" (texto como sai de `dadosDoEvento`, sem hora de fim). Gerar essas formas com a mesma regra do site, de preferência com as mesmas funções. Teste: uma cópia feita pelo fluxo de um evento bloqueado abre como "removido".
- **Em `docs/moderacao.md`:** dizer que o bloqueio pega as cópias feitas pelos botões do site sem mudança, mas não as que alguém editou.

**Bloqueia:** divulgação.

### M3 · Médio · A pauta vai sempre no link e no QR do cartaz, sem aviso antes de escrever

**Onde:**
- `src/ferramentas/fluxo/passos.ts:99` (dica da pauta: só "Um assunto por linha.");
- `src/ferramentas/fluxo/estado.ts:450-466` (a pauta numerada vira a descrição do evento no link);
- `src/ferramentas/fluxo/pronto.ts:48` e `:114-115` (a frase "Quem receber pode repassar" só aparece no Pronto, depois de o link ficar pronto);
- `src/ferramentas/fluxo/estado.ts:483-503` ("Copiar só o texto" também leva o link).

A regra está em `docs/produto.md` 7.3: "o texto sempre leva o link".

**O que mudou:** na convocação de antes, o link do evento era opcional (`src/ferramentas/reuniao/convocacao.ts:14`). Agora, toda reunião vira link, e o link leva a pauta inteira.

**Cenário:** um sindicato ou uma igreja escreve na pauta "Afastamento do tesoureiro João" ou "Situação da irmã Maria". O texto do WhatsApp já mostra isso a quem recebe a mensagem, mas o link vai mais longe:
- abre a pauta no nosso domínio;
- é repassado sozinho, sem a mensagem que explicava o contexto;
- pode ficar no histórico do navegador de quem abre (e, com a sincronização ligada, na conta Google ou Apple dessa pessoa);
- o QR do cartaz impresso para o mural abre a pauta inteira para quem passar na frente, embora o cartaz mostre só o começo dela.

O comentário de `passos.ts:93` já prevê "nome de pessoa na pauta". Nome de pessoa junto com sindicato, igreja ou movimento revela filiação, que é dado sensível.

Além disso, a única saída sem o link é "Baixar a imagem". "Copiar só o texto" também leva o link, e o cartaz leva o QR.

**Correção proposta:**
- Dica da pauta (`passos.ts:99`): "Um assunto por linha. A pauta vai no link do convite, e quem receber pode repassar. Não escreva nome de pessoa nem assunto que só o grupo pode saber." Passar pelo `revisor-acessibilidade` (texto da dica longo).
- Trazer a frase do Pronto para o passo 1 da reunião, perto da pauta. Hoje ela só aparece depois que o link já existe.
- Cartaz: ao lado de "Imprimir cartaz para o mural", na reunião: "O QR do cartaz abre a pauta inteira."
- Decisão do Kauê (se mudar, registrar na 7.3 e na 7.6): oferecer "Mandar sem o link" para reunião interna, e cartaz de reunião sem QR.

**Bloqueia:** beta.

### B1 · Baixo · "Fazer o card deste evento" pula o aviso "Confira tudo antes de mandar"

**Onde:** `src/ferramentas/fluxo/index.ts:47` (vai direto ao passo 3); `passos.ts:61-64` (a nota `NOTA_DO_LINK` só aparece no passo 1); `pronto.ts` (não há nota para dados vindos de link).

A pessoa repassa o texto de um terceiro com um link novo, que passa a ser dela, sem nenhum lembrete. Pelo "Criar outro a partir deste", a nota aparece, porque esse caminho abre no passo 1.

**Correção:** mostrar `NOTA_DO_LINK` também no passo 3 e no Pronto quando a origem for "link".

### B2 · Baixo · O Pronto gera link para um evento igual a um já removido, sem avisar

**Onde:** `src/ferramentas/fluxo/link.ts:31-46` (não confere a lista de bloqueio).

Se alguém escreve de novo o conteúdo exato de um evento removido, o Pronto entrega o link normalmente. Quem recebe vê "removido", e quem criou não sabe por quê.

Também: `docs/proximos-passos.md` (linha "Tamanho") diz "a lista de bloqueio só no Pronto", mas o Pronto não baixa a lista. Só o "Criar outro a partir deste" confere.

**Correção:** no Pronto, conferir o link novo com `motivoDoLinkBloqueado`. Se estiver na lista, não oferecer o link e dizer: "Um evento igual a este foi removido do site. O link não vai abrir." Junto, o caminho para as Regras de uso. Corrigir a frase dos próximos passos.

### B3 · Baixo · A tela "não pode ser usado como modelo" não diz o motivo nem como pedir revisão

**Onde:** `src/ferramentas/fluxo/editar.ts:66-67`.

A página do evento removido mostra a regra ferida e como pedir revisão (M7 da auditoria de segurança, `src/ferramentas/evento/pagina.ts:38-48`). O mesmo link aberto por "Criar outro a partir deste" mostra só "Este link foi removido e não pode ser usado como modelo."

**Correção:** usar `textosDoRemovido(motivo)` e o botão "Ver as Regras de uso", como em `pagina.ts`.

### B4 · Baixo · Duas dicas puxam nome de pessoa

**Onde:** `src/ferramentas/cards/modelos.ts:49-50`, usadas no passo 1 (`passos.ts:100`).

As dicas são "O que foi alcançado e por quem." (conquista) e "A quem e pelo quê." (agradecimento). Elas convidam a pôr nome de pessoa. Em "conquista", também puxam o crédito para uma pessoa, inclusive alguém com mandato ("graças ao vereador…"), que é o uso de campanha que a plataforma evita. A dica da organização já diz "não de pessoas" e "Nome de criança ou adolescente nunca".

**Correção:** "O que o grupo conseguiu." e "A quem o grupo agradece e pelo quê. Prefira o nome do grupo. Nome de criança ou adolescente nunca."

### B5 · Baixo · Exemplos com nome de lugar que existe

**Onde:** `src/ferramentas/cards/exemplos.ts:5-13`.

As organizações são inventadas, mas usam lugares reais. "Jardim das Flores" é bairro em várias cidades. "Rio Claro" é município em São Paulo e no Rio de Janeiro. Mandado por engano (M1), "Conselho Escolar Rio Claro" parece o conselho de uma escola de verdade. Com M1 corrigido, o risco cai muito.

**Correção:** conferir numa busca rápida que nenhum nome completo é de organização real. Na dúvida, usar lugar inventado.

### B6 · Baixo · O que a pessoa escreveu fica na aba até ela fechar ou tocar em "Fazer outro"

**Onde:** `src/ferramentas/fluxo/memoria.ts:10` e `:45-49`.

Depois de mandar, os dados continuam na memória da aba. Num aparelho dividido (celular da família, computador do salão), quem abrir a mesma porta depois vê a pauta anterior. A ata avisa ao fechar a aba e tem "Apagar a ata". O fluxo não diz nada.

**Correção:** no Pronto, perto de "Fazer outro": "Terminou? Toque em Fazer outro para apagar o que você escreveu neste aparelho." (Hoje "Fazer outro" apaga o fluxo e a pauta guardada para a ata, mas não a ata, e isso está certo.)

### B7 · Baixo · O link do Pronto herda o caminho do endereço aberto (já existia antes do fluxo)

**Onde:** `src/ferramentas/evento/partes.ts:15` (`enderecoDoSite` = origem + caminho aberto); `public/sw.js:112-128`.

Sem rede, o service worker serve o app guardado em qualquer endereço de um nível dentro da pasta, por exemplo `…/projeto-comunidade/qualquer-texto`. Com a base relativa, os arquivos carregam do cache. O link do Pronto e o QR saem com esse caminho (`…/projeto-comunidade/qualquer-texto#/evento/…`). Para quem recebe, o link dá erro 404, e na mensagem aparece um texto escolhido por quem mandou o endereço estranho. O caso depende de a pessoa abrir um endereço desses sem internet: é improvável. A criação do evento de antes já tinha o mesmo comportamento; o fluxo herdou.

**Correção:** base fixa da pasta do app (`new URL('./', location.href)`) ou o endereço do site num lugar só (`src/comum/marca.ts`). No service worker, servir a página guardada só para o escopo e o `index.html`, como já faz ao guardar. São arquivos compartilhados: vai para a sessão de correções.

---

## Respostas ponto a ponto

### Dados entre os passos e para a ata

Nada vai para link nem sai do aparelho sem um toque da pessoa. O que conferi:

- **Memória:** os dados do fluxo ficam num `Map` do módulo (`memoria.ts`); a ata e a pauta que vai para ela, num objeto do módulo (`reuniao/rascunho.ts`). O logo fica na memória e nunca é enviado.
- **Endereço:** só `#/fazer/<tipo>` e `#/fazer/<tipo>/<passo>` (`enderecoDoPasso`). Quem recarrega ou abre `/3` ou `/pronto` direto volta ao passo 1 (`index.ts:55-58`). O "Criar outro" troca o endereço com `location.replace` assim que lê os dados, e o endereço com os dados não fica como passo.
- **Teste da pasta** (`pasta.test.ts`): proíbe `localStorage`, `sessionStorage`, IndexedDB, cookie, `history.*State`, `caches`, rede, endereço de outro site e leitura de `rota.resto` fora de `estado.ts`.
- **Título da aba:** vem do `h1`, que no fluxo só tem texto fixo (o verbo da porta e o passo). Nada digitado vai para o título nem para o histórico.
- **Contagem de visitas:** manda só `p=/fazer` (`src/comum/metricas.ts:20-24`), sem tipo, passo nem dados.
- **Ponte para a ata** (`pronto.ts:261-268`, `ponte.ts`): pauta, organização, dia, local e hora vão para o rascunho na memória. Nada da ata volta para o fluxo nem para o link. A presença não passa por aqui.
- **Ata em `#/ata`:** continua com o corretor desligado em todos os campos (`ATRIBUTOS_SEM_CORRETOR`), aviso ao fechar a aba e saída só por impressão, PDF ou cópia.
- **Corretor na convocação:** desligado na reunião (`passos.ts:94` e `:131`, passos 1 e 2). Fica ligado no evento, no aviso, na conquista e no agradecimento, que são textos para publicar.
- **O link:** só existe para reunião e evento e leva o que a pessoa escreveu para o convite (título, dia, hora, local, texto ou pauta, organização). Ponto fraco: M3.

### Endereços antigos e links já enviados

| Endereço | O que abre | Lista de bloqueio |
|---|---|---|
| `#/evento/<dados>` | A página do evento, igual a antes | Conferida com o link como veio e com a forma canônica |
| `#/evento/editar/<dados>` e `#/fazer/evento/editar/<dados>` | O fluxo, no passo 1, com os dados do evento | Conferida (`abrirEvento`). Removido: tela sem modelo (B3) |
| `#/evento` | O fluxo, evento, passo 1 | — |
| `#/cards` e `#/cards/<qualquer coisa>` | Só o que a página do evento preparou na memória da aba. Sem nada preparado, o início. Dados no link nunca preenchem (M5 da auditoria de segurança segue valendo) | O que veio da página já passou pela conferência |
| `#/cards/galeria` | A galeria, só com os exemplos | — |
| `#/reuniao` e `#/reuniao/<qualquer coisa>` | O fluxo, reunião, passo 1. A ata, que ficava na mesma tela, agora é `#/ata` | — |
| `#/fazer/<tipo>/<passo>` sem dados na aba | O passo 1 | — |

Os links de evento que já circulam abrem igual e continuam sendo bloqueados como antes. O que ficou de fora da lista: as cópias que o fluxo gera (M2) e o link novo do Pronto, que não é conferido (B2).

### Injeção de texto

- **Telas novas:** todo campo digitado entra por `formulario.ts` (com `esc`) ou por `textContent`. Atributos com texto digitado (`aria-label`, `alt`) entram por `setAttribute` ou pela propriedade. `pasta.test.ts` confere que os campos não entram crus nos modelos de HTML. Não há `eval`, `new Function` nem `document.write`.
- **Texto do "Mandar no WhatsApp"** (`estado.ts:483-503`): é montado só com os campos. Tira `*`, `_`, `~` e `` ` `` e junta espaços e quebras de linha. Assim, ninguém forja negrito, linha nova ou um "Mais detalhes:" falso dentro de um campo. O texto sai pelo menu do sistema (Web Share) ou pela área de transferência, nunca por robô ou API.
- **Reunião e evento** passam pela mesma validação da página do evento antes de sair do passo: sem link, telefone, PIX, e-mail, invisíveis nem frase que finge ser do site. O mesmo vale para os dados que chegam de um evento de outra pessoa.
- **Aviso, conquista e agradecimento** não passam por essa validação: dá para escrever um link ou uma chave PIX no card. Já era assim no Cards de antes. Isso não aparece no nosso domínio, porque esses tipos não têm link, mas o card sai com "Feito com Projeto Comunidade". Não conto como achado novo. Se quiser, o rodapé pode desligar sozinho quando o texto tiver link, telefone ou PIX (decisão do Kauê).
- **Link do Pronto** (`link.ts`, `apoio.ts:54-57`): sai de `validarEvento` e `codificar`, com a base `enderecoDoSite()` (sem `?…`). "Ver a página do evento" só recebe dados no formato do evento (letras sem acento, números, `-` e `_`). "Criar outro" só reaproveita o link de antes se ele for deste site e os campos não tiverem mudado. Ponto fraco: B7.
- **Ata:** a pauta que vem do fluxo entra nos pontos por `esc` (`reuniao/index.ts:213`).

### Exemplos em rodízio

- **Rodízio:** 7 tipos de organização (associação de moradores, sindicato, grupo religioso, núcleo de bairro, coletivo cultural, instituto e conselho escolar). Começa num deles ao acaso e anda um a cada exemplo novo (`memoria.ts:14` e `:23`). Na mesma aba, cada porta mostra um tipo diferente.
- **Nomes de pessoas:** nenhum nos exemplos, nas pautas nem nas dicas. Ponto fraco: B4.
- **Partido:** nenhuma sigla, nome, número ou cor de partido. A paleta padrão é "Papel". O teste de neutralidade varre `exemplos.ts` e `estado.ts`.
- **"Instituto Rede Viva":** "Rede" também é o nome curto de um partido. O projeto já trata "rede" como palavra comum (`testes/siglas-partidos.txt`, linhas 9 a 11). Não conto como achado; se quiser folga, troque o nome.
- **"Núcleo de Bairro Zona Norte":** "núcleo" é palavra usada por partidos, movimentos e igrejas. Neutro, sem achado.
- **Conquista "Conseguimos o asfalto da rua 4":** o crédito vai para o grupo ("Obrigado a todos"), não para alguém com mandato. Está certo.
- **Lugares:** B5.

### O aviso "Você ainda está com o exemplo" impede mandar o exemplo por engano?

Não. Ver M1. O aviso não trava nem pede confirmação, some com qualquer toque nos passos 1 e 2 (até no atalho do dia), não aponta para o botão "Mandar" no leitor de tela, e o link do evento é gerado mesmo para o exemplo.

---

## O que está bem feito (para não desfazer)

- Endereço só com o tipo e o passo, e um teste que proíbe guardar dado e ler dado do endereço na pasta toda.
- A pauta vai para a ata pela memória, com pergunta antes de trocar pontos já escritos.
- Reunião e evento passam pela mesma validação da página do evento antes de sair de cada passo, então o link nunca sai recusado.
- "Criar outro a partir deste" confere a lista de bloqueio antes de mostrar qualquer dado.
- `#/cards` vindo de fora continua sem preencher nada.
- Texto do WhatsApp sem as marcas de formatação digitadas.
- Corretor desligado na convocação e na ata.
- Contagem de visitas sem o tipo nem o passo.

## Conferências que dependem do Kauê

Nenhum painel nem conta. Só decisões:

1. **M1:** pedir confirmação antes de mandar o exemplo (o proposto) ou travar os botões até trocar o exemplo.
2. **M3:** oferecer "Mandar sem o link" e cartaz de reunião sem QR, ou ficar só com a dica e o aviso.
3. **Injeção de texto:** desligar sozinho o rodapé "Feito com…" quando o card de aviso, conquista ou agradecimento tiver link, telefone ou PIX.

## Ordem sugerida para as correções

1. M1, na pasta do fluxo (`estado.ts`, `memoria.ts`, `passos.ts`, `pronto.ts`, `link.ts`, testes).
2. M3, na pasta do fluxo (`passos.ts`, `pronto.ts`).
3. M2 em duas partes: o link original em "Fazer o card" (pasta do fluxo) e as impressões das cópias em `scripts/bloquear.mjs` e `docs/moderacao.md` (sessão de correções).
4. B1 e B3 com M2. Depois B2, B4, B5 e B6. B7 junto das outras pendências do service worker (B2 da auditoria de segurança).

Toda correção que mexer em texto da plataforma ou em link passa pelo `revisor-privacidade-neutralidade` antes de juntar.
