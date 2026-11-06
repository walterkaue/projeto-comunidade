# Onda 1 — plano de construção

> 05/11/2026 · Preparado pelo Chat depois da revisão de toda a base e do código público do Guerra de Torcidas. Aqui estão o escopo fechado, o plano em trilhas paralelas, as mensagens prontas para o Claude Code e o passo a passo fora do Code. As decisões que o Kauê ainda precisa confirmar estão na seção 1.
>
> **Para o estado de hoje e o que vem a seguir, leia `docs/proximos-passos.md`** (atualizado a cada rodada; o último retrato é de 06/11/2026).
>
> **Atualização de 05/11/2026:** este é o plano de construção, guardado como registro. Depois dele veio o **fluxo único** (`docs/produto.md` 7.6): a entrada deixou de ser "três ferramentas" e virou "O que você quer fazer?", com cinco portas, 3 passos e a tela Pronto; a ata ficou em "Depois da reunião" (`#/ata`). As ferramentas continuam as mesmas por dentro (pastas `cards`, `evento` e `reuniao`), e as telas novas moram em `src/ferramentas/fluxo/`. O roteiro das entrevistas (8.7) já está no fluxo novo.

## 1. O que considerei aprovado e o que falta confirmar

**Aprovado em 05/11** ("gostei bastante… prepare a Onda 1"): caminho A (gerador de cards) como porta de entrada e Onda 1 = itens 1, 2 e 3 da tabela da pesquisa.

**Decidi por padrão; o Kauê pode trocar antes da Sessão 0** (troca barata depois também):

| # | Assunto | Padrão adotado | Por quê |
|---|---|---|---|
| D1 | Onde o site roda no começo | Endereço gratuito do GitHub (`walterkaue.github.io/projeto-comunidade/`), em beta fechado | Não depende do nome nem de DNS; domínio próprio entra quando o nome estiver decidido |
| D2 | Nome no código | "Projeto Comunidade" num único arquivo de configuração | Trocar o nome depois é mudar uma linha |
| D3 | Licença do código | MIT; modelos e textos em CC BY 4.0 | Máximo de reaproveitamento por outras organizações |
| D4 | Rodapé "feito com…" nos cards | Ligado por padrão, mas **quem faz o card pode desligar** | Espalha a marca sem impor a marca da plataforma em material de ninguém, inclusive de campanha |
| D5 | Métricas | Nenhuma no beta; GoatCounter (sem cookie, código aberto, grátis) antes de divulgar | Independente de big tech, sem banner de cookies |
| D6 | Idade | Não perguntar idade na Onda 1 | Sem conta, sem dado, sem interação entre pessoas; autodeclaração tem risco no art. 9º do ECA Digital (pendência já registrada no Guerra). Confirmar com advogado |

## 2. Revisão da base: o que achei

1. **Caminhos errados nas instruções do Projeto.** Elas citam `claude/estado-do-projeto.md` e `claude/pesquisa-e-roadmap.md`, mas os dois estão na raiz. Correção na seção 8.1 (só o Kauê consegue editar as instruções).
2. **Página de evento com dados no link (item 2) tem mais risco do que a nota dizia.** Mesmo sem banco, o conteúdo aparece **no nosso domínio**: alguém pode montar um link com golpe ("pague o PIX aqui") ou desinformação e usar a nossa credibilidade. Mitigação adotada na seção 4: dados só no trecho depois do `#` (nem o servidor recebe), nenhum campo de link livre, PIX ou telefone, aviso fixo "conteúdo de quem enviou o link", botão de denúncia e **lista de links bloqueados publicada no próprio site**, que permite atender pedido de remoção sem banco de dados. Pergunta nova para o advogado (seção 8.6).
3. **Ata e lista de presença (item 3).** Nome de quem foi a uma reunião de sindicato, partido ou igreja revela filiação, que é dado sensível. Regra adotada: presença e ata ficam **só no aparelho** de quem escreve e **nunca** vão para um link compartilhável. Saem só como PDF ou texto, por escolha de quem escreveu.
4. **"Validado no servidor" não se aplica à Onda 1** porque não há regra, permissão nem contagem. Registrado para ninguém achar que a regra foi esquecida. Métrica de visitas é indicativa, não é regra.
5. **O "Telão" do Guerra reaproveita bem, mas não é pronto para cá:**
   - o compartilhamento não tem botão de baixar a imagem (no computador sem Web Share não há saída);
   - o modo offline não pré-carrega nada, então a primeira volta sem internet falha;
   - o contraste é medido por uma heurística, não pela regra WCAG de 4,5:1;
   - o card tem um tamanho só (9:16).
   A nota "Reaproveita 5" do item 1 cai para 4. O motor de desenho, o QR, o aviso de saída, o esquema de Termos e o deploy continuam valendo (lista na seção 5).
6. **Domínio no GitHub Pages:** publicando pelo GitHub Actions (como no Guerra), o arquivo `CNAME` do repositório é ignorado e o domínio fica só nas configurações do Pages. Atualizado no `aprendizados-guerra-de-torcidas.md`.
7. **Nome:** não trava a construção, mas trava a divulgação (cards levam o nome, domínio e INPI dependem dele). Trilha própria na seção 6.

