// Testes de ponta a ponta (e2e/), só para desenvolvimento: nada daqui entra no site publicado.
// Rodam no build de produção servido localmente (vite preview), em tela de celular Android de 360 × 640.
// Uso: npm run e2e (faz o build antes). Detalhes em e2e/README.md.

import { defineConfig, devices } from '@playwright/test';

const PORTA = 4173;
const CI = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e/.resultados',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['list'], ['html', { outputFolder: 'e2e/.relatorio', open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices['Pixel 5'],
    viewport: { width: 360, height: 640 },
    baseURL: `http://localhost:${PORTA}/`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    // Por padrão sem service worker: o page.route da lista de bloqueio só vê o pedido sem ele.
    // O teste offline liga de novo.
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'android-360', use: { browserName: 'chromium' } }],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}/`,
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
