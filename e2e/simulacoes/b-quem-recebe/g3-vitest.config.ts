// Configuração só da varredura em Node do G3 (sem navegador): vitest run --config e2e/simulacoes/b-quem-recebe/g3-vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['e2e/simulacoes/b-quem-recebe/g3-varredura.vitest.ts'], testTimeout: 120_000 },
});
