# Projeto Comunidade — produto (fonte da verdade)

> Versão 0.3 · 05/11/2026 · nome provisório. Este documento guarda regras e decisões. O que está em "Perguntas abertas" ainda não foi decidido. Plano de construção e passo a passo: `claude/onda-1.md`.

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
| 05/11/2026 | Padrões adotados (podem ser trocados): beta no endereço gratuito do GitHub; nome no código num arquivo só; licença MIT para o código e CC BY 4.0 para modelos e textos; rodapé "feito com…" ligado mas removível por quem faz o card; nenhuma métrica no beta e GoatCounter (sem cookie) antes de divulgar; não perguntar idade na Onda 1. |
| 05/11/2026 | E-mail público de contato do projeto: **contato.projetocomunidade@gmail.com** (Gmail próprio, separado do pessoal, transferível para a futura associação). Usado em denúncia, remoção e contato. |
| 05/11/2026 | **Presença e ata ficam só no aparelho** de quem escreve e nunca entram em link compartilhável (presença revela filiação). |
| 05/11/2026 | **Página de evento por link:** dados só depois do `#`, nada de link livre, PIX ou telefone, faixa "conteúdo de quem enviou", denúncia e lista pública de links bloqueados. |
| 05/11/2026 | A regra "validado no servidor" não se aplica à Onda 1, que não tem regra, permissão nem contagem. Volta a valer na Onda 2. |

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

## 5. Cuidados jurídicos já identificados (confirmar com advogado)

- **LGPD:** opinião política, filiação a partido, sindicato ou organização religiosa, filosófica ou política e convicção religiosa são **dados pessoais sensíveis** (art. 5º, II). Legítimo interesse não serve de base para dado sensível (art. 11). Se uma organização usar a plataforma para cadastrar membros, presença ou votos, a plataforma passa a guardar dado sensível por associação, mesmo sem perguntar. Definir quem é controlador (a organização) e quem é operador (a plataforma) em cada serviço.
- **Lei eleitoral:** partido e candidato não podem receber doação em dinheiro ou "estimável em dinheiro" de pessoa jurídica (art. 24 da Lei 9.504/97 e ADI 4650). Serviço gratuito pode ser tratado como doação estimável. Próximas eleições: municipais de 2028. Parecer de advogado eleitoral antes de qualquer serviço de campanha e antes de divulgar ferramentas que partidos possam usar.
- **Marco Civil depois do STF (26/06/2025):** o art. 19 ficou parcialmente inconstitucional; provedores podem responder por conteúdo ilícito de terceiros que não removerem após notificação extrajudicial (crimes contra a honra seguem exigindo ordem judicial). Qualquer serviço que **hospede conteúdo público** precisa de canal de denúncia e processo de remoção desde o primeiro dia. A página de evento por link não guarda nada, mas mostra conteúdo no nosso domínio: perguntar ao advogado se aviso + denúncia + lista de bloqueio bastam.
- **ECA Digital (Lei 15.211/2025):** em vigor desde 17/03/2026; vale para serviços direcionados a menores ou "de acesso provável" por eles; guia da ANPD de 28/10/2026 modula exigências por porte; fiscalização a partir de jan/2027. Autodeclaração de idade tem risco (art. 9º). Decidir idade mínima antes de quizzes e jogos.
- **Direito autoral:** livros e aulas enviados por usuários precisam de termo de autorização e de canal de pedido de remoção. Preferir apontar (link + resumo próprio) a hospedar. Logos e marcas nos cards são responsabilidade de quem faz o card (confirmar redação).
- **Moderação:** com conteúdo de todas as posições políticas, a moderação precisa ser previsível e documentada desde o início.

## 6. Perguntas abertas

- [ ] Nome e marca definitivos (domínio no Registro.br e busca no INPI). Não trava a construção; trava a divulgação.
- [ ] Pessoa física, MEI, empresa ou associação sem fins lucrativos (OSC) como responsável. Uma OSC abre editais, doações, `.org.br`, Google para ONGs e TechSoup; definir com contador e advogado.
- [ ] Como se sustenta sendo grátis: editais, doações, apoio institucional, voluntariado.
- [ ] Quem modera e com que regras (na Onda 1: quem atende denúncia e atualiza a lista de bloqueio).
- [ ] Se haverá conta de "organização" (com várias pessoas administrando) ou só contas pessoais (Onda 3).
- [ ] Se menores de 18 poderão usar e como (antes da Onda 2).

## 7. Escopo da Onda 1

> Uma página leve com três ferramentas e as páginas institucionais. Nada de conta, nada de banco. No repositório, este arquivo vira `docs/produto.md`.

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
- Ata: modelo guiado (data, local, presentes, pauta, o que foi decidido, encaminhamentos com responsável e prazo), com rascunho salvo **só neste aparelho** e botão "Apagar do aparelho".
- Saída da ata: imprimir ou salvar em PDF (pelo próprio navegador, sem biblioteca pesada) e copiar o texto. A ata **não** vira link.

### 7.4 Páginas institucionais
- Sobre (o que é, quem mantém, princípios de neutralidade), Termos de Uso, Política de Privacidade, Regras de uso, Como denunciar e pedir remoção, Contato.
- Textos em versão provisória, com faixa "em revisão jurídica" até o advogado aprovar.

### 7.5 Regras técnicas
- Vite + TypeScript estrito, testes com Vitest, deploy pelo GitHub Actions (testes antes do build). Rotas por `#` e caminhos relativos, para funcionar no endereço do GitHub e depois no domínio próprio sem retrabalho.
- **Peso:** primeira tela com no máximo ~150 KB transferidos (HTML, CSS, JS e fontes); cada ferramenta carrega só quando aberta.
- **Offline:** service worker com pré-carga do app; depois da primeira visita, tudo funciona sem internet.
- **Acessibilidade:** WCAG 2.2 AA; contraste testado automaticamente; alvos de toque de 48 px; tudo operável por leitor de tela; texto simples; nunca informação só pela cor; respeitar "reduzir movimento"; tela de 360 px sem rolagem lateral.
- **Privacidade:** nenhuma chamada de rede além do próprio site; sem cookies; armazenamento local só para rascunhos e preferências, com botão de apagar.
- **Neutralidade no código:** teste que varre os textos da plataforma atrás de linguagem de campanha e de siglas partidárias.