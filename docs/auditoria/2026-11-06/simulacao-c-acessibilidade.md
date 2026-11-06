# Simulação C — acessibilidade (06/11/2026)

> Sessão de teste e relato: nada do site foi mudado. Seis personagens fictícios usaram o build de produção, servido localmente (`vite preview`, porta 4183 e as derivadas 41831 a 41834, só desta sessão). Nenhum pedido saiu do localhost.
>
> - **Roteiros:** `e2e/simulacoes/c-acessibilidade/` (`c1.sim.ts` a `c6.sim.ts`, mais o `repro.sim.ts`, a reprodução feita pela conversa principal).
> - **Fotos deste relatório:** `docs/auditoria/2026-11-06/fotos/c-NN-*.png`, com o número do achado.
> - **Fora do git:** árvores, textos coletados, tempos e as demais fotos ficam em `.saida/` e `.fotos/`, dentro da pasta da simulação.
>
> O axe já roda em cada tela nos testes de ponta a ponta. Aqui o foco foi o que ele não pega: ordem de leitura, sentido, esforço e condições do aparelho. Os achados passaram pelo `revisor` e pelo `revisor-acessibilidade`, que não escreveram os roteiros.

## Para o Kauê

1. Se a internet cai antes do Pronto na primeira visita, o convite sai sem o link, e o site manda conferir o texto (C-01).
2. "Apagar tudo" e "Fazer outro" apagam o que a pessoa escreveu, sem perguntar e sem desfazer (C-02, C-03).
3. O título para de aceitar letras em 80, sem avisar, e o card sai com palavra cortada (C-04).
4. Os avisos somem em 5 segundos, e quem lê devagar perde a instrução; com letra grande, o aviso tapa o campo (C-05, C-06).
5. Dia e hora do exemplo vão para o grupo sem aviso: é preciso decidir se o site avisa (C-07).

Leitor de tela e teclado chegam ao fim de tudo, sem travar. Falta conferir no celular de verdade, sobretudo A-1 (TalkBack) e A-4 (modo avião na primeira visita).

**Contagem:** 0 TRAVA · 7 ATRAPALHA · 15 MELHORIA · 8 SÓ NO APARELHO. Nenhum achado reprova com clareza um critério AA do WCAG 2.2. Os mais perto disso:
- **C-04:** provável falha de 3.3.2, nível A.
- **C-05:** risco de falha de 2.2.1, nível A.
- **C-06:** passa raspando em 2.4.11, nível AA.

## Personagem × aparelho

| Personagem | Aparelho | Terminou? | Tempo | Onde travou ou hesitou |
|---|---|---|---|---|
| C1 Sérgio, 48, cego (conselho de saúde) | AND-GRANDE, 4G, só foco (Tab, Enter, Espaço, setas) | Sim: reunião inteira e mandar; depois a ata (presentes, decisão, encaminhamento, copiar, imprimir) | Reunião: 17 a 27 s (98 teclas). Com a ata: 34 a 38 s (161 teclas) | Não travou. Ouve a miniatura antes do título (C-17) e um "Confira 1 campo." velho no fim da página (C-16) |
| C2 Dona Neide, 74, baixa visão e mão trêmula (pastoral) | AND-FRACO com letra a 200%; e zoom de 400% (320 × 200 com DPR 4, aproximação) | Sim, "Dar um aviso" até mandar, nos dois tamanhos | Até o Pronto, cerca de 20 s (início 8 s, abrir a porta 6 a 7 s, cada passo 0,2 a 2 s) | "Apagar tudo" e "Fazer outro" apagam sem perguntar (C-02, C-03). O aviso tapa o Título (C-06). O campo mostra só "Associação de Mor" (C-08) |
| C3 Paulo, 39, daltônico (coletivo de hip-hop) | AND-GRANDE, filtros de deuteranopia, protanopia e tritanopia (matriz de Machado 2009, aproximação) | Sim; baixou os 6 cards | — | Bolinhas claras parecidas entre si, sem o nome na tela (C-19) |
| C4 Jéssica, 31, lê devagar (cooperativa de catadores) | AND-FRACO (CPU 6x, 3G lento) | Sim, o caminho inteiro (78 telas coletadas) | "Dar um aviso": 14 a 18 s do aparelho, mais a leitura de 283 palavras. A 3 palavras por segundo, cerca de 1,8 min no total; a 2, cerca de 2,6 min | Avisos que somem (C-05), corte em 80 letras (C-04), palavras difíceis (C-14) |
| C5 Renan, 22, só teclado (associação de pessoas com deficiência) | PC-GRANDE sem mouse; de novo com `forcedColors: 'active'` | Sim: evento e aviso até mandar, "Ver maior", "Mais opções" e a página do evento | Evento: 8 s (51 teclas). Aviso: 10 s (44 teclas) | No alto contraste, o botão principal fica igual aos outros (C-20) |
| C6 Edu, 26, time de várzea | AND-FRACO, modo escuro, reduzir movimento, economia de dados; a rede cai no passo 2 | Sim, nas 8 execuções | Início: 7,6 a 8,6 s. Passo 1: 2 a 8 s. Passos 2 e 3: até 5 s. Link: 0,6 a 2,9 s | Sem service worker, o Pronto não cria o link e manda sem ele (C-01) |

