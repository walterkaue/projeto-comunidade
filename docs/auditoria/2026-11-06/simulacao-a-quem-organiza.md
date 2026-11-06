# Simulação de uso: quem organiza (A1 a A7)

> 06/11/2026 · sessão de teste e relato, sem mudança no site. Build de produção servido em `localhost:4181`, Playwright 1.65 com Chromium, Firefox e WebKit. Roteiros em `e2e/simulacoes/a-quem-organiza/` (como rodar: `BRIEF.md` da mesma pasta). Personagens fictícios, sem nome real de pessoa, partido, igreja ou organização.
> Achados revisados pelo `revisor` e pelo `revisor-acessibilidade`, que não escreveram os roteiros (ver "Revisão").

## Para o Kauê

1. **O card parte a palavra do título no meio** no formato Status. O próprio exemplo da porta "Contar uma conquista" já sai "Conseguim / os o asfalto". Vai assim para o grupo (A-01).
2. **Campo que estoura não diz o limite:** a pauta da assembleia é barrada sem dizer quanto cortar (A-02). A organização longa é cortada em 60 letras sem aviso e sai "HabitacionalII" no card (A-03).
3. **Com letra grande, o painel "Isto ainda tem partes do exemplo" abre com o começo da frase fora da tela** (A-04).
4. **Quando a imagem não vai junto, a tela não deixa claro.** Diz "texto enviado" sem falar da imagem (A-05). Ou dá a instrução "baixe a imagem" num aviso que some em 5 s (A-06).
5. **No teclado, a bolinha da cor escolhida não mostra o foco**, porque o anel de "escolhida" esconde o anel de foco (A-07).

Neutralidade: Thiago (núcleo de partido de direita) e Rafaela (coletivo de partido de esquerda) receberam exatamente o mesmo, e o rodízio de exemplos não pende para nenhum tipo.

**20 achados:** 1 TRAVA, 6 ATRAPALHA, 11 MELHORIA, 2 SÓ NO APARELHO. Os revisores cortaram 6 (ver "Revisão").

## Personagem × aparelho

Tempo do início até o toque que manda de verdade em "Mandar no WhatsApp". A medição foi feita com 1 navegador por vez, sem axe nem fotos. A digitação é automática: alguns roteiros digitam letra por letra, outros colam o texto. Por isso os números comparam o site entre aparelhos, não pessoas entre si. A máquina também atendia outras sessões.

| Personagem | Aparelho | Terminou? | Tempo | Onde travou ou demorou |
|---|---|---|---|---|
| A1 Dona Cida, mutirão, letra 200% | AND-FRACO | Sim | 62,6 s | 8,1 s para abrir o início e mais 8,3 s para abrir a porta (3G lento e CPU 6×). Foi até o Pronto com o exemplo, viu o painel com o começo fora da tela (A-04), voltou por "Mudar algo" e trocou. A organização foi cortada (A-03). |
| A1 Dona Cida, mesmo caminho | WEBVIEW | Só o texto | 62 a 149 s (com axe) | Sem menu: copiou o texto. "Baixar a imagem" disse "Imagem baixada" sem baixar (A-19, só no aparelho). |
| A1 Dona Cida, fecha o menu | AND-FRACO | Sim, na 2ª tentativa | 125 a 188 s (com axe) | Nada travou: tocar de novo abriu o menu. |
| A2 Rogério, assembleia e ata | SAMSUNG | Sim | 6,3 s (ata pronta em 14,5 s) | Pauta de 9 itens barrada até encurtar (A-02). A pauta sai cortada no card (A-10). |
| A3 Pastora Lúcia, culto e bazar | IPHONE-SE | Sim | 12,0 s | A quebra de linha some no texto (A-09). Com o arquivo recusado, só o texto vai (A-05). |
| A4 Mãe Iara, festa | AND-PEQUENO | Sim | 39,3 s | O nome de quem mora passou no local sem aviso (A-17). |
| A4 Mãe Iara, agradecer | AND-PEQUENO | Sim | 19,3 s | "Pular este passo" funcionou. |
| A5 Thiago, palestra (evento) e reunião | IPHONE-GRANDE | Sim | 25,8 s e 45,7 s | Nada. O WebKit emulado é lento nesta máquina. |
| A5 Rafaela, plenária (reunião) e evento | AND-GRANDE | Sim | 7,2 s e 8,0 s | Nada. |
| A6 Marcos, cartaz com logo | PC-FIREFOX | Sim | 44,5 s | Testou 6 logos e 2 cores no meio do caminho. Logo recusado deixa a tela contraditória (A-11). |
| A6 Marcos, cartaz com logo | PC-GRANDE | Sim | 38,6 s | Prévia pequena para o espaço (A-14). |
| A7 Bia, conquista | TABLET | Sim | 18,4 s | O card partiu "Conseguimos" (A-01). |
| A7 Bia, conquista | AND-DEITADO | Sim | 15,1 s | O mesmo card partido. Com 360 × 330 (teclado aberto, aproximação), nenhum campo ficou embaixo da barra. |

