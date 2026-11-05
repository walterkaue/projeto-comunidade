# Próximos passos

> Retrato do projeto em 05/11/2026, para retomar em qualquer conversa. Regras e decisões ficam no `docs/produto.md`; aqui só fica o que vem a seguir.
> Ao fechar um item, atualize este arquivo no mesmo commit. Para começar, siga a divisão de trabalho do `CLAUDE.md`.

## Onde estamos

| Área | Estado em 05/11/2026 |
|---|---|
| Código | **Onda 1 pronta na `main`**: Cards e convites, Evento em um link, Reunião (convocação, pauta e ata) e as seis páginas institucionais. 30 arquivos de teste, 456 testes passando, incluindo os de regra (peso, neutralidade, privacidade) |
| Publicação | No ar em https://walterkaue.github.io/projeto-comunidade/, publicado pelo GitHub Actions. Conferido em 360 px: evento → página → card preenchido com QR → denúncia com o link; sem rolagem lateral, sem erro no console |
| Tamanho | Cerca de 7 KB gzip na primeira visita (HTML, JS e CSS iniciais; limite do teste: 80 KB), mais 24 KB de fontes. Cada ferramenta baixa só quando abre (a maior, Cards, tem 12 KB gzip) |
| Revisão | Cada sessão passou pelos três revisores; o conjunto também (geral, acessibilidade, privacidade e neutralidade). Achados graves, altos e médios corrigidos |
| Moderação | Denúncia por e-mail; `npm run bloquear -- --arquivo <caminho>` grava a impressão do link e da forma canônica do evento. O link nunca vai na linha de comando (`docs/moderacao.md`) |
| Segurança | Revisão de 05/11/2026 em `docs/auditoria/2026-11-05/seguranca.md`: 0 crítico, 1 alto, 9 médios, 9 baixos. **O que bloqueava o beta (A1, M1, M2, M3) foi corrigido em 05/11/2026.** Faltam M4 a M9 antes da divulgação |

## Próximos passos

1. **Kauê testa no celular** e mostra para 5 a 8 organizações (roteiro em `docs/onda-1.md`, seção 8.7).
2. **Advogado:** documento de consulta no Claude Docs (com os textos de Termos, Privacidade e Regras). Decidido em 05/11/2026: responsável pelos dados é o Kauê (pessoa física) até a associação, e os e-mails ficam guardados sem prazo por enquanto; o advogado avalia as duas coisas. Acrescentar à consulta: a contagem de visitas no GoatCounter (servidores na Finlândia e na Alemanha) como transferência internacional, e a regra nova contra se passar por outra pessoa ou organização (auditoria M4 e M6). Aprovado, `LANCAMENTO_PUBLICO = true` em `src/comum/marca.ts`.
3. **Moderação em operação:** Gem criado e testado de ponta a ponta em 05/11/2026 (denúncia → Gmail → Gem → `npm run bloquear` → "removido"). Formulário de denúncia com tipo, descrição obrigatória e revisão antes de enviar no ar desde 05/11/2026 (`src/paginas/formularioDenuncia.ts`). Modelo da planilha de controle em `docs/controle-denuncias-modelo.csv`. **Kauê:** colar no Gem as instruções novas de 05/11/2026 (`docs/gemini-triagem.md`, seção 4, com o passo a passo no topo dela).
4. **Correções da auditoria antes da divulgação** (Sessão 7 de `docs/onda-1.md`): M4 a M9 e os baixos B1, B3, B4 e B5, na ordem do fim do relatório. Do Kauê, nos painéis: GoatCounter (Settings → Data collection, antes do texto de M4), verificação em duas etapas no Gmail do projeto, conta do Gem com a Atividade desligada, Dependabot e regra da `main` no GitHub, e desligar o Pages do `auxiliar-ia` se não for usado.
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
