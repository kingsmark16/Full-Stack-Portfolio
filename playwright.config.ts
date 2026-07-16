import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: [
    {
      command: 'pnpm --filter api dev',
      url: 'http://localhost:3001/',
      reuseExistingServer: true,
    },
    {
      command: 'pnpm --filter web dev',
      url: 'http://localhost:3000/',
      reuseExistingServer: true,
    },
  ],
})
