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

### 2026-11-05 · sessão cards · testes/peso.test.ts deve permitir o link do WhatsApp
- **O que precisa:** a varredura "o build não cita outro domínio" reprova `https://wa.me/?text=` (botão "Abrir no WhatsApp" dos cards, que é um `<a href target="_blank">` comum, permitido pelo `testes/privacidade.test.ts`). Liberar `https://wa.me/` na função `permitido` do teste.
- **Por quê:** o botão é pedido em docs/produto.md 7.1. Nada é carregado: só abre quando a pessoa toca.
- **Sugestão de assinatura:** em `permitido`, acrescentar `|| url.startsWith('https://wa.me/')`.
- **Cópia provisória:** `src/ferramentas/cards/textos.ts` monta o endereço em pedaços (`ENDERECO_DO_WHATSAPP`) para o teste passar. Quando o pedido for atendido, trocar pela string inteira.

### 2026-11-05 · sessão cards · quebrarTexto sem partir emoji composto
- **O que precisa:** `quebrarTexto` e `cortarTexto` (src/comum/texto.ts) separam palavra longa por ponto de código (`Array.from`), o que pode partir emoji composto (bandeira, família, tom de pele) quando uma palavra sozinha é mais larga que a linha. Usar `Intl.Segmenter` (granularidade `grapheme`) com volta para `Array.from` onde não existir.
- **Por quê:** título ou texto de card com emoji composto muito largo pode sair com o emoji cortado ao meio. Caso raro; os cards só quebram palavra assim se ela não couber numa linha.
- **Sugestão de assinatura:** `function letras(texto: string): string[]` (interna ao texto.ts), usada no lugar de `Array.from`.
- **Cópia provisória:** nenhuma (o caso é raro e não foi copiado; os cards usam o `quebrarTexto` comum como está).

