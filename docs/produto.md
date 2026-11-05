# Projeto Comunidade — produto (fonte da verdade)

> Versão 0.5 · 05/11/2026 · nome provisório. Este documento guarda regras e decisões. O que está em "Perguntas abertas" ainda não foi decidido. A cópia que vale no código é `docs/produto.md` no repositório; esta aqui deve ficar igual a ela. A v0.5 junta a v0.4 (benchmark aprovado) com as decisões tomadas no Claude Code em 05/11 (ata só na aba, denúncias por e-mail com ajuda do Gemini, sem fins lucrativos, menores, só pessoas, métricas no beta).

## 1. O que é

Uma plataforma digital gratuita, aberta a qualquer pessoa e a qualquer organização social ou partidária, que reúne serviços digitais, conteúdos, aulas, livros, jogos didáticos e ferramentas úteis para a vida em comunidade.

## 2. Para quem

- **Livre para todos que quiserem usar** (decidido em 04/11): pessoas, coletivos, associações, movimentos, ONGs, igrejas e grupos comunitários, sindicatos, escolas, partidos e núcleos partidários.
- Não há público prioritário definido. A pesquisa (04/11) mostrou que o ponto comum de todos é organizar e comunicar pelo WhatsApp, no celular, com pouca gente e pouca formação em tecnologia (`claude/pesquisa-resultado.md`).

## 3. Decisões tomadas

| Data | Decisão |
|---|---|
| 04/11/2026 | Plataforma **aberta a todas** as organizações, de qualquer posição política, com as mesmas regras para todas. |
| 04/11/2026 | **Uso livre** para qualquer pessoa ou organização. |
| 04/11/2026 | **Nada é produzido antes da pesquisa** (`pesquisa-e-roadmap.md`). |
| 04/11/2026 | Projeto **separado do Guerra de Torcidas**: marca, Projeto no claude.ai, repositório, banco de dados e subdomínio próprios. |
| 04/11/2026 | Pesquisa concluída (`claude/pesquisa-resultado.md`). |
| 05/11/2026 | **Onda 1 aprovada:** cards e convites para WhatsApp (porta de entrada), evento em um link e reunião com pauta e ata. Sem conta e sem banco de dados; tudo gerado no aparelho. Escopo na seção 7. |
| 05/11/2026 | Padrões adotados (podem ser trocados): beta no endereço gratuito do GitHub; nome no código num arquivo só; licença MIT para o código e CC BY 4.0 para modelos e textos; rodapé "feito com…" ligado mas removível por quem faz o card; não perguntar idade na Onda 1. (O padrão "nenhuma métrica no beta" foi trocado; ver abaixo.) |
| 05/11/2026 | E-mail público de contato do projeto: **contato.projetocomunidade@gmail.com** (Gmail próprio, separado do pessoal, transferível para a futura associação). Usado em denúncia, remoção e contato. |
| 05/11/2026 | **Presença e ata ficam só no aparelho** de quem escreve e nunca entram em link compartilhável (presença revela filiação). |
| 05/11/2026 | **Página de evento por link:** dados só depois do `#`, nada de link livre, PIX ou telefone, faixa "conteúdo de quem enviou", denúncia e lista pública de links bloqueados. |
| 05/11/2026 | A regra "validado no servidor" não se aplica à Onda 1, que não tem regra, permissão nem contagem. Volta a valer na Onda 2. |
| 05/11/2026 | **Rascunho da ata só na aba aberta** enquanto o site estiver no endereço do GitHub (o armazenamento do aparelho é dividido com outros projetos desse endereço). Some ao fechar; a pessoa salva o PDF. Rever com domínio próprio. |
| 05/11/2026 | **Denúncias por e-mail**, no endereço de contato. Uma IA (Gemini, no plano do Kauê) pode ajudar a separar e resumir, mas **quem decide a remoção é uma pessoa**. Sem área de administração no site. |
| 05/11/2026 | **Sem fins lucrativos**, sustentado no futuro por doações. Formato jurídico ainda a definir. |
| 05/11/2026 | **Menores podem usar**, sem restrição de uso, se o advogado confirmar (ECA Digital). |
| 05/11/2026 | **Só pessoas usam**, sem conta de organização, por enquanto. |
| 05/11/2026 | **Métricas ligadas já no beta** (troca o padrão "nenhuma métrica no beta"), para achar problemas antes da divulgação. GoatCounter sem cookie, por imagem de 1 pixel e sem script de fora; manda só o nome da tela aberta, nunca os dados do link. Citado na Política de Privacidade. |
| 05/11/2026 | **Benchmark aprovado** (`claude/benchmarks.md`): regras de operação da seção 4.1 e direção das Ondas 2 e 3 na seção 8. |
| 05/11/2026 | **Nenhum robô nem API oficial do WhatsApp**, por princípio: a política da Meta proíbe partidos e campanhas, e a plataforma é aberta a todos. Só links `wa.me` e recursos nativos do WhatsApp. |
| 05/11/2026 | **Nada de IA dentro do site na Onda 1.** A única IA é a ajuda na triagem de denúncias, fora do site e sob as regras da seção 4.1. |
| 05/11/2026 | Padrão adotado (pode ser trocado): **prazo de resposta a denúncia** de até 5 dias úteis, e até 48 horas para golpe, ameaça, risco a criança ou dado pessoal exposto. |