## 3. Novas oportunidades

| Oportunidade | Entra? | Comentário |
|---|---|---|
| **Texto pronto para o WhatsApp** junto de cada card (negrito do WhatsApp, data, local, link) | Onda 1 | Leve (texto pesa nada), lido por leitor de tela, e muita gente prefere mensagem a imagem |
| **Cartaz A4 para imprimir**, com QR do link | Onda 1 | Chega a quem não tem internet: mural da padaria, da igreja, do posto |
| **Um fluxo só "Vou chamar pessoas para…"**: reunião, evento ou aviso gera card + texto + link + cartaz de uma vez | Onda 1 | Une os itens 1, 2 e 3 numa porta de entrada; menos telas para aprender |
| **Funciona sem internet** depois da primeira visita | Onda 1 | 39% ficam sem pacote ao menos uma vez em três meses |
| **"Adicionar à agenda"** (arquivo .ics e Google Agenda) | Onda 1 | Gerado no aparelho, sem conta |
| **Exemplos de todos os tipos de organização**, em rodízio (associação, sindicato, grupo religioso, núcleo partidário, coletivo cultural, ONG, conselho) | Onda 1 | A neutralidade aparece na própria tela, não só no texto dos Termos |
| **Remoção de links denunciados sem banco** (lista de bloqueio no site) | Onda 1 | Cumpre o "canal de remoção" e reduz o risco pós-STF |
| Versão em áudio do aviso (leitura em voz, para quem lê pouco) | Onda 2 | Testar a vontade nas entrevistas antes |
| Guia da Lei de Acesso à Informação | Primeiro da Onda 2 | Também é estático; se sobrar fôlego, puxar |
| Página "Quem mantém e quem apoia" com princípios de neutralidade | Onda 1 (simples) | Base para editais e confiança dos dois lados |

## 4. Escopo fechado da Onda 1

> Esta seção também está no `produto.md` (seção 7), que vai para o repositório como `docs/produto.md`.

**Uma página leve com três ferramentas e as páginas institucionais. Nada de conta, nada de banco.** (Desde 05/11/2026, as três ferramentas se usam por um caminho só, o fluxo único: `docs/produto.md` 7.6.)

### 4.1 Cards e convites
- 5 modelos: **Reunião ou assembleia, Evento ou atividade, Aviso, Resultado ou conquista, Agradecimento**.
- 3 formatos: **Status** (1080×1920), **Conversa** (1080×1080) e **Cartaz A4** (impressão, com QR).
- Campos curtos (título, data, hora, local, texto de até ~140 caracteres, nome da organização) e logo opcional. O logo é lido e reduzido no próprio aparelho e **nunca é enviado**.
- 6 paletas neutras e cor livre com checagem automática de contraste (4,5:1). Nenhuma paleta ou ícone remete a partido; todas valem para todos.
- Saídas: compartilhar a imagem (Web Share), **baixar a imagem**, copiar o texto, abrir no WhatsApp (`wa.me`) e imprimir ou salvar o cartaz em PDF.
- Texto alternativo da imagem gerado a partir dos campos.

### 4.2 Evento em um link
- Página do evento montada a partir dos dados que estão **no próprio link, depois do `#`**, compactados. Nada vai para servidor.
- Mostra título, data, hora, local (com botão "Ver no mapa" gerado por nós) e descrição; tem "Adicionar à agenda" (.ics e Google) e o card pronto.
- Proibido: link livre, PIX, telefone, HTML. Tudo exibido como texto puro, com limite de tamanho.
- Faixa fixa: "Conteúdo criado por quem enviou este link. O [nome] não confere nem guarda este conteúdo. Denunciar".
- Antes de mostrar, confere se o link está na lista `bloqueados.json`; se estiver, mostra "Este link foi removido após denúncia".

### 4.3 Reunião: convocação, pauta e ata
- Convocação: gera card e texto da reunião com a pauta numerada, e opcionalmente o link do evento.
- Ata: modelo guiado (data, local, presentes, pauta, o que foi decidido, encaminhamentos com responsável e prazo), com rascunho salvo **só neste aparelho** e botão "Apagar do aparelho".
- Saída da ata: imprimir ou salvar em PDF (pelo próprio navegador, sem biblioteca pesada) e copiar o texto. A ata **não** vira link.

### 4.4 Páginas institucionais
- Sobre (o que é, quem mantém, princípios de neutralidade), Termos de Uso, Política de Privacidade, Regras de uso, Como denunciar e pedir remoção, Contato.
- Textos em versão provisória, com faixa "em revisão jurídica" até o advogado aprovar.

