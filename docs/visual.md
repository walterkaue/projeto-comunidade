# Nova cara — especificação visual

> 07/11/2026 · Chat. Aprovada pelo Kauê (direção C, "Caderno", versão 3). Telas no quadro "Projeto Comunidade — nova cara" (claude.ai), páginas "C · Caderno, versão 3" e "C · versão 3, outras telas", em celular de 360 × 640, modo claro e escuro. No repositório, este texto é `docs/visual.md`. Regras de produto: `docs/produto.md` v0.15 (seção 3, linhas de 07/11, e seção 7.6). Este documento muda a cara e os textos de tela, **não as regras**.

## 1. Ideia

- **Base clara e quente**, creme. No escuro, marrom bem escuro, nunca cinza-azulado.
- **Cada porta tem a sua cor**, e a mesma cor acompanha a pessoa nos 3 passos e no Pronto daquela porta. Nenhuma cor é "a cor do site": o que é do site (marca, rodapé, páginas institucionais) usa só tinta e creme, e a marca junta as cinco cores.
- **Cor onde guia:** ícone, topo do passo, progresso, foco do campo e botão principal. Texto corrido sempre em tinta.
- **Aviso com cara de aviso, campo com cara de campo.** Aviso tem ícone e fundo de cor, sem borda. Campo tem fundo branco (no escuro, cartão) e borda de 2 px.
- **Exemplo só para ilustrar:** em cinza dentro do campo, começando com "Ex.:", e some quando a pessoa escreve (`produto.md` v0.14).
- Nada de imagem pesada, gradiente nem biblioteca nova. Ícones em SVG de traço, desenhados no código. A fonte continua a Atkinson Hyperlegible.

## 2. Cores (tokens)

Nomes sugeridos para `src/comum/tema.css`. Os da base valem para o site todo; os da porta (`--cor` e `--cor-clara`) mudam conforme a porta, por um atributo na tela (ex.: `data-porta="reuniao"`). Fora de uma porta (início, páginas institucionais), `--cor` é a tinta.

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--papel` | `#fbf6ee` | `#1a1512` | fundo da página |
| `--superficie` | `#ffffff` | `#26201b` | campo, cartão, painel |
| `--tinta` | `#2a211b` | `#f6efe6` | texto, botão secundário |
| `--tinta-suave` | `#5c4f45` | `#cbbdad` | dica, texto de apoio |
| `--exemplo` | `#6b5e53` | `#a99a8a` | exemplo dentro do campo (`::placeholder`, `opacity: 1`) |
| `--borda` | `#e8ddcd` | `#3d332b` | linhas e separadores (enfeite, sem contraste mínimo) |
| `--borda-campo` | `#8c7d70` | `#9a8b7c` | borda de campo, botão terciário, bolinha de cor |
| `--atencao` | `#efe5d5` | `#352b23` | fundo do aviso de atenção (faixa, painel, link removido) |
| `--erro` | `#a8241b` | `#ff8a80` | texto e borda de erro |
| `--sobre-cor` | `#ffffff` | `#1a1512` | texto e ícone sobre a cor da porta |
| `--sombra` | `0 1px 2px rgba(74,52,30,.10), 0 3px 10px rgba(74,52,30,.07)` | `0 1px 2px rgba(0,0,0,.40)` | cartão |
| `--sombra-barra` | `0 -2px 12px rgba(74,52,30,.10)` | `0 -2px 12px rgba(0,0,0,.45)` | barra fixa de baixo |

**Cores das portas** (`--cor` / `--cor-clara`; no escuro, a "clara" é um fundo suave escuro):

| Porta | Nome | Claro: cor | Claro: clara | Escuro: cor | Escuro: clara |
|---|---|---|---|---|---|
| Chamar para uma reunião (e ata) | Petróleo | `#1d5a72` | `#e2eef2` | `#7fc3dc` | `#18323c` |
| Divulgar um evento | Musgo | `#3d6a2c` | `#e6efdc` | `#9fcf83` | `#22321a` |
| Dar um aviso | Barro | `#9a4326` | `#f7e5dc` | `#f2a487` | `#3d2219` |
| Contar uma conquista | Ocre | `#7f5f0c` | `#f5ecd2` | `#e2c063` | `#352a10` |
| Agradecer | Amora | `#8a3760` | `#f4e2eb` | `#eba0c5` | `#3a1e2c` |

