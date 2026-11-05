# Divisão de trabalho entre modelos

> Como quebrar uma tarefa para gastar menos tokens sem perder qualidade. O processo passo a passo está na skill `planejar-tarefa`.

## A regra

Tarefa complexa começa no Opus mais recente, em intensidade alta. Essa conversa avalia o todo, quebra em partes, escolhe quem executa cada uma e confere o resultado. Depois do plano aprovado, cada parte vai para o executor mais barato que mantém a qualidade.

## Quando dividir

Dividir tem custo: cada sessão nasce com milhares de tokens de ferramentas e instruções.

- **Não divida** o que cabe em cerca de 10 chamadas de ferramenta, nem partes que precisam das mesmas alterações ao mesmo tempo.
- **Divida** quando a parte tem resultado próprio, escopo fechado e dá para escrever "pronto quando" em uma frase.
- **Dois executores nunca mexem nos mesmos arquivos.** Se isso for necessário, a parte é uma só, ou a segunda espera a primeira.
- **Sessões paralelas:** cada ferramenta mexe só em `src/ferramentas/<nome>/` e nos testes dela. O que é compartilhado (`src/comum/`, `src/main.ts`, `src/paginas/`, `testes/`, tema, configuração) vira pedido em `docs/pedidos-comum.md`, atendido depois por uma sessão só.

## Quem faz o quê

| Trabalho | Executor | Modelo | Intensidade |
|---|---|---|---|
| Plano, arquitetura, decisão de risco | Conversa principal | Opus | alta |
| Ferramenta ou página com escopo claro | Sessão própria, worktree próprio, só a própria pasta | Sonnet | média |
| Parte que volta para a conversa | Subagente `executor` | Sonnet | média |
| Ajuste mecânico, texto, busca no código | Subagente `mecanico` | Haiku | baixa |
| Revisão de diff | Subagente `revisor` | Sonnet | alta |
| Acessibilidade | Subagente `revisor-acessibilidade` | Sonnet | alta |
| Rede, armazenamento, dados em link, texto partidário | Subagente `revisor-privacidade-neutralidade` | Opus | alta |

- Em dúvida entre dois níveis, comece pelo mais barato só se o erro for fácil de notar. Erro de privacidade, neutralidade ou acessibilidade não é fácil de notar: fique com o nível de cima.
- **Quem escreveu não revisa o próprio trabalho.**
- Identificadores de hoje: `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`. Atualize aqui quando sair modelo novo.

## Sessão ou subagente

- **Sessão** (`start_session`): a parte termina em branch ou PR próprio, ou o Kauê pode querer abrir e acompanhar. Sempre em worktree próprio se escrever código.
- **Subagente** (`Agent`): o resultado volta para a conversa no mesmo turno, como busca, teste, revisão ou ajuste pequeno.

## Modelo de brief

O executor não viu a conversa, e cada linha de brief poupa leitura.

```
Tarefa: o que fazer, em uma ou duas frases.
Arquivos: onde mexer, e onde não mexer.
Leia: seções exatas dos docs (ex.: docs/produto.md, seção tal).
Decisões já tomadas: o que não deve ser rediscutido.
Pronto quando: resultado verificável.
Entrega: branch ou PR, ou o que devolver.
```

Quem planeja cita as seções dos docs; quem executa lê só elas. As regras do `CLAUDE.md` chegam a toda sessão sozinhas.

## Limites

- Uma conversa não troca o próprio modelo. Por isso, depois do plano, a conversa em Opus espera os avisos em vez de acompanhar passo a passo.
- Sessão criada só pode usar modelo e intensidade iguais ou mais baratos que os da conversa que a criou.
- Estas regras orientam o Claude, mas não travam nada. Escolha errada se corrige na revisão. Se uma faixa da tabela der retrabalho, suba um nível e registre aqui.