### 4.5 Regras técnicas
- Vite + TypeScript estrito, testes com Vitest, deploy pelo GitHub Actions (testes antes do build). Rotas por `#` e caminhos relativos, para funcionar no endereço do GitHub e depois no domínio próprio sem retrabalho.
- **Peso:** primeira tela com no máximo ~150 KB transferidos (HTML, CSS, JS e fontes); cada ferramenta carrega só quando aberta.
- **Offline:** service worker com pré-carga do app; depois da primeira visita, tudo funciona sem internet.
- **Acessibilidade:** WCAG 2.2 AA; contraste testado automaticamente; alvos de toque de 48 px; tudo operável por leitor de tela; texto simples; nunca informação só pela cor; respeitar "reduzir movimento"; tela de 360 px sem rolagem lateral.
- **Privacidade:** nenhuma chamada de rede além do próprio site; sem cookies; armazenamento local só para rascunhos e preferências, com botão de apagar.
- **Neutralidade no código:** teste que varre os textos da plataforma atrás de linguagem de campanha e de siglas partidárias.

## 5. Peças do Guerra de Torcidas a copiar e adaptar

Código **copiado e adaptado**, nunca importado. O Code consulta uma cópia de leitura fora do repositório.

| Peça no Guerra | O que adaptar |
|---|---|
| `.github/workflows/deploy.yml` | Igual, com testes antes do build; sem arquivo CNAME |
| `vite.config.ts`, `tsconfig.json`, scripts do `package.json`, `.gitattributes` (LF) | Tirar Supabase e pglite; `base` relativo |
| `public/sw.js` (linhas 1–76) e `src/pwa.ts` | Tirar push; acrescentar pré-carga do app e tela offline |
| `public/manifest.webmanifest`, `<head>` do `index.html`, `scripts/gerar-icones.mjs` | Nome, cores, ícones; acrescentar `og:image` para a prévia no WhatsApp |
| `scripts/fontes.mjs` | Fontes de leitura fácil, cortadas para o português |
| `src/jogo/card.ts` (esqueleto `desenharModelo`, `quebrarTexto`, `prontoParaDesenhar`, `mostrarCard`) | Trocar o modelo de futebol por modelo de convite; vários formatos |
| `cortarTexto`, `corDaBorda`, `corDeTexto`, `distanciaDeCor` | Trocar heurística por contraste WCAG real, com teste |
| `src/telas/resultadoPadrao.ts` (cadeia de compartilhar) e `wa.me` | Acrescentar "Baixar imagem" e aviso em `aria-live`; mandar só o arquivo no iOS |
| `src/jogo/qrSvg.ts` + `uqr` sob demanda | Versão que desenha o QR direto no canvas, para o cartaz |
| `src/jogo/termos.ts` + `src/telas/termos.ts` + estrutura do `termos.md` | Texto novo ("nada sai do aparelho"); trocar "apagar meus dados do servidor" por "apagar deste aparelho" |
| `src/telas/saida.ts` (aviso de link externo) e `nivelInicial` de `qualidade.ts` | Reduzir efeitos em aparelho fraco ou com economia de dados |
| `src/dev/cards.ts` + `dev/cards.html` | Galeria de todos os modelos para revisar visualmente |
| `CLAUDE.md`, `.claude/agents/{executor,mecanico,revisor}.md`, skill `planejar-tarefa`, `docs/orquestracao.md`, formato do `docs/proximos-passos.md` | Regras do Projeto Comunidade no lugar das de futebol e Supabase |

**Não copiar:** Supabase, login, captcha e código do aparelho; cenas de futebol; push e notificações; triagem de faixa etária e regra 18+; listas de palavras do jogo (reaproveitar só o mecanismo do teste).

## 6. Plano em trilhas paralelas

```
DIA 1   Kauê (30 min): e-mail de contato · repositório vazio · Pages = GitHub Actions
        Code: SESSÃO 0 Fundação (sozinha, precisa terminar primeiro)
        Kauê, em paralelo: 3 a 5 nomes candidatos · contato com advogado e contador

DIA 2+  Code, 4 sessões em paralelo, cada uma em worktree:
          S1 Cards      S2 Evento em um link      S3 Reunião e ata      S4 Páginas institucionais
        Kauê, em paralelo: marcar as entrevistas com 5 a 8 organizações

DEPOIS  Code, 2 sessões em paralelo:
          S5 Revisão de segurança e privacidade (só lê e relata)
          S6 Acabamento: acessibilidade, peso e teste em internet lenta
        Code: S7 Correções do relatório da S5 (pode ser a mesma S6, se pequenas)

BETA    Kauê: mostrar para as 5 a 8 organizações (roteiro na seção 8.7) · Chat consolida o que ouvir

ANTES DE DIVULGAR  nome decidido · domínio · advogado aprovou textos · métricas · lista de bloqueio testada
```

**Por que assim:** a Sessão 0 cria as regras, a estrutura de pastas e os ajudantes; sem ela, as sessões paralelas brigam pelos mesmos arquivos. Depois, cada ferramenta mora na própria pasta (`src/ferramentas/cards`, `evento`, `reuniao`), o que permite quatro sessões ao mesmo tempo. Peças comuns (`src/comum`) só mudam na Sessão 0; se uma sessão paralela precisar mudar algo comum, ela anota em `docs/pedidos-comum.md` e o pedido vira tarefa curta depois.

