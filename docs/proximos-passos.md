# Próximos passos

> Retrato do projeto em 05/11/2026, para retomar em qualquer conversa. Regras e decisões ficam no `docs/produto.md`; aqui só fica o que vem a seguir.
> Ao fechar um item, atualize este arquivo no mesmo commit. Para começar, siga a divisão de trabalho do `CLAUDE.md`.
> Os marcadores `{{...}}` são números que o Kauê preenche depois.

## Onde estamos

| Área | Estado em 05/11/2026 |
|---|---|
| Código | Base pronta: Vite 8, TypeScript estrito, Vitest, rotas por `#`. {{TESTES}} testes passando |
| Publicação | {{PUBLICACAO}} (endereço: https://walterkaue.github.io/projeto-comunidade/) |
| Tamanho | {{PESO}} KB gzip de JS+CSS inicial (limite: 80 KB) |
| Conteúdo | Sem ferramentas prontas ainda. A Onda 1 (cards, evento, reunião e páginas institucionais) vai ser construída em sessões paralelas |

## Em andamento

**Onda 1:** três ferramentas sem login e sem banco, tudo gerado no aparelho, mais as páginas institucionais. Nada construído ainda. As sessões abaixo rodam em paralelo, cada uma em seu worktree, só na própria pasta (regra das sessões paralelas no `CLAUDE.md`).

## Próximos passos

1. **Colar o texto do produto** em `docs/produto.md`, sem mudar nada, num commit `docs: texto do produto`.
2. **Sessão: cards e convites para WhatsApp.** Brief: gerar card de convite em imagem no aparelho, com compartilhar e baixar. Só mexe em `src/ferramentas/cards/` e nos testes dela.
3. **Sessão: evento em um link.** Brief: página do evento com os dados depois do `#`, só o que a pessoa escolheu publicar, com QR. Só mexe em `src/ferramentas/evento/` e nos testes dela.
4. **Sessão: reunião com convocação, pauta e ata em PDF.** Brief: convocação e pauta para compartilhar; ata em PDF gerado no aparelho, nunca em link. Só mexe em `src/ferramentas/reuniao/` e nos testes dela.
5. **Sessão: páginas institucionais.** Brief: Sobre, Termos, Privacidade, Regras de uso e Como denunciar, em linguagem simples e neutra. Pode mexer em `src/paginas/`.
6. **Sessão para atender `docs/pedidos-comum.md`.** Uma sessão só junta os pedidos das outras e altera `src/comum/`, tema e configuração. Depois, os revisores (`revisor`, `revisor-acessibilidade`, `revisor-privacidade-neutralidade`) olham o conjunto.
7. **Ligar as métricas.** Decidir um serviço sem cookie e preencher `METRICAS_ID` em `src/comum/marca.ts`. O Kauê cria a conta no serviço; diga exatamente onde clicar e peça o código que ele recebe.
8. **Domínio próprio.** O que muda: `og:image` com endereço absoluto no `index.html`, arquivo `CNAME` em `public/`, e a configuração no painel do GitHub (repositório, Settings, Pages, Custom domain). O DNS é feito pelo Kauê no painel de quem registrou o domínio.
9. **Ícone e nome definitivos.** Trocar o nome provisório em `src/comum/marca.ts`, rodar `npm run icones` e conferir os textos.
10. **Conferir a lista oficial de partidos do TSE** em `testes/siglas-partidos.txt`, para o teste de neutralidade não deixar nada passar.
