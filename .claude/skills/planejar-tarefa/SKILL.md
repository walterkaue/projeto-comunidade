---
name: planejar-tarefa
description: Avalia a complexidade de uma tarefa nova e a quebra em partes com executor, modelo e intensidade, para economizar tokens sem perder qualidade. Use como primeira ação em tarefa complexa do Projeto Comunidade, como ferramenta nova, mudança em vários arquivos, lote grande ou pedido com várias frentes. Não use em ajuste que cabe em cerca de 10 chamadas de ferramenta.
---

# Planejar tarefa

Leia `docs/orquestracao.md` e `docs/produto.md` antes de planejar.

## 1. Avalie o todo

- Cabe em cerca de 10 chamadas de ferramenta: faça direto e pare de seguir esta skill.
- É complexa e a conversa não está em Opus de intensidade alta: diga isso em uma linha e siga.

## 2. Quebre em partes

Cada parte tem resultado próprio e não divide arquivos com outra. Para cada uma, escolha o executor pela tabela "Quem faz o quê" de `docs/orquestracao.md`.

Lembre da **regra das sessões paralelas** do `CLAUDE.md`: cada ferramenta tem a sua pasta (`src/ferramentas/<nome>/`). `src/comum/`, `src/main.ts`, `src/paginas/`, `testes/`, tema e configuração são compartilhados. Não coloque duas partes mexendo neles; o que a ferramenta precisar ali vira pedido em `docs/pedidos-comum.md`, atendido por uma parte própria depois.

Junte partes que dariam menos trabalho juntas: dividir tem custo.

## 3. Apresente o plano

Uma tabela, sem texto sobrando:

| Parte | Executor | Modelo | Intensidade | Arquivos | Pronto quando |
|---|---|---|---|---|---|

Depois dela, diga a ordem, o que depende do quê, o que fica no Opus e o que precisa do Kauê (painel, conta, senha). Espere a aprovação.

## 4. Crie as sub-conversas

A aprovação do plano já autoriza isso. Escreva cada brief pelo "Modelo de brief" de `docs/orquestracao.md`.

- **Sessão:** `start_session` com `initiation: "user_asked"`, `context: "fresh"`, `model`, `effort` e `use_worktree: true` se escrever código. Se a ferramenta não existir (terminal), use subagente.
- **Subagente:** `Agent` com `subagent_type` `executor`, `mecanico`, `revisor`, `revisor-acessibilidade` ou `revisor-privacidade-neutralidade`. O modelo e a intensidade vêm do perfil.

Faça aqui o que é de arquitetura e decisão, sem esperar as sessões.

## 5. Confira

- Não acompanhe sessão por sessão: espere o aviso de cada uma.
- O aviso é um relato, não prova. Confira o diff e rode `npm test` antes de dizer que terminou.
- Prove em worktree novo: pasta fora do git que sobrou no worktree do executor pode esconder falha.
- Ferramenta pronta passa pelo `revisor`, pelo `revisor-acessibilidade` e, se mexe em rede, armazenamento, link ou texto da plataforma, pelo `revisor-privacidade-neutralidade`.
- Ao fechar, ajuste `docs/orquestracao.md` se uma faixa deu retrabalho.
