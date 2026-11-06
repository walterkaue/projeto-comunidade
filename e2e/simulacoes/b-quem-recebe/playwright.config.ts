// Simulação B (quem recebe o link), só para desenvolvimento: nada daqui entra no site publicado.
// Uso, da raiz do repositório:
//   npm run build                                                    (uma vez, antes)
//   npx playwright test --config e2e/simulacoes/b-quem-recebe/playwright.config.ts
// Porta 4182, só desta sessão (PORTA_SIM troca, para rodar dois grupos ao mesmo tempo). O servidor é sempre novo
// (reuseExistingServer: false). Com BUILD=1, faz o build antes de servir.
// Roteiros em *.sim.ts (e não *.spec.ts), para o npm run e2e da raiz não os pegar.
// Projetos: Chromium (padrão), WebKit (testes com @webkit no nome) e Firefox (@firefox).

import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const PORTA = Number(process.env.PORTA_SIM ?? 4182);
const AQUI = fileURLToPath(new URL('.', import.meta.url));
const RAIZ = fileURLToPath(new URL('../../../', import.meta.url));
const servir = `npx vite preview --port ${PORTA} --strictPort`;

export default defineConfig({
  testDir: AQUI,
  testMatch: /\.sim\.ts$/,
  outputDir: `${AQUI}.resultados`,
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  timeout: 180_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: `http://localhost:${PORTA}/`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 640 }, browserName: 'chromium' }, grepInvert: /@webkit|@firefox/ },
    { name: 'webkit', use: { browserName: 'webkit' }, grep: /@webkit/ },
    { name: 'firefox', use: { browserName: 'firefox' }, grep: /@firefox/ },
  ],
  webServer: {
    command: process.env.BUILD ? `npm run build && ${servir}` : servir,
    cwd: RAIZ,
    url: `http://localhost:${PORTA}/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
