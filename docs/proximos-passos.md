# Próximos passos

> Retrato do projeto em 05/11/2026, para retomar em qualquer conversa. Regras e decisões ficam no `docs/produto.md`; aqui só fica o que vem a seguir.
> Ao fechar um item, atualize este arquivo no mesmo commit. Para começar, siga a divisão de trabalho do `CLAUDE.md`.

## Onde estamos

| Área | Estado em 05/11/2026 |
|---|---|
| Código | **Onda 1 pronta na `main`**: Cards e convites, Evento em um link, Reunião (convocação, pauta e ata) e as seis páginas institucionais. 28 arquivos de teste, 436 testes passando, incluindo os de regra (peso, neutralidade, privacidade) |
| Publicação | No ar em https://walterkaue.github.io/projeto-comunidade/, publicado pelo GitHub Actions. Conferido em 360 px: evento → página → card preenchido com QR → denúncia com o link; sem rolagem lateral, sem erro no console |
| Tamanho | Cerca de 7 KB gzip na primeira visita (HTML, JS e CSS iniciais; limite do teste: 80 KB), mais 24 KB de fontes. Cada ferramenta baixa só quando abre (a maior, Cards, tem 12 KB gzip) |
| Revisão | Cada sessão passou pelos três revisores; o conjunto também (geral, acessibilidade, privacidade e neutralidade). Achados graves, altos e médios corrigidos |
| Moderação | Denúncia por e-mail; `npm run bloquear` grava a impressão do link e da forma canônica do evento (`docs/moderacao.md`) |

## Próximos passos

1. **Kauê testa no celular** e mostra para 5 a 8 organizações (roteiro em `docs/onda-1.md`, seção 8.7).
2. **Advogado:** documento de consulta no Claude Docs (com os textos de Termos, Privacidade e Regras). Pendentes na Política de Privacidade: responsável pelos dados e prazo de guarda dos e-mails ("[a definir antes do lançamento]"). Aprovado, `LANCAMENTO_PUBLICO = true` em `src/comum/marca.ts`.
3. **Triagem das denúncias com o Gemini:** preparar as instruções a partir das Regras de uso (a pessoa decide a remoção).
4. **Métricas** (antes de divulgar): conta do GoatCounter do Kauê; servir o `count.js` como cópia local, pôr o endereço de contagem no `connect-src` da CSP, preencher `METRICAS_ID` e citar na Política de Privacidade.
5. **Nome e domínio** (Kauê, semana de 09/11/2026): trocar a `og:image` no `index.html` e configurar em Settings → Pages → Custom domain (com Actions não há arquivo CNAME; ver `docs/onda-1.md`, 8.5). Com domínio próprio, rever o rascunho da ata no aparelho.
6. **Ícone e nome definitivos:** `src/comum/marca.ts`, `index.html`, `public/manifest.webmanifest`, `public/offline.html`, `scripts/gerar-icones.mjs`; rodar `npm run icones`.
7. **Onda 2:** guia da Lei de Acesso à Informação, idade mínima antes de quizzes e jogos (depende do advogado).

## Pendências pequenas da revisão (não bloqueiam)

- O teste de neutralidade não confere cor de partido em paletas e modelos prontos: a sessão dos cards e o `revisor-privacidade-neutralidade` olham isso à mão.
- `public/offline.html` usa `onclick` em linha. Hoje não tem CSP própria; se ganhar, trocar por um listener.
- Aviso de saída não pega o toque longo "abrir em nova aba" do celular (só clique e clique do meio).
- "Oficial" e "verificado" só são recusados no evento quando ligados ao site ou ao conteúdo ("evento verificado", "oficial do site"); "Equipe da Comunidade" ainda passa (o nome curto só é recusado como campo inteiro).
- "Doação via transferência TED." sem número passa: sem valor ou número não dá para separar de texto comum.
- Sem internet e sem nenhuma cópia da lista guardada (primeira visita já sem rede), um evento bloqueado aparece.