**Sub-agentes dentro de cada sessão:** a Sessão 0 cria os ajudantes do repositório (executor, mecânico, revisor, revisor de acessibilidade, revisor de privacidade e neutralidade). Cada sessão de construção planeja, divide o trabalho entre ajudantes que rodam juntos e, no fim, passa o resultado por revisores que não escreveram o código.

## 7. Mensagens para o Claude Code

Em todas: abrir uma **sessão nova** no app, escolher a pasta `projeto-comunidade`, escolher modelo e intensidade **no seletor do app** e colar a mensagem.

### Sessão 0 — Fundação (rodar sozinha, primeiro)

**Modelo: Opus · Intensidade: Alta**

```
Você vai criar a fundação do Projeto Comunidade (nome provisório), uma plataforma gratuita e apartidária para organizações comunitárias, sociais e partidárias. Eu não uso terminal: rode você todos os comandos e me diga só o que eu preciso clicar fora daqui.

CONTEXTO
- Esta pasta está vazia. O repositório remoto já existe, público e vazio: https://github.com/walterkaue/projeto-comunidade
- Referência de método e código: o repositório público https://github.com/walterkaue/guerra-de-torcidas. Clone-o numa pasta FORA deste repositório (ex.: ..\referencia-gdt), só para leitura. Copie e adapte o que for útil; nunca importe dele, nunca faça commit de nada de lá, nunca altere aquele projeto.
- A Onda 1 tem três ferramentas, sem login e sem banco de dados, tudo gerado no aparelho: (1) cards e convites para WhatsApp, (2) evento em um link (dados depois do #), (3) reunião com convocação, pauta e ata em PDF. Mais páginas institucionais. Elas serão construídas em sessões paralelas DEPOIS desta. Nesta sessão você NÃO constrói as ferramentas: prepara o terreno para elas.

O QUE FAZER
1. Git: inicie o repositório, ligue ao remoto, branch main. .gitattributes com LF (copie o do Guerra).
2. Stack: Vite + TypeScript estrito + Vitest, como no Guerra (vite.config.ts, tsconfig.json, scripts dev/build/test/fontes), SEM Supabase. Base relativa e rotas por # para o site funcionar em walterkaue.github.io/projeto-comunidade/ e, depois, num domínio próprio sem retrabalho.
3. Deploy: copie e adapte .github/workflows/deploy.yml do Guerra (npm test antes do build; publica com actions/deploy-pages). Sem arquivo CNAME.
4. PWA: adapte public/sw.js (sem push) e src/pwa.ts, acrescentando pré-carga do app no install e uma tela offline simples. Manifest e ícones (adapte scripts/gerar-icones.mjs com um ícone provisório simples e neutro). <head> com og:title, og:description e og:image estático para a prévia no WhatsApp.
5. Fontes: adapte scripts/fontes.mjs com fontes de leitura fácil e licença aberta, cortadas para o português.
6. Estrutura de pastas: src/comum (marca, tema, roteador por #, utilitários de texto e cor, compartilhar, componentes de formulário acessíveis), src/ferramentas/cards, src/ferramentas/evento, src/ferramentas/reuniao, src/paginas. Cada ferramenta com um index.ts vazio que exporta a tela e é carregada sob demanda.
7. src/comum/marca.ts com NOME = "Projeto Comunidade", e-mail de contato num campo único (contato.projetocomunidade@gmail.com) e ID de métricas vazio (métricas desligadas).
8. Peças comuns já prontas e testadas, adaptadas do Guerra:
   - contraste WCAG real (razão 4,5:1) no lugar de corDeTexto/distanciaDeCor, com testes;
   - quebrarTexto/cortarTexto do card;
   - cadeia de compartilhar: arquivo pelo Web Share > texto e link > copiar, MAIS botão "Baixar imagem", aviso em aria-live e envio só do arquivo quando texto + arquivo falham no iOS;
   - QR (uqr sob demanda) desenhado direto no canvas;
   - aviso de link externo (saida.ts) e nivelInicial (economia de dados / aparelho fraco).
9. Home provisória (trocada em 05/11/2026 pelo início "O que você quer fazer?" do fluxo único): as três ferramentas como botões grandes, e rodapé com Sobre, Termos, Privacidade, Regras de uso, Como denunciar.
10. Testes de regra do projeto:
   - peso: falha se o JS+CSS inicial passar de 80 KB gzip;
   - neutralidade: varre os textos da plataforma (não o que o usuário digita) atrás de linguagem de campanha ("vote", "eleja", "candidato") e de siglas de partidos registrados no TSE (lista em arquivo, com nota para conferir a lista oficial);
   - privacidade: falha se o código tiver fetch/XMLHttpRequest/sendBeacon para fora do próprio site (exceto o script de métricas, quando ligado).
11. Método de trabalho (adapte do Guerra):
   - CLAUDE.md com: fonte da verdade (docs/produto.md), limites, produto (celular primeiro, 360 px, toque, nunca hover, internet fraca), técnica (peso, testes antes de commit, módulos puros testados), privacidade (nada sai do aparelho; nada de presença/ata em link), neutralidade, fluxo (commits pequenos em português "tipo: descrição"; ao terminar, dizer o que mudou, como testar no celular e o que ficou pendente) e REGRA DAS SESSÕES PARALELAS: cada sessão mexe só na própria pasta de ferramenta; mudanças em src/comum viram pedido em docs/pedidos-comum.md.
   - .claude/agents/: executor (sonnet), mecanico (haiku), revisor (sonnet, só leitura), revisor-acessibilidade (sonnet, só leitura: WCAG 2.2 AA, leitor de tela, contraste, alvos, 360 px) e revisor-privacidade-neutralidade (opus, só leitura: chamadas de rede, armazenamento, dados em links, textos partidários, escape de texto).
   - .claude/skills/planejar-tarefa e docs/orquestracao.md (seções "quem faz o quê" e "modelo de brief").
   - docs/produto.md com o texto que colei no fim desta mensagem, sem mudar nada; docs/proximos-passos.md no formato do Guerra; docs/pedidos-comum.md vazio.
12. LICENSE MIT; README curto; nota de que modelos e textos são CC BY 4.0.
13. Rode testes e build, faça commit e push na main. Confirme que o GitHub Actions publicou. Se o Pages ainda não estiver ativado, me diga exatamente onde clicar.

COMO TRABALHAR
- Planeje primeiro com uma tabela (parte, quem faz, arquivos, pronto quando). Use sub-agentes em paralelo para partes independentes (ex.: PWA e ícones; peças comuns e testes; documentos de método). Quem escreveu não revisa o próprio trabalho: no fim, rode o revisor e o revisor-privacidade-neutralidade.
- Não pergunte o que já está decidido aqui. Pergunte antes de qualquer coisa que dependa de conta, senha ou painel.

ENTREGA
- Endereço publicado, o que ficou pronto, como abrir no celular, o que eu preciso clicar, e o texto de docs/proximos-passos.md.

=== produto.md (colado abaixo) ===
```