- Do Pronto ao menu de compartilhar abrir: de 0,2 a 1,5 s em todos os aparelhos.
- No AND-FRACO, abrir o início e abrir a porta levou cerca de 8 s cada. Em `docs/proximos-passos.md` a conta para 3G lento é de 3 s cada, mas ela não tem a CPU 6× mais lenta. Vale conferir num Android fraco de verdade se aparece algo na tela enquanto o fluxo carrega.

## Achados

As fotos guardadas estão em `docs/auditoria/2026-11-06/fotos/`. Os caminhos `.fotos/…` e `.saidas/…` ficam em `e2e/simulacoes/a-quem-organiza/` (fora do git; voltam a ser gerados ao rodar os roteiros).

### A-01 · O card parte a palavra do título no meio · TRAVA

- **Quem e onde:** A7 Bia (TABLET e AND-DEITADO), porta "Contar uma conquista", formato Status. Aparece na prévia, no Pronto e no PNG que vai para o WhatsApp.
- **O que aconteceu:** "Conseguimos a quadra coberta!" saiu "Conseguimo / s a quadra / coberta!". Sem digitar nada, o título do exemplo da porta ("Conseguimos o asfalto da rua 4") também sai "Conseguim / os o asfalto / da rua 4". O card é desenhado em canvas de tamanho fixo, então acontece em qualquer aparelho.
- **Por quê (código):** em `src/ferramentas/cards/desenho.ts`, o desenho começa com a letra em 1,3 × o tamanho do formato (cerca de 161 px no título do Status) e só diminui quando o conteúdo não cabe na altura. A largura da palavra mais longa nunca é conferida. Palavra que não cabe na linha é partida (`partirPalavra`, `src/comum/texto.ts`). Em título curto, "Conseguimos" (1.025 px) e "Agradecemos" (1.036 px) passam da largura útil de 936 px. "Inauguração" (945 px) passa por pouco. Títulos longos, como o da Dona Cida, saem com letra menor e não partem.
- **Esperado:** quebrar só entre palavras.
- **Reproduziu:** 2 de 2 nos roteiros (tablet e deitado), mais 1 vez pelo `revisor` com o exemplo padrão.
- **Evidência:** `fotos/a-01-card-palavra-partida.png`, `fotos/a-01-exemplo-da-porta.png`.
- **Sugestão:** no laço que escolhe o tamanho, diminuir também até a palavra mais longa do título caber numa linha. Teste puro com "Conseguimos" e "Agradecemos" no Status.

### A-02 · A pauta é barrada sem dizer quanto passou · ATRAPALHA

- **Quem e onde:** A2 Rogério, SAMSUNG, porta reunião, passo 1.
- **O que aconteceu:** 9 itens de pauta, dois deles com 112 e 116 letras (extremos de propósito do roteiro). São 398 caracteres digitados e 440 contados (com "Pauta:" e a numeração). O Continuar não passou: "a pauta ficou longa para o link: use até 400 letras no total". O campo deixa escrever 120 letras por item e até 20 itens. A dica ("Um assunto por linha. Sem nome de pessoa.") não fala de limite, e o erro não diz quanto passou nem o que encurtar. Com uma pauta de 9 itens mais curta, passou.
- **Esperado:** saber o limite antes de estourar e quanto cortar.
- **Reproduziu:** 3 de 3.
- **Evidência:** `fotos/a-02-pauta-barrada.png` (360 × 740, 6 s depois do toque); `.saidas/pauta-completa.jsonl`.
- **Sugestão:** contador "sobram N letras" embaixo da pauta e, no erro, "passou N letras". Aumentar o limite do link: **pede decisão** (docs/produto.md 7.2 e 7.6, o que vai no link).

### A-03 · Nome longo é cortado em silêncio no campo · ATRAPALHA

