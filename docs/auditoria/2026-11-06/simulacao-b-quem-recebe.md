# Simulação B — quem recebe o link

> 06/11/2026. Sessão de teste e relato: nenhum arquivo do site foi mudado. Os roteiros ficam em `e2e/simulacoes/b-quem-recebe/`: Playwright no build de produção local, porta 4182. Cada grupo de roteiros também rodou numa porta própria, de 4282 a 4582, para não disputar o servidor. Personagens e organizações são fictícios e aparecem só pelo tipo.
> Revisado por `revisor` e `revisor-acessibilidade`, que não escreveram os roteiros. O que mudou com a revisão está no fim.

## Para o Kauê

1. **Golpe com cara de órgão público sai no WhatsApp sem ressalva.** "Defesa Civil: evacuação imediata", assinado "Prefeitura de Vila Alegre", vai ao grupo com o rodapé do site. O aviso "segundo quem criou" só aparece depois que a pessoa toca no link (B-01).
2. **Com letra grande, a página do evento abre já rolada e esconde o aviso** "Conteúdo criado por quem enviou… Nunca faça pagamento" (B-02).
3. **Link copiado com ponto, parêntese ou "Obrigada!" colado no fim não abre.** Aparece "link incompleto ou alterado" (B-03).
4. **Texto honesto barrado, com mensagem que acusa golpe:** "19:30-21:00", "Mostra Doc 2026", "Inscrições pelo site da escola", "senhas no Banco de Alimentos" (B-08 a B-10).
5. **O cartaz do mural corta o endereço longo:** "número 1500" vira "número 150…" (B-04).

**Quantos achados:** 1 TRAVA, 9 ATRAPALHA, 1 SÓ NO APARELHO e 21 MELHORIA. Há ainda 9 pontos para você conferir no celular, que a emulação não mostra (seção "SÓ NO APARELHO").

## Personagem × aparelho

Os tempos com rede limitada foram medidos com a máquina dividida com outras sessões. O tempo para abrir o evento foi medido de novo com a máquina livre (tabela logo abaixo).

| Personagem | Aparelho | Terminou? | Tempo | Onde travou ou hesitou |
|---|---|---|---|---|
| B1 Seu Antônio, convite do sindicato | WEBVIEW, letra 200% | Leu o convite e abriu o QR. Pôr na agenda depende do app (B-11) | abrir 2,8 a 3,4 s (sem limite de rede) | O aviso "baixado" aparece mesmo sem baixar (B-11). Quando copiar falha, o aviso manda usar um botão que não existe (B-21) |
| B1 | AND-FRACO, letra 200% | Sim: o .ics baixou e está certo | abrir 13,4 a 14,2 s; QR 4,8 s; .ics 1,3 s | Abre rolada, com o aviso cortado no alto (B-02). O título quebra no meio da palavra (B-29) |
| B2 Joana, em Manaus | AND-GRANDE | Sim | abrir 2,6 s | A página diz "às 19h" sem dizer de onde; a agenda marca 19h de Manaus, que são 20h em São Paulo (B-18) |
| B2 Edson, em Rio Branco | AND-PEQUENO e IPHONE-SE | Sim | abrir 3,4 s e 4,2 s | Idem: 19h do Acre, que são 21h em São Paulo (B-18) |
| B3 Kleber, cartaz da padaria | IPHONE-SE (QR lido do PDF) | Sim: o QR do PDF lê, é igual ao link do texto e o evento abre | 26 a 33 s (máquina lenta) | Cartaz com local longo cortado (B-04); QR de 36 a 40 mm (B-31) |
| B3, Wi-Fi com página de login | AND-GRANDE, com service worker | Primeira visita: vê só o portal. Depois de conectar, abre | menos de 1 s até o portal | Nada que o site possa resolver; ver B-15 |
| B4 Luana, WhatsApp Web | PC-FIREFOX e PC-GRANDE | Link inteiro: sim. Dos 35 links estragados, 10 não abrem ou abrem errado | 1 a 19 s por link | Ponto ou texto colado no fim (B-03); endereço quase certo vai ao início (B-16); letra trocada (B-17); evento passado sem aviso (B-22) |
| B5 golpista | AND-GRANDE e Node (242 textos × 4 campos, fluxo e link montado à mão) | Conseguiu publicar órgão falso, selo falso e telefone quebrado em linhas | — | B-01, B-06, B-07, B-27 |
| B5 ao contrário, boa-fé | AND-FRACO e AND-GRANDE | Os 12 textos da lista pedida passam, menos "Festa do Pix da Escola" | — | B-08 a B-10, B-14 |
| B6 Dona Rosa | AND-FRACO | Sim: denúncia revisada; mailto de 634 caracteres; tela de link removido entendida | abrir o golpe: 12 a 17 s | A faixa só fala de pagamento, não de documento (B-20); a tela de link removido não orienta quem recebeu (B-25) |
| Em todos: página do evento | AND-PEQUENO (320 px), SAMSUNG escuro, AND-GRANDE, AND-DEITADO, AND-TECLADO, TABLET, IPHONE-SE, IPHONE-GRANDE, PC-FIREFOX, PC-GRANDE | Sim em todos | 3 a 10 s sem limite de rede | Axe sem erro grave, sem rolagem lateral, nenhum alvo menor que 48 px. Deitado e com letra grande, a folha "Você vai sair…" passa da tela (B-05) |
| Em todos: "Fazer o card" e "Criar outro" | AND-GRANDE | Sim | 22 a 60 s (máquina lenta) | Organização de outra pessoa já preenchida (B-12); pauta longa cortada no meio da palavra (B-13) |

