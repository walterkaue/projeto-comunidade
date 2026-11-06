// Configuração só do grupo G2: sem servidor do vite (os testes sobem o próprio servidor do dist/ em g2-apoio.ts)
// e com pasta de resultados própria (outras sessões usam a mesma pasta e o Playwright a esvazia ao começar).
//   npx playwright test --config e2e/simulacoes/b-quem-recebe/g2-playwright.config.ts --workers=1

import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const AQUI = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  testDir: AQUI,
  testMatch: /g2-.*\.sim\.ts$/,
  outputDir: `${AQUI}.resultados-g2`,
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  timeout: 240_000,
  expect: { timeout: 20_000 },
  use: { locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block', trace: 'off' },
  projects: [
    { name: 'chromium', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 640 }, browserName: 'chromium' }, grepInvert: /@webkit|@firefox/ },
    { name: 'webkit', use: { browserName: 'webkit' }, grep: /@webkit/ },
    { name: 'firefox', use: { browserName: 'firefox' }, grep: /@firefox/ },
  ],
});