Os tempos foram medidos com a máquina rodando várias sessões ao mesmo tempo. Valem como ordem de grandeza.

## Achados

Cada ATRAPALHA se reproduziu pelo menos duas vezes: duas rodadas do roteiro do personagem e duas do `repro.sim.ts`, no ritmo de uma pessoa (pausas de 1 a 3 s entre as ações). A reprodução está em dois arquivos de `.saida/`:
- `repro-rodada1.md`: R-apagar, R-outro, R-aviso-velho, R-corte, R-dia e R-sem-menu;
- `repro.md`: R-rede, R-passado e R-denuncia.

### ATRAPALHA

#### C-01 · A rede cai antes do Pronto e o convite vai sem link, com a mensagem errada

**Personagem e aparelho:** C6 Edu, AND-FRACO. Reproduzido também no `repro.sim.ts` (AND-FRACO, sem limite de rede).

**Tela:** Pronto de "Divulgar um evento", depois de a rede cair no passo 2, sem service worker instalado.

**O que aconteceu:**
- Os pedaços do link (partes do evento, formato e lista de bloqueio, cerca de 4,5 KB gzip) só são baixados no Pronto.
- Sem rede, o Pronto mostra: "Não deu para criar o link do evento. Confira o texto em Mudar algo."
- O painel antes de mandar fala só do exemplo ("Isto ainda tem partes do exemplo: texto e local."), nunca do link.
- "Mandar no WhatsApp" manda a imagem e o texto **sem link** e avisa: "Pronto, imagem enviada para compartilhar."
- Com a rede de volta, o Pronto não tenta de novo (`pronto.ts` calcula o link uma vez só). O único caminho é Mudar algo → Continuar → Continuar → Ficou bom.

**Esperado:**
- Dizer que faltou internet e o que fazer: "Sem internet: o link do evento não foi criado. Toque em Tentar de novo quando a rede voltar."
- Avisar, antes de mandar, que a mensagem vai sem o link.
- Tentar de novo quando a rede voltar.

**Quando acontece:**
- Com o service worker já instalado, tudo funcionou sem rede: o link saiu igual, com 497 caracteres no texto e 285 no link.
- O risco é a primeira visita em 3G, antes de o service worker terminar de guardar o app, e os navegadores dentro de app que não guardam o service worker.
- Não é a pendência "primeira visita já sem rede": aqui a visita começou com rede.

**WCAG:** 3.3.1 Identificação do erro (A) e 3.3.3 Sugestão de correção (AA). O erro é descrito em texto, mas a sugestão ("confira o texto") está errada para um erro de rede. Não chega a reprovar com clareza. É também uma falha que atinge todo mundo, não só quem tem deficiência.

**Gravidade:** ATRAPALHA. A pessoa termina e vê a frase de erro antes de mandar, e há caminho de volta. Mas o grupo recebe o convite sem o link, e ela é mandada mexer no texto à toa.

**Evidência:**
- `fotos/c-01-rede-caiu-sem-link.png`;
- `.saida/c6-semsw-r1.md`, `c6-semsw-r2.md` e `c6-texto-sem-rede.txt`;
- `.saida/repro.md` (R-rede, 2 rodadas).

**Sugestão:**
- Baixar os pedaços do link já no passo 2, quando ainda há rede.
- Separar a mensagem "sem internet" da mensagem "texto recusado", com um botão "Tentar de novo".
- Ouvir o evento `online` para refazer o link quando a rede voltar.

#### C-02 · "Apagar tudo" apaga o que a pessoa escreveu, sem perguntar e sem desfazer

**Personagem e aparelho:** C2 Dona Neide, AND-FRACO com letra a 200%. Reproduzido no `repro.sim.ts`.

**Tela:** passo 1, em qualquer porta.

**O que aconteceu:**
- Depois que a pessoa escreve, o link "Apagar o exemplo" vira "Apagar tudo".
- Um toque limpa título, organização e texto, sem confirmação e sem "Desfazer". O Ctrl+Z no campo vazio também não recupera.

**Esperado:** quem só queria apagar o exemplo não perde o que já escreveu.

**WCAG:** 3.3.4 Prevenção de erros (AA) não se aplica. Ele cobre dado jurídico, financeiro ou apagar dado guardado pela pessoa num sistema, e aqui o texto está só na memória da aba. Fica como melhoria ligada ao 3.3.6 (AAA).

**Gravidade:** ATRAPALHA. Quem tem tremor ou baixa visão toca sem querer e perde o que escreveu.

**Evidência:**
- `fotos/c-02-apagar-tudo.png`;
- `.saida/repro-rodada1.md` (R-apagar, 2 rodadas: "botão de desfazer: 0");
- `.saida/c2.md`.