- **Quem e onde:** A1 Dona Cida (AND-FRACO e WEBVIEW) e A3 Pastora Lúcia (IPHONE-SE), passo 1.
- **O que aconteceu:**
  - "Associacao dos Moradores e Amigos do Conjunto Habitacional Jardim Esperanca II" (78 letras) parou em 60, sem aviso, contador nem limite na dica. Ela apagou um pouco e digitou "II", e saiu "Conjunto HabitacionalII" no card, no texto e no link.
  - O limite do campo (`maxlength`) conta cada emoji como 2: 60 emojis digitados no título viraram 40. A validação conta certo; quem corta é o campo.
- **Esperado:** saber que há limite e quanto falta (WCAG 3.3.2, instrução).
- **Reproduziu:** 3 de 3 (organização) e 2 de 2 (emoji); o `revisor-acessibilidade` também reproduziu os dois.
- **Evidência:** `fotos/a-03-organizacao-cortada.png`; `.saidas/digitado-passo1.jsonl`.
- **Sugestão:** limite na dica ("até 60 letras") e contador de letras restantes no título, na organização e no local, cortando por letra e não por unidade de código. Para o leitor de tela, avisar uma vez perto do limite e uma ao chegar nele, não a cada tecla (como já faz `reuniao/index.ts`). O campo vem de `src/comum/formulario.ts`, que é compartilhado: vira pedido em `docs/pedidos-comum.md`.

### A-04 · Com letra a 200%, o painel do exemplo abre com o começo fora da tela · ATRAPALHA

- **Quem e onde:** A1 Dona Cida, AND-FRACO com letra 200%, Pronto, painel "Isto ainda tem partes do exemplo".
- **O que aconteceu:** o painel tem 822 px de altura numa tela de 640. O foco vai para "Mudar algo", e o topo do painel fica 226 px acima da tela. Ela vê "organização, texto e local." e os botões, mas não "Isto ainda tem partes do exemplo: título,". O leitor de tela lê a frase toda (`aria-describedby`). Quem perde é quem enxerga pouco e usa letra grande. Com letra normal, o painel cabe.
- **Reproduziu:** 3 de 3; o `revisor-acessibilidade` reproduziu.
- **Evidência:** `fotos/a-04-painel-200.png`; `.saidas/painel-exemplo.jsonl`.
- **Sugestão:** rolar até o topo do painel e pôr o foco sem rolar de volta (`focus({ preventScroll: true })`), ou pôr o foco no próprio painel (`tabindex="-1"`). Só rolar antes do `focus()` não basta, porque o foco rola de volta para o botão.

### A-05 · Quando o celular recusa a imagem, a tela diz "texto enviado" e não fala dela · ATRAPALHA

- **Quem e onde:** A3 Pastora Lúcia, IPHONE-SE com o menu recusando arquivo (`canShare` falso para arquivos, simulado; quantos aparelhos fazem isso de verdade não se sabe), Pronto.
- **O que aconteceu:** "Mandar no WhatsApp" mandou só o texto. O aviso foi "Pronto, texto enviado para compartilhar.", que é verdade, mas não diz que a imagem ficou de fora nem lembra de "Baixar a imagem".
- **Reproduziu:** 2 de 2 (a mesma simulação).
- **Evidência:** `fotos/a-05-sem-arquivo.png`; `.saidas/a3-lucia-menu-sem-arquivo--IPHONE-SE/a3sa-whatsapp.txt`.
- **Sugestão:** no Pronto sempre há imagem, então o resultado `texto` quer dizer que ela não foi. Basta o aviso do fluxo (`avisoDoCompartilhamento`, `src/ferramentas/fluxo/apoio.ts`) dizer: "A imagem não foi junto. Toque em Baixar a imagem e mande no WhatsApp." Nenhum arquivo compartilhado muda. Junto de A-06, a frase deve ficar na tela.

### A-06 · A instrução "baixe a imagem" some em 5 s · ATRAPALHA

- **Quem e onde:** A6 Marcos (PC-FIREFOX e PC-GRANDE) e A1 Dona Cida (WEBVIEW), sem menu de compartilhar, Pronto.
- **O que aconteceu:** "Mandar no WhatsApp" copia o texto e diz "Texto copiado. Baixe a imagem e mande junto no WhatsApp." A frase só existe no aviso flutuante, que some em 5 s. Quem estava olhando para o WhatsApp, ou quem lê devagar, perde a instrução e manda o texto sem a imagem. Outras mensagens do Pronto usam `dizer()` (`pronto.ts`) e ficam também em `#fluxo-estado`, na tela.
- **Reproduziu:** em todas as rodadas sem menu (Firefox, PC grande, WEBVIEW). Achado do `revisor-acessibilidade`, que o liga ao WCAG 2.2.1 por interpretação.
- **Sugestão:** usar `dizer()` para os resultados `copiado` e "imagem não foi" (A-05), para a frase ficar na tela.

