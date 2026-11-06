# Projeto Comunidade — produto (fonte da verdade)

> Versão 0.10 · 06/11/2026 · nome provisório. Este documento guarda regras e decisões. O que está em "Perguntas abertas" ainda não foi decidido. A cópia que vale no código é `docs/produto.md` no repositório; esta aqui deve ficar igual a ela. A v0.5 junta a v0.4 (benchmark aprovado) com as decisões tomadas no Claude Code em 05/11 (ata só na aba, denúncias por e-mail com ajuda do Gemini, sem fins lucrativos, menores, só pessoas, métricas no beta). A v0.7 registra as decisões tomadas a partir da revisão de segurança e da análise jurídica preliminar de 05/11 (guarda dos e-mails, nome do responsável, prazos de denúncia, regras 9 a 11). A v0.8 registra as decisões de 06/11, tomadas a partir da revisão do fluxo único (exemplo, link e reunião; seção 7.6). A v0.9 registra a direção para problemas da rua (06/11): a porta "Pedir conserto na rua" logo depois do beta e o mapa público do bairro na Onda 3.

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
| 05/11/2026 | **Resposta à denúncia** escrita com ajuda de IA leva a frase "escrita com ajuda de inteligência artificial e revisada por uma pessoa" e oferece falar com uma pessoa respondendo o e-mail. |
| 05/11/2026 | **E-mail de denúncia guardado por até 6 meses depois de encerrado o caso; o registro sem dados pessoais (planilha), por 3 anos**; com processo ou ordem de autoridade, até o fim dele. Troca o "sem prazo definido" decidido antes, que a análise jurídica preliminar apontou como contrário à LGPD (arts. 6º, III, e 9º, II). E-mails de **contato**: até 6 meses depois de encerrada a conversa (decidido em 05/11). Limpeza mensal no Gmail (`docs/moderacao.md`). Atividade do Gemini desligada. |
| 05/11/2026 | **Responsável pelos dados (controlador) é o Kauê, como pessoa física**, até existir a associação. Nome civil completo (**Kauê Sevilhano Walter**, sem CPF e sem endereço) e e-mail do projeto na Política de Privacidade, nos Termos e no Sobre (`RESPONSAVEL` em `src/comum/marca.ts`). Agente de pequeno porte, sem encarregado, com o e-mail como canal. |
| 05/11/2026 | **Benchmark aprovado** (`claude/benchmarks.md`): regras de operação da seção 4.1 e direção das Ondas 2 e 3 na seção 8. |
| 05/11/2026 | **Nenhum robô nem API oficial do WhatsApp**, por princípio: a política da Meta proíbe partidos e campanhas, e a plataforma é aberta a todos. Só links `wa.me` e recursos nativos do WhatsApp. |
| 05/11/2026 | **Nada de IA dentro do site na Onda 1.** A única IA é a ajuda na triagem de denúncias, fora do site e sob as regras da seção 4.1. |
| 05/11/2026 | **Prazo de resposta a denúncia:** conteúdo sexual com criança ou adolescente, bloqueio imediato ao ler; outro risco a criança ou adolescente, ameaça, golpe e aviso falso de perigo ou de órgão público, até 24 horas; dado pessoal exposto, até 48 horas; o resto, até 5 dias úteis; revisão, até 5 dias úteis. Troca o padrão anterior (48 horas para os urgentes), a partir da análise jurídica preliminar. |
| 05/11/2026 | **Fluxo único** (caminho B, telas aprovadas pelo Kauê): a entrada do site deixa de ser "três ferramentas" e vira "O que você quer fazer?". Um caminho de 3 passos curtos, com exemplo já preenchido e prévia sempre à vista, termina numa tela que entrega imagem, texto, link e cartaz de uma vez. A ata vira "Depois da reunião". Escopo na seção 7.6. |
| 05/11/2026 | **Depois da revisão de segurança** (`docs/auditoria/2026-11-05/seguranca.md`): regra nova nas Regras de uso, "fingir ser outra pessoa, organização ou órgão público"; a tela de link removido mostra a regra ferida e como pedir revisão; pedido "é um conteúdo meu" só é atendido com indício de que a pessoa criou o link; o Cards só abre preenchido pelo que outra ferramenta preparou na mesma aba, nunca por dados no link. |
| 05/11/2026 | **Depois da análise jurídica preliminar** (feita por IA, a conferir pelo advogado; não muda a faixa "em revisão jurídica"): a regra 9 ganha exceção para paródia, sátira e crítica que quem lê percebe logo; regras novas 10 (expor criança ou adolescente) e 11 (incentivo a automutilação ou suicídio); seção "O que não é removido" (crítica, mesmo dura, não é ofensa); a tela de link removido fala como decisão do site e, nas regras 8 e 10, não repete o texto da regra; a página de evento pede para não ser indexada e avisa "Nunca faça pagamento pedido por um evento"; cada decisão de moderação registra o fundamento; Termos com responsabilidade, cláusula eleitoral e nenhum atendimento exclusivo a partido, candidato ou campanha. **Regras de apoio** (página Sobre): nenhuma doação com destino marcado; recusa de dinheiro e serviço de partido, candidato, pré-candidato, campanha, quem exerce mandato, dirigente partidário e órgão público (a não ser por edital público); lista pública de apoiadores com o valor ou a faixa; nenhum apoiador passa de 20% da receita do ano. |
| 06/11/2026 | **Depois da revisão do fluxo único** (`docs/auditoria/2026-11-05/fluxo.md`): o Pronto diz o que ainda é do exemplo e pede confirmação na própria tela antes de mandar, baixar, copiar ou imprimir; **o link do evento só nasce com a organização trocada** (o título do exemplo pode ser o de verdade, então não trava); a reunião avisa no passo 1 que título, local e pauta vão no link, sem nome de pessoa; "Fazer o card" e "Criar outro", sem mudança, mantêm o link original, para o bloqueio pegar as cópias. "Mandar sem o link" e cartaz de reunião sem QR esperam o beta. Detalhes na seção 7.6. |
| 06/11/2026 | **Problemas da rua** (mato alto, buraco, lâmpada apagada, entulho e parecidos). **Porta nova "Pedir conserto na rua"**, logo depois do beta do fluxo único: a pessoa escolhe o tipo, marca o ponto no mapa ou digita o endereço e pode pôr uma foto; o site monta texto, foto e link do local para o canal oficial da cidade (ouvidoria, 156 ou o aplicativo que a prefeitura já usa, como o Colab) e para o grupo do bairro no WhatsApp. **Nada fica guardado** e nada é enviado em nome de ninguém. O **mapa público do bairro** fica para a Onda 3, com as condições da seção 8. Em qualquer caso, **as categorias falam só de coisas, nunca de pessoas**. Escopo na seção 8. |
| 06/11/2026 | **Primeira tela do fluxo:** em celular de 360 × 640, o primeiro campo do passo 1, as escolhas do passo 3 e o "Mandar no WhatsApp" do Pronto aparecem sem rolar; "Fazer a ata" é botão secundário. Avisos iguais, só mudam de lugar e de tamanho. Conferido nos testes de ponta a ponta. |

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
- **Fotos de rua (06/11):** rosto, placa de carro e fachada de casa podem ser dado pessoal. Na porta "Pedir conserto na rua" a foto não sai do aparelho. No mapa público (Onda 3), perguntar ao advogado a base legal para publicar e se borrar rosto e placa basta. Um mapa de problemas também pode ser usado como peça de campanha em 2028: perguntar que cuidados eleitorais valem para ele.
- **Moderação:** com conteúdo de todas as posições políticas, a moderação precisa ser previsível e documentada desde o início (seção 4.1).
- Lista completa de perguntas ao advogado: `docs/onda-1.md` 8.6 e `claude/benchmarks.md` 6.4.