**Neutralidade das cores:** tons fechados, nenhuma porta vermelha, laranja ou roxa. Na grade do início, o verde (evento) e o azul (reunião) nunca encostam no amarelo (conquista): a ordem das portas não muda. Os ícones não lembram símbolo de partido, religião ou time. O `--foco` deixa de ser azul: é a `--cor` da porta nos passos e a `--tinta` fora deles (contorno de 3 px, afastado 2 px).

`theme-color` (index.html e manifest): `#fbf6ee` no claro e `#1a1512` no escuro (`<meta name="theme-color" media="(prefers-color-scheme: dark)">`); `background_color` do manifest `#fbf6ee`.

## 3. Contraste medido (WCAG 2.2: 4,5:1 texto, 3:1 bordas e ícones que informam)

**Base, modo claro**

| Par | Frente | Fundo | Contraste | Mínimo |
|---|---|---|---|---|
| Texto sobre a página | `#2a211b` | `#fbf6ee` | 14.66:1 | 4.5:1 |
| Texto sobre cartão e campo | `#2a211b` | `#ffffff` | 15.77:1 | 4.5:1 |
| Texto suave sobre a página | `#5c4f45` | `#fbf6ee` | 7.34:1 | 4.5:1 |
| Texto suave sobre cartão | `#5c4f45` | `#ffffff` | 7.90:1 | 4.5:1 |
| Exemplo em cinza no campo | `#6b5e53` | `#ffffff` | 6.27:1 | 4.5:1 |
| Borda do campo sobre o campo | `#8c7d70` | `#ffffff` | 3.98:1 | 3:1 |
| Borda do campo sobre a página | `#8c7d70` | `#fbf6ee` | 3.69:1 | 3:1 |
| Erro sobre a página | `#a8241b` | `#fbf6ee` | 6.65:1 | 4.5:1 |
| Erro (borda) sobre o campo | `#a8241b` | `#ffffff` | 7.16:1 | 3:1 |
| Texto do aviso de atenção | `#2a211b` | `#efe5d5` | 12.64:1 | 4.5:1 |
| Aviso que some (texto claro sobre tinta) | `#fbf6ee` | `#2a211b` | 14.66:1 | 4.5:1 |

**Portas, modo claro**

| Porta | Cor | Clara | Cor/página (texto, link, foco) | Cor/cartão (ícone) | Texto do botão/cor | Tinta/clara | Suave/clara | Cor/clara (ícone, verbo) | Borda do campo/clara |
|---|---|---|---|---|---|---|---|---|---|
| Petróleo (reunião) | `#1d5a72` | `#e2eef2` | 7.08 | 7.62 | 7.62 | 13.32 | 6.67 | 6.43 | 3.36 |
| Musgo (evento) | `#3d6a2c` | `#e6efdc` | 5.92 | 6.37 | 6.37 | 13.32 | 6.67 | 5.38 | 3.36 |
| Barro (aviso) | `#9a4326` | `#f7e5dc` | 6.09 | 6.55 | 6.55 | 12.91 | 6.47 | 5.37 | 3.26 |
| Ocre (conquista) | `#7f5f0c` | `#f5ecd2` | 5.51 | 5.92 | 5.92 | 13.37 | 6.70 | 5.02 | 3.37 |
| Amora (agradecer) | `#8a3760` | `#f4e2eb` | 6.98 | 7.51 | 7.51 | 12.71 | 6.36 | 6.05 | 3.20 |

**Base, modo escuro**

| Par | Frente | Fundo | Contraste | Mínimo |
|---|---|---|---|---|
| Texto sobre a página | `#f6efe6` | `#1a1512` | 15.87:1 | 4.5:1 |
| Texto sobre cartão e campo | `#f6efe6` | `#26201b` | 14.11:1 | 4.5:1 |
| Texto suave sobre a página | `#cbbdad` | `#1a1512` | 9.85:1 | 4.5:1 |
| Texto suave sobre cartão | `#cbbdad` | `#26201b` | 8.75:1 | 4.5:1 |
| Exemplo em cinza no campo | `#a99a8a` | `#26201b` | 5.88:1 | 4.5:1 |
| Borda do campo sobre o campo | `#9a8b7c` | `#26201b` | 4.87:1 | 3:1 |
| Borda do campo sobre a página | `#9a8b7c` | `#1a1512` | 5.48:1 | 3:1 |
| Erro sobre a página | `#ff8a80` | `#1a1512` | 7.93:1 | 4.5:1 |
| Erro (borda) sobre o campo | `#ff8a80` | `#26201b` | 7.05:1 | 3:1 |
| Texto do aviso de atenção | `#f6efe6` | `#352b23` | 12.10:1 | 4.5:1 |
| Aviso que some (texto escuro sobre tinta clara) | `#1a1512` | `#f6efe6` | 15.87:1 | 4.5:1 |