**Sugestão:** depois de apagar, o próprio link vira "Desfazer" por 10 s. O texto apagado fica só na memória da aba, como o resto do fluxo. **Pede decisão** se o Kauê entender que isso é guardar dado.

#### C-03 · "Fazer outro" apaga tudo na hora, ao lado de "Mudar algo"

**Personagem e aparelho:** C2 Dona Neide, AND-FRACO com letra a 200%. Reproduzido no `repro.sim.ts`, a 100%.

**Tela:** Pronto.

**O que aconteceu:**
- "Mudar algo" e "Fazer outro" têm o mesmo tamanho e o mesmo estilo: lado a lado a 100% (158 × 55 px cada) e um embaixo do outro a 200%.
- "Fazer outro" volta ao início e esquece tudo, sem perguntar.
- Ao abrir a porta de novo, vem outro exemplo. O voltar do navegador não traz o texto de volta.
- A dica "Terminou? Toque em Fazer outro para apagar…" está ligada ao botão (o leitor de tela a lê), mas na tela fica embaixo dele: quem enxerga lê depois de tocar.

**Esperado:** quem queria corrigir um detalhe não perde o card pronto.

**WCAG:** 3.3.4 (AA) não se aplica, pelo mesmo motivo de C-02. Fica como melhoria ligada ao 3.3.6 (AAA).

**Gravidade:** ATRAPALHA. Os dois botões parecem iguais e só um apaga.

**Evidência:**
- `fotos/c-03-fazer-outro.png`;
- `.saida/repro-rodada1.md` (R-outro, 2 rodadas).

**Sugestão:** dar a "Fazer outro" um estilo diferente de "Mudar algo" (por exemplo, link) e pôr a dica acima dos botões. Os dois botões vêm do desenho aprovado em 7.6, e apagar é o objetivo do "Fazer outro" (privacidade). Por isso, um "Desfazer" depois dele **pede decisão**.

#### C-04 · Título, organização e texto cortados em silêncio

**Personagem e aparelho:** C4 Jéssica, AND-FRACO. Reproduzido no `repro.sim.ts`.

**Tela:** passo 1.

**O que aconteceu:**
- Os campos têm `maxlength`: título 80 letras, organização 60 e texto 140.
- Quem digita, cola ou dita mais vê o texto parar de entrar, sem contador e sem dica.
- O leitor de tela não diz nada: o navegador descarta as letras em silêncio.
- Um título de 122 letras virou "…de todas as ruas do bair", e o card sai assim.
- A dica do campo é só "Ex.: Mudança de horário".

**Esperado:** saber o limite antes de escrever, e quanto falta.

**WCAG:** provável falha de 3.3.2 Rótulos ou instruções (A), com confiança média. O limite é uma regra do campo que não está escrita em lugar nenhum (`src/comum/formulario.ts`).

**Gravidade:** ATRAPALHA. O card sai com palavra cortada.

**Evidência:**
- `fotos/c-04-titulo-cortado.png`;
- `.saida/repro-rodada1.md` (R-corte, 2 rodadas).

**Sugestão:**
- Dica "Até 80 letras".
- Um contador que aparece perto do fim ("faltam 12"), anunciado com calma (`aria-live="polite"`, de 10 em 10).
- O campo é de `src/comum/`, então a mudança vira pedido em `docs/pedidos-comum.md`.

#### C-05 · Os avisos somem em 5 s

**Personagem e aparelho:** C4 Jéssica e C2 Dona Neide, AND-FRACO.

**Tela:** o fluxo inteiro (o aviso na base da tela, `#aviso-vivo`).

**O que aconteceu:**
- Todo aviso fica 5 s na tela (`TEMPO_DO_AVISO_MS`; medido entre 4,8 e 5,4 s) e não há como pará-lo nem trazê-lo de volta.
- Quem lê devagar, a 1,5 ou 2 palavras por segundo, não termina estes avisos:
  - "Não deu para copiar sozinho. Use Mandar no WhatsApp ou copie pelo seu aparelho." (14 palavras, 7 a 9 s);
  - "Imagem baixada. Procure em Downloads ou na galeria." (8 palavras, 4 a 5 s, e a pessoa ainda está olhando para o botão quando o aviso aparece).
- Esses avisos trazem a instrução de como continuar, que não aparece em nenhum outro lugar.
- Quem usa leitor de tela ouve tudo (`role=status`). O problema é de quem lê na tela ou usa ampliador.

**WCAG:** risco de falha de 2.2.1 Ajustável por temporização (A). É um tempo-limite do próprio site, sem jeito de desligar ou estender. A exceção "essencial" não vale, porque o aviso carrega a instrução de continuação.

**Gravidade:** ATRAPALHA. A pessoa perde a instrução de onde achar a imagem ou de como copiar.

**Evidência:**
- `src/comum/aviso.ts` (5000 ms);
- `.saida/c4-tempo-aviso.md` (a medição do tempo);
- `.saida/c4-textos.md` (os textos).

