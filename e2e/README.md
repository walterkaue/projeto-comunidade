# Testes de ponta a ponta

Ferramenta de desenvolvimento: nada desta pasta entra no site publicado, e o `npm test` não roda estes testes.

```
npx playwright install chromium   # uma vez, baixa o navegador
npm run e2e                       # faz o build, serve em localhost:4173 e roda tudo
```

- Celular Android emulado (Chromium, Pixel 5) em 360 × 640, no build de produção (`vite preview`).
- O menu de compartilhar e a janela de impressão são de mentira (`apoio.ts`): o teste lê o texto que seria mandado e conta as impressões.
- Nenhum pedido sai para outro domínio.
- Toda tela passa pelo axe (WCAG 2.2 A e AA; falha com erro grave ou crítico) e pela conferência de rolagem lateral (`conferirTela`).
- Um teste só: `npx playwright test e2e/ata.spec.ts`. Com o navegador à vista: `npx playwright test --headed`.
- No GitHub Actions roda em `.github/workflows/e2e.yml`, separado da publicação. Se falhar, o relatório fica em "Artifacts" na página da execução.

| Arquivo | O que confere |
|---|---|
| `fluxo.spec.ts` | As cinco portas com o exemplo (painel antes de mandar, sem link) e a reunião com a organização trocada (aviso do passo 1, link no texto, nota do QR, ponte para a ata) |
| `evento.spec.ts` | Página do evento, "Fazer o card" e "Criar outro" devolvendo o mesmo link, link removido com o motivo, denúncia com a revisão |
| `ata.spec.ts` | Preencher, imprimir e apagar a ata |
| `offline.spec.ts` | Sem rede depois da primeira visita: início, fluxo e ata |
| `primeira-tela.spec.ts` | Nas cinco portas, em 360 × 640: o campo do título (passo 1), "Onde vai mandar?" e a cor (passo 3) e o "Mandar no WhatsApp" (Pronto) aparecem sem rolar; prévia do passo 3 com no máximo 40% da altura e "Ver a prévia maior"; só o "Mandar no WhatsApp" é escuro. Com texto a 200%, cada um fica inteiro à vista ao rolar até ele, sem faixa fixa por cima |
