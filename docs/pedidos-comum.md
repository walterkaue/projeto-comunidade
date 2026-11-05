# Pedidos para o código compartilhado

> Sessões de ferramenta não editam `src/comum/`, `src/main.ts`, `src/paginas/`, `testes/`, tema nem configuração. Quando precisarem de algo ali, escrevem um pedido aqui. Uma sessão só atende os pedidos depois, juntando todos.

<!--
Modelo de pedido (copie, preencha e apague os comentários):

### AAAA-MM-DD · sessão <nome> · <título curto>
- **O que precisa:** ...
- **Por quê:** ...
- **Sugestão de assinatura:** `function nome(arg: Tipo): Retorno`
- **Cópia provisória:** arquivo em src/ferramentas/<nome>/ (marcada com "// cópia provisória: pedido em docs/pedidos-comum.md")
-->

## Pedidos abertos

### 2026-11-05 · sessão evento · liberar dois links de saída em `testes/peso.test.ts`
- **O que precisa:** o teste "o build não cita outro domínio (privacidade)" recusa qualquer `https://` no JS do build, e hoje falha por causa de dois links que o produto pede (`docs/produto.md` 7.2): "Ver no mapa" (`https://www.google.com/maps/search/?api=1&query=…`) e o link do Google Agenda (`https://calendar.google.com/calendar/render?action=TEMPLATE&…`). Incluir os dois no `permitido` do teste, só para esses dois prefixos e só no arquivo `assets/evento-*.js`.
- **Por quê:** são links que a pessoa toca (abrem pelo aviso de saída, `src/comum/saida.ts`), não chamadas de rede; `testes/privacidade.test.ts` já aceita `<a href="https://…">`. Montar o endereço em pedaços só para escapar do teste foi descartado: seria driblar a regra.
- **Sugestão:** em `permitido(url, linha)`, acrescentar `|| /^https:\/\/(www\.google\.com\/maps\/search\/|calendar\.google\.com\/calendar\/render\?)/.test(url)`.
- **Enquanto isso:** `npm test` tem 1 falha (só esse teste); o resto passa e o build gera normalmente.

### 2026-11-05 · sessão evento · `npm run bloquear` deve incluir também a forma canônica do evento
- **O que precisa:** `scripts/bloquear.mjs` hoje põe em `public/bloqueados.json` só o SHA-256 dos dados do link como vieram. O mesmo evento pode ser escrito de muitas formas (marca `z` ou `r`, espaço no JSON, 2 bits soltos no último caractere do base64, caractere invisível no texto) e cada uma tem outro SHA-256. A página de evento já confere **as duas impressões** (a do link como veio e a da forma canônica, `dadosCanonicos` em `src/ferramentas/evento/formato.ts`), mas só adianta se a lista tiver a canônica.
- **Por quê:** sem isso, quem teve o link removido volta trocando 1 caractere do link.
- **Sugestão:** o script lê o link, decodifica (marca `r`: base64url; marca `z`: `zlib.inflateRawSync`), valida e limpa os 7 campos como `validarEvento` (`src/ferramentas/evento/validar.ts`) e grava, além da impressão do link, o SHA-256 de `"1r" + base64url(JSON.stringify([titulo, data, inicio, fim, local, descricao, organizacao]))`. Como o script é `.mjs`, o jeito mais simples é o `validar.ts`/`formato.ts` serem importados por ele (Node 24 lê `.ts`; hoje o `formato.ts` importa `./validar` sem extensão, então ajustar junto). Acrescentar teste de que as duas contas batem (como o teste atual da impressão).

### 2026-11-05 · sessão evento · título da aba por tela (`document.title`)
- **O que precisa:** o roteador (`src/main.ts`) trocar `document.title` a cada tela (ex.: o texto do `h1` + " – " + NOME). Hoje toda tela, inclusive a página de um evento, tem a aba "Projeto Comunidade" (WCAG 2.4.2).
- **Sugestão:** depois de `mostrar(...)` e depois que a tela terminar de carregar o conteúdo, ler o `h1`. As telas do evento carregam o conteúdo de forma assíncrona (conferem a lista de bloqueio): sugerir que a `Tela` possa devolver/avisar o título, ou observar o `h1` com um `MutationObserver` no `#app`.

### 2026-11-05 · sessão evento · acabamentos comuns de acessibilidade
- **O que precisa:** (1) `src/comum/saida.ts`: ligar o `<p>` da folha de saída ao diálogo com `aria-describedby`, para o leitor de tela ler "Você vai sair do… e abrir <domínio>" ao abrir; (2) `src/comum/componentes.css`: `html { scroll-padding-bottom: 5rem; }` para o aviso (`.aviso-vivo`, fixo no rodapé por 5 s) não cobrir o botão focado; (3) um rodapé ou `<nav>` comum a todas as telas (hoje o rodapé com Sobre, Termos e Regras só existe na página inicial): quem abre um link de evento no WhatsApp não encontra Termos, Regras nem "Como denunciar" sem voltar ao início.
- **Por quê:** achados da revisão de acessibilidade (WCAG 2.4.3, 4.1.2, 2.4.5). A tela do evento já tem os links "Conhecer o Projeto Comunidade" e "Denunciar".

## Pedidos atendidos

Nenhum.
