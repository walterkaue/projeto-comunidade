// Simulação C (acessibilidade), auditoria de 06/11/2026. Só ferramenta de desenvolvimento: nada daqui entra no
// site publicado, e nem o `npm test` nem o `npm run e2e` rodam estes arquivos.
//
// Uso (com o build já feito por `npm run build`):
//   npx playwright test --config e2e/simulacoes/c-acessibilidade/playwright.config.ts
//
// Serve o dist/ com `vite preview` na porta 4183, própria desta sessão (outras sessões usam outras portas).
// PORTA_SIM troca a porta para rodar grupos em paralelo (41831 a 41834, derivadas da 4183 e só desta sessão).
// reuseExistingServer: false, para nunca testar o servidor de outra sessão por engano.

import { defineConfig } from '@playwright/test';

const PORTA = Number(process.env.PORTA_SIM ?? 4183);

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.sim\.ts$/,
  outputDir: '.resultados',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 900_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: `http://localhost:${PORTA}/`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    browserName: 'chromium',
  },
  webServer: {
    // node direto (sem npx): com várias sessões ao mesmo tempo, o npx levava minutos para achar o vite.
    command: `node node_modules/vite/bin/vite.js preview --host localhost --port ${PORTA} --strictPort`,
    cwd: '../../..',
    url: `http://localhost:${PORTA}/`,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
