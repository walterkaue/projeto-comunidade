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

## Pedidos atendidos

Nenhum.