**Portas, modo escuro** (a "clara" é o fundo suave escuro)

| Porta | Cor | Fundo suave | Cor/página (texto, link, foco) | Cor/cartão (ícone) | Texto do botão/cor | Tinta/fundo suave | Suave/fundo suave | Cor/fundo suave (ícone, verbo) | Borda do campo/fundo suave |
|---|---|---|---|---|---|---|---|---|---|
| Petróleo (reunião) | `#7fc3dc` | `#18323c` | 9.26 | 8.23 | 9.26 | 11.80 | 7.32 | 6.88 | 4.07 |
| Musgo (evento) | `#9fcf83` | `#22321a` | 10.11 | 8.99 | 10.11 | 11.96 | 7.42 | 7.62 | 4.13 |
| Barro (aviso) | `#f2a487` | `#3d2219` | 9.00 | 8.00 | 9.00 | 12.77 | 7.92 | 7.24 | 4.41 |
| Ocre (conquista) | `#e2c063` | `#352a10` | 10.31 | 9.16 | 10.31 | 12.35 | 7.67 | 8.02 | 4.27 |
| Amora (agradecer) | `#eba0c5` | `#3a1e2c` | 8.94 | 7.95 | 8.94 | 13.13 | 8.15 | 7.39 | 4.54 |

Estes pares viram teste automático (`src/comum/tema.test.ts`), lendo os valores do próprio `tema.css`: se alguém trocar uma cor e o par cair abaixo do mínimo, o teste falha.

## 4. Tipo, tamanhos e formas

- Fonte: Atkinson Hyperlegible (400 e 700), como hoje. Corpo de 1.0625rem (17 px) nos campos e botões; texto da página continua em 1.125rem.
- Título da tela (h1): 1.875rem (30 px), `line-height: 1.15`, `letter-spacing: -0.01em`. No início, 2rem.
- Rótulo do campo: 17 px, negrito. Dica: 15 px, `--tinta-suave`. Nome da porta acima do título: 16 px, negrito, na `--cor`.
- Cantos: cartão das portas 20 a 22 px; topo do passo 24 px só embaixo; campo 12 px; botão 14 px; atalho do dia 999 px (pílula); quadrado do ícone 13 a 18 px.
- Alturas: botão principal e secundário 52 px (o "Mandar no WhatsApp", 60 px); campo 52 px; atalhos, "Ver maior", links de texto e bolinhas com alvo de 48 px ou mais.
- Tudo em rem ou com teto, para o texto a 200% não cortar; 320 e 360 px sem rolagem lateral.

## 5. Componentes

