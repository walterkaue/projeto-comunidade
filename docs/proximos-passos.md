# Próximos passos

> Retrato do projeto em 05/11/2026, para retomar em qualquer conversa. Regras e decisões ficam no `docs/produto.md`; aqui só fica o que vem a seguir.
> Ao fechar um item, atualize este arquivo no mesmo commit. Para começar, siga a divisão de trabalho do `CLAUDE.md`.

## Onde estamos

| Área | Estado em 05/11/2026 |
|---|---|
| Código | Fundação pronta na `main`: Vite 8, TypeScript estrito, Vitest, rotas por `#`, base relativa. 13 arquivos de teste e 101 testes passando, incluindo os de regra (peso, neutralidade, privacidade) |
| Publicação | No ar em https://walterkaue.github.io/projeto-comunidade/ desde 05/11/2026, publicado pelo GitHub Actions (testes antes do build). Conferido no navegador em 360 px: telas abrem, o app fica guardado no aparelho para abrir sem rede, sem erro no console |
| Tamanho | 4,9 KB gzip de JS + CSS inicial (limite do teste: 80 KB). Fontes: 24 KB (Atkinson Hyperlegible 400 e 700, cortadas para o português). Cabe com folga nos ~150 KB da primeira tela pedidos no `produto.md` (7.5) |
| Conteúdo | `docs/produto.md` com o texto do produto (versão 0.3). Ferramentas ainda vazias ("em construção"). Páginas institucionais sem texto |

## O que a fundação entrega

- **Peças comuns prontas e testadas** em `src/comum/`: contraste WCAG (`cor.ts`), quebra e corte de texto para canvas (`texto.ts`), cadeia de compartilhar com "Baixar imagem" (`compartilhar.ts`), aviso falado (`aviso.ts`), QR no canvas (`qr.ts`), aviso de link externo (`saida.ts`), aparelho fraco e economia de dados (`nivel.ts`), campos de formulário acessíveis (`formulario.ts`), escape e `urlSegura` (`html.ts`).
- **PWA:** instalável, guarda o app inteiro na instalação (lista gerada no build), tela offline, usa a página guardada se a rede demorar mais de 4 s.
- **Privacidade no navegador:** CSP no `index.html` (o site só fala consigo mesmo) e `no-referrer`.
- **Revisão:** `revisor` e `revisor-privacidade-neutralidade` passaram pela fundação; os achados graves e médios foram corrigidos.

## Próximos passos

1. **Sessões paralelas da Onda 1** (cada uma em worktree próprio, só na própria pasta, testes dentro dela; o que precisar de `src/comum` vira pedido em `docs/pedidos-comum.md`). O escopo de cada uma está no `produto.md`, seção 7:
   - **Cards e convites para WhatsApp** — `src/ferramentas/cards/` (7.1). 5 modelos, 3 formatos (Status, Conversa, Cartaz A4 com QR), 6 paletas neutras e cor livre checada com `cor.ts`; logo reduzido no aparelho e nunca enviado; compartilhar, "Baixar imagem", copiar texto, `wa.me` e imprimir; texto alternativo gerado dos campos; rodapé "feito com…" removível. Exemplos com organizações fictícias e neutras.
   - **Evento em um link** — `src/ferramentas/evento/` (7.2). Dados compactados depois do `#`; atualizar o link com `history.replaceState`; sem link livre, PIX, telefone ou HTML (o `urlSegura` aceita `tel:`, então o evento não pode usar link vindo dos dados: só "Ver no mapa" e "Adicionar à agenda" montados por nós); faixa fixa "conteúdo de quem enviou" com Denunciar; conferir `bloqueados.json` (relativo ao site) antes de mostrar; QR com `qr.ts`; link malformado mostra aviso, não quebra.
   - **Reunião** — `src/ferramentas/reuniao/` (7.3). Convocação com pauta numerada para compartilhar; ata guiada, impressa ou salva em PDF pelo navegador, e copiar texto; presença e ata nunca em link. Rascunho da ata só na memória da aba aberta (some ao fechar; decidido em 05/11/2026), com aviso para salvar o PDF antes de sair e botão de apagar.
   - **Páginas institucionais** — `src/paginas/` (7.4). Sobre, Termos, Privacidade, Regras de uso, Como denunciar e **Contato** (essa rota ainda não existe: pedido em `docs/pedidos-comum.md` para `rotas.ts`, `main.ts` e o rodapé), com faixa "em revisão jurídica", linguagem simples e neutra e o e-mail de `marca.ts`.
2. **Sessão para atender `docs/pedidos-comum.md`** depois das quatro. Depois, `revisor`, `revisor-acessibilidade` e `revisor-privacidade-neutralidade` olham o conjunto.
3. **Ligar as métricas** (decisão do Kauê): escolher um serviço sem cookie (sugestão no código: GoatCounter), servir o script como cópia local, acrescentar o endereço de contagem ao `connect-src` da CSP e preencher `METRICAS_ID` em `src/comum/marca.ts`.
4. **Domínio próprio:** trocar o endereço da `og:image` no `index.html`, criar `public/CNAME`, configurar em Settings → Pages → Custom domain e o DNS no painel do registro do domínio (o Kauê clica). Com domínio próprio, o armazenamento deixa de ser dividido com outros projetos.
5. **Ícone e nome definitivos:** trocar em `src/comum/marca.ts`, `index.html`, `public/manifest.webmanifest`, `public/offline.html` e `scripts/gerar-icones.mjs`; rodar `npm run icones`.
6. **Conferir a lista oficial de partidos do TSE** em `testes/siglas-partidos.txt` (foi montada de memória).

## Pendências pequenas da revisão (não bloqueiam)

- `cortarTexto` e `quebrarTexto` contam por ponto de código: emoji composto (família, bandeira) pode ser partido no meio. Resolver com `Intl.Segmenter` quando o card precisar.
- O teste de neutralidade não confere cor de partido em paletas e modelos prontos: a sessão dos cards e o `revisor-privacidade-neutralidade` olham isso à mão.
- `public/offline.html` usa `onclick` em linha. Hoje não tem CSP própria; se ganhar, trocar por um listener.
- Aviso de saída não pega o toque longo "abrir em nova aba" do celular (só clique e clique do meio).