Depois de colar a mensagem acima, **cole logo abaixo o texto inteiro do `produto.md`** (no claude.ai: Projeto > produto.md > selecionar tudo > copiar). A seção 7 dele tem o escopo da Onda 1 que as outras sessões usam.

### Sessões 1 a 4 — em paralelo, depois da Sessão 0

Abrir **quatro sessões novas**, cada uma com a opção **worktree** ligada no app. Terminar e juntar **uma de cada vez** (a que terminar primeiro junta primeiro).

Cabeçalho comum (colar no início de cada uma das quatro):

```
Leia CLAUDE.md, docs/produto.md e docs/proximos-passos.md antes de tudo. Você está numa sessão paralela em worktree: mexa só na pasta da sua ferramenta e nos testes dela. Se precisar mudar src/comum, anote o pedido em docs/pedidos-comum.md e siga com uma solução local. Planeje com a skill planejar-tarefa, rode em paralelo sub-agentes para as partes independentes e, no fim, passe pelo revisor, pelo revisor-acessibilidade e pelo revisor-privacidade-neutralidade. Testes e build verdes, depois traga a main atualizada para a sua branch, resolva conflitos, junte na main e faça push. Entrega: o que mudou, como testar no celular, o que ficou pendente, e atualize docs/proximos-passos.md.
```

**Sessão 1 — Cards e convites · Modelo: Opus · Intensidade: Alta**
```
[cabeçalho comum]

Construa src/ferramentas/cards conforme a seção 7.1 de docs/produto.md:
- 5 modelos (Reunião ou assembleia, Evento ou atividade, Aviso, Resultado ou conquista, Agradecimento) sobre um motor único adaptado de desenharModelo do Guerra.
- 3 formatos: Status 1080×1920, Conversa 1080×1080 e Cartaz A4 para imprimir com QR.
- Campos curtos com limite e contador; logo opcional lido e reduzido no aparelho, nunca enviado.
- 6 paletas neutras + cor livre com checagem de contraste 4,5:1 (recusa ou ajusta cor ilegível e explica em texto simples).
- Texto pronto para o WhatsApp (com *negrito*) e texto alternativo gerados dos campos.
- Saídas: compartilhar imagem, baixar imagem, copiar texto, abrir no WhatsApp (wa.me), imprimir/salvar PDF do cartaz.
- Rodapé "feito com [NOME]" ligado por padrão, com opção de desligar.
- Exemplos de preenchimento em rodízio entre tipos de organização (associação de moradores, sindicato, grupo religioso, núcleo partidário, coletivo cultural, ONG, conselho), sem nomes reais.
- Galeria dev (como dev/cards.html do Guerra) com todos os modelos × formatos × paletas.
- Desenho só quando pedido e mais leve em aparelho fraco (nivelInicial).
```