### A-07 · No teclado, a bolinha da cor escolhida não mostra o foco · ATRAPALHA

- **Quem e onde:** passo 3, "Cor". Achado do `revisor-acessibilidade`, medido no Chromium no modo claro e no escuro. Vale para quem usa teclado no computador ou teclado Bluetooth no celular, como o Marcos.
- **O que aconteceu:** o foco entra no grupo de cores sempre pela bolinha escolhida, e as setas mudam a escolha junto com o foco. A regra do anel de foco (`fluxo.css`, `.fluxo-bola-item input:focus-visible + label`, cor `--foco`) perde para a regra da escolhida (`.fluxo-bola-item input:checked + label`, cor `--tinta`). As duas têm o mesmo peso, e a da escolhida vem depois. O anel azul de foco nunca aparece nas bolinhas. Os botões de formato não têm esse defeito.
- **Esperado:** o foco visível (WCAG 2.4.7).
- **Evidência:** `fotos/a-07-foco-bolinha.png` (Grafite escolhida e com foco: só o anel de tinta).
- **Sugestão:** regra `:checked:focus-visible + label` com anel de `--foco` por fora do anel de tinta.

### A-08 · O aviso flutuante cobre o que está logo acima da barra · MELHORIA

- **Quem e onde:** A2 Rogério (SAMSUNG, 360 × 740, erro da pauta), A6 Marcos (passo 3, Firefox) e A1 Dona Cida (letra 200%).
- **O que aconteceu:** depois do erro da A-02, o foco vai para a pauta. Por 5 s, o aviso "Confira 1 campo." fica por cima da primeira linha do erro ("a pauta ficou longa para o link:"). Só aparece "use até 400 letras no total." Depois de 5 s, o erro aparece inteiro, e a barra não o cobre. Nos outros casos medidos, o aviso cobriu um campo em parte (o "Mais opções", em 46 de 52 px), nunca o foco inteiro.
- **Reproduziu:** 3 de 3, e pelos dois revisores. A primeira versão deste achado culpava a barra; a medida mostrou que é o aviso.
- **Evidência:** `fotos/a-08-aviso-sobre-o-erro.png` (300 ms depois do toque); `fotos/a-02-pauta-barrada.png` (6 s depois).
- **Sugestão:** quando há erro, o aviso diz o motivo ("Confira a pauta: passou do limite") ou fica só para o leitor de tela, já que o erro está escrito embaixo do campo.

### A-09 · A quebra de linha do texto some no WhatsApp · MELHORIA

- **Quem e onde:** A3 Pastora Lúcia, IPHONE-SE, texto mandado.
- **O que aconteceu:** "Venha com sua família 🙏" + quebra de linha + "Teremos roupas, livros e bolo 🎉😊" chegou numa linha só. No card a quebra fica. Os emojis chegaram certos.
- **Por quê (código):** `semMarcas` (`src/ferramentas/fluxo/estado.ts`) troca todo espaço em branco, inclusive a quebra de linha, por um espaço.
- **Reproduziu:** 3 de 3.
- **Evidência:** `.saidas/a3-lucia-caminho-inteiro-com-emoji--IPHONE-SE/a3-whatsapp.txt`.
- **Sugestão:** no texto livre, juntar só espaços e tabulações e manter a quebra de linha (no máximo uma linha em branco seguida).

### A-10 · A pauta sai cortada em 140 letras, no meio da palavra, no card e no cartaz · MELHORIA

- **Quem e onde:** A2 Rogério, SAMSUNG, card de Grupo e cartaz A4.
- **O que aconteceu:** a pauta de 9 itens termina em "Visitas aos locais; Ass…". O corte vem de `textoDaPautaNoCard` (`estado.ts`), que corta em 140 letras mesmo com espaço sobrando no card. O cartaz do mural perde 2 itens sem dizer quantos. O texto do WhatsApp e o link levam a pauta toda, e o Pronto diz que o QR abre a pauta inteira.
- **Reproduziu:** 3 de 3.
- **Evidência:** `fotos/a-10-cartaz-pauta-cortada.png`.
- **Sugestão:** cortar num item inteiro e acrescentar "e mais N assuntos". A mudança é em `estado.ts`, da própria pasta do fluxo.

