# Teste de legítimo interesse (LGPD, art. 10)

> 05/11/2026 · Registro pedido pela análise jurídica preliminar de 05/11/2026 (feita por IA). **O advogado confere antes da divulgação.** Responsável pelos dados: Kauê Sevilhano Walter, pessoa física (`src/comum/marca.ts`). Mudou o uso, refaça este teste.

O projeto usa o legítimo interesse (LGPD, art. 7º, IX) em três usos. Para cada um: a finalidade, se o dado é mesmo necessário, o impacto em quem tem o dado e os cuidados que equilibram.

## 1. Denúncias por e-mail

| Ponto | Resposta |
|---|---|
| Finalidade | Moderar o serviço (tirar do ar link que fere as Regras de uso) e responder a quem denunciou. Quando a lei manda remover (Marco Civil, ECA Digital), soma-se o cumprimento de obrigação legal (art. 7º, II) e, para guardar o registro da decisão, o exercício regular de direitos (art. 7º, VI). |
| Dados | Endereço de e-mail de quem denuncia; o link do evento (que leva o conteúdo); o tipo de problema; o texto que a pessoa escreveu. |
| Necessidade | O e-mail é o único jeito de responder e de receber pedido de revisão. O link é o próprio objeto da denúncia. Nada além disso é pedido: o formulário diz "não precisa dar seu nome". |
| Expectativa de quem denuncia | Quem escreve para o canal de denúncia espera que a mensagem seja lida, analisada e respondida. A Política e a página "Como denunciar" dizem isso, e dizem que uma IA pode ajudar na triagem. |
| Impacto | Baixo. Os dados não são publicados nem vendidos e não servem para outro fim. O risco maior é dado sensível de terceiros dentro do conteúdo denunciado (por exemplo, nome de alguém ligado a uma igreja ou partido). Por isso, antes da IA, todo nome de pessoa vira "PESSOA 1": o que chega ao Gemini não identifica ninguém, e a regra "dado sensível nunca vai para IA" (`docs/produto.md`, 4.1) continua valendo. Para guardar o e-mail original, que pode ter esse dado, o legítimo interesse não vale (art. 11): a base é o exercício regular de direitos (art. 11, II, "d"). |
| Cuidados | Antes da IA, saem nome, e-mail e documento de quem denuncia, e todo nome de pessoa vira "PESSOA 1" (`docs/gemini-triagem.md`); Gemini com a atividade desligada e sem botões de avaliar; e-mail guardado por até 6 meses depois do caso e registro sem dados pessoais por 3 anos (`docs/moderacao.md`); planilha sem nome, e-mail, link ou trecho do conteúdo; quem decide é uma pessoa. |
| Transferência internacional | Gmail e Gemini guardam dados em servidores fora do Brasil, sob os termos de consumidor do Google. Com a associação, migrar para o Google Workspace (o Google vira operador, com as cláusulas-padrão da ANPD). |
| Conclusão | O interesse do projeto e de quem denuncia prevalece, com os cuidados acima. |

## 2. Contagem de visitas (GoatCounter)

| Ponto | Resposta |
|---|---|
| Finalidade | Saber quais telas são usadas, para manter e melhorar o serviço e achar problemas antes da divulgação. |
| Dados | O nome da tela (por exemplo, "/evento") e o nome do site. O navegador manda, como em qualquer acesso, o IP, os dados do navegador e o idioma. |
| Necessidade | Só o nome da tela é enviado pelo site. Nunca vão os dados do evento, do card, da ata, o título da aba, a origem da visita nem o tamanho da tela (`src/comum/metricas.ts`, com teste). |
| Papel do GoatCounter | Operador: trata os dados por conta do projeto. Não guarda o IP; usa IP e navegador só na memória, por até 8 horas; guarda contagens agregadas (tela, navegador, sistema, país ou região, idioma, conforme o painel). Servidores na Finlândia e na Alemanha (União Europeia). Guardar uma cópia datada dos termos e da política dele aqui em `docs/`. |
| Expectativa de quem visita | Contagem simples de visitas, sem cookie, é comum em sites públicos. A Política descreve o fluxo. |
| Impacto | Mínimo: sem cookie, sem identificador guardado no aparelho, sem perfil, sem cruzamento com outros sites, sem publicidade. Vale também para crianças e adolescentes (ECA Digital, art. 26: nada de perfil para publicidade). |
| Cuidados | Nunca mandar dado do conteúdo; nunca ligar no GoatCounter recursos que cruzem visitas entre sites ou guardem identificador; nunca usar os números para publicidade ou para descobrir quem é menor; conferir uma vez por ano se os servidores continuam na União Europeia. Opcional: não contar quando o navegador pede "Do Not Track" ou "Global Privacy Control". |
| Conclusão | O interesse do projeto prevalece, com impacto mínimo. Não é preciso consentimento nem aviso na entrada do site. |

## 3. Mensagens de contato

| Ponto | Resposta |
|---|---|
| Finalidade | Responder dúvidas, sugestões e pedidos. |
| Dados | O e-mail de quem escreve e o que escreveu. |
| Necessidade e impacto | Mínimos: sem a mensagem não há resposta, e ela não tem outro uso. |
| Cuidados | Guardadas por até 6 meses depois de encerrada a conversa, com a mesma exceção das denúncias (processo ou ordem de autoridade). Limpeza mensal (`docs/moderacao.md`). |
| Conclusão | O interesse de quem escreveu e do projeto prevalece. |