**Sessão 2 — Evento em um link · Modelo: Opus · Intensidade: Alta**
```
[cabeçalho comum]

Construa src/ferramentas/evento conforme a seção 7.2 de docs/produto.md:
- Formulário do evento e geração do link com os dados depois do # (JSON compacto, comprimido quando o navegador permitir, base64url, campo de versão). Link final idealmente abaixo de 1.500 caracteres; avise se passar.
- Página do evento que lê o link e mostra título, data, hora, local, descrição; botão "Ver no mapa" gerado por nós a partir do local; "Adicionar à agenda" (.ics gerado no aparelho e link do Google Agenda); botão para gerar o card do evento (chame a ferramenta de cards se ela já estiver na main; se não, deixe o botão preparado e anote o pedido).
- Segurança: tudo exibido como texto puro (textContent, nunca innerHTML); limites de tamanho por campo; nenhum campo de link livre, PIX ou telefone; datas validadas; link malformado mostra mensagem amigável.
- Faixa fixa "Conteúdo criado por quem enviou este link. O [NOME] não confere nem guarda este conteúdo." com "Denunciar" (mailto para o e-mail de contato, já com o link no corpo, e a explicação do que acontece depois).
- public/bloqueados.json com hashes SHA-256 do conteúdo depois do #; a página confere antes de mostrar e exibe "Este link foi removido após denúncia". O service worker busca esse arquivo da rede primeiro. Documente em docs/remocao.md o passo a passo para bloquear um link (tarefa curta para Sonnet).
- Testes de codificação/decodificação, de limites, de tentativa de injeção e da lista de bloqueio.
```

**Sessão 3 — Reunião, pauta e ata · Modelo: Opus · Intensidade: Alta**
```
[cabeçalho comum]

Construa src/ferramentas/reuniao conforme a seção 7.3 de docs/produto.md:
- Convocação: data, hora, local, pauta numerada; gera texto para o WhatsApp e, se a ferramenta de cards já estiver na main, o card de convocação (senão, deixe preparado e anote o pedido).
- Ata guiada: cabeçalho (organização, data, local, hora de início e fim), presentes, pauta, para cada ponto o que foi discutido e decidido, encaminhamentos (o quê, quem, até quando).
- Rascunho salvo só neste aparelho (localStorage), com aviso claro e botão "Apagar do aparelho". Presença e ata NUNCA entram em link compartilhável.
- Saída: imprimir ou salvar em PDF pelo navegador, com CSS de impressão caprichado (sem biblioteca de PDF), e copiar o texto da ata.
- Linguagem simples; sem termos jurídicos que prometam validade (a ata é um modelo, não substitui o que o estatuto da organização exige); diga isso numa linha.
- Testes do modelo de ata e do texto gerado.
```

**Sessão 4 — Páginas institucionais · Modelo: Sonnet · Intensidade: Média**
```
[cabeçalho comum]

Construa src/paginas conforme a seção 7.4 de docs/produto.md: Sobre, Termos de Uso, Política de Privacidade, Regras de uso, Como denunciar e pedir remoção, Contato.
- Adapte o mecanismo de termos do Guerra (termos.md + termosEmHtml + aviso de versão pela data), sem "ver/apagar dados do servidor": no lugar, "Apagar tudo que este site guardou neste aparelho".
- Use os compromissos de docs/produto.md (princípios, dados mínimos, nada sai do aparelho, rodapé removível, lista de bloqueio, não perguntamos voto, filiação ou opinião política).
- Faixa "Versão provisória, em revisão jurídica" em Termos, Privacidade e Regras de uso. Crie um teste que procura a marca "em revisão jurídica" e que só falha quando a constante LANCAMENTO_PUBLICO em src/comum/marca.ts for true (não mude src/comum: anote o pedido para criar a constante).
- Página Sobre com "Quem mantém" e "Quem apoia" (lista vazia por enquanto) e as regras de financiamento: apoiadores diversos e públicos, sem contrapartida sobre conteúdo, sem recurso de partido ou candidato.
```

### Sessões 5 e 6 — em paralelo, depois que S1 a S4 estiverem na main

**Sessão 5 — Revisão de segurança e privacidade · Modelo: Fable (ou Opus) · Intensidade: Extra alta**
```
Leia CLAUDE.md e docs/produto.md. Faça uma revisão de segurança e privacidade do site inteiro SEM alterar código de produto. Escreva o relatório em docs/auditoria/AAAA-MM-DD/seguranca.md e faça commit só dele.

Procure, com arquivo, linha e cenário reproduzível:
- injeção de HTML/script pelos links de evento, pelos campos dos cards e da ata, pelo nome de arquivo do logo;
- abuso da página de evento para golpe ou desinformação (o que um atacante consegue mostrar no nosso domínio) e se a lista de bloqueio funciona online e offline;
- qualquer dado que saia do aparelho (rede, prévias, mailto, métricas) e qualquer dado pessoal que entre em link;
- service worker servindo versão velha da lista de bloqueio ou do app;
- Content-Security-Policy possível no GitHub Pages (meta tag) e cabeçalhos que faltam;
- dependências: versões, licenças, scripts de terceiros.
Classifique cada achado (crítico, alto, médio, baixo) e proponha a correção. Termine com a lista do que bloqueia o beta e do que bloqueia a divulgação.
```