## 4. Princípios (regras que nunca mudam)

1. Aberta e apartidária na operação: a plataforma não toma partido, não recomenda voto e não dá destaque diferente a ninguém.
2. Grátis para quem usa; sem anúncio e sem venda de dados.
3. Respeito: ofensa, discurso de ódio, ameaça e desinformação comprovada ficam de fora, com regras públicas iguais para todos.
4. Dados mínimos; nunca perguntar voto, filiação ou opinião política.
5. Conteúdo de terceiros só com permissão e com canal de remoção.
6. Celular primeiro, internet fraca, acessibilidade.
7. Compartilhável no WhatsApp.
8. Validação no servidor.

**Na prática, para a neutralidade:** nenhuma paleta, ícone ou exemplo remete a partido; os exemplos da tela giram entre todos os tipos de organização; os textos da plataforma passam por um teste automático contra linguagem de campanha e siglas partidárias; apoiadores são diversos e públicos, sem contrapartida sobre conteúdo e sem recurso de partido ou candidato.

### 4.1 Regras de operação (aprovadas em 05/11/2026)

**Moderação**
- Toda denúncia recebe resposta no prazo público (seção 3), com o motivo da decisão, e quem denunciou ou foi denunciado pode pedir revisão (recurso), decidida por outra pessoa sempre que houver mais de uma pessoa moderando.
- Quem modera fica impedido de decidir casos com conflito de interesse: organização própria ou de parente, adversário direto, ou caso em que tenha interesse pessoal. Enquanto houver uma pessoa só, o conflito é declarado no relatório.
- Relatório público semestral com número de denúncias, remoções, recursos e prazos cumpridos, sem dados pessoais.
- O formulário de denúncia pede a descrição do problema e mostra uma revisão antes de enviar.

**Desinformação comprovada**
- Só conta como comprovada quando houver decisão judicial, ou checagem publicada por iniciativa de checagem independente, de preferência mais de uma e de linhas editoriais diferentes. Nunca por avaliação só da plataforma.

**Neutralidade e consultas**
- Toda consulta ou enquete criada na plataforma declara antes o que será feito com o resultado.
- Quando houver conteúdo público (Onda 3), regras eleitorais iguais para todos, com calendário público.

**IA**
- A IA nunca fala em nome do grupo nem decide: tudo o que gera sai como rascunho, com a fonte ou a fala original ao lado, e quem decide é uma pessoa.
- Não gera texto persuasivo nem de campanha e não recomenda candidato, partido ou voto (alinhado à Res. TSE 23.755/2026).
- Conteúdo gerado leva o rótulo "feito com IA".
- Nada do usuário vai para provedor que use os dados para treinar; dado sensível nunca vai para IA.

**WhatsApp**
- Nenhum robô nem API oficial do WhatsApp; só links `wa.me` e recursos nativos.

**Lei de Acesso à Informação**
- A plataforma nunca expõe quem fez um pedido e nunca envia pedido em nome de ninguém.

**Sustentação**
- Desde a criação da associação: reserva para encerramento e plano de saída (código aberto, dados exportáveis), para não depender de um único financiador.

## 5. Cuidados jurídicos já identificados (confirmar com advogado)