### A-11 · Logo recusado: o campo diz "nenhum arquivo" e o texto diz "Logo escolhido" · MELHORIA

- **Quem e onde:** A6 Marcos, PC-FIREFOX e PC-GRANDE, passo 3, "Mais opções".
- **O que aconteceu:** depois de um SVG aceito, ele escolheu um .txt com nome de .png. Apareceu "Erro: Não deu para ler essa imagem.", e o código limpa o campo, que passa a mostrar "nenhum arquivo". Embaixo continuam "Logo escolhido: a6-logo-sem-tamanho.svg" e "Tirar o logo", e a prévia mantém o logo anterior. A tela se contradiz, embora o estado esteja certo. O erro também não diz o que fazer.
- **Reproduziu:** 3 de 3.
- **Evidência:** `fotos/a-11-logo-recusado.png`.
- **Sugestão:** "Esse arquivo não deu. O logo de antes continua no card. Escolha uma foto ou um desenho (PNG, JPG ou SVG)."
- **O resto do logo foi bem:** PNG de 4,8 MB aceito em menos de 1,5 s; JPG de foto deitada (EXIF 6) sai em pé; SVG com e sem tamanho funciona; PDF recusado com frase clara.

### A-12 · A dica do botão manda escolher "a conversa", mesmo com Status · MELHORIA

- **Quem e onde:** A1 Dona Cida, Pronto, formato Status.
- **O que aconteceu:** embaixo de "Mandar no WhatsApp" está "Abre o menu do celular. Escolha o WhatsApp e a conversa." Quem escolheu Status precisa achar o status, não uma conversa.
- **Sugestão:** frase por formato, escrita depois de ver o menu real no Android e no iPhone (o nome do destino de status não foi conferido).

### A-13 · A ata com 9 pontos fica muito comprida · MELHORIA

- **Quem e onde:** A2 Rogério, SAMSUNG, ata vinda da reunião.
- **O que aconteceu:** a página tem 7.258 px de altura ao abrir, 8.718 preenchida e 10.738 com a ata pronta embaixo, numa tela de 740 px: de 10 a 15 telas de rolagem. Cada ponto tem três campos grandes e três botões. Mesmo assim o resultado saiu certo: 15 presentes, 3 decisões e 4 encaminhamentos no PDF, com o rodapé nas 2 páginas.
- **Sugestão:** deixar "O que se discutiu" fechado até tocar, ou abrir só o ponto que está sendo escrito.

### A-14 · No computador, a prévia fica pequena para o espaço · MELHORIA

- **Quem e onde:** A6 Marcos, PC-FIREFOX (1366) e PC-GRANDE (1920), passo 3 e Pronto.
- **O que aconteceu:** a coluna tem 640 px no meio de 1.920. No passo 3 a prévia ocupa só uma parte da coluna, com espaço vazio ao lado, e para julgar logo e cor é preciso abrir "Ver a prévia maior". Em 1920 × 1080, "Baixar a imagem" e as outras saídas ficam abaixo da dobra.
- **Evidência:** `fotos/a-14-pc-1920.png`.
- **Sugestão:** acima de cerca de 1.000 px, prévia grande ao lado do formulário.

### A-15 · O aviso da cor livre fala de "faixa" e "detalhes" · MELHORIA