**Sessão 6 — Acabamento · Modelo: Opus · Intensidade: Alta**
```
Leia CLAUDE.md, docs/produto.md, docs/proximos-passos.md e docs/pedidos-comum.md. Esta sessão:
1. Atende os pedidos de docs/pedidos-comum.md (é a única sessão que mexe em src/comum agora), com testes.
2. Revisa acessibilidade (WCAG 2.2 AA) em todas as telas com o revisor-acessibilidade e corrige: leitor de tela, ordem do foco, rótulos, contraste, alvos de 48 px, 360 px sem rolagem lateral, reduzir movimento.
3. Mede peso e velocidade simulando internet lenta e celular fraco (use o navegador de pré-visualização), corrige o que passar do orçamento e registra os números em docs/proximos-passos.md.
4. Confere o modo offline de ponta a ponta (primeira visita, sem rede, volta da rede).
Commits pequenos, testes verdes, push. Entrega com o que mudou e como testar no celular.
```

**Sessão 7 — Correções da revisão · Modelo: Sonnet · Intensidade: Média** (ou Opus + Alta se houver achado crítico)
```
Leia o relatório mais recente em docs/auditoria/. Corrija todos os achados críticos e altos e os médios que bloqueiam o beta, um commit por achado, com teste que prova a correção. Depois rode o revisor-privacidade-neutralidade só sobre os arquivos alterados. Atualize docs/proximos-passos.md com o que foi corrigido e o que ficou para antes da divulgação.
```

## 8. Passo a passo fora do Code

### 8.1 Claude (claude.ai) — manter o Projeto em dia (5 min, depois de cada rodada no Code)
Os arquivos que valem estão no GitHub; o Projeto do claude.ai guarda cópias, que ficam velhas. Depois de cada rodada no Claude Code:
1. Abra https://github.com/walterkaue/projeto-comunidade/tree/main/docs. Em cada arquivo abaixo, toque no arquivo e depois no botão **Download raw file** (seta para baixo, no alto à direita do texto):
   - `produto.md` (regras e decisões; hoje v0.8);
   - `proximos-passos.md` (onde estamos e o que vem a seguir);
   - `onda-1.md` (plano da Onda 1 e passo a passo fora do Code);
   - se quiser o detalhe das revisões: `auditoria/2026-11-05/seguranca.md` e `auditoria/2026-11-05/fluxo.md`.
2. Abra o Projeto "Projeto Comunidade" no claude.ai. Em **Conhecimento do projeto** (Project knowledge), remova a cópia antiga de cada arquivo (no menu ou no **×** do arquivo) e envie a nova pelo **+** (**Carregar do dispositivo**, ou *Upload from device* se o claude.ai estiver em inglês).
3. Se o Projeto ainda tiver um `estado-do-projeto.md` antigo, troque por `proximos-passos.md`: é ele que tem o retrato atual.
4. Em **Instruções** (o lápis ao lado delas), deixe esta frase: "Antes de responder sobre o projeto, leia `produto.md` (regras e decisões) e `proximos-passos.md` (onde estamos e o que vem a seguir). `onda-1.md` é o plano da Onda 1." Salve.

### 8.2 E-mail de contato (10 min) — feito em 05/11: `contato.projetocomunidade@gmail.com`
1. Crie um Gmail novo só para o projeto (ex.: `projetocomunidade.contato@gmail.com`, ou o que estiver livre). Não use o pessoal: ele vai ficar público na página de denúncia.
2. Ative a verificação em duas etapas (Conta Google > Segurança).
3. Me diga o endereço; viro uma tarefa curta de Sonnet + Média para trocar em `src/comum/marca.ts`.

### 8.3 GitHub — repositório e Pages (10 min)
1. Entre em github.com com sua conta e abra **github.com/new**.
2. Owner: `walterkaue`. Repository name: `projeto-comunidade`. Marque **Public**.
3. **Não** marque README, .gitignore nem licença (a Sessão 0 cria tudo). Clique em **Create repository**.
4. No repositório, vá em **Settings > Pages**. Em "Build and deployment", **Source: GitHub Actions**. Não precisa salvar nada além disso.
5. Rode a Sessão 0. Quando ela terminar, a aba **Actions** do repositório mostra o "Publicar no GitHub Pages" com bolinha verde, e o endereço aparece em Settings > Pages.
   - Se quiser, eu faço os passos 1 a 4 pelo navegador com você acompanhando.

### 8.4 Claude Code (app desktop) — como abrir cada sessão
1. No Explorador de Arquivos, crie a pasta `C:\Users\walte\Projetos\projeto-comunidade` (vazia), **fora do OneDrive**. Em Settings > Claude Code > Worktree location, use `C:\Users\walte\Projetos\worktrees`.
2. No app do Claude Code, **nova sessão** > escolha essa pasta.
3. No seletor, escolha **modelo** e **intensidade** do cabeçalho da mensagem.
4. Sessões 1 a 4: ao abrir, ligue a opção **worktree** (sessão isolada). Pode abrir as quatro de uma vez.
5. Quando uma sessão perguntar algo que dependa de conta ou painel, ela diz onde clicar. Se travar, me mande o que ela disse.
6. Ordem de juntar: a primeira que terminar junta primeiro; as outras trazem a main atualizada antes de juntar (já está nas mensagens).

