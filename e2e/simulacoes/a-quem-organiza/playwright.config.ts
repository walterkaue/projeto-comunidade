// Simulação "a quem organiza" (docs/auditoria/2026-11-06/simulacao-a-quem-organiza.md).
// Ferramenta de teste e relato: nada daqui entra no site. Roda no build de produção servido em localhost:4181.
//
// Uso:
//   npx playwright test --config e2e/simulacoes/a-quem-organiza/playwright.config.ts
// Com o servidor já aberto por esta sessão na 4181 (vários grupos rodando juntos):
//   SIM_SERVIDOR_PRONTO=1 SIM_GRUPO=a1 npx playwright test --config ... a1-
//
// Cada aparelho é um projeto. Um teste diz em que aparelho roda pela etiqueta no título (ex.: "@AND-FRACO").

import { defineConfig } from '@playwright/test';
import { APARELHOS, PORTA, type Opcoes } from './aparelhos';

const GRUPO = process.env.SIM_GRUPO ?? 'geral';

export default defineConfig<Opcoes>({
  testDir: '.',
  testMatch: /.*\.sim\.ts$/,
  // Cada grupo tem a sua pasta: o Playwright apaga a pasta de saída ao começar.
  outputDir: `.resultados/${GRUPO}`,
  fullyParallel: true,
  retries: 0,
  workers: 3,
  reporter: 'list',
  timeout: 240_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: `http://localhost:${PORTA}/`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    acceptDownloads: true,
  },
  projects: Object.entries(APARELHOS).map(([nome, a]) => ({
    name: nome,
    grep: new RegExp(`@${nome}(\\s|$)`),
    use: a.use,
  })),
  webServer: process.env.SIM_SERVIDOR_PRONTO
    ? undefined
    : {
        command: `npm run build && npx vite preview --port ${PORTA} --strictPort`,
        cwd: '../../..',
        url: `http://localhost:${PORTA}/`,
        // Nunca reaproveita servidor: na mesma máquina outra sessão pode ter o seu em outra porta.
        reuseExistingServer: false,
        timeout: 240_000,
      },
});