### Tempo para abrir o evento (AND-FRACO: CPU 6× mais lenta, 400 kbit/s, 2 s de ida e volta)

Medido do toque no link até o título do evento na tela, com o link `evento-sp-19h`. Rodou 2× com a máquina livre (`g4-tempo.sim.ts`, `--workers=1`) e 1× no grupo G4, com a máquina carregada.

| Caso | Tempos | Leitura |
|---|---|---|
| Primeira visita, nada guardado | 16,5 s e 12,4 s (livre); 17,0 s (carregada) | Bem acima dos ≈ 3 s que o `proximos-passos.md` estima para o início em 3G lento. Aqui entram a CPU 6× mais lenta, a página do evento e a lista de bloqueio, e cada pedido leva 2 s de ida e volta. Quem recebe passa 12 a 17 s olhando "Abrindo o evento…" |
| Segunda visita, com service worker e lista guardados | 7,0 s e 2,5 s (livre); 1,6 s (carregada) | Ganho grande, mas que varia; a emulação não explica a rodada de 7 s |
| Lista de bloqueio atrasada 4 s, 9 s ou sem resposta (só na primeira visita) | 12,0 a 18,7 s (livre); 12,4 a 23,3 s (carregada) | Dentro da variação da primeira visita: o site desiste da lista em 8 s, como já descrito nas pendências. Nada pior que isso |

## Achados

Cada TRAVA e ATRAPALHA se reproduziu 2× ou mais. As fotos estão em `docs/auditoria/2026-11-06/fotos/`, com o número do achado no nome. As saídas brutas ficam em `e2e/simulacoes/b-quem-recebe/.saidas/`, fora do git; os roteiros as geram de novo.

### TRAVA

#### B-01 · Texto que se passa por órgão público passa e sai no WhatsApp sem ressalva — **pede decisão**
- **Personagem:** B5 golpista; quem recebe é qualquer pessoa do grupo. **Aparelho:** AND-FRACO, mais uma varredura em Node com as mesmas funções do site. **Passo:** passos 1 e 2, Pronto e página do evento.
- **O que aconteceu:** 12 textos de órgão passaram nos 4 campos, tanto pelo fluxo quanto pelo link montado à mão. Exemplos: "Defesa Civil: evacuação imediata", "Prefeitura de Vila Alegre informa", "INSS: atualização cadastral", "Receita Federal: regularize seu CPF". O texto que vai ao grupo traz `*Defesa Civil: evacuação imediata*`, o dia, o local, `_Prefeitura de Vila Alegre_` e o link. O card assina "Prefeitura de Vila Alegre", com "Feito com Projeto Comunidade" embaixo. A ressalva "segundo quem criou o link" e a faixa só aparecem na página, depois do toque.
- **Esperado:** um convite que se diz de órgão público não sair com cara de comunicado oficial. "Fingir ser órgão público" já é regra de uso, com prazo de 24 horas na moderação (`produto.md`, seção 3). A brecha é o texto que chega antes do toque.
- **Evidência:** `fotos/b-01-autoridade-previa.png`; `.saidas/g3-cenas.jsonl` (cena `pronto-autoridade`); `.saidas/g3-varredura.json`. Reproduziu 2×, e o revisor rodou de novo.
- **Sugestão (pede decisão: o que o produto barra, o texto do WhatsApp e a neutralidade):**
  - (a) No texto do WhatsApp, quando houver link, escrever "Quem chama, segundo quem criou: …" no lugar do nome em itálico.
  - (b) Palavras de órgão (Prefeitura, Defesa Civil, Governo, INSS, Receita, Polícia, Banco Central) abrem uma confirmação, sem barrar: "Este convite fala em nome de um órgão público? Isso não é permitido." Barrar não serve, porque "reunião com a Prefeitura" é honesto. A confirmação vale igual para toda organização.

### ATRAPALHA

