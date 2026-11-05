# Moderação: tirar do ar um link de evento

> Onda 1. A página de evento não guarda nada no servidor: o conteúdo está no próprio link. Para "remover" um link denunciado, o site passa a recusá-lo.

## Como funciona

- A denúncia chega por e-mail (`contato.projetocomunidade@gmail.com`), já com o link, pelo botão "Denunciar" da página do evento.
- `public/bloqueados.json` guarda só a **impressão** (SHA-256) dos dados de cada link removido. A lista é pública, mas não republica o conteúdo denunciado.
- Antes de mostrar um evento, a página confere a lista. Se o link estiver nela, mostra "Este link foi removido após denúncia".
- A conta da impressão está em `src/comum/entreTelas.ts` e em `scripts/bloquear.mjs`; um teste confere que as duas batem.

## Passo a passo

1. Abra o link denunciado e confira se fere as Regras de uso. Para ajuda na triagem, use o Gem do Gemini (`docs/gemini-triagem.md`): ele sugere, a pessoa decide.
2. Peça ao Claude Code: "bloqueie este link: <link>". Ele roda `npm run bloquear -- "<link>"`, faz commit `fix: bloqueia link denunciado` e push.
   - O script grava a impressão do link e a da forma canônica do evento: trocar um caractere do link não traz o evento de volta.
   - Link quebrado em linhas pelo e-mail ou link de "editar" funcionam. Se o evento não puder ser lido, o script **para sem gravar**; confira se o link chegou inteiro (`--forcar` grava só aquele link exato).
3. Em cerca de 2 minutos o site novo está no ar. Responda o e-mail de quem denunciou.

Limite conhecido: sem internet e sem nenhuma cópia da lista guardada no aparelho (primeira visita já sem rede), o evento é mostrado. Com rede lenta ou erro do servidor, vale a última lista guardada.

Quem decide e com que regras ainda é pergunta aberta (`docs/produto.md`, seção 6).

## Planilha de controle e relatório semestral

> `docs/produto.md`, seção 4.1: relatório público a cada seis meses, sem dados pessoais.

- O modelo está em `docs/controle-denuncias-modelo.csv` (só o cabeçalho). **Importe no Google Planilhas e use a cópia lá. Não guarde denúncias reais neste repositório**, que é público.
- Uma linha por denúncia. **Nunca** escreva nome, e-mail, link do evento nem trecho do conteúdo: só o número da denúncia (1, 2, 3…) e as categorias abaixo.

| Coluna | O que vai |
|---|---|
| `numero` | Número em sequência. |
| `recebida_em` | Data em que o e-mail chegou (AAAA-MM-DD). |
| `tipo` | `golpe`, `ameaça`, `risco a criança`, `dado pessoal`, `ódio`, `ofensa`, `mentira comprovada`, `direito autoral`, `outro` ou `sem regra ferida`. |
| `regra_ferida` | Número da regra de `regras.ts` (1 a 8), ou vazio. |
| `prioridade` | `urgente` (golpe, ameaça, risco a criança, dado pessoal exposto), `alta` ou `normal`. |
| `prazo_limite` | Urgente: recebida + 48 horas (`PRAZO_URGENTE_HORAS`). Outras: recebida + 5 dias úteis (`PRAZO_DENUNCIA_DIAS_UTEIS`). |
| `respondida_em` | Data e hora da resposta. |
| `prazo_cumprido` | `sim` ou `não` (resposta até o prazo limite). |
| `decisao` | `removido`, `mantido` ou `pedido mais informação`. |
| `recurso_pedido` | `sim` ou `não`. |
| `decisao_do_recurso` | `mantida`, `revertida` ou vazio. |
| `conflito_declarado` | `sim` se quem decidiu tinha conflito de interesse (a regra pede que isso apareça no relatório), senão `não`. |
| `triagem_com_ia` | `sim` ou `não`. |

**Relatório a cada semestre** (números agregados, sem dados pessoais): total de denúncias; quantas por `tipo`; removidas e mantidas; recursos pedidos e quantos revertidos; percentual de `prazo_cumprido` = sim; quantas com `conflito_declarado` = sim. Dá para fazer com `CONT.SE` e tabela dinâmica. Publique como texto simples na página "Como denunciar" (pedir ao Claude Code).