**Sugestão:**
- O aviso com instrução fica até o próximo toque; o resto, pelo menos 1 s por palavra.
- Textos mais curtos ("Não copiou. Toque em Mandar no WhatsApp.").
- `aviso.ts` é de `src/comum/`: vira pedido em `docs/pedidos-comum.md`.

#### C-06 · Com letra grande, o aviso tapa o campo que acabou de receber o foco

**Personagem e aparelho:** C2 Dona Neide, AND-FRACO com letra a 200%.

**Tela:** passo 1, logo depois de "Apagar tudo".

**O que aconteceu:**
- O foco vai para o campo Título, e o aviso "Tudo apagado. Escreva de novo." aparece fixo na base da tela por 5 s.
- O aviso cobre quase todo o campo: só uma tira do anel de foco fica à vista.
- A 100%, ele cobre o campo Organização, que é o próximo a ser preenchido.
- O teste de "foco coberto" dos roteiros não viu isso, porque usa `elementFromPoint`, e o aviso tem `pointer-events: none`.

**WCAG:** 2.4.11 Foco não encoberto, mínimo (AA), passa raspando: o foco não fica *inteiramente* oculto. Já 2.4.12 (AAA) reprova. Com zoom de 400% ou tela menor, pode chegar a reprovar o 2.4.11; não foi medido.

**Gravidade:** ATRAPALHA. A pessoa não vê onde vai escrever, logo depois de perder o texto.

**Evidência:** `fotos/c-06-aviso-cobre-o-campo.png` (duas rodadas do roteiro C2, que gravaram a mesma foto); `fotos/c-02-apagar-tudo.png` (a 100%).

**Sugestão:** o aviso fica no alto da tela quando o foco está na metade de baixo, ou rola o campo para cima do aviso. É CSS de `src/comum/componentes.css`: vira pedido.

#### C-07 · Dia e hora do exemplo vão para o grupo sem aviso · pede decisão

**Personagem e aparelho:** C4 Jéssica, AND-FRACO. Reproduzido no `repro.sim.ts`.

**Tela:** Pronto da reunião e do evento.

**O que aconteceu:**
- A porta abre com dia e hora prontos (por exemplo, "sábado, 7 de novembro, às 19h").
- Quem troca título e organização e não passa pelo dia vê o aviso "O título, a pauta e o local ainda são do exemplo.", que não fala de dia e hora.
- O convite vai com o dia do exemplo.

**Esperado:** a pessoa confere o dia antes de mandar.

**Decisão envolvida:** `docs/produto.md` 7.6 diz que "dia e hora não contam" como exemplo, por decisão de 06/11. O sub-agente marcou como TRAVA ("manda algo errado"). A revisão manteve ATRAPALHA, porque o dia aparece grande no card e no passo 2. **Pede decisão.**

**WCAG:** nenhum. É questão de produto.

**Gravidade:** ATRAPALHA.

**Evidência:** `fotos/c-07-dia-do-exemplo.png`; `.saida/repro-rodada1.md` (R-dia, 2 rodadas).

**Sugestão:** sem mudar a regra do link, mostrar "Confira o dia: sábado, 7/11, às 19h" no aviso do Pronto, só quando o dia não foi mexido. Se aparecesse em todo Pronto, viraria ruído.

### MELHORIA

#### C-08 · Com letra a 200%, o campo de uma linha mostra só o começo

- **Quem e onde:** C2, AND-FRACO com letra a 200%, Título e Organização.
- **O que acontece:** o campo mede 268 px e o texto, de 408 a 647 px. A pessoa vê "Associação de Mor" e só vê o resto movendo o cursor.
- **WCAG:** 1.4.4 e 1.4.10 passam, porque o campo rola por dentro, como faz qualquer campo de uma linha. A miniatura mostra o texto inteiro.
- **Sugestão:** `textarea` de uma linha que cresce, como o texto curto já faz.
- **Evidência:** `fotos/c-08-campo-cortado-200.png`; `.saida/c2.md`.

#### C-09 · Ano errado passa sem aviso, e o card não mostra o ano

- **Quem e onde:** C4, AND-FRACO, no `repro.sim.ts`.
- **O que acontece:** "01/01/2020" é aceito. No passo 2, o ano aparece por extenso embaixo do campo, mas o card diz só "quarta-feira, 1 de janeiro", com o dia da semana de 2020.
- **Sugestão:** "Esse dia já passou. Está certo?", sem bloquear; e o ano no card quando não for o ano corrente.
- **Evidência:** `.saida/repro.md` (R-passado, 2 rodadas).

#### C-10 · Sem menu de compartilhar, a dica promete um menu que não abre

- **Quem e onde:** C4, C5 e C6, com `navigator.share` ausente (computador, Firefox, navegador dentro de app). Usabilidade.
- **O que acontece:** embaixo do botão continua "Abre o menu do celular. Escolha o WhatsApp e a conversa." Ao tocar, o site copia o texto e diz "Texto copiado. Baixe a imagem e mande junto no WhatsApp.", o que está certo, mas a dica enganou antes do toque.
- **Sugestão:** sem `navigator.share`, a dica vira "Copia o texto. Depois, baixe a imagem e mande as duas no WhatsApp."
- **Evidência:** `fotos/c-10-sem-menu-de-compartilhar.png`; `.saida/repro-rodada1.md` (R-sem-menu).