#### B-02 · Com letra grande, a página do evento abre rolada e esconde o começo do aviso
- **Personagem:** B1 e B6. **Aparelho:** AND-FRACO e IPHONE-SE, com texto a 200%. **Tela:** página do evento, ao abrir.
- **O que aconteceu:** a tela abre com o título no alto. Da faixa só aparecem "…evento." e "Denunciar". O resto ("Conteúdo criado por quem enviou este link… Nunca faça pagamento…") fica acima, fora da tela. Em 360 × 640 a página rola cerca de 630 px, e a faixa começa em −582 px. Com letra normal e em 320 px, o aviso aparece inteiro.
- **Esperado:** a proteção de quem recebe é a primeira coisa vista. O critério WCAG mais próximo é o 1.4.4, mas nenhum critério AA reprova; é regra do produto (7.2).
- **Evidência:** `fotos/b-02-faixa-cortada-200.png`. Reproduziu 3× (Chromium e WebKit), mais 2× com cada revisor.
- **Causa:** `$('h1').focus()` sem `preventScroll`, em `src/ferramentas/evento/pagina.ts` (linha 124). O conteúdo chega depois do `scrollTo(0, 0)` do roteador, e o foco rola até o título.
- **Sugestão:** `focus({ preventScroll: true })` nesse h1. Ressalva da acessibilidade: o leitor de tela só ouve a faixa pelo `aria-describedby` do h1, e o TalkBack e o VoiceOver costumam ignorá-lo fora de campos de formulário. Ver "SÓ NO APARELHO". Se não ler, levar o foco para a faixa.

#### B-03 · Link com ponto, parêntese ou texto colado no fim não abre
- **Personagem:** B4 Luana, no WhatsApp Web. **Aparelho:** PC-FIREFOX e PC-GRANDE.
- **O que aconteceu:** não abrem `…<dados>.`, `…<dados>)`, `…<dados>,`, `…<dados> Obrigada!` (o navegador faz `%20Obrigada!`) nem `%0A` no fim. Todos dão "Não deu para abrir este evento. Este link de evento está incompleto ou foi alterado." Espaço e quebra de linha no fim abrem, porque o navegador os tira.
- **Esperado:** quem copia "…link. Valeu!" junto consegue abrir o evento. Os dados do link só usam letras, números, `-` e `_`; o que vem depois pode ser cortado sem risco.
- **Evidência:** `fotos/b-03-ponto-no-fim.png`. Reproduziu 2× nos dois navegadores, e o revisor rodou de novo.
- **Sugestão:** ao ler o link, cortar a partir do primeiro caractere que não seja letra, número, `-` ou `_` (`src/ferramentas/evento/abrir.ts`). Não muda o formato do link.

#### B-04 · O cartaz corta o local e a organização com reticências
- **Personagem:** B3 (quem lê o mural) e quem fez o cartaz. **Aparelho:** AND-GRANDE, PDF A4 do Chromium. **Passo:** Pronto → Cartaz → "Imprimir cartaz para o mural".
- **O que aconteceu:** com um local de 119 letras (o campo aceita 120), o cartaz traz "…Avenida Central, número 150…". Somem o "1500, fundos, Centro", e o "150" passa por número certo. A organização longa sai "…do Jardim das Acáci…". A página do evento mostra tudo. A miniatura do passo 3 usa o mesmo desenho, mas em tamanho pequeno.
- **Esperado:** o que o campo aceita cabe no cartaz, ou o Pronto avisa que o cartaz vai cortar. Só acontece com local de mais de uns 90 caracteres.
- **Evidência:** `fotos/b-04-cartaz-corta-local.png`; PDF em `.saidas/g2-cartaz-pior.pdf`. Reproduziu 3× (o desenho é sempre o mesmo).
- **Sugestão:** no cartaz, reduzir a letra do local até caber em 3 linhas, sem cortar; ou avisar no Pronto "O cartaz corta o endereço. Encurte o local." (pastas `cards` e `fluxo`).

#### B-05 · Celular deitado e letra grande: a folha "Você vai sair…" passa da tela e não rola
- **Personagem:** B1 Seu Antônio, que usa letra grande e deixa o celular deitado na mesa. **Aparelho:** AND-DEITADO (640 × 360), texto a 200%. **Tela:** página do evento → "Abrir no Google Agenda" ou "Ver no mapa".
- **O que aconteceu:** a caixa da folha mede 472 px numa tela de 360 px e começa em −112 px. A frase "Você vai sair do Projeto Comunidade e abrir calendar.google.com" fica fora da tela, e a folha não rola. Só os botões "Ir para o site" e "Ficar aqui" aparecem, sem dizer para onde vão. Em pé (360 × 640) cabe, mas o domínio quebra assim: "calendar.google.co / m".
- **Esperado:** a frase de segurança sempre à vista, ou rolável (WCAG 1.4.4 e 1.4.10).
- **Evidência:** `fotos/b-05-folha-deitado-200.png`; `.saidas/r-folha.jsonl`; roteiro `r-folha.sim.ts`. Achado pelo `revisor-acessibilidade` e reproduzido 2×.
- **Sugestão:** `.folha { overflow-y: auto }`, `.folha-caixa { max-height: 100% }` e `align-items: safe flex-end`; quebrar o domínio só nos pontos (`<wbr>`). Os arquivos `src/comum/componentes.css` e `saida.ts` são compartilhados, então vira pedido em `docs/pedidos-comum.md`.