- **LGPD:** opinião política, filiação a partido, sindicato ou organização religiosa, filosófica ou política e convicção religiosa são **dados pessoais sensíveis** (art. 5º, II). Legítimo interesse não serve de base para dado sensível (art. 11). Se uma organização usar a plataforma para cadastrar membros, presença ou votos, a plataforma passa a guardar dado sensível por associação, mesmo sem perguntar. Definir quem é controlador (a organização) e quem é operador (a plataforma) em cada serviço. A lista "quem leva o quê" (Onda 2) pode revelar filiação por associação: decidir base legal e cuidados antes de construir.
- **Lei eleitoral:** partido e candidato não podem receber doação em dinheiro ou "estimável em dinheiro" de pessoa jurídica (art. 24 da Lei 9.504/97 e ADI 4650). Serviço gratuito pode ser tratado como doação estimável. Próximas eleições: municipais de 2028. Parecer de advogado eleitoral antes de qualquer serviço de campanha e antes de divulgar ferramentas que partidos possam usar. A Res. TSE 23.755/2026 proíbe provedor de IA de recomendar candidato, partido ou voto; confirmar se ela nos alcança caso a plataforma ofereça IA.
- **Marco Civil depois do STF (26/06/2025):** o art. 19 ficou parcialmente inconstitucional; provedores podem responder por conteúdo ilícito de terceiros que não removerem após notificação extrajudicial (crimes contra a honra seguem exigindo ordem judicial). Qualquer serviço que **hospede conteúdo público** precisa de canal de denúncia e processo de remoção desde o primeiro dia. A página de evento por link não guarda nada, mas mostra conteúdo no nosso domínio: perguntar ao advogado se aviso + denúncia + lista de bloqueio bastam.
- **ECA Digital (Lei 15.211/2025):** em vigor desde 17/03/2026; vale para serviços direcionados a menores ou "de acesso provável" por eles; guia da ANPD de 28/10/2026 modula exigências por porte; fiscalização a partir de jan/2027. Autodeclaração de idade tem risco (art. 9º). Decisão de 05/11: menores podem usar, se o advogado confirmar. Rever antes de quizzes e jogos.
- **Direito autoral:** livros e aulas enviados por usuários precisam de termo de autorização e de canal de pedido de remoção. Preferir apontar (link + resumo próprio) a hospedar. Logos e marcas nos cards são responsabilidade de quem faz o card (confirmar redação). Modelos da WikiLAI (CC BY 4.0) podem ser adaptados com crédito.
- **IA e transferência internacional:** mandar texto de usuário para IA no exterior (inclusive na triagem de denúncias) pode ser transferência internacional (LGPD, art. 33). Confirmar com o advogado e citar na Política de Privacidade.
- **Moderação:** com conteúdo de todas as posições políticas, a moderação precisa ser previsível e documentada desde o início (seção 4.1).
- Lista completa de perguntas ao advogado: `docs/onda-1.md` 8.6 e `claude/benchmarks.md` 6.4.

## 6. Perguntas abertas

- [ ] Nome e marca definitivos (domínio no Registro.br e busca no INPI). Não trava a construção; trava a divulgação.
- [ ] Formato jurídico (decidido: sem fins lucrativos). Associação sem fins lucrativos (OSC) é o recomendado; definir com contador e advogado.
- [ ] Como se sustenta: doações (decidido), além de editais e apoio institucional.
- [ ] Quem modera além do Kauê (na Onda 1: quem atende denúncia e atualiza a lista de bloqueio). As regras estão na seção 4.1.
- [ ] Se haverá conta de "organização" (Onda 3). Por enquanto, só pessoas.
- [ ] Na lista "quem leva o quê": nome, apelido ou nada, e quando a lista se apaga sozinha (antes da Onda 2).

## 7. Escopo da Onda 1

> Uma página leve com três ferramentas e as páginas institucionais. Nada de conta, nada de banco, nada de IA no site. No repositório, este arquivo é `docs/produto.md`.

### 7.1 Cards e convites
- 5 modelos: **Reunião ou assembleia, Evento ou atividade, Aviso, Resultado ou conquista, Agradecimento**.
- 3 formatos: **Status** (1080×1920), **Conversa** (1080×1080) e **Cartaz A4** (impressão, com QR).
- Campos curtos (título, data, hora, local, texto de até ~140 caracteres, nome da organização) e logo opcional. O logo é lido e reduzido no próprio aparelho e **nunca é enviado**.
- 6 paletas neutras e cor livre com checagem automática de contraste (4,5:1). Nenhuma paleta ou ícone remete a partido; todas valem para todos.
- Saídas: compartilhar a imagem (Web Share), **baixar a imagem**, copiar o texto, abrir no WhatsApp (`wa.me`) e imprimir ou salvar o cartaz em PDF.
- Texto alternativo da imagem gerado a partir dos campos.

### 7.2 Evento em um link
- Página do evento montada a partir dos dados que estão **no próprio link, depois do `#`**, compactados. Nada vai para servidor.
- Mostra título, data, hora, local (com botão "Ver no mapa" gerado por nós) e descrição; tem "Adicionar à agenda" (.ics e Google) e o card pronto.
- Proibido: link livre, PIX, telefone, HTML. Tudo exibido como texto puro, com limite de tamanho.
- Faixa fixa: "Conteúdo criado por quem enviou este link. O [nome] não confere nem guarda este conteúdo. Denunciar".
- Antes de mostrar, confere se o link está na lista `bloqueados.json`; se estiver, mostra "Este link foi removido após denúncia".

