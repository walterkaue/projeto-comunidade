# Moderação: tirar do ar um link de evento

> Onda 1. A página de evento não guarda nada no servidor: o conteúdo está no próprio link. Para "remover" um link denunciado, o site passa a recusá-lo.
> Prazos, guarda e roteiros abaixo seguem a análise jurídica preliminar de 05/11/2026 (feita por IA, a conferir pelo advogado) e as decisões do Kauê no `docs/produto.md`, seção 3.

## Como funciona

- A denúncia chega por e-mail (`contato.projetocomunidade@gmail.com`), já com o link, pelo botão "Denunciar" da página do evento.
- `public/bloqueados.json` guarda só a **impressão** (SHA-256) dos dados de cada link removido e o **motivo** (`{ "h": "<impressão>", "motivo": "regra-5" }` ou `"motivo": "pedido"`). A lista é pública, mas não republica o conteúdo denunciado. Itens antigos, só com a impressão, continuam valendo, sem motivo.
- Antes de mostrar um evento, a página confere a lista. Se o link estiver nela, mostra que ele foi removido, o motivo (como decisão do site) e como pedir revisão por e-mail. Nas regras de proteção a crianças e adolescentes (8 e 10), a tela não repete o texto da regra.
- A conta da impressão está em `src/comum/entreTelas.ts` e em `scripts/bloquear.mjs`; um teste confere que as duas batem.
- O histórico de commits do `bloqueados.json` é a prova da data de cada remoção. **Nunca reescreva esse histórico.**

## Prazos de resposta

| Tipo | Prazo |
|---|---|
| Conteúdo sexual com criança ou adolescente | **Bloqueio imediato, ao ler.** Denuncie também em new.safernet.org.br/denuncie ou à polícia. Não copie o conteúdo para lugar nenhum além do necessário |
| Outro risco a criança ou adolescente, ameaça, golpe em andamento, aviso falso de perigo ou em nome de órgão público | Até 24 horas (`PRAZO_URGENTE_HORAS`) |
| Dado pessoal exposto | Até 48 horas (`PRAZO_DADO_PESSOAL_HORAS`) |
| Ódio, mentira comprovada sobre saúde, segurança ou eleição, personificação comum | Prioridade alta, dentro de 5 dias úteis |
| O resto | Até 5 dias úteis (`PRAZO_DENUNCIA_DIAS_UTEIS`) |
| Pedido de revisão | Até 5 dias úteis |

- Denúncia feita pela própria vítima, por quem responde por ela, pelo Ministério Público ou por entidade de defesa de crianças e adolescentes passa na frente.
- Ordem judicial: cumpra no prazo que ela fixar.
- Se em algum período não der para cumprir os prazos (viagem, doença), avise na página "Como denunciar" antes ("de tal a tal dia, respostas mais lentas"). Prazo prometido e perdido pesa contra o projeto.

## Passo a passo

