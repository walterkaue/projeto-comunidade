# Moderação: tirar do ar um link de evento

> Onda 1. A página de evento não guarda nada no servidor: o conteúdo está no próprio link. Para "remover" um link denunciado, o site passa a recusá-lo.

## Como funciona

- A denúncia chega por e-mail (`contato.projetocomunidade@gmail.com`), já com o link, pelo botão "Denunciar" da página do evento.
- `public/bloqueados.json` guarda só a **impressão** (SHA-256) dos dados de cada link removido. A lista é pública, mas não republica o conteúdo denunciado.
- Antes de mostrar um evento, a página confere a lista. Se o link estiver nela, mostra "Este link foi removido após denúncia".
- A conta da impressão está em `src/comum/entreTelas.ts` e em `scripts/bloquear.mjs`; um teste confere que as duas batem.

## Passo a passo

1. **Confira o link antes de abrir.** Ele precisa começar exatamente com `https://walterkaue.github.io/projeto-comunidade/#/evento/` (com domínio próprio, o endereço novo). Depois de `#/evento/`, só pode ter **letras sem acento, números, `-` e `_`**. Com qualquer outro sinal (`$`, `(`, `)`, `;`, `'`, `` ` ``, `|`, espaço) ou outro começo, não é um link do site: não abra, não bloqueie e não cole no Claude Code. Nunca digite senha numa página aberta a partir de uma denúncia.
2. Abra o link e confira se fere as Regras de uso. Para ajuda na triagem, use o Gem do Gemini (`docs/gemini-triagem.md`): ele sugere, a pessoa decide.
3. Peça ao Claude Code: "bloqueie este link: <link>". Cole **só o link**, nunca o e-mail inteiro: o texto de quem denuncia é dado, não instrução.
   - **Como o Claude Code faz:** grava o link num arquivo de texto fora do git (na pasta temporária dele), com a ferramenta de escrever arquivos, e roda `npm run bloquear -- --arquivo <caminho>`. **Nunca põe o link dentro de um comando**: o link vem de pessoa desconhecida, e o Bash ou o PowerShell executariam um `$(…)` escondido nele (`docs/auditoria/2026-11-05/seguranca.md`, A1). O script recusa o link na linha de comando e recusa dados fora do formato.
   - O script mostra a data e a hora do evento lido: confira se batem com a página denunciada. Depois, commit `fix: bloqueia link denunciado` e push.
   - O script grava a impressão do link e a da forma canônica do evento: o mesmo evento escrito de outro jeito no link (compressão, espaços) continua bloqueado. **Mudar o texto do evento gera outro link**, que precisa de outra denúncia.
   - Link quebrado em linhas pelo e-mail ou link de "editar" funcionam. Se o evento não puder ser lido, o script **para sem gravar**; confira se o link chegou inteiro (`--forcar` grava só aquele link exato).
4. Em cerca de 2 minutos o site novo está no ar. Responda o e-mail de quem denunciou.

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