- **Porta do início.** Link com fundo `--cor-clara`, sem borda, cantos de 20 a 22 px, ícone num **quadrado de cor cheia** (`--cor`, ícone em `--sobre-cor`, traço 2,25). Título em tinta, negrito; exemplos em `--tinta-suave`. Reunião (destaque): largura cheia, ~112 px de altura, quadrado de 62 px, título de 22 px, borda de 2 px na `--cor` e, à direita, uma seta branca num círculo cheio de 40 px. Evento e aviso: largura cheia, ~82 px, quadrado de 52 px e um chevron na `--cor`. Conquista e agradecer: lado a lado, quadrado de 46 px em cima, texto embaixo.
- **Marca.** Cinco pontos (um de cada cor de porta) em círculo, 22 px, antes do nome do site, e uma faixa fina de 6 px no topo do início com as cinco cores, em partes iguais. As duas são enfeite (`aria-hidden`).
- **Topo do passo (zona).** Bloco com fundo `--cor-clara`, cantos de baixo de 24 px, que leva: (passos 1 e 2) a linha da prévia; o nome da porta com um quadradinho de 30 px; "Passo N de 3" em texto e três barrinhas de 8 px (cheias na `--cor` até o passo atual, as outras em `--superficie`); e o título do passo. A barrinha é enfeite: o "Passo N de 3" escrito é que informa.
- **Linha da prévia (passos 1 e 2).** 64 a 72 px de altura, fixa no topo como hoje: miniatura de ~54 px de altura, o texto "Assim vai ficar a imagem" e, embaixo, "(com exemplo no que falta)" (só quando algum campo ainda está vazio), e o botão "Ver maior" (48 px, contorno `--borda-campo`, fundo `--superficie`). Antes eram ~112 px.
- **Campo.** Rótulo em cima; "(opcional)" em `--tinta-suave` só nos opcionais (some o "(obrigatório)"; o `aria-required` continua nos obrigatórios); dica de **uma frase** embaixo do rótulo (as frases jurídicas que ficam, ficam inteiras); entrada de 52 px, fundo `--superficie`, borda de 2 px `--borda-campo`, cantos de 12 px. Exemplo em `::placeholder`, cor `--exemplo`, começando com "Ex.:". **Foco:** borda e contorno de 3 px na `--cor` da porta. **Erro:** borda de 4 px `--erro` e, embaixo, ícone de erro + "Erro: <motivo>" em negrito na cor `--erro` (nunca só a cor).
- **Atalhos do dia.** Pílulas de 48 px, acima do campo Dia, quebrando linha se precisar. A escolhida fica cheia na `--cor` com ✓ e `aria-pressed="true"`.
- **Botões.** Principal: fundo `--cor`, texto `--sobre-cor`, com seta → no "Continuar". Secundário: contorno de 2 px na `--tinta`, fundo transparente ("Voltar" com seta ←, "Mudar algo" com lápis, "Seguir assim"). Terciário (as saídas do Pronto, a página do evento): fundo `--superficie`, contorno `--borda-campo`, ícone na `--cor` à esquerda e texto à esquerda. Link: sublinhado, negrito, na `--cor` ("Apagar tudo", "Desfazer") ou na tinta ("Fazer outro").
- **Barra fixa de baixo.** "Voltar" (2/5) e "Continuar" (3/5), fundo `--papel`, com `--sombra-barra` em vez de linha. Continua soltando da tela com o teclado aberto.
- **Aviso de informação.** Fundo `--cor-clara`, sem borda, cantos de 14 px, ícone "i" na `--cor`, primeira frase em negrito. Ex.: o quadro do link no passo 1 da reunião.
- **Aviso de atenção.** Fundo `--atencao`, sem borda, ícone de triângulo na tinta, frase principal em negrito. Ex.: a faixa do evento, o painel de órgão público, a tela de link removido, a faixa "em revisão jurídica" das páginas.
- **Painel (folha de baixo).** Sobe de baixo, com fundo escurecido atrás; dentro, o aviso de atenção e os dois botões empilhados (principal e secundário). Usar `<dialog>` com `showModal()` (prende o foco e fecha com Esc = a escolha "Mudar o texto"). Com "reduzir movimento", aparece sem animação.
- **Aviso que some.** Pílula com fundo `--tinta` e texto `--papel`, ícone à esquerda, sombra; continua indo para o alto quando o foco está na metade de baixo (regra de hoje).
- **Opções de formato (passo 3).** Três opções empilhadas, 54 px cada, com ícone (celular, balão, impressora) e nome; a escolhida tem fundo `--cor-clara`, borda `--cor` e ✓. Embaixo, a explicação do formato escolhido (texto de hoje).
- **Bolinhas de cor (passo 3).** 42 px com borda `--borda-campo`, o nome embaixo (14 px); a escolhida ganha anel de 3 px na `--cor` (afastado 3 px) e ✓ dentro, e o nome em negrito.
- **Sombras e movimento.** Só a sombra dos cartões e da barra. Nenhuma animação além das que já existem; todas respeitam "reduzir movimento".
- **Alto contraste (forced-colors).** As regras de hoje continuam: o botão principal mantém fundo; os quadrados de ícone e os avisos ganham borda `CanvasText`.

## 6. Ícones (SVG 24 × 24, traço 2, pontas redondas, `aria-hidden`)

Os cinco das portas continuam os de hoje (`src/paginas/inicio.ts`). Novos, num arquivo só (ex.: `src/comum/icones.ts`), cada um uma string de caminhos:

| Nome | Caminhos |
|---|---|
| info | `<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>` |
| atencao | `<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4.5M12 17.5v.5"/>` |
| erro | `<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>` |
| ata | `<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>` |
| chevron | `<path d="M9 6l6 6-6 6"/>` |
| direita | `<path d="M5 12h14M13 6l6 6-6 6"/>` |
| esquerda | `<path d="M19 12H5M11 6l-6 6 6 6"/>` |
| abrir | `<path d="M6 9l6 6 6-6"/>` |
| check | `<path d="M5 12.5l4.5 4.5L19 7"/>` |
| relogio | `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>` |
| local | `<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>` |
| enviar | `<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>` |
| baixar | `<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>` |
| copiar | `<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>` |
| link | `<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>` |
| imprimir | `<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><path d="M7 14h10v7H7z"/>` |
| lapis | `<path d="M4 20h4L19 9l-4-4L4 16v4z"/>` |
| mais | `<path d="M12 5v14M5 12h14"/>` |
| celular | `<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>` |
| conversa | `<path d="M4 5h16v11H9l-5 4z"/>` |
| compartilhar | `<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>` |
| denunciar | `<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>` |
| predio | `<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>` |
| cadeado | `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>` |
| livro | `<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>` |
| lupa | `<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8.5v5M8.5 11h5"/>` |

O ícone "pessoas" (lista de presença da ata) é o mesmo da porta da reunião.

## 7. Telas (o que muda)

**Início**
- Faixa de cinco cores no topo; marca de cinco pontos + nome do site; "O que você quer fazer?"; a frase de hoje; as cinco portas (seção 5); "Depois da reunião: fazer a ata" como botão de 58 px com borda Petróleo, ícone da ata num quadradinho Petróleo claro e chevron. Rodapé como hoje.

**Passo 1** (reunião; nas outras portas, a mesma coisa na cor delas)
- Topo na cor da porta, com a linha da prévia (seção 5).
- Dica do passo: "Escreva com as suas palavras. O que está em cinza é só exemplo." Quando já há texto, o link "Apagar tudo" fica na mesma linha (e vira "Desfazer" depois de apagar, sem relógio).
- Título: exemplo "Ex.: <título do exemplo>". Organização (opcional): dica "O nome da organização, não de pessoas. Nome de criança ou adolescente nunca." (a segunda frase não muda: análise jurídica). Exemplo "Ex.: <organização do exemplo>".
- Quadro do link (reunião), como aviso de informação: **"Título, local e pauta vão no link."** + "Quem receber pode repassar. Não escreva nome de pessoa nem assunto que só o grupo pode saber." Continua lido junto com o título e a pauta (`aria-describedby`).
- Pauta (os assuntos da reunião): dica "Um assunto por linha. Sem nome de pessoa."; exemplo com um assunto por linha, a primeira começando com "Ex.:".
- Evento, aviso, conquista, agradecer: "Texto curto" (opcional), com a dica de hoje de cada modelo e o exemplo em cinza.

**Passo 2**
- Dica do passo: "Escolha o dia num toque ou abra o calendário."
- Dia: rótulo; **atalhos acima do campo** (Hoje, Amanhã, Próximo sábado); campo `type="date"` (o calendário do celular; nada de teclado numérico), vazio no começo; embaixo, o dia por extenso em negrito na `--cor` ("sábado, 14 de novembro"); "Esse dia já passou. Está certo?" continua.
- Hora: `type="time"`, vazia no começo.
- Local: dica "Como se fosse procurar no mapa. Se for numa casa, não ponha o nome de quem mora." (reunião e evento); exemplo "Ex.: <local do exemplo>".
- Se o navegador não tiver campo de data (raro), cai no campo de texto de hoje (dd/mm/aaaa), sem quebrar.

**Passo 3**
- Topo na cor da porta, sem a linha da prévia. Dica de hoje.
- Prévia à esquerda (até 40% da altura da tela; no Status, ~212 px de altura), com o botão redondo de lupa (48 px, `aria-label="Ver a prévia maior"`) no canto de baixo.
- À direita: "Onde vai mandar?" com as três opções empilhadas (seção 5) e a explicação do formato embaixo.
- Embaixo: "Cor da imagem" com as 6 bolinhas e os nomes (seção 5). Depois, "Mais opções (logo, outra cor, rodapé)", fechado, com a seta de abrir.
- Barra: "Voltar" e "Ficou bom". As escolhas aparecem sem rolar em 360 × 640.

**Pronto**
- Topo na cor da porta, com o nome da porta e "Pronto!" com um ✓ num círculo cheio.
- "Mandar no WhatsApp" (60 px, ícone de enviar) logo abaixo do topo; embaixo dele, a frase do link de hoje, em `--tinta-suave`.
- A prévia, centralizada, com sombra.
- Título novo "Outros jeitos de usar" (h2) e os botões terciários com ícone: Baixar a imagem (baixar), Copiar só o texto (copiar), Copiar o link (link), Imprimir cartaz para o mural (imprimir); a nota do QR embaixo, como hoje.
- Linha; "Mudar algo" (secundário, com lápis); a dica "apaga tudo" e "Fazer outro" (link), centralizados.
- Reunião: quadro com fundo `--cor-clara`: "E depois da reunião?" (h2, com o ícone da ata), "A ata já abre com a pauta." e o botão "Fazer a ata" (fundo `--superficie`, borda `--cor`, seta).
- Não existem mais: o aviso e o painel do exemplo e o "Confira o dia" (`produto.md` v0.14). A nota "Confira tudo antes de mandar" de dados que vieram de um link continua, como aviso de informação.