#### B-06 · Telefone quebrado em linhas passa no texto e na pauta
- **Personagem:** B5 golpista. **Passo:** passo 1, "Texto curto" (evento) e "Pauta" (reunião).
- **O que aconteceu:** passa o texto "Chame no zap", com "11", "91234" e "5678" cada um numa linha. Na reunião, cada pedaço vira um item, e a página mostra "1. Chame no zap 2. 11 3. 91234 4. 5678". No campo de uma linha (título, organização, local) o mesmo número é barrado.
- **Esperado:** a regra "sem telefone" (`produto.md` 7.2) valer também quando o número vem em linhas; é o disfarce mais barato. Os disfarces que nunca vão ser 100% barrados (letra no lugar do número, número por extenso) estão em B-27.
- **Evidência:** `fotos/b-06-telefone-em-linhas.png`; cenas `pagina-telefone-em-linhas` e `reuniao-pauta-telefone`. Reproduziu 2×.
- **Sugestão:** conferir o texto também com as quebras de linha trocadas por espaço (`validar.ts` na pasta `evento`, ou `src/comum/conteudo.ts` se a regra for de lá: aí vira pedido).

#### B-07 · Selo e faixa falsos passam — **pede decisão**
- **Personagem:** B5 golpista. **Passo:** título, organização e texto.
- **O que aconteceu:** passam "Este evento foi conferido", "Evento aprovado pela moderação", "Moderação da Comunidade", "Projeto-Comunidade" (com hífen), "P.Comunidade" e a frase da faixa copiada palavra por palavra. Na página, "Este evento foi conferido" aparece logo abaixo da faixa verdadeira, e a descrição repetindo a faixa parece uma segunda faixa do site. Fica tudo como texto puro, abaixo da faixa real.
- **Pior do que a pendência já anotada** ("Equipe da Comunidade ainda passa"): o nome do site com hífen passa, e "conferido" sem "pelo site" também.
- **Evidência:** `fotos/b-07-faixa-copiada.png`; varredura (`plat-*`). Reproduziu 2×, e o revisor rodou de novo.
- **Sugestão (pede decisão: o que conta como imitar o site):**
  - Comparar o nome do site sem pontuação nem hífen.
  - Barrar "conferido", "checado", "aprovado" ou "verificado" quando ligados a "evento" ou "conteúdo".
  - Barrar texto igual ao da faixa.

#### B-08 · Texto honesto barrado: horário com dois-pontos e traço, período e lista de números
- **Personagem:** B5 ao contrário, quem organiza de boa-fé. **Passo:** passos 1 e 2, todos os campos.
- **O que aconteceu:**
  - **Barrados:** "19:30-21:00", "Das 19:30-21:00", "10/11-15/11", "Dias 10, 11, 12, 13", "Salas 101, 102, 103" e "CEP 01234567".
  - **Passam:** "19h-21h" e "Das 19h30-21h". O problema é só o horário com dois-pontos.
  - **A mensagem:** fala em "telefone, e-mail, @, CPF, CNPJ ou outro número comprido… (o endereço pode ir sem CEP)". Quem escreveu um horário não entende o que trocar (WCAG 3.3.3).
- **Da lista pedida, todos passam:** Rua 7, nº 1234; CEP 01234-567; Das 19h30 às 21h; Bazar: aceitamos doação de roupas; Rua do Telefone; Sala 12, 2º andar; Ônibus 8012; 15/11; 2026; R. Dr. Pedro, 1500 – fundos; Ligue-se na cultura. **A exceção é "Festa do Pix da Escola"** (B-09). Também passam Av. Brasil, 12.345; Km 23 da estrada; Turma 2026/1; Casa 3, quadra 12, lote 7; Linha 5 do metrô; WhatsApp do grupo; site da escola; Cine clube 35 mm.
- **Evidência:** `fotos/b-08-erro-horario-traco.png`; varredura (`h-horario-*`, `h-periodo-datas`, `h-dias-virgula`, `h-salas-virgula`, `h-cep-sem-hifen`). Reproduziu 2×, e o revisor rodou de novo.
- **Sugestão:** não contar como número comprido o horário (`hh:mm-hh:mm`), o período de datas e a lista com vírgula. No mínimo, a mensagem dizer: "Se for horário ou lista, separe com 'às' ou 'e'".