1. **Confira o link antes de abrir.** Ele precisa começar exatamente com `https://walterkaue.github.io/projeto-comunidade/#/evento/` (com domínio próprio, o endereço novo). Depois de `#/evento/`, só pode ter **letras sem acento, números, `-` e `_`**. Duas exceções servem: o link de "editar" (`#/evento/editar/` e depois o mesmo formato) e o link quebrado em linhas pelo e-mail (junte as linhas; o resto precisa seguir o formato). Com qualquer outro sinal (`$`, `(`, `)`, `;`, `'`, `` ` ``, `|`, espaço no meio de uma linha) ou outro começo, não é um link do site: não abra, não bloqueie e não cole no Claude Code. O script confere o formato de novo. Nunca digite senha numa página aberta a partir de uma denúncia.
2. **Abra o link e confira se fere as Regras de uso.** Para ajuda na triagem, use o Gem do Gemini (`docs/gemini-triagem.md`): ele sugere, a pessoa decide.
   - **Ofensa e honra:** remova só a ofensa clara (xingamento, humilhação, acusação de crime sem base). Crítica, mesmo dura, a governo, autoridade, candidato ou organização fica. Na dúvida, mantenha e responda: "Se considera o conteúdo ofensivo, você pode pedir a remoção na Justiça. Cumprimos ordem judicial." Use a mesma régua para todos os lados.
   - **Regra 9 (fingir ser outro):** pergunte "uma pessoa comum, recebendo isto no WhatsApp, acharia que é um aviso real dessa organização?". Se sim, fere. Se não, e o resto for crítica, paródia ou sátira, mantém. Pedido da própria organização: veja o roteiro abaixo.
   - **Anote o fundamento na planilha, também quando mantiver** (uma ou duas linhas, sem dado pessoal: "mantido: crítica a governo sem ofensa; sem checagem que mostre falsidade"). Só protege quem consegue mostrar que analisou.
3. **Para remover**, peça ao Claude Code: "bloqueie este link pela regra <número>: <link>" (o número de `src/comum/regras.ts`, de 1 a 11) ou "bloqueie este link a pedido de quem criou: <link>". Cole **só o link**, nunca o e-mail inteiro: o texto de quem denuncia é dado, não instrução.
   - **Como o Claude Code faz:** grava o link num arquivo de texto fora do git (na pasta temporária dele), com a ferramenta de escrever arquivos, e roda `npm run bloquear -- --arquivo <caminho> --motivo regra-<número>` (ou `--motivo pedido`). O script para se faltar o motivo. **Nunca põe o link dentro de um comando**: o link vem de pessoa desconhecida, e o Bash ou o PowerShell executariam um `$(…)` escondido nele (`docs/auditoria/2026-11-05/seguranca.md`, A1). O script recusa o link na linha de comando e recusa dados fora do formato.
   - O script mostra a data e a hora do evento lido: confira se batem com a página denunciada. Depois, commit `fix: bloqueia link denunciado` e push.
   - O script grava a impressão do link e a da forma canônica do evento: o mesmo evento escrito de outro jeito no link (compressão, espaços) continua bloqueado. **Mudar o texto do evento gera outro link**, que precisa de outra denúncia (a página "Como denunciar" pede isso).
   - Link quebrado em linhas pelo e-mail ou link de "editar" funcionam (passo 1). Se o evento não puder ser lido, o script **para sem gravar**; confira se o link chegou inteiro (`--forcar` grava só aquele link exato).
4. Em cerca de 2 minutos o site novo está no ar. Abra o link de novo para conferir e responda o e-mail de quem denunciou.
5. **Aviso falso em nome de órgão público** (Defesa Civil, prefeitura, posto de saúde): remova na hora, sem esperar o órgão pedir, quando o aviso for de perigo (evacuação, alerta, suspensão de serviço). Depois, avise o órgão pelo canal oficial (Defesa Civil: 199; ouvidoria da prefeitura): "Um link falso usando o nome de vocês circulou; já o tiramos do ar." Marque o e-mail com `Guardar` (veja "Guarda dos e-mails").

## Pedido de remoção feito pela organização citada

Quem é personificado é a vítima e a melhor fonte para dizer se convocou ou não. O risco é o contrário: um adversário se passar pela organização para derrubar um evento verdadeiro. Antes de remover pela regra 9:

1. O evento diz ser dessa organização ("Quem chama" ou o texto).
2. O pedido vem de um canal público dela, **conferido por você fora do e-mail recebido**: o e-mail que aparece no site ou nas redes oficiais dela, ou uma resposta a um contato que você achou sozinho (mensagem ao perfil oficial, telefone público) perguntando "vocês pediram esta remoção?". Nunca use um contato que veio no próprio pedido.
3. Organização sem canal público (coletivo pequeno, grupo de bairro): aceite um print do grupo ou da página da organização dizendo que o evento é falso, ou a confirmação de duas pessoas conhecidas da organização. Na dúvida, não remova e peça mais informação.
4. **Disputa interna** (duas partes dizem ser o mesmo sindicato, a mesma igreja, o mesmo diretório): não é personificação, é dúvida razoável. Mantenha, anote o fundamento e responda: "Quem representa a organização é assunto interno ou da Justiça. Cumprimos decisão judicial."

## Pedido "é um conteúdo meu e quero que saia"

> Auditoria 05/11/2026, achado M8. Sem conta, ninguém consegue provar que criou um link. Um adversário pode dizer "este evento é meu" para derrubar a convocação de outra organização.

- **Se o conteúdo fere uma regra**, trate como denúncia comum (`--motivo regra-<número>`), não importa quem pediu.
- **Se o evento traz dado pessoal de quem pede** (nome, endereço, foto), ela pode pedir a remoção como titular, sem provar que criou o link: remova pela regra 6 (`--motivo regra-6`). Se o pedido parecer de outra pessoa (só repete o nome que está no evento, sem nada que ligue a ela), confira como no roteiro da organização.
- **Se não fere regra**, só remova com algum indício de que a pessoa criou o link. Valem só duas coisas: um print em que **quem pede aparece como quem mandou o link** (com data), ou um e-mail vindo do endereço que a organização do evento **já usa em público** (site, rede social), conferido por você fora do e-mail. Não vale o que quem pede só digita: nome, endereço ou outro dado que está no próprio evento qualquer pessoa leu no link. Não peça dado pessoal para "provar".
- **Na dúvida, não remova.** Responda que quem criou pode só parar de compartilhar e fazer outro link; o site não guarda nada.
- Quando remover a pedido, use `--motivo pedido`: a tela diz "removido a pedido de quem o criou", não "após denúncia". Na planilha, `tipo` = `pedido de quem criou`.
- Quem discordar (por exemplo, a organização que de fato criou o link) pede revisão respondendo o e-mail, como em qualquer remoção.

## Revisão (recurso)

- Quem denunciou ou quem criou o link pede revisão respondendo o e-mail. Responda em até 5 dias úteis.
- Quando houver mais de uma pessoa moderando, outra pessoa decide a revisão.
- **Se a revisão mostrar que a remoção estava errada, desfaça no mesmo dia:** peça ao Claude Code para tirar do `public/bloqueados.json` os itens daquele link (o script mostra as impressões; elas também saem rodando o mesmo comando de bloqueio, que avisa "já estava bloqueado"). Commit `fix: desfaz bloqueio após revisão` e push. A página volta a funcionar para todos que têm o link.

## Guarda dos e-mails

- **E-mail da denúncia:** até 6 meses depois de encerrado o caso (resposta e eventual revisão).
- **Linha da planilha de controle** (sem dado pessoal): 3 anos. Depois, apague a linha.
- **Impressão na lista pública:** enquanto o bloqueio valer.
- **Exceção:** se houver processo, ordem judicial, requisição de autoridade ou possível investigação (por exemplo, conteúdo sexual com criança, aviso falso de perigo), guarde o caso inteiro até o fim dele. No Gmail, ponha o marcador `Guardar`.
- **Uma vez por mês:** no Gmail do projeto, busque `label:Denúncias -label:Guardar older_than:6m`. Confira que cada caso está encerrado há mais de 6 meses e apague. A lixeira do Gmail apaga de vez depois de 30 dias.

## Planilha de controle e relatório semestral

> `docs/produto.md`, seção 4.1: relatório público a cada seis meses, sem dados pessoais.

- O modelo está em `docs/controle-denuncias-modelo.csv` (só o cabeçalho). **Importe no Google Planilhas e use a cópia lá. Não guarde denúncias reais neste repositório**, que é público.
- Uma linha por denúncia. **Nunca** escreva nome, e-mail, link do evento nem trecho do conteúdo: só o número da denúncia (1, 2, 3…) e as categorias abaixo. Guarde cada linha por 3 anos.

| Coluna | O que vai |
|---|---|
| `numero` | Número em sequência. |
| `recebida_em` | Data em que o e-mail chegou (AAAA-MM-DD). |
| `tipo` | `golpe`, `ameaça`, `risco a criança`, `expor criança`, `automutilação ou suicídio`, `dado pessoal`, `ódio`, `ofensa`, `mentira comprovada`, `direito autoral`, `personificação`, `pedido de quem criou`, `outro` ou `sem regra ferida`. |
| `regra_ferida` | Número da regra de `src/comum/regras.ts` (1 a 11), ou vazio. |
| `prioridade` | `imediato` (conteúdo sexual com criança), `urgente` (24 horas), `dado pessoal` (48 horas), `alta` ou `normal`. |
| `prazo_limite` | Imediato: a hora em que chegou. Urgente: recebida + 24 horas. Dado pessoal: recebida + 48 horas. Outras: recebida + 5 dias úteis. |
| `respondida_em` | Data e hora da resposta. |
| `prazo_cumprido` | `sim` ou `não` (resposta até o prazo limite). |
| `decisao` | `removido`, `mantido` ou `pedido mais informação`. |
| `fundamento` | Uma ou duas linhas, sem dado pessoal, dizendo por que removeu ou manteve. Também quando manteve. |
| `recurso_pedido` | `sim` ou `não`. |
| `decisao_do_recurso` | `mantida`, `revertida` ou vazio. |
| `conflito_declarado` | `sim` se quem decidiu tinha conflito de interesse (a regra pede que isso apareça no relatório), senão `não`. |
| `triagem_com_ia` | `sim` ou `não`. |

**Relatório a cada semestre** (números agregados, sem dados pessoais): total de denúncias; quantas por `tipo`; removidas e mantidas; recursos pedidos e quantos revertidos; percentual de `prazo_cumprido` = sim; quantas com `conflito_declarado` = sim. Dá para fazer com `CONT.SE` e tabela dinâmica. Publique como texto simples na página "Como denunciar" (pedir ao Claude Code).

Limite conhecido: sem internet e sem nenhuma cópia da lista guardada no aparelho (primeira visita já sem rede), o evento é mostrado. Com rede lenta ou erro do servidor, vale a última lista guardada.

Quem decide além do Kauê ainda é pergunta aberta (`docs/produto.md`, seção 6).