**Painel de órgão público**: folha de baixo (seção 5) com o ícone de prédio, o texto de hoje com a pergunta em negrito ("Este convite fala em nome de um órgão público?") e os botões "Mudar o texto" (principal) e "Seguir assim" (secundário).

**Erro e aviso que some**: como na seção 5. O texto dos erros não muda ("Erro: escreva o local." etc.); o aviso continua "Confira N campo(s)."

**Página do evento (quem recebe o link)**
- Faixa de cinco cores no topo; logo abaixo, a **faixa do evento** como aviso de atenção (triângulo), com o texto de hoje sem mudar uma palavra e a última frase ("Nunca faça pagamento…") em negrito; "Denunciar" como link sublinhado de 48 px dentro dela. A faixa continua a primeira coisa da página.
- Cor da página: sempre Musgo (o link não diz se veio de reunião, e não entra dado novo no link). Acima do título, "Convite" com o quadradinho do ícone de calendário.
- Título (30 px); "Quem chama, segundo quem criou o link: …" (texto de hoje); bloco com fundo `--cor-clara` com Quando (ícone de calendário) e Onde (ícone de local), rótulo pequeno em cima e o valor em negrito, "(horário do local do evento)" sem negrito; "Ver no mapa" (terciário, ícone de local); a descrição.
- Seções "Adicionar à agenda", "Compartilhar" e "Mais", com h2 de 19 px: o primeiro botão de cada seção é principal (na cor), os outros terciários com ícone. "Denunciar este evento" com o ícone de bandeira.
- Tela de link removido: mesma estrutura, com o texto de hoje num aviso de atenção. Nenhuma palavra muda (espera o advogado).

**Ata (Depois da reunião)**
- Topo Petróleo claro: "Depois da reunião" (com o ícone da ata) e o título "A ata"; a frase de hoje embaixo ("Escreva o que foi decidido. A ata fica só neste aparelho.").
- Os três avisos de hoje num cartão (`--superficie`, borda `--borda`), um por linha, cada um com ícone na `--cor`: relógio ("O rascunho some ao fechar."…), pessoas (lista de presença…) e cadeado (corretor ortográfico…). **Texto igual, palavra por palavra.**
- O lembrete do estatuto em `--tinta-suave`, com o ícone de livro, texto de hoje.
- Campos com a mesma cara do fluxo. Organização com exemplo em cinza (do rodízio de exemplos); Data com o calendário do celular, como hoje.

**Páginas institucionais (Sobre, Termos, Privacidade, Regras, Como denunciar, Contato) e as telas de erro**: só os tokens novos. A faixa "em revisão jurídica" vira aviso de atenção. Sem cor de porta.

## 8. Textos

**Novos ou mudados** (português simples; podem passar pelo teste de neutralidade como os outros):
- "Escreva com as suas palavras. O que está em cinza é só exemplo." (dica do passo 1)
- "Ex.: …" nos exemplos dentro dos campos.
- "Assim vai ficar a imagem" e "(com exemplo no que falta)" (linha da prévia).
- "(opcional)" no lugar de "(obrigatório)".
- Quadro do link da reunião: "Título, local e pauta vão no link." (em negrito) + "Quem receber pode repassar. Não escreva nome de pessoa nem assunto que só o grupo pode saber."
- "Escolha o dia num toque ou abra o calendário." (dica do passo 2)
- Local: "Como se fosse procurar no mapa. Se for numa casa, não ponha o nome de quem mora."
- "Cor da imagem"; "Mais opções (logo, outra cor, rodapé)".
- "Outros jeitos de usar" (Pronto); "A ata já abre com a pauta." (ponte da ata).
- "Convite" acima do título da página do evento.

**Não mudam de redação** (análise jurídica; esperam o advogado): "Nome de criança ou adolescente nunca.", os avisos da ata e o lembrete do estatuto, a faixa do evento, "segundo quem criou o link", o texto da tela de link removido, o painel de órgão público e a faixa "em revisão jurídica". Só mudam de formato e de lugar.