#### C-11 · Menu cancelado não diz nada; arquivo recusado não diz que a imagem ficou de fora

- **Quem e onde:** C5, PC-GRANDE. Usabilidade.
- **Menu fechado pela pessoa (AbortError):** não há aviso nenhum. Está certo não mostrar erro, mas um "Não mandou. Toque de novo quando quiser." ajuda quem usa leitor de tela.
- **Arquivo recusado (`canShare` falso para arquivos):** o site manda só o texto e diz "Pronto, texto enviado para compartilhar.", sem avisar que a imagem não foi.
- **Sugestão:** "Mandamos só o texto. Toque em Baixar a imagem e mande junto."
- **WCAG:** 4.1.3 (AA) passa.
- **Evidência:** `.saida/c5-compartilhar-cancela.md` e `c5-compartilhar-recusa-arquivo.md`.

#### C-12 · Imprimir demora 2,6 a 4,2 s em aparelho fraco, sem "Preparando"

- **Quem e onde:** C6, AND-FRACO. Usabilidade.
- **O que acontece:** "Mandar" e "Baixar" mostram "Preparando a imagem…" depois de 300 ms. "Imprimir cartaz para o mural" não mostra nada até a impressão abrir. Há trava contra toque duplo.
- **Sugestão:** o mesmo aviso, "Preparando o cartaz…".
- **Evidência:** `.saida/c6-semsw-r1.md` e `c6-sw-r1.md`.

#### C-13 · O botão diz "Grupo", e o leitor de tela diz "Conversa"

- **Quem e onde:** C1 e C4.
- **O que acontece:** o botão do passo 3 se chama "Grupo" (`estado.ts`), mas a prévia lida pelo leitor de tela diz "formato Conversa" (`cards/modelos.ts`), 55 vezes no caminho.
- **WCAG:** nenhum critério AA. É problema de vocabulário (a descrição é fiel ao card, e o canvas não é controle).
- **Sugestão:** ler "formato Grupo".
- **Evidência:** `.saida/c4-textos.md`, `.saida/arvore-c1-03-passo3.yml`.

#### C-14 · Linguagem: palavras difíceis e frases longas no caminho

C4, AND-FRACO. WCAG: 3.1.3 Palavras incomuns, 3.1.4 Abreviaturas ("QR", "PDF") e 3.1.5 Nível de leitura. Os três são AAA, além do AA. As trocas mais úteis:

| Onde | Hoje | Proposta |
|---|---|---|
| Passo 1, Organização (também em aviso, conquista e agradecimento, onde ninguém "chama") | "Quem está chamando. Escreva o nome da organização, não de pessoas. Nome de criança ou adolescente nunca." | "Nome do grupo, não de pessoas. Nunca ponha nome de criança ou adolescente." **Pede decisão** (veio da análise jurídica) |
| Passo 1, depois de apagar | "Já vem com um exemplo. Troque pelo que for seu." (continua na tela) | Sumir, ou "Escreva o seu." |
| Fluxo inteiro | "card" | "imagem" (e "cartaz" só para o papel) |
| Reunião (53 vezes) | "pauta" | Na primeira vez: "pauta (os assuntos da reunião)" |
| Pronto da reunião | "O link leva título, dia, hora, local e a pauta. Quem receber pode repassar." | "…Quem receber pode mandar para outras pessoas." **Pede decisão** (frase fixa da seção 7.3) |
| Passo 3, cor livre | "Essa cor fica difícil de ler sobre o fundo claro. A faixa mantém a sua cor; nos detalhes, escurecemos um pouco para o texto ficar legível." (27 palavras) | "Essa cor é clara e difícil de ler. Nas letras, vamos usar um tom mais escuro." |
| Ata | Quatro avisos antes do primeiro campo, com "O rascunho some ao fechar." repetido | Um aviso só, no alto (ver `fotos/c-14-ata-avisos.png`). **Pede decisão:** os avisos vêm da decisão do rascunho e da análise jurídica |
| Ata | "Encaminhamentos" · "Guardar a ata" (nada é guardado) · "Imprimir ou salvar em PDF" e "Salvar como PDF" | "O que ficou combinado" · "Salvar ou copiar a ata" · um nome só para o PDF |
| Como denunciar | Frases de 21 a 35 palavras ("Quer tirar do ar um link que você criou?…") | Texto institucional em revisão jurídica: só apontar. As 32 frases longas das páginas institucionais estão listadas em `c4-textos.md` |

**Evidência:** `.saida/c4-textos.md` (as 78 telas, com as marcas); `fotos/c-14-cor-livre.png`.

#### C-15 · Página do evento e link removido: frases que assustam ou confundem · pede decisão