#### B-09 · "Doc", "Ted", hashtag e linha de traços barrados como pagamento ou código
- **Personagem:** B5 ao contrário. **Passo:** passo 1.
- **O que aconteceu:** são barrados "Mostra Doc 2026" (mostra de documentários), "Festa do Ted 2026" (nome de pessoa), a hashtag `#EncontroDosMoradores2026` e uma linha decorativa de 30 traços. A mensagem fala de "chave PIX, pagamento ou um código comprido". "Festa do Pix da Escola" também é barrado, e para "Pix" não há contorno: até "P.I.X" é barrado.
- **Fora do achado:** "Pague 1 leve 2" e "Pagamento em 3 vezes" são barrados de propósito, porque o 7.2 proíbe pedido de pagamento.
- **Evidência:** varredura (`h-mostra-doc`, `h-festa-do-ted`, `h-hashtag`, `h-linha-decorativa`, `h-festa-do-pix`); cena `erro-festa-do-pix`. Reproduziu 2×.
- **Sugestão:**
  - "doc" e "ted" só contam junto de valor em R$; uma linha só de traços não é código.
  - Liberar a palavra "Pix" sem chave **pede decisão** (PIX proibido é regra do 7.2).
  - Sem decisão, a mensagem pode dizer: "Se Pix é parte do nome, troque a palavra; o site não aceita nenhuma menção a Pix."

#### B-10 · "Site da escola" e "senhas": a mensagem acusa golpe
- **Personagem:** B5 ao contrário. **Passo:** passo 1.
- **O que aconteceu:**
  - "Inscrições pelo site da escola" e "Lançamento oficial do projeto da horta" são barrados com "o evento não pode dizer que é do site nem que foi conferido por ele".
  - "Distribuição de senhas no Banco de Alimentos" e "Passe na portaria com documento com foto" são barrados com "…É assim que muitos golpes começam."
  - Quem é honesto se sente acusado e não sabe o que trocar (WCAG 3.3.3).
- **Fora do achado:** "Comunidade" sozinho é barrado de propósito (pendência já anotada sobre o nome curto).
- **Evidência:** `fotos/b-10-erro-site-da-escola.png`; cena `erro-senha-banco-alimentos`. Reproduziu 2×, e o revisor rodou de novo.
- **Sugestão:** "site" e "oficial" só contam perto do nome deste site. Tirar a frase "É assim que muitos golpes começam" e dar um exemplo: "Se é senha de atendimento, escreva 'ficha'."

### SÓ NO APARELHO (achado)

#### B-11 · Navegador dentro do app: o aviso diz "baixado" sem saber se baixou
- **Personagem:** B1 Seu Antônio, 70. **Aparelho:** WEBVIEW. **Tela:** página do evento → "Baixar arquivo para a agenda".
- **O que se sabe:** o aviso "Arquivo da agenda baixado. Abra-o para adicionar o evento." sai sempre, sem conferir nada (`src/ferramentas/evento/pagina.ts`, linha 117). Na emulação, o download foi desligado de propósito, para imitar navegadores dentro de app que ignoram downloads. Então o "não baixou" é premissa do teste, não observação. A saída "Abrir no Google Agenda" fica logo abaixo.
- **O que olhar no celular:** abrir um link de evento recebido **dentro do WhatsApp** (Android e iPhone) e **dentro do Instagram** e tocar no botão. Se não baixar e o aviso aparecer, vira ATRAPALHA.
- **Sugestão:** aviso mais neutro, na própria pasta `evento`: "Se o arquivo não aparecer, toque em Abrir no Google Agenda."

### MELHORIA