### 7.3 Reunião: convocação, pauta e ata
- Convocação: gera card e texto da reunião com a pauta numerada, e opcionalmente o link do evento.
- Ata: modelo guiado (data, local, presentes, pauta, o que foi decidido, encaminhamentos com responsável e prazo), com rascunho **só na aba aberta** enquanto o site estiver no endereço do GitHub (seção 3).
- Saída da ata: imprimir ou salvar em PDF (pelo próprio navegador, sem biblioteca pesada) e copiar o texto. A ata **não** vira link.

### 7.4 Páginas institucionais
- Sobre (o que é, quem mantém, princípios de neutralidade), Termos de Uso, Política de Privacidade, Regras de uso, Como denunciar e pedir remoção, Contato.
- **Regras de uso** trazem as regras da seção 4.1: moderação, definição de desinformação comprovada, neutralidade e o compromisso de não usar robô de WhatsApp.
- **Como denunciar** mostra o prazo de resposta (seção 3), que a decisão vem com o motivo e é tomada por uma pessoa, como pedir revisão (recurso) e que haverá relatório público semestral.
- **Política de Privacidade** diz que o texto de uma denúncia pode passar por uma ferramenta de IA para ajudar na triagem, sem o nome nem o e-mail de quem denunciou, e que quem decide é uma pessoa.
- Textos em versão provisória, com faixa "em revisão jurídica" até o advogado aprovar.

### 7.5 Regras técnicas
- Vite + TypeScript estrito, testes com Vitest, deploy pelo GitHub Actions (testes antes do build). Rotas por `#` e caminhos relativos, para funcionar no endereço do GitHub e depois no domínio próprio sem retrabalho.
- **Peso:** primeira tela com no máximo ~150 KB transferidos (HTML, CSS, JS e fontes); cada ferramenta carrega só quando aberta.
- **Offline:** service worker com pré-carga do app; depois da primeira visita, tudo funciona sem internet.
- **Acessibilidade:** WCAG 2.2 AA; contraste testado automaticamente; alvos de toque de 48 px; tudo operável por leitor de tela; texto simples; nunca informação só pela cor; respeitar "reduzir movimento"; tela de 360 px sem rolagem lateral.
- **Privacidade:** nenhuma chamada de rede além do próprio site e da contagem de visitas sem cookie (seção 3); sem cookies; armazenamento só para rascunhos e preferências, com botão de apagar.
- **Neutralidade no código:** teste que varre os textos da plataforma atrás de linguagem de campanha e de siglas partidárias.

## 8. Direção das Ondas 2 e 3 (aprovada em 05/11/2026; escopo detalhado antes de cada onda)

**Onda 2 — Aprender e agir** (entra o Supabase)
1. **Lista de quem leva o quê** (antigos itens 7 e 8 juntos): lista em link para doação de itens, mutirão, festa ou ação, com itens, quantidade, limite e botão "eu levo"; apelido opcional, sem telefone. **Primeira da Onda 2.**
2. **Assistente de pedido de LAI** (antigo item 4): mostra onde pedir (Informa.BR no federal, prefeitura, câmara), modelo pronto adaptado da WikiLAI, aviso de que não é preciso dizer o motivo, "veja se alguém já pediu" (busca da CGU e diário oficial) e lembrete de prazo e de recurso gerado no aparelho. Nunca envia nem publica pedidos. Estático; pode rodar em paralelo ao item 1.
3. **Lei e regra em linguagem simples**, pré-gerada com IA e revisada por pessoa, com a fonte oficial ao lado. Junto dos itens 2 e dos modelos de documentos. Sem IA ao vivo.
4. **Ouvir o aviso com a voz do celular** nos cards e no evento (leitura do próprio aparelho, sem IA generativa e sem custo).
5. Quizzes de cidadania, modelos de documentos e biblioteca curada, como já previsto.
6. **Enquete rápida anônima** (antigo item 10, parte A), se couber: só totais, grupo mínimo, sem conta, complementar à enquete nativa do WhatsApp.

**Onda 3 — Gerir a organização**
- **Mapa de consenso** no estilo Polis (antigo item 10, parte B): só pauta interna da organização, só agregados, sem tema partidário ou eleitoral.
- **Rascunho de ata com IA** a partir de texto colado: só depois de nova decisão registrada aqui, porque contraria hoje a regra "ata só no aparelho".
- Consulta a dados públicos via API do Querido Diário, página da organização, prestação de contas e contas de organização.

**Fora:** robô ou API do WhatsApp (por princípio), abaixo-assinado, mapa de organizações, cadastro de membros e ferramentas de campanha eleitoral.