## 9. Fora desta rodada

- As imagens geradas (card, cartaz, as 6 paletas) ficam como estão.
- Nome definitivo e logo: a marca de cinco pontos é provisória, como o nome.
- Ilustrações e fotos: nenhuma.

## 10. Classes no código

> Escrito pela Sessão 1 (07/11/2026), para as Sessões 2 e 3. Estilos em `src/comum/tema.css` (botões) e `src/comum/componentes.css` (o resto). Cada classe desta tabela é conferida em `src/comum/tema.test.ts`: se sumir do CSS, o teste falha.

**Cor da porta.** Ponha `data-porta="reuniao"` (ou `evento`, `aviso`, `resultado`, `agradecimento`) no elemento de fora da tela (ex.: a `<section>` do passo). Tudo dentro dela passa a usar `--cor` e `--cor-clara` da porta, e o foco (`--foco`) também. Tudo o que usa `--cor` ou `--foco` (barra fixa de baixo, `<dialog class="painel">`) precisa ficar **dentro** do elemento com `data-porta`; o aviso que some e a folha de saída ficam no `body` e usam só tinta e papel. Fora de uma porta, `--cor` é a tinta e `--cor-clara` é a `--atencao`. As cores de cada porta também existem soltas, para a marca de cinco cores: `--cor-reuniao`, `--clara-reuniao` e assim por diante. Nomes antigos que ainda funcionam, como apelidos, e saem quando as telas trocarem: `--destaque` (= `--cor`), `--sobre-destaque` (= `--sobre-cor`), `--porta-fundo`, `--porta-texto` e `--porta-desc` (fundo, texto e texto suave da porta da reunião). Outros tokens novos: `--raio-botao` (14 px), `--raio-aviso` (14 px), `--raio-cartao` (20 px).

**Ícones.** `icone(nome, { tamanho?, traco?, classe? })` em `src/comum/icones.ts` devolve o `<svg>` (24 × 24 por padrão, traço 2, `stroke="currentColor"`, `aria-hidden="true"`, `focusable="false"`, classe `icone`). A cor vem do texto em volta (`color`). Nomes: `reuniao`, `evento`, `aviso`, `resultado`, `agradecimento` (as portas), `pessoas` (= reunião) e `calendario` (= evento), e os da seção 6: `info`, `atencao`, `erro`, `ata`, `chevron`, `direita`, `esquerda`, `abrir`, `check`, `relogio`, `local`, `enviar`, `baixar`, `copiar`, `link`, `imprimir`, `lapis`, `mais`, `celular`, `conversa`, `compartilhar`, `denunciar`, `predio`, `cadeado`, `livro`, `lupa`. O tipo `NomeDoIcone` lista todos. O ícone é sempre enfeite: o texto ao lado é que informa.

**Formulário** (`src/comum/formulario.ts`). `campoTexto` e `campoAreaDeTexto` aceitam `exemplo: '...'`, que vira `placeholder="Ex.: ..."` (na área de texto, só a primeira linha leva "Ex.:"). Campo sem `obrigatorio: true` ganha "(opcional)" no rótulo; o obrigatório leva só `aria-required`. `mostrarErro` põe o ícone de erro antes de "Erro: <motivo>" (o `textContent` continua "Erro: <motivo>").

