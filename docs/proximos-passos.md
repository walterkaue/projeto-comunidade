# Próximos passos

> Retrato do projeto em 05/11/2026, para retomar em qualquer conversa. Regras e decisões ficam no `docs/produto.md`; aqui só fica o que vem a seguir.
> Ao fechar um item, atualize este arquivo no mesmo commit. Para começar, siga a divisão de trabalho do `CLAUDE.md`.

## Onde estamos

| Área | Estado em 05/11/2026 |
|---|---|
| Código | **Onda 1 pronta na `main`**: Cards e convites, Evento em um link, Reunião (convocação, pauta e ata) e as seis páginas institucionais. 33 arquivos de teste, 470 testes passando, incluindo os de regra (peso, neutralidade, privacidade) |
| Publicação | No ar em https://walterkaue.github.io/projeto-comunidade/, publicado pelo GitHub Actions. Conferido em 360 px: evento → página → card preenchido com QR → denúncia com o link; sem rolagem lateral, sem erro no console |
| Tamanho | Cerca de 7 KB gzip na primeira visita (HTML, JS e CSS iniciais; limite do teste: 80 KB), mais 24 KB de fontes. Cada ferramenta baixa só quando abre (a maior, Cards, tem 12 KB gzip) |
| Revisão | Cada sessão passou pelos três revisores; o conjunto também (geral, acessibilidade, privacidade e neutralidade). Achados graves, altos e médios corrigidos |
| Moderação | Denúncia por e-mail; `npm run bloquear -- --arquivo <caminho> --motivo regra-<número>` (ou `--motivo pedido`) grava a impressão do link, a da forma canônica do evento e o motivo, que a tela de link removido mostra. O link nunca vai na linha de comando (`docs/moderacao.md`) |
| Segurança | Revisão de 05/11/2026 em `docs/auditoria/2026-11-05/seguranca.md`: 0 crítico, 1 alto, 9 médios, 9 baixos. **A1 e M1 a M8 corrigidos em 05/11/2026.** M9 (endereço dividido no github.io) sai com o domínio próprio. Seguem abertos os baixos B2 a B9 |

## Próximos passos

1. **Kauê testa no celular** e mostra para 5 a 8 organizações (roteiro em `docs/onda-1.md`, seção 8.7).
2. **Advogado:** em 05/11/2026 chegou uma **análise jurídica preliminar feita por IA**, que não é parecer com OAB. Ela diz que nada impede o beta, e o que ela apontava como impedimento para a divulgação já foi aplicado (`docs/produto.md`, seção 3, v0.7). Levar ao advogado: a análise, os textos novos (Termos, Privacidade, Regras de uso, Como denunciar, Sobre), `docs/legitimo-interesse.md` e `docs/avaliacao-eca-digital.md`. Pedir que ele confirme as normas de 2026 citadas na análise (Res. CD/ANPD 32/2026, Decretos 12.975, 12.880 e 12.882/2026, embargos do STF de 17/06/2026) antes de qualquer uma entrar num texto público. Pedir também, no contrato de honorários, autorização para licenciar sob CC BY 4.0 os textos que ele revisar. Aprovado, `LANCAMENTO_PUBLICO = true` em `src/comum/marca.ts`.
3. **Moderação em operação:** Gem criado e testado de ponta a ponta em 05/11/2026 (denúncia → Gmail → Gem → `npm run bloquear` → "removido"). Formulário de denúncia com tipo, descrição obrigatória e revisão antes de enviar no ar desde 05/11/2026 (`src/paginas/formularioDenuncia.ts`). Modelo da planilha de controle em `docs/controle-denuncias-modelo.csv`. **Kauê:** colar no Gem o bloco novo de 05/11/2026, com as regras 9 a 11 e os prazos de 24 horas (`docs/gemini-triagem.md`, seção 4, com o passo a passo no topo dela). Uma vez por mês, apagar no Gmail as denúncias encerradas há mais de 6 meses (`docs/moderacao.md`, "Guarda dos e-mails").
4. **O que sobrou da auditoria e da análise:** baixos B3 e B4 antes da divulgação (B5 feito: `CREDITOS.md` e `public/licencas.txt`; os outros quando der); M9 com o domínio próprio (item 6). Da análise jurídica: a dica "escreva o nome da organização, não de pessoas" na criação do evento e o aviso e o rodapé da ata ficaram para a sessão do fluxo único, que está refazendo essas telas; prazo de guarda dos e-mails de contato (pergunta aberta); guardar em `docs/` uma cópia datada dos termos do GoatCounter; opcionais (código de remoção, "evento já aconteceu" depois de 30 dias, respeitar o Do Not Track); regra eleitoral sobre IA até março de 2028; migrar o e-mail para o Google Workspace quando houver associação. Do Kauê, nos painéis: GoatCounter (Settings → Data collection, antes do texto de M4), verificação em duas etapas no Gmail do projeto, conta do Gem com a Atividade desligada, Dependabot e regra da `main` no GitHub, e desligar o Pages do `auxiliar-ia` se não for usado.
5. **Métricas:** ligadas em 05/11/2026 (GoatCounter `projetocomunidade`, painel em https://projetocomunidade.goatcounter.com). Código em `src/comum/metricas.ts`; para desligar, `METRICAS_ID = ''` em `marca.ts` e tirar o endereço do `img-src` da CSP (o teste de privacidade confere os dois juntos).
6. **Nome e domínio** (Kauê, semana de 09/11/2026): trocar a `og:image` no `index.html` e configurar em Settings → Pages → Custom domain (com Actions não há arquivo CNAME; ver `docs/onda-1.md`, 8.5). Com domínio próprio, rever o rascunho da ata no aparelho.
7. **Ícone e nome definitivos:** `src/comum/marca.ts`, `index.html`, `public/manifest.webmanifest`, `public/offline.html`, `scripts/gerar-icones.mjs`; rodar `npm run icones`.
8. **Onda 2:** guia da Lei de Acesso à Informação, idade mínima antes de quizzes e jogos (depende do advogado).

## Pendências pequenas da revisão (não bloqueiam)

- O teste de neutralidade não confere cor de partido em paletas e modelos prontos: a sessão dos cards e o `revisor-privacidade-neutralidade` olham isso à mão.
- `public/offline.html` usa `onclick` em linha. Hoje não tem CSP própria; se ganhar, trocar por um listener.
- Aviso de saída não pega o toque longo "abrir em nova aba" do celular (só clique e clique do meio).
- "Oficial" e "verificado" só são recusados no evento quando ligados ao site ou ao conteúdo ("evento verificado", "oficial do site"); "Equipe da Comunidade" ainda passa (o nome curto só é recusado como campo inteiro).
- "Doação via transferência TED." sem número passa: sem valor ou número não dá para separar de texto comum.
- Sem internet e sem nenhuma cópia da lista guardada (primeira visita já sem rede), um evento bloqueado aparece.