## 6. Perguntas abertas

- [ ] Nome e marca definitivos (domínio no Registro.br e busca no INPI). Não trava a construção; trava a divulgação.
- [ ] Formato jurídico (decidido: sem fins lucrativos). Associação sem fins lucrativos (OSC) é o recomendado; definir com contador e advogado.
- [ ] Como se sustenta: doações (decidido), além de editais e apoio institucional.
- [ ] Quem modera além do Kauê (na Onda 1: quem atende denúncia e atualiza a lista de bloqueio). As regras estão na seção 4.1.
- [ ] Se haverá conta de "organização" (Onda 3). Por enquanto, só pessoas.
- [ ] Na lista "quem leva o quê": nome, apelido ou nada, e quando a lista se apaga sozinha (antes da Onda 2).
- [ ] Parecer do advogado sobre a análise jurídica preliminar de 05/11/2026 (feita por IA). As normas de 2026 citadas nela (adequação da União Europeia, decretos do Marco Civil e do ECA Digital) só entram nos textos públicos depois que ele confirmar.
- [ ] De onde vem o mapa da porta "Pedir conserto na rua": hospedar o nosso próprio mapa (dados do OpenStreetMap) ou usar um fornecedor gratuito que permita esse uso. Decidir antes de construir a porta.
- [ ] Lista de canais oficiais por cidade (ouvidoria, 156, aplicativo da prefeitura): começa genérica ou com algumas cidades? Quem mantém e como confere que o canal é mesmo oficial?

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
- Antes de mostrar, confere se o link está na lista `bloqueados.json`; se estiver, mostra que ele foi removido após denúncia (ou a pedido de quem o criou), o motivo como decisão do site e como pedir revisão por e-mail.
- Quem chama aparece como "segundo quem criou o link". A faixa também diz "Nunca faça pagamento pedido por um evento". A página pede aos buscadores para não indexar.
- O card do evento recebe os dados pela memória da aba, nunca pelo link.