| Classe | Onde | Para que serve |
|---|---|---|
| `botao` | `<button>`, `<a>` | Botão principal: fundo `--cor`, texto `--sobre-cor`, 52 px, cantos de 14 px. Base de todos os botões. |
| `botao-sec` | com `botao` | Secundário: contorno de 2 px na tinta, fundo transparente ("Voltar", "Mudar algo", "Seguir assim"). |
| `botao-ter` | com `botao` | Terciário: fundo `--superficie`, contorno `--borda-campo`, ícone na `--cor` à esquerda e texto à esquerda (saídas do Pronto, página do evento). |
| `botao-alto` | com `botao` | Botão de 60 px ("Mandar no WhatsApp"). |
| `link-acao` | `<a>`, `<button>` | Link de ação: sublinhado, negrito, na `--cor`, alvo de 48 px ("Apagar tudo", "Desfazer"). |
| `link-tinta` | com `link-acao` | O mesmo link, na tinta ("Fazer outro"). |
| `icone` | `<svg>` | Posta por `icone()`; não encolhe dentro de flex. |
| `cartao` | bloco | Cartão: fundo `--superficie`, borda `--borda`, cantos de 20 px, `--sombra` (avisos da ata). |
| `aviso-info` | bloco | Aviso de informação: fundo `--cor-clara`, sem borda, cantos de 14 px. Dentro: `icone('info', { classe: 'aviso-icone' })` e `.aviso-corpo`. Primeira frase em `<strong>`. |
| `aviso-atencao` | bloco | Aviso de atenção: fundo `--atencao` (areia), sem borda. Dentro: `icone('atencao', { classe: 'aviso-icone' })` e `.aviso-corpo`. Frase principal em `<strong>`. |
| `aviso-icone` | `<svg>` do aviso | Ícone do aviso: na `--cor` (informação) ou na tinta (atenção). |
| `aviso-corpo` | dentro do aviso | O texto do aviso (um ou mais `<p>`). |
| `icone-quadro` | `<span>` com o ícone | Quadrado de ícone cheio: fundo `--cor`, ícone `--sobre-cor`, 46 px. |
| `icone-quadro-claro` | com `icone-quadro` | Quadrado claro: fundo `--cor-clara`, ícone `--cor`. |
| `icone-quadro-p` | com `icone-quadro` | Quadrado de 30 px (use o ícone com `tamanho: 18`). |
| `icone-quadro-g` | com `icone-quadro` | Quadrado de 52 px. |
| `icone-quadro-gg` | com `icone-quadro` | Quadrado de 62 px. |
| `pilulas` | bloco | Fileira de pílulas que quebra linha. |
| `pilula` | `<button type="button" aria-pressed>` | Atalho do dia: 48 px, pílula com contorno; com `aria-pressed="true"`, cheia na `--cor`. |
| `pilula-check` | `<svg>` dentro da pílula | `icone('check', { tamanho: 18, classe: 'pilula-check' })`: só aparece na escolhida. |
| `painel` | `<dialog>` | Folha que sobe de baixo, aberta com `showModal()`, fundo escurecido atrás. Esc dispara `cancel`: trate como a escolha segura ("Mudar o texto"). Sem animação com "reduzir movimento". |
| `painel-acoes` | dentro do painel | Os botões empilhados (principal e secundário). |
| `campo-opcional` | posta por `formulario.ts` | "(opcional)" em `--tinta-suave`. (`campo-obrig` tem o mesmo estilo até o fluxo trocar.) |
| `campo-erro-icone` | posta por `mostrarErro` | Ícone de erro antes de "Erro: …". |
| `aviso-vivo` | posta por `aviso.ts` | O aviso que some: pílula de tinta com texto creme e ícone "i". Nada a fazer nas telas. |

O campo (`campo`, `campo-rotulo`, `campo-dica`, `campo-entrada`, `campo-erro`) mantém os nomes de antes; muda só a cara: 52 px, fonte de 17 px, exemplo em `--exemplo`, foco de 3 px na `--cor`, erro com borda de 4 px. Componentes que ficam com as Sessões 2 e 3, cada uma no CSS da sua tela: porta do início, marca e faixa de cinco cores, topo do passo, linha da prévia, barra fixa de baixo, opções de formato e bolinhas de cor.

**Alto contraste (forced-colors):** avisos, quadrados de ícone, cartão e painel ganham borda `CanvasText`; a pílula escolhida fica em `Highlight` (foco em `CanvasText`); o botão principal mantém o fundo (regra de `tema.css`).

**Cuidados de acessibilidade ao usar** (da revisão de 07/11/2026):
- **Painel (`<dialog class="painel">`):** dê nome com `aria-labelledby` (o título ou a pergunta em negrito); ponha `autofocus` no botão seguro ("Mudar o texto"), para o `showModal()` não focar a ação de risco; trate `cancel` (Esc) como a escolha segura; guarde quem abriu e devolva o foco a ele no `close` (se a tela refez o HTML, foque o elemento novo equivalente). Tocar no fundo escurecido não fecha: é uma confirmação.
- **Pílulas:** o `div.pilulas` leva `role="group"` e `aria-label` (ex.: "Atalhos do dia").
- **Avisos:** o ícone é `aria-hidden`, então o leitor de tela não ouve se é informação ou atenção. Onde o tipo importa e o texto não está na lista que não muda de redação (seção 8), comece a frase dizendo o que é. Nos textos da análise jurídica, só formato e lugar mudam.
- **Exemplo no campo de uma linha:** o `::placeholder` não quebra linha. Use exemplos curtos (até uns 28 letras) em `<input>`; o que for maior vai numa área de texto.