| Código | Personagem e aparelho | O que aconteceu | Sugestão |
|---|---|---|---|
| B-12 | Quem recebeu e quer o seu, AND-GRANDE | "Criar outro evento a partir deste" abre com a organização de quem mandou já preenchida, com a dica "Quem está chamando" e uma nota genérica ("Estes dados vieram de um link de evento"). O campo e a miniatura mostram o nome, mas quem faz o próprio evento pode não trocar (`fotos/b-12-criar-outro.png`) | Nota própria em "Criar outro": "Este convite é de outra organização. Se o evento é seu, troque a Organização." |
| B-13 | Quem repassa a `reuniao-longa`, AND-GRANDE | No card, no texto do WhatsApp e no cartaz, a pauta vem numa linha só e cortada no meio da palavra ("…Calendário de mutirõe…"). Os itens 5 a 11 somem sem aviso; o link ainda leva tudo (`fotos/b-13-pauta-cortada-card.png`). Pendência já anotada; é nova só a palavra quebrada | Cortar no fim de um item, um por linha, e terminar com "… e mais 7 itens no link" |
| B-14 | B5 ao contrário | "Data: sáb/dom" é barrado como link ("sáb/dom" sozinho passa), e a mensagem fala de um "ponto sem espaço" que não existe. "Av.das Flores" é barrado, mas ali a mensagem ajuda ("coloque um espaço") | Barra entre duas palavras curtas não é link |
| B-15 | B3, Wi-Fi de login | O service worker guarda como "a página" qualquer HTML com resposta 200 (`public/sw.js`, linha 160). No teste, a página do portal ficou guardada e voltou sem rede. No site de verdade, em HTTPS, um portal não consegue responder pelo nosso endereço sem erro de certificado; por isso fica só como endurecimento | Guardar só HTML com a marca do app (ex.: `<meta name="app">`); pedido em `docs/pedidos-comum.md` |
| B-16 | B4, PC | `#<dados>` ou `#/<dados>` (sem "evento/") abre o início sem aviso; sem o `#`, dá 404 (o `dist/` não tem `404.html`; no GitHub Pages seria a página do GitHub, não vista no ar) | Reconhecer dados de evento depois do `#`; um `public/404.html` com `lang` e `<title>` que leve ao `#/evento/…` |
| B-17 | B4, PC | Uma letra trocada no meio do link abre o evento com "Mð3ica" no lugar de "Música", sem aviso (`fotos/b-17-letra-trocada.png`). É raro | Código de conferência curto nos links novos. **Pede decisão** (o que vai no link, 7.2) |
| B-18 | B2, Manaus e Rio Branco | A página diz "às 19h" igual em todo fuso. O `.ics` e o Google Agenda levam a hora sem fuso (flutuante), certo para evento presencial e errado para quem acompanha de longe | "às 19h (horário do local do evento)" na página. Pôr o fuso no link **pede decisão** (7.2) |
| B-19 | Quem cria a reunião | Pauta de 12 itens com 386 letras recusada com "use até 400 letras no total": a conta inclui "Pauta:" e a numeração (`src/ferramentas/fluxo/estado.ts`, linhas 504 e 572), e não há contador. Visto ao gerar os links da simulação | Descontar o que a pessoa não digitou, ou mostrar "faltam N letras" |
| B-20 | B6, AND-FRACO | "Cesta básica grátis… Leve RG e CPF… vagas limitadas" passa, e a faixa só fala de pagamento (`fotos/b-20-golpe-documentos.png`). Pedir documento é comum e honesto ("leve documento com foto") | Faixa: "Nunca faça pagamento nem mande documentos por causa de um evento." **Pede decisão** (texto da faixa, 7.2) |
| B-21 | B1, WEBVIEW | Quando copiar falha, o aviso é "Não deu para compartilhar. Use Baixar imagem.", mas a página do evento não tem esse botão (`src/comum/compartilhar.ts:115`; `fotos/b-21-compartilhar-webview.png`). Com permissão de copiar, aparece "Texto copiado. Cole na conversa.", que está certo | Mensagem por tela; na página do evento: "Copie o endereço da barra do navegador" (pedido) |
| B-22 | B4, PC | Evento de ontem e de 2 meses atrás abre igual a um futuro, com "Adicionar à agenda" ativo. Já está nos opcionais da análise jurídica ("evento já aconteceu") | Frase "Este evento já passou." perto de "Quando" |
| B-23 | B4 | Link cortado: a mensagem é boa ("Peça a quem enviou para mandar de novo"), mas o botão escuro é "Criar um evento" | "Voltar ao início" como botão principal, ou a dica "Copie a mensagem inteira, até o fim do link" |
| B-24 | B4, PC; B1 | Sem menu de compartilhar, "Compartilhar este link" copia o texto, e o nome promete outra coisa. O aviso tapa o botão de baixo por 5 s, mas o toque passa por ele (`pointer-events: none`) | Sem `navigator.share`, chamar o botão de "Copiar o link", como o Pronto já faz |
| B-25 | B6, AND-FRACO | Link removido por golpe: explica o motivo e tem saída, mas a única ação ("Criou este link e discorda?") é para quem criou | Na regra 5: "Se você recebeu este link, não pague nem mande documentos. Avise quem mandou e o grupo." |
| B-26 | AND-GRANDE, menu que recusa arquivo | "Pronto, texto enviado para compartilhar." não diz que a imagem não foi | "Só o texto foi. Para mandar a imagem, toque em Baixar a imagem" (pedido em `src/comum/compartilhar.ts`) |
| B-27 | B5 | Disfarces que passam: letras de bandeira (🇵🇮🇽), 🅿🅸🆇, "bit ly barra x", "golpe com br", número com letra (`9l234`), número por extenso, "Taxa de liberação de R$ 49", "Chame no privado". Nada vira link clicável | Converter letras de bandeira e de círculo em letras comuns antes de conferir. Lista de frases de golpe **pede decisão** (manutenção contínua) |
| B-28 | B5 | Link recusado ao abrir ("tem conteúdo que o site não aceita") não diz o que fazer a quem criou de boa-fé | Acrescentar "Peça a quem enviou para conferir título, local e texto" |
| B-29 | B1, letra 200% | O título "Assembleia da categoria" quebra no meio da palavra ("Assemblei / a"). Não é falha WCAG: sem a quebra (`overflow-wrap: anywhere`), o título seria cortado | `hyphens: auto` (o `lang` já é `pt-BR`) no h1 da página do evento |
| B-30 | B1 | A folha diz "…e abrir google.com" para o mapa e "calendar.google.com" para a agenda, sem nomear o destino | "abrir o mapa (google.com)", "abrir o Google Agenda (calendar.google.com)" |
| B-31 | B3 | O QR do cartaz mede 36 a 40 mm: lê bem a uns 40 cm, não a 1 m | QR maior (há espaço ao lado do nome da organização). Conferir no aparelho (abaixo) |
| B-32 | Todos, letra grande | O aviso some sozinho em 5 s (`src/comum/aviso.ts`); com 2 ou 3 linhas de letra grande, quem lê devagar perde a mensagem. O leitor de tela não perde nada (`aria-live`) | Tempo maior para aviso longo, ou mantê-lo até o próximo toque (WCAG 2.2.1, AAA) |