C4, AND-FRACO. A faixa e o "segundo quem criou o link" estão em `docs/produto.md` 7.2. O texto do link removido vem da decisão de 05/11 (seção 3), que pede que a tela fale como decisão do site: qualquer troca fica para depois da revisão jurídica.

- **Link removido:** "Removemos este link porque, na nossa análise, ele fere esta regra de uso: Golpe, ou pedido de dinheiro ou de dado pessoal por meio de engano." (26 palavras). Quem recebeu o link de um amigo pode ler como acusação contra si. Proposta: "Este link saiu do ar por decisão do site. Motivo: golpe ou pedido de dinheiro."
- **Faixa:** "Conteúdo criado por quem enviou este link…". Proposta: "Quem mandou este link escreveu tudo isto. O Projeto Comunidade não confere nada. Nunca pague nada que o evento pedir."
- **Quem chama:** "Quem chama, segundo quem criou o link:". Proposta: "Quem chama (escrito por quem fez o link):". Mexe também no texto do `.ics` (`src/ferramentas/evento/agenda.ts`) e no teste dele.
- **Agenda:**
  - "Baixar arquivo para a agenda" não diz para que serve. Proposta: "Salvar na agenda do celular".
  - O "(abre outro site)" de "Abrir no Google Agenda" só o leitor de tela ouve. Mostrar na tela também (3.2.5, AAA).

**Evidência:** `fotos/c-15-link-removido.png`; `.saida/c4-textos.md`.

#### C-16 · O último aviso fica guardado na região viva, e o erro do link é anunciado duas vezes

C1, AND-GRANDE, e C6.

- **Texto velho na região viva:** o aviso some da tela só por `opacity: 0`, e o texto continua em `#aviso-vivo`. Quem percorre a página inteira com o leitor de tela ouve no fim um aviso que já passou: "Confira 1 campo." no passo 3 e no Pronto, ou "Link copiado." em outra tela.
- **Erro do link em dobro:** no Pronto, "Não deu para criar o link do evento…" vai para `#fluxo-link-estado` (que tem `role=status`) e para `avisar()`, então é anunciado duas vezes (`pronto.ts`).
- **WCAG:** 4.1.3 (AA) passa.
- **Sugestão:**
  - Limpar o texto quando o aviso some da tela. É de `src/comum/aviso.ts`, então vira pedido.
  - No erro do link, anunciar por um caminho só.
- **Evidência:**
  - `.saida/arvore-c1-03-passo3.yml` e `arvore-c1-04-pronto.yml` (última linha);
  - `.saida/repro-rodada1.md` (R-aviso-velho);
  - `.saida/c6-semsw-r1.md` (as duas linhas do mesmo aviso).

#### C-17 · Nos passos 1 e 2, a miniatura vem antes do título na ordem de leitura

- **Quem e onde:** C1, AND-GRANDE.
- **O que acontece:** na árvore, a imagem com a descrição longa e "Ver a prévia maior" vêm antes do h1. O foco já vai ao h1 ao trocar de passo, então quem desliza a partir do título não ouve a miniatura. Quem desliza do topo ouve o card inteiro antes de saber em que passo está.
- **WCAG:** 1.3.2 e 2.4.3 passam: a ordem é a mesma da tela.
- **Sugestão:** pôr a miniatura depois do h1 no código (ela continua fixa no topo pelo CSS), ou dar a ela uma descrição curta ("Prévia. Toque em Ver a prévia maior.") e deixar a longa só no "Ver maior".
- **Evidência:** `.saida/arvore-c1-01-passo1.yml`.

#### C-18 · O nome de "Mais opções" leva o sinal "+"

- **Quem e onde:** C1, passo 3.
- **O que acontece:** o `summary::after` usa `content: '+'` e `'−'` sem texto alternativo vazio. A árvore mostra "Mais opções +", e o leitor deve falar "Mais opções, mais". O ✓ das bolinhas já usa `content: '✓' / ''`.
- **Sugestão:** `content: '+' / ''` (`fluxo.css`).
- **Evidência:** `.saida/arvore-c1-03-passo3.yml`.

#### C-19 · As 6 bolinhas de cor não mostram o nome na tela · pede decisão

- **Quem e onde:** C3, AND-GRANDE com filtros.
- **O que já funciona:** a escolhida tem anel de 3 px, ✓ de 24 px e o texto "Cor: <nome>" acima. Nada depende só da cor (1.4.1 passa).
- **O problema:**
  - Na deuteranopia e na protanopia, Papel, Areia e Névoa (claras) e Grafite e Ameixa (escuras) quase não se distinguem. O nome só aparece depois de escolher.
  - Quem usa comando de voz não sabe que nome falar.
  - Com cor livre ativa, nenhuma bolinha fica marcada, e não há amostra da cor ao lado.
- **Os cards:** os 6 baixados ficam legíveis nos 3 filtros.
- **Sugestão:** nome curto embaixo de cada bolinha e uma 7ª bolinha "Livre" com a cor escolhida. Muda o desenho aprovado em 7.6: **pede decisão**.
- **Evidência:** `fotos/c-19-bolinhas-deuteranopia.png`; `.fotos/c3-folha-*.png`.