### 8.5 Nome e domínio (trilha paralela, sem pressa até a divulgação)
1. Liste 3 a 5 nomes curtos, fáceis de falar no áudio do WhatsApp e sem cara de partido. Me mande que eu avalio contra os princípios.
2. Para cada nome, pesquise em **registro.br** (campo de busca da página inicial) se o `.com.br` está livre. O `.com.br` custa R$ 40/ano e pode ser registrado com CPF. O `.org.br` exige CNPJ de entidade sem fins lucrativos, então só depois da associação.
3. Pesquise a marca no INPI: **busca.inpi.gov.br/pePI** > Marcas > busca por palavra (pode pedir cadastro gratuito). Anote se há marca parecida na classe de serviços de software ou educação.
4. Decidido o nome: registre o domínio no Registro.br e me avise. Eu monto o passo a passo do DNS e a tarefa curta para o Code trocar o nome.

**Quando houver domínio próprio (dois caminhos):**
- **Domínio no Registro.br, DNS no Hostgator** (como no Guerra): no cPanel do Hostgator > **Domínios > Zone Editor** > na linha do domínio, **+ CNAME Record**: Name `@` ou subdomínio (ex.: `www`), Record `walterkaue.github.io`. Use só o prefixo no nome; se digitar o nome completo, termine com ponto. Não deixe outro registro com o mesmo nome.
- No GitHub: **Settings > Pages > Custom domain**, digite o domínio e **Save**. Com publicação por Actions, não existe arquivo CNAME.
- Verificação (protege contra sequestro do domínio): **foto de perfil > Settings > Pages > Add a domain**, crie o **TXT** `_github-pages-challenge-walterkaue` com o valor mostrado, clique em **Verify** e **mantenha o TXT**.
- Depois que o certificado sair (pode levar de minutos a 24 h), marque **Enforce HTTPS**.

### 8.6 Advogado e contador (trilha paralela)
Mandar ao advogado (OAB identificada no parecer):
1. Termos de Uso, Política de Privacidade e Regras de uso (rascunhos da Sessão 4).
2. **Páginas de evento por link:** o conteúdo não fica guardado em servidor, mas aparece no nosso domínio. Que responsabilidade temos pós-STF (Marco Civil, art. 19)? A faixa de aviso + denúncia + lista de bloqueio bastam?
3. Logos e marcas que o usuário coloca no card.
4. Partido ou candidato usando a ferramenta gratuita: é doação estimável? O rodapé removível muda algo? Há algo a fazer antes da pré-campanha de 2028?
5. ECA Digital: um site sem conta, sem dados e sem interação entre pessoas é "de acesso provável" por menores? Precisamos de idade mínima?
6. Ata: o aviso "modelo, não substitui o estatuto" basta?

Contador + advogado: formato do responsável (associação sem fins lucrativos é o recomendado; abre `.org.br`, editais, Google para ONGs e TechSoup).

### 8.7 Entrevistas com organizações (trilha paralela, durante o beta)
- Quem: 5 a 8 organizações de tipos e posições diferentes (associação de moradores, sindicato, grupo religioso, núcleo partidário de um campo e de outro, coletivo cultural, ONG).
- Como: 10 minutos, por chamada ou presencial, com o celular da pessoa.
- Roteiro:
  1. "Como vocês chamam as pessoas para uma reunião hoje?"
  2. Abra o site no celular dela e peça para escolher, sozinha, uma das cinco portas ("Chamar para uma reunião", "Divulgar um evento"…) e fazer um convite real, trocando o exemplo pelo que for dela. Não ajude. Anote onde travou: em qual passo, em qual campo, se entendeu "Onde vai mandar?" e se achou o "Mandar no WhatsApp".
  3. Peça para mandar de verdade para ela mesma (ou para quem ela quiser) e olhar como chegou: a imagem e o texto foram juntos? O link abriu a página do evento? "Mandaria isso no grupo? O que falta?"
  4. "Fazem ata? Como?" Se fizerem, peça para tocar em "Fazer a ata" (ou "Depois da reunião: fazer a ata", no início) e ver se o modelo serve.
  5. "Alguma coisa aqui pareceu ter lado político?" (inclusive os exemplos que já vêm preenchidos)
- Não anote nome de quem participou nem a posição política da organização; anote só o tipo de organização e o que ouviu. Me mande as anotações que eu consolido.

### 8.8 Antes de divulgar (checklist)
- [ ] Nome decidido, domínio ligado e com HTTPS
- [ ] E-mail de contato no ar e testado (denúncia chega)
- [ ] Advogado aprovou os textos; faixa "em revisão jurídica" retirada (LANCAMENTO_PUBLICO = true e teste verde)
- [ ] Relatório de segurança sem achados críticos ou altos abertos
- [ ] Lista de bloqueio testada de ponta a ponta
- [ ] Métricas sem cookie ligadas (GoatCounter) e citadas na Política de Privacidade
- [ ] Entrevistas feitas e ajustes do beta aplicados