**Pendência que a simulação reforçou (não contada como achado novo):** aviso, conquista e agradecimento não conferem PIX, telefone nem link, e a imagem leva "Feito com Projeto Comunidade". Já é decisão pendente (`proximos-passos.md`, item 4: rodapé nesses cards). A simulação acrescenta que o conteúdo também não é conferido (`.saidas/g3-aviso-*.json`, 1 rodada).

### SÓ NO APARELHO (o que olhar no celular)

| Item | O que olhar |
|---|---|
| B-11 | Link de evento aberto **dentro do WhatsApp** (Android e iPhone) e **dentro do Instagram**: "Baixar arquivo para a agenda" baixa? O aviso "baixado" aparece mesmo assim? |
| B-02 | Com a letra do sistema no máximo, abrir um link de evento: a faixa "Conteúdo criado por quem enviou…" aparece inteira, sem rolar? |
| Leitor de tela na página do evento | Com TalkBack e VoiceOver, ao abrir o link: a pessoa ouve o título **e** a faixa (`aria-describedby`)? O aviso do .ics, do QR e do compartilhar é lido? |
| B-05 e folha de saída | Com o celular deitado e a letra no máximo, tocar "Ver no mapa": a frase aparece? Com leitor de tela, o foco vai para "Ir para o site", fica nos dois botões e volta ao botão de origem ao fechar? |
| B-16 | Abrir `https://walterkaue.github.io/projeto-comunidade/evento/abc` e ver a página de erro de verdade |
| B-31 | Imprimir o cartaz numa impressora comum, colar na parede e ler o QR a 1 m e a 2 m com um celular simples |
| Denúncia | Tocar "Enviar pelo aplicativo de e-mail": assunto, acentos e link chegam inteiros? O teste deu 634 caracteres, abaixo do limite de ~2000 de alguns apps |
| Compartilhar | "Mandar no WhatsApp" a partir de "Fazer o card": imagem e texto chegam juntos? |
| Samsung Internet | Com o modo escuro do próprio navegador (que reescreve as cores), a faixa, as bordas e os botões continuam legíveis? |

## Neutralidade

Nada encontrado.
- Os textos da plataforma vistos por quem recebe (faixa, página do evento, link removido, mensagens de recusa) não têm linguagem de campanha, sigla, cor nem número de partido.
- A página e as recusas não dependem da organização. Sindicato, associação de moradores, coletivo cultural, grupo de mães e grupo da horta tiveram o mesmo tratamento, e a varredura do B5 deu o mesmo resultado em qualquer campo.
- As sugestões B-01 e B-07 valeriam igual para toda organização.

## O que a emulação não reproduz

