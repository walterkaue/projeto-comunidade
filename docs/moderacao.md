# Moderação: tirar do ar um link de evento

> Onda 1. A página de evento não guarda nada no servidor: o conteúdo está no próprio link. Para "remover" um link denunciado, o site passa a recusá-lo.

## Como funciona

- A denúncia chega por e-mail (`contato.projetocomunidade@gmail.com`), já com o link, pelo botão "Denunciar" da página do evento.
- `public/bloqueados.json` guarda só a **impressão** (SHA-256) dos dados de cada link removido. A lista é pública, mas não republica o conteúdo denunciado.
- Antes de mostrar um evento, a página confere a lista. Se o link estiver nela, mostra "Este link foi removido após denúncia".
- A conta da impressão está em `src/comum/entreTelas.ts` e em `scripts/bloquear.mjs`; um teste confere que as duas batem.

## Passo a passo

1. Abra o link denunciado e confira se fere as Regras de uso.
2. Peça ao Claude Code: "bloqueie este link: <link>". Ele roda `npm run bloquear -- "<link>"`, faz commit `fix: bloqueia link denunciado` e push.
3. Em cerca de 2 minutos o site novo está no ar. Responda o e-mail de quem denunciou.

Quem decide e com que regras ainda é pergunta aberta (`docs/produto.md`, seção 6).