- **Quem e onde:** A6 Marcos, cor livre amarelo-claro (#fff59d).
- **O que aconteceu:** "A faixa mantém a sua cor; nos detalhes, escurecemos um pouco para o texto ficar legível." Quem não sabe o que é contraste não sabe o que é faixa nem detalhe. O contraste em si funciona: o `revisor-acessibilidade` passou 5.832 cores pela conta de `cor.ts`, e o pior caso tem 4,50:1.
- **Sugestão:** "A sua cor fica no topo do card. As letras pequenas ficam um pouco mais escuras, para dar para ler."

### A-16 · O aviso flutuante guarda o texto antigo depois de sumir · MELHORIA

- **Quem e onde:** todas as telas com aviso. Achado do `revisor-acessibilidade` (`src/comum/aviso.ts`).
- **O que aconteceu:** quando o aviso some, só a classe sai, e o texto fica. Quem lê a página com leitor de tela em modo de leitura encontra no fim, por exemplo, "Imagem baixada. Procure em Downloads…", mesmo depois de "Fazer outro".
- **Sugestão:** limpar o texto depois que o aviso some. É arquivo compartilhado: vira pedido em `docs/pedidos-comum.md`.

### A-17 · No evento, nada pede para não pôr o nome de quem mora na casa · MELHORIA · pede decisão

- **Quem e onde:** A4 Mãe Iara, AND-PEQUENO, porta evento, passo 2 (local).
- **O que aconteceu:** ela escreveu "Casa da Mãe Iara, Rua das Palmeiras, 120, fundos, Vila Nova", e isso foi para o card, o texto e o link, sem aviso. A dica do local no evento é "Escreva o endereço como se fosse procurar no mapa." A dica "não ponha o nome de quem mora" existe só na reunião, como decidido em docs/produto.md 7.6. A frase "O link leva título, dia, hora, local e o texto." aparece no Pronto.
- **Reproduziu:** 3 de 3.
- **Evidência:** `fotos/a-17-local-com-nome.png`.
- **Sugestão:** usar no evento a mesma dica do local da reunião. **Pede decisão** (docs/produto.md 7.6, hoje a dica é só da reunião).

### A-18 · Os exemplos religiosos são de uma tradição só · MELHORIA · pede decisão

- **Quem e onde:** A4 Mãe Iara e A5, rodízio dos exemplos (`src/ferramentas/cards/exemplos.ts`).
- **O que aconteceu:** o único grupo religioso do rodízio é um "Grupo de Oração", com "Salão paroquial" como local. A porta evento lista "Mutirão, festa, culto, ato, curso". Uma casa de candomblé não se vê em nenhum exemplo. Nenhum exemplo tem lado partidário.
- **Sugestão:** trocar "Salão paroquial" por "Salão comunitário" e "culto" por "celebração", ou alternar o grupo religioso entre tradições. **Pede decisão** (docs/produto.md seção 4, exemplos, e 7.6, texto da porta).

### A-19 · "Imagem baixada" é dito sem saber se baixou · SÓ NO APARELHO

- **Quem e onde:** A1 Dona Cida, WEBVIEW, Pronto. A simulação é o user agent de navegador de dentro do Instagram e do WhatsApp, com o compartilhar e o download desligados à força.
- **O que aconteceu:** sem menu, o texto foi copiado. Em "Baixar a imagem", o download não aconteceu (porque a simulação o barrou), e a tela disse "Imagem baixada. Procure em Downloads ou na galeria." `baixar` (`pronto.ts`) avisa isso logo depois do clique, em qualquer navegador, sem como saber se deu certo.
- **Evidência:** `fotos/a-19-webview-imagem-baixada.png`.
- **Conferir no aparelho:** abrir o link do site dentro do Instagram e do WhatsApp, no Android e no iPhone. Ver se o menu de compartilhar existe e se a imagem baixa de fato. Se não baixar, vira ATRAPALHA ou TRAVA, e a sugestão é dizer "Se a imagem não aparecer em Downloads, abra este site no Chrome ou no Safari".

### A-20 · O cartaz A4 vai até a borda da folha · SÓ NO APARELHO

- **Quem e onde:** A6 Marcos (PC-GRANDE) e A2 Rogério, PDF do cartaz.
- **O que aconteceu:** a página do cartaz não tem margem (`@page { margin: 0 }`, de propósito, em `pronto.ts`). No PDF do Chromium, a caixa branca do QR e o "Feito com…" ficam a cerca de 1 mm da borda de baixo. Impressora comum não imprime os últimos 4 a 5 mm.
- **Evidência:** `fotos/a-20-cartaz-borda.png`.
- **Conferir no aparelho:** imprimir o cartaz numa impressora comum e ver se o QR sai inteiro e se o celular o lê. Se cortar: margem de 8 mm.

## O que funcionou

- **Neutralidade lado a lado (A5):** Thiago (núcleo de partido de direita, iPhone) e Rafaela (coletivo de partido de esquerda, Android) seguiram o mesmo roteiro e receberam o mesmo conteúdo, byte a byte: início, três passos, Pronto, ícones, 6 paletas e botões. Só muda o que cada um digitou. Os cards PNG são iguais, a não ser pelo nome da organização. A cor padrão (Papel) e o formato padrão (Grupo) são os mesmos para todos. Nenhuma paleta lembra partido.
- **Rodízio (A5, 30 aberturas por porta em aba nova, 150 ao todo):**

  | Porta | Moradores | Sindicato | Oração | Núcleo de bairro | Coletivo cultural | Instituto/ONG | Conselho escolar |
  |---|---|---|---|---|---|---|---|
  | Reunião | 4 | 4 | 3 | 3 | 3 | 8 | 5 |
  | Evento | 3 | 2 | 4 | 6 | 9 | 3 | 3 |
  | Aviso | 7 | 2 | 4 | 4 | 3 | 6 | 4 |
  | Conquista | 5 | 4 | 3 | 6 | 5 | 6 | 1 |
  | Agradecer | 3 | 2 | 7 | 9 | 4 | 2 | 3 |
  | **Total** | 22 | 14 | 21 | 28 | 24 | 25 | 16 |

  O primeiro exemplo da aba é sorteado (`memoria.ts`); depois segue uma fila fixa. A diferença entre os tipos é a do sorteio (qui-quadrado ≈ 6,9 com 6 graus de liberdade, p ≈ 0,33). Todos os tipos aparecem em todas as portas. Na mesma aba, voltar ao início e tocar de novo mostra o mesmo exemplo, e "Fazer outro" anda a fila. Partido não aparece entre os tipos, nem de forma genérica, para ninguém. É a regra da seção 4 ("nenhum exemplo remete a partido"), então não é achado.
- **Sem rolagem lateral, sem alvo de toque menor que 48 px e sem alvo colado** nas 483 telas inspecionadas (320 px, 360 px com letra 200%, deitado, tablet e PC). Os três botões do passo 3 cabem lado a lado em 320 px e empilham com letra 200%. Limites da medição em "O que a emulação não mostra".
- **Axe:** nenhuma violação grave ou crítica. A única que apareceu (contraste do aviso flutuante no Samsung escuro, 1 em 33 telas) foi medida no meio da animação de entrada de 0,2 s. Parado, o aviso tem contraste acima de 14:1 (conferido pelo `revisor-acessibilidade`).
- **Console:** nenhum erro de JavaScript. Só o aviso do Safari sobre `interactive-widget` na meta viewport, que ele ignora.
- **Modo escuro (Samsung):** campos, prévia e textos legíveis. O card PNG sai claro, igual ao do modo claro.
- **Ata (A2):** a pauta veio da reunião, o PDF saiu certo com o rodapé nas 2 páginas, e o texto copiado tem 1.169 caracteres. Recarregar a página pede confirmação. Fechar a aba e abrir de novo traz a ata vazia, como manda a regra, e o aviso "O rascunho some ao fechar" está no topo.
- **Página do evento e .ics (A2):** título, data, local, pauta numerada e acentos certos. O .ics tem a pauta na descrição e termina 1 h depois do início, porque não há campo de fim.
- **Navegação:**
  - Voltar do navegador nos passos e no Pronto volta um passo sem perder nada, e avançar retorna. Conferido no Android, no Samsung, no PC e no iPhone grande (4 testes de Voltar do Thiago).
  - "Mudar algo" mantém tudo, inclusive logo, cor livre e formato.
  - "Fazer outro" apaga tudo e traz o próximo exemplo. A dica embaixo do botão avisa que apaga.
- **Sem menu de compartilhar (PC):** "Mandar no WhatsApp" copia o texto com o link. "Baixar a imagem" funciona. "Pular este passo" funciona no aviso e no agradecimento.
- **Emoji e caixa alta (A3):** o card mostra "🙏🎉" e o título em caixa alta sem quadrado nem desalinho. O texto leva os emojis certos.
- **Aparelho fraco:** no AND-FRACO o card sai com 648 × 1152 em vez de 1080 × 1920. É de propósito (`src/comum/nivel.ts`, nível "leve") e continua legível.

## O que a emulação não mostra

- **Teclado de verdade:** o 360 × 330 do AND-DEITADO só imita a altura. Já está nas pendências.
- **Menu de compartilhar de verdade:** o compartilhar é de mentira. Falta ver no Android e no iPhone se imagem e texto vão juntos, qual nome o destino de status tem no menu (A-12) e como o WhatsApp mostra o link do evento. O link tem de 250 a 355 caracteres no evento e de 515 a 704 numa reunião de 9 itens. O texto inteiro chega a 1.214. Os dados depois do `#` são regra do produto (7.2). Só vale rever se as organizações estranharem.
- **Navegador de dentro do Instagram e do WhatsApp:** só o user agent, mais o compartilhar e o download desligados à força. O real decide a A-19.
- **Samsung Internet:** é o Chromium com o user agent do Samsung. O modo escuro forçado do Samsung pode repintar o site e a prévia. Conferir se card e cartaz continuam legíveis.
- **iPhone:** o WebKit do Playwright no Windows não é o Safari do iOS. Falta ver o VoiceOver, o gesto de voltar deslizando e a impressão. Com a máquina carregada, o axe às vezes travou no WebKit: a A5 no iPhone ficou sem axe e sem parte do rodízio (o código do rodízio é o mesmo do Android).
- **CPU e rede lentas:** CPU 6× e 3G de 400 kbit/s pelo CDP aproximam um aparelho fraco, mas não a memória curta nem a troca de app. O campo de hora aparece como "07:00 PM" no Chromium emulado; no Android em português deve ser 24 h.
- **Impressão:** o PDF sai do `page.pdf` do Chromium, não do diálogo de impressão. O Firefox não gerou PDF. A borda do cartaz (A-20) só se confirma no papel.
- **Limites da medição automática** (`sim.ts`, apontados pelo `revisor-acessibilidade`):
  - O axe roda num instante só e sem as regras de boa prática (ordem de títulos, marcos), então "nenhuma violação" não prova esses pontos.
  - Foco visível, ordem do foco e teclado não são medidos. Por isso a A-07 só apareceu na revisão.
  - O `body` tem `overflow-x: clip`, então "sem rolagem lateral" não pega conteúdo cortado pelo clip. Já está nas pendências, a 200% do navegador.
  - Conteúdo dentro de "Mais opções" fechado não entra na medida de alvos.
  - A conferência "atrás da barra" conta qualquer encosto de caixa e exagerou a A-08 na primeira versão.
  - As fotos de página inteira põem a barra e o aviso fora do lugar real. As fotos guardadas são da tela visível, a não ser onde está dito.
- **Tempos:** a máquina atendia outras sessões ao mesmo tempo, e a digitação é automática. Os números comparam aparelhos, não pessoas.

## Revisão

O `revisor` e o `revisor-acessibilidade` leram os 25 achados do rascunho sem ter escrito os roteiros. Os dois reproduziram os principais em scripts próprios.

- **Cortados (6):**
  - "Fechar o menu de compartilhar não diz nada": é decisão registrada no código, sem dano.
  - "O painel não mostra o valor do exemplo": gosto.
  - "Voltar depois de Fazer outro não desfaz": coerente com a regra, e a dica já avisa.
  - "A dica do exemplo fica depois de trocar": verdadeira e inofensiva.
  - "Não há exemplo de partido": a seção 4 manda que nenhum exemplo remeta a partido. Ficou como nota em "O que funcionou".
  - "Link de 250 a 700 caracteres": é regra do produto. Ficou como nota em "O que a emulação não mostra".
- **Gravidade mudada:**
  - "Imagem baixada" no navegador de app: de ATRAPALHA para SÓ NO APARELHO (A-19), porque a falha do download era da simulação.
  - Erro da pauta coberto: de ATRAPALHA para MELHORIA (A-08), porque quem cobre é o aviso flutuante, por 5 s, e não a barra.
  - Local sem a dica no evento: de ATRAPALHA para MELHORIA com "pede decisão" (A-17), porque hoje a dica é só da reunião por decisão.
  - Quebra de linha (A-09) e pauta cortada no card (A-10): de ATRAPALHA para MELHORIA, porque o texto chega inteiro.
- **Corrigido:**
  - A causa da A-01: a letra começa maior, e o desenho não confere a largura da palavra. Também entrou o exemplo padrão que já sai partido.
  - Os números da A-02: 398 caracteres digitados e 440 contados, em vez de 344 "letras" sem espaço.
  - A sugestão da A-04: focar sem rolar de volta.
  - A A-05 não precisa de pedido em código compartilhado.
  - As alturas da A-13.
  - A medida da prévia na A-14.
  - As evidências tiradas de foto de página inteira.
- **Achados novos da revisão:** A-06 (a instrução some em 5 s), A-07 (foco invisível na bolinha escolhida) e A-16 (o aviso guarda o texto antigo).
- **Mantido:** os personagens A5 são descritos como no pedido ("núcleo de partido de direita", "coletivo de partido de esquerda"), por tipo, sem nome, sigla, cor ou número de partido. O `revisor` sugeriu tirar os rótulos, mas sem eles a comparação perde o sentido. O relatório é documento interno, não texto da plataforma.