### 7.3 Reunião: convocação, pauta e ata
- Convocação: gera card e texto da reunião com a pauta numerada e o link do evento. Desde o fluxo único (7.6), a convocação é a porta "Chamar para uma reunião" e o texto sempre leva o link, com a frase "O link leva título, dia, hora, local e a pauta. Quem receber pode repassar." na tela Pronto.
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


### 7.6 Fluxo único (aprovado em 05/11/2026)

> Telas aprovadas no quadro "Fluxo único — telas" (claude.ai). As ferramentas continuam as mesmas por dentro; muda o caminho até elas.

- **Início — "O que você quer fazer?"**: cinco portas grandes com verbo e exemplo: Chamar para uma reunião (assembleia, encontro, plenária); Divulgar um evento (mutirão, festa, culto, ato, curso); Dar um aviso (mudança, lembrete, recado); Contar uma conquista; Agradecer. Reunião em destaque (fundo escuro), evento e aviso em largura cheia, conquista e agradecimento lado a lado e menores, cada porta com um ícone simples de traço. Abaixo, o atalho "Depois da reunião: fazer a ata". Uma frase só de explicação: "Em 1 minuto você tem a imagem, o texto e o link para o WhatsApp. Sem cadastro."
- **Três passos**, uma coisa por tela, com "Passo N de 3" em texto, botões "Voltar" e "Continuar" fixos embaixo (no passo 3, "Ficou bom"). A barra nunca cobre o campo: com o teclado aberto, ela solta da tela. O rodapé do site não aparece nos passos nem no Pronto; fica no início, nas páginas, na ata e na página do evento:
  1. **O quê:** título, organização e, se for reunião, a pauta (um item por linha).
  2. **Quando e onde:** dia (com atalhos Hoje, Amanhã, Próximo sábado), hora e local. Aviso e agradecimento podem pular este passo.
  3. **Como fica:** prévia grande e só duas escolhas: "Onde vai mandar?" (Status, Grupo, Cartaz, três botões lado a lado) e a cor (as 6 paletas, em bolinhas com o nome lido pelo leitor de tela e ✓ na escolhida). Logo, cor livre e rodapé ficam em "Mais opções", fechado.
- **Prévia sempre à vista:** nos passos 1 e 2, uma miniatura fixa no topo com "Ver maior".
- **Começa preenchido:** cada porta abre com um exemplo pronto, em rodízio entre os tipos de organização; a pessoa troca o que quiser ("Apagar o exemplo" é um link discreto abaixo do texto de abertura; limpa também o local, se ainda for o do exemplo). Nada de tela em branco.
- **Tela "Pronto"**: um botão principal, "Mandar no WhatsApp" (imagem + texto; com data e local, o texto leva o link do evento). Embaixo: Baixar a imagem, Copiar só o texto, Copiar o link, Imprimir cartaz para o mural. Depois, "Mudar algo" e "Fazer outro". Na reunião, a ponte "E depois da reunião? Fazer a ata", que já abre com a pauta.
  - **Exemplo não trocado:** o Pronto diz quais campos ainda são do exemplo (título, organização, texto ou pauta e local; dia e hora não contam). Antes de mandar, baixar, copiar o texto ou o link, ou imprimir, abre um painel na própria tela: "Mudar algo" ou "<Ação> mesmo assim". Depois de confirmar, não pergunta de novo.
  - **O link só nasce com o seu:** o link do evento só é criado depois de trocar a organização do exemplo (é ela que faria o convite parecer de outra organização). O título do exemplo pode ser o de verdade ("Assembleia da categoria"), então fica só no aviso e na confirmação. Sem link, não há QR no cartaz nem "Mais detalhes" no texto.
  - **Reunião no link:** título, local e pauta vão no link do convite. O passo 1 da reunião avisa isso antes dos campos: quem receber pode repassar, e não se escreve nome de pessoa nem assunto só do grupo. A dica da pauta pede "sem nome de pessoa" e a do local (passo 2) pede para não pôr o nome de quem mora, se for numa casa. A organização do catálogo de exemplos também conta como do exemplo em dados de link antigos. No Pronto da reunião, uma nota ao lado de "Imprimir cartaz para o mural" diz que o QR abre a pauta inteira.