- **Celular fraco de verdade:** CPU e rede foram limitadas pelo Chromium (CDP). Memória pouca, GPU fraca e aquecimento ficam de fora. Com a máquina dividida, o mesmo passo variou de 2 s a 90 s; só o tempo do evento foi medido de novo com a máquina livre.
- **Navegador dentro de app:** foi imitado pelo user agent, sem `navigator.share` e com o download de blob desligado. O que o WhatsApp e o Instagram fazem de verdade com download, `target=_blank` e o mapa só se vê no aparelho.
- **iPhone:** é o WebKit do Playwright, não o Safari. Não tem barra que encolhe, menu de compartilhar nem VoiceOver.
- **Samsung Internet:** só o user agent e o `prefers-color-scheme` escuro.
- **Letra a 200%:** imitada com `font-size: 200%` na raiz. A letra do sistema e o zoom do navegador podem se comportar de outro jeito, e a medição de rolagem lateral não vê o que o `body { overflow-x: clip }` esconde (pendência já anotada).
- **Teclado aberto:** só uma tela mais baixa (360 × 330). O teclado de verdade muda o `visualViewport` de outro jeito.
- **WhatsApp Web:** os links estragados foram montados à mão, imitando o copiar e colar; o WhatsApp não foi usado.
- **Portal de Wi-Fi:** simulado com resposta HTML 200 em HTTP local. Ficaram de fora o HTTPS de verdade, o redirecionamento 302 e a janela própria de login do Android e do iPhone.
- **Cartaz e QR:** PDF do `page.pdf` do Chromium, lido por decodificador (jsQR a 288 dpi), sem impressora nem câmera.
- **Menu de compartilhar, área de transferência e e-mail:** de mentira ou só lidos, nunca abertos.
- **Medidor de cada tela (`medirTela`):** o axe só conta erros graves e críticos. A busca por "coberto" não vê o aviso, que deixa o toque passar, e não conhece o rótulo clicável de caixas de marcar.
- **Leitor de tela:** não foi usado. O axe não substitui o TalkBack e o VoiceOver.

## Como rodar de novo

```
npm run build
npx playwright test --config e2e/simulacoes/b-quem-recebe/playwright.config.ts
```

- Os roteiros terminam em `.sim.ts` (não em `.spec.ts`), para o `npm run e2e` da raiz não os rodar.
- `00-links.sim.ts` gera os links pelo fluxo e grava `links.json`. Os roteiros `g1-` a `g4-` e `r-folha` leem esse arquivo.
- O G2 tem configuração própria, que sobe o seu servidor: `npx playwright test --config e2e/simulacoes/b-quem-recebe/g2-playwright.config.ts`.
- A varredura do B5 roda em Node: `npx vitest run --config e2e/simulacoes/b-quem-recebe/g3-vitest.config.ts`.
- A leitura do QR usa bibliotecas só de desenvolvimento da própria pasta: `npm install --prefix e2e/simulacoes/b-quem-recebe`.
- As fotos do relatório saem de `node e2e/simulacoes/b-quem-recebe/fotos-relatorio.mjs`.

## Revisão

O `revisor` e o `revisor-acessibilidade` leram os achados sem ter escrito os roteiros. Cada um rodou de novo o que julgou duvidoso (varredura do B5, página do evento com letra a 200%, links estragados, PDF do cartaz).

- **Desceram de TRAVA:**
  - Cartaz cortado (agora B-04) e telefone em linhas (B-06): para ATRAPALHA. A miniatura mostra o corte do cartaz, e o telefone em linhas é brecha de um tipo só.
  - Selo falso (B-07): para ATRAPALHA, porque a faixa verdadeira fica acima e o texto é puro.
  - O .ics no navegador dentro de app (B-11): para SÓ NO APARELHO, porque o "não baixou" era premissa da emulação.
- **Desceram de ATRAPALHA para MELHORIA:**
  - B-12: a organização fica à vista no campo e na miniatura.
  - B-13: o corte em 140 letras já é pendência.
  - B-14: só falha com o rótulo "Data:", e a mensagem já ajuda em "Av.das".
  - B-16: nenhum caminho real tira o `#`.
  - B-17: é raro.
  - B-18: a hora flutuante é certa para evento presencial.
  - B-19: é do lado de quem cria, e a mensagem diz "no total".
  - B-20: nada mostrou a pessoa errando; é decisão de texto.
  - B-15 (portal guardado): em HTTPS o cenário não acontece, então fica só como endurecimento.
- **Cortados:** links do rodapé "colados" (cada um tem 52 px e há 16 px entre eles na horizontal; cumpre o 2.5.8), o selo "EVENTO" no card de reunião (gosto) e o aviso do console do WebKit (inofensivo). O "aviso cobre botão" deixou de ser problema de foco: o toque passa por ele.
- **Tirados dos falsos positivos:** "Pague 1 leve 2" e "Pagamento em 3 vezes" (o 7.2 manda barrar) e "Comunidade" sozinho (pendência já anotada).
- **Novos, da acessibilidade:** a folha de saída sem rolagem (B-05, reproduzida 2× nesta revisão) e o aviso que some em 5 s (B-32). Também entraram o critério 3.3.3 em B-08 e B-10, e o leitor de tela na faixa (B-02) em "SÓ NO APARELHO".
- **Correções de fato:** o aviso "baixado" está em `src/ferramentas/evento/pagina.ts`, não em `src/comum/`. "Data: sáb/dom" só barra com o rótulo. As fotos ganharam o número do achado.
