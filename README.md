# Projeto Comunidade

Plataforma gratuita e apartidária para organizações comunitárias, sociais e partidárias. Ferramentas simples, sem login e sem banco: tudo é gerado no seu aparelho e nada sai dele.

Nome provisório. Endereço publicado: https://walterkaue.github.io/projeto-comunidade/

## O que tem

A entrada é "O que você quer fazer?", com cinco portas: chamar para uma reunião, divulgar um evento, dar um aviso, contar uma conquista e agradecer. Cada porta abre um caminho de 3 passos já preenchido com um exemplo e termina na tela Pronto, com a imagem para o WhatsApp, o texto, o link do evento (reunião e evento) e o cartaz para imprimir. Depois da reunião, dá para fazer a ata (só no aparelho, salva em PDF). Mais as páginas Sobre, Termos, Privacidade, Regras de uso, Como denunciar e Contato.

Onde fica no código:

- `src/ferramentas/fluxo/`: o fluxo único (os passos, a prévia e a tela Pronto).
- `src/ferramentas/cards/`, `evento/` e `reuniao/`: os motores (desenho do card, formato e validação do link do evento, página do evento, ata).
- `src/paginas/`: início e páginas institucionais. `src/comum/`: peças compartilhadas.

## Como rodar

```
npm install
npm run dev      # servidor local
npm test         # testes
npm run build    # versão final
npm run fontes   # refaz as fontes cortadas para o português
npm run icones   # refaz ícones e imagem de prévia (precisa do Chrome ou do Edge)
```

Cada push na `main` testa, gera e publica no GitHub Pages (`.github/workflows/deploy.yml`).

## Regras do projeto

- `CLAUDE.md`: regras de trabalho, privacidade, neutralidade e acessibilidade.
- `docs/produto.md`: a fonte da verdade sobre o produto.
- `docs/proximos-passos.md`: onde estamos e o que vem a seguir.

## Licença

- Código: MIT (`LICENSE`).
- Modelos, textos e imagens de exemplo: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.pt-br), com atribuição sugerida "Projeto Comunidade" (`LICENSE-CONTEUDO.md`).