- **Ata (Depois da reunião):** o modelo de ata atual, recebendo a pauta da convocação só na mesma aba (regra da seção 3: nada vai para link nem sai do aparelho).
- **Links que já circulam continuam valendo:** páginas de evento (`#/evento/...`) abrem igual; os endereços antigos das ferramentas levam ao ponto certo do fluxo. "Fazer o card deste evento" e "Criar outro a partir deste", sem mudar título, dia, hora, local, texto ou organização (formato e cor não contam), mantêm o link original do evento; mudou algum campo, sai um link novo. Dados que vieram de um link levam a nota "Confira tudo antes de mandar" nos passos 1 e 3 e no Pronto.
- **Ajuda só na hora certa:** uma dica curta por passo, sem tour de boas-vindas.
- **Visual:** a fonte e as cores atuais do site; botões de 52 px ou mais; texto do campo sempre visível acima dele, nunca só dentro.

## 8. Direção das Ondas 2 e 3 (aprovada em 05/11/2026; escopo detalhado antes de cada onda)

**Logo depois do beta — porta "Pedir conserto na rua"** (aprovada em 06/11/2026; sem banco, mesma arquitetura da Onda 1)
- Mais uma porta do início "O que você quer fazer?", no mesmo jeito de 3 passos e tela "Pronto".
- **Tipos fixos, só de coisas:** mato alto, buraco no asfalto ou na calçada, lâmpada apagada, lixo ou entulho, vazamento de água ou esgoto, árvore ou galho com risco de cair, sinalização quebrada, outro problema na rua. **Nunca** categoria sobre pessoas (morador em situação de rua, "ponto de droga", "pessoa suspeita" e parecidos).
- **Local:** endereço digitado ou ponto no mapa. O mapa é opcional e só carrega se a pessoa pedir (internet fraca). A localização do aparelho só é usada se a pessoa tocar em "usar onde estou", e só o ponto do problema entra no texto.
- **Foto opcional:** lida e reduzida no aparelho, sem a localização gravada pela câmera, com aviso "evite rostos e placas de carro". Nunca é enviada para nós.
- **Saída:** texto pronto pedindo o conserto, a foto e o link do ponto no mapa; "Mandar no WhatsApp" para o grupo do bairro; e "Onde pedir na sua cidade", que mostra o canal oficial (ouvidoria, 156 ou o aplicativo que a prefeitura já usa, como o Colab). A plataforma **nunca envia o pedido em nome de ninguém** e não cria página no nosso domínio.
- **Neutralidade:** o texto pede o conserto e não culpa ninguém; nenhuma menção a prefeito, vereador, partido ou gestão.
- **Mapa:** dados do OpenStreetMap, com crédito. Nunca usar os servidores de mapa do próprio OpenStreetMap, que proíbem uso pesado; hospedar o nosso ou usar fornecedor que permita (pergunta aberta na seção 6).

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
- **Mapa público do bairro** (aprovado como direção em 06/11/2026): os pedidos de conserto ficam à vista de todos, com "eu também vi" e "já foi resolvido". Só entra quando houver parecer do advogado, Supabase, mais de uma pessoa moderando e regras eleitorais com calendário público (seção 4.1). Condições: quem registrou nunca aparece; foto só aparece depois de revisão ou com rosto e placa borrados; "eu também vi" e "resolvido" contados e validados no servidor; nenhuma nota, ranking ou comparação de gestão, prefeito, vereador ou partido; dados abertos iguais para todos. Antes de construir, comparar com reaproveitar o FixMyStreet (código aberto da mySociety) e com o padrão aberto Open311.

**Fora:** robô ou API do WhatsApp (por princípio), abaixo-assinado, mapa de organizações (o mapa de problemas da rua é outra coisa: ver acima), cadastro de membros e ferramentas de campanha eleitoral.