#### C-20 · No alto contraste, o botão principal perde o destaque

- **Quem e onde:** C5, PC-GRANDE com `forcedColors: 'active'`.
- **O que acontece:** "Continuar", "Ficou bom" e "Mandar no WhatsApp" ficam iguais aos secundários: só borda, sem fundo. Não há regra `forced-colors` em `src/`. Bolinhas, ✓, bordas dos campos, erro e foco continuam visíveis.
- **WCAG:** nenhum critério reprova.
- **Sugestão:** em `@media (forced-colors: active)`, dar ao botão principal `background: ButtonText; color: ButtonFace` ou uma borda mais grossa. Se for no tema, vira pedido.
- **Evidência:** `fotos/c-20-alto-contraste.png`; `.saida/c5-altocontraste.md`.

#### C-21 · A caixa de "Mostrar 'Feito com…'" tem 24 × 24 px

- **Quem e onde:** C2, AND-FRACO.
- **O que acontece:** o toque vale no rótulo inteiro (52 px), então passa no 2.5.8 (AA). Mas a caixa em si fica abaixo da regra do projeto (48 px, `CLAUDE.md`).
- **O resto dos alvos:** nada a menos de 8 px na barra Voltar/Continuar, nas bolinhas ou no Pronto. Status, Grupo e Cartaz ficam a 8 px exatos, empilhados com letra a 200%. Os links do rodapé têm 48 px, mas se encostam (0 a 3 px).
- **Sugestão:** caixa de 48 px, e 12 px entre os botões de formato e entre os links do rodapé. O CSS é de `src/comum/componentes.css`: vira pedido.

### Fora da acessibilidade (para o relatório de produto)

#### C-22 · Economia de dados quase não muda nada · pede decisão

- **Quem e onde:** C6, AND-FRACO.
- **O que acontece:**
  - Com `saveData`, o site só reduz o desenho do card de 1080 para 648 px.
  - Os bytes são iguais com e sem economia: 87,2 KB no fluxo inteiro.
  - As fontes são 25,2 KB dos 34,7 KB da primeira tela, cerca de 73%.
  - O site não lê o cabeçalho `Save-Data` nem `prefers-reduced-data`, que o Chromium também não aceitou na emulação.
- **Sugestão:** com economia de dados, usar a fonte do sistema. Mexe no visual (7.6) e nas fontes, que ficam em arquivo comum: **pede decisão**.
- **Evidência:** `.saida/c6-peso-normal.md` e `c6-peso-economia.md`.

**Neutralidade:** nenhuma cor, ícone ou palavra da plataforma com lado, e nenhum lado recebe algo diferente. As seis cores são neutras e o rodízio passa por 7 tipos de organização. "Núcleo de Bairro" e "Reunião de núcleo transferida" aparecem nos exemplos. "Núcleo" também se usa para núcleo partidário, mas aqui é de bairro: ficou como observação, não como achado.

### SÓ NO APARELHO (o Kauê confere no celular)

| # | O que olhar | Por quê |
|---|---|---|
| A-1 | Com TalkBack (Android) e VoiceOver (iPhone), percorrer a reunião. A descrição longa da miniatura é lida como imagem? Ela é lida de novo a cada letra digitada? | A árvore do Playwright não é o leitor de tela. A descrição muda com atraso de cerca de 1 s. A leitura de "Passo N de 3" já está nas pendências e a simulação não mostrou piora |
| A-2 | Dia e hora no Android: o teclado numérico do campo "Dia" e o seletor nativo de hora abrem, e o TalkBack confirma? Na ata, o campo de data mostra dd/mm/aaaa? | No Chromium de teste, a hora tem 4 paradas de Tab (com AM/PM) e a data da ata aparece como mm/dd/yyyy. É o idioma do navegador de teste, não do site |
| A-3 | (Outros) Ligar a "Economia de dados" do Chrome e conferir se o card sai menor | `nivel.ts` só lê `navigator.connection.saveData`. No teste, foi forçado por script |
| A-4 | (Outros) Modo avião no passo 2, na **primeira** visita, e ir até o Pronto (C-01) | Queda limpa de rede não é sinal instável, e o service worker não sofre o limite do CDP |
| A-5 | Ler a letra pequena do card ("Feito com…", descrição em cinza) numa tela de 360 px, com o card leve (648 px) | O axe não olha dentro do canvas |
| A-6 | Mão trêmula: tocar perto de "Fazer outro", "Apagar tudo" e dos três formatos | O teste toca no ponto exato |
| A-7 | Alto contraste de verdade (Android: "Texto em alto contraste"; Windows: tema de contraste) | `forcedColors` usa um tema padrão |
| A-8 | Comando de voz (Voice Access) nas bolinhas e no "Mais opções"; ampliação de tela do Android a 400% com o aviso da base à vista | Sem nome visível, a voz não acha a bolinha (C-19). O aviso fixo pode ficar fora da área ampliada (C-05, C-06) |

## O que ficou de fora e o que a emulação não reproduz

- **Leitor de tela, ampliador e comando de voz:** nenhum foi usado de verdade. O `ariaSnapshot` e o rastreio de `aria-live` mostram o que existe para o leitor, não como o TalkBack fala, pausa ou repete.
- **Só Chromium:** `<dialog>`, `details` e `content: '✓' / ''` não foram vistos no Safari nem no Firefox.
- **Letra a 200%:** feita por `font-size` no `html`, como no `e2e/primeira-tela.spec.ts`. O ajuste do Android muda só a fonte.
- **Zoom de 400%:** aproximado com 320 × 200 e DPR 4.
- **Espaçamento de texto (1.4.12, AA):** não foi testado (altura de linha 1,5, letras 0,12 em, palavras 0,16 em, parágrafos 2 em).
- **Foco coberto:** o teste usa `elementFromPoint` e não vê elementos com `pointer-events: none`. Foi assim que C-06 escapou; ele foi achado na foto, na revisão.
- **Daltonismo:** é um filtro de matriz sobre a página e o PNG, não a percepção de uma pessoa daltônica. Vale mostrar as bolinhas para alguém daltônico.
- **Rede:** o 3G emulado tem latência e banda fixas, sem perda de pacote nem troca de torre. Com outra sessão CDP ativa, o `context.setOffline` do Playwright não cortava a rede. Por isso, o roteiro C6 usa uma sessão CDP só, com uma sonda que confirma a queda.
- **Compartilhar e imprimir:** são de mentira (o teste lê o que seria mandado). O menu real do Android e do iPhone e a janela de impressão não foram vistos.
- **Tempos:** foram medidos com várias sessões na mesma máquina. Um tempo isolado de 60 s (C4) foi a máquina, não o site. Uma rodada de C3 foi interrompida e refeita (14 de 14 passaram).
- **Cortado na revisão por não se reproduzir no ritmo de uma pessoa:**
  - "Confira 1 campo." à vista no Pronto (C3) e "Confira os campos marcados." sobre a revisão da denúncia (C4). Os dois só apareceram porque o robô chegou à tela seguinte em menos de 5 s. Com pausas de 6 a 8 s, o aviso já tinha sumido (R-aviso-velho em `.saida/repro-rodada1.md` e R-denuncia em `.saida/repro.md`).
  - "Sem indicador de foco" no ícone do relógio (C5): o anel do navegador aparece.
- **Cortado como gosto ou fora de escopo:**
  - a mensagem "parece ter chave PIX" num local de 300 letras seguidas;
  - "verbos para apagar";
  - o "rodapé" do card (o rodapé do site não aparece no fluxo);
  - o rodízio curto da conquista (3 exemplos em 6 sorteios é acaso, e o catálogo tem 7).
- **Já nas pendências, sem piora:**
  - recarregar no passo 2 volta ao passo 1 com outro exemplo (em uma de duas rodadas, mostrou "Carregando…" por alguns segundos em 3G);
  - miniatura e barra soltam com letra a 200%;
  - VoiceOver lendo "Passo N de 3".

## Positivo (conferido, sem achado)

- **Foco:**
  - vai ao h1 em cada passo, no Pronto e na ata, e o h1 diz a porta e o passo;
  - contorno de 3 px em todo Tab, inclusive no alto contraste;
  - nada fixo cobre o elemento focado ao navegar por Tab, nem em 480 × 270 (exceção: o aviso de C-06).
- **Leitor de tela:**
  - as bolinhas são rádios com nome e estado ("Grafite, marcado"), e a legenda "Cor: <nome>" muda junto;
  - os avisos `aria-live` saem uma vez só, na hora certa ("Link copiado.", "Item 1 acrescentado.", "Preparando a imagem…"), menos o erro do link (C-16);
  - o erro de campo tem `aria-invalid`, o texto "Erro: …" e borda de 4 px: não depende de cor.
- **Painéis:** o painel do exemplo leva o foco a "Mudar algo" e o devolve a "Mandar no WhatsApp"; "Ver maior" fecha com Esc e devolve o foco.
- **Movimento e modo escuro:** com reduzir movimento, nenhuma animação nem transição em nenhum passo; no modo escuro, o axe não acusa erro em nenhuma tela.
- **Contraste** (conferido pelo `revisor-acessibilidade` com a conta de `src/comum/cor.ts`): o menor par do tema claro é a borda do campo, com 4,08:1 (o mínimo para borda é 3:1); no tema escuro, 5,03:1; o menor par das paletas do card é o acento da Areia, com 5,96:1; o texto sobre a cor livre fica em 4,58:1 ou mais.
- **Sem rede:** com o service worker instalado, o fluxo inteiro funciona sem rede, com o mesmo link.
- **Tela:** nenhuma rolagem lateral em 320, 360 e 412 px, nem a 400%.
- **Erros e rede:** nenhum erro de JavaScript; nenhum pedido para fora do localhost.
