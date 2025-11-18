// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    dir: './test',
    coverage: {
      include: ['src/**.{js,jsx,ts,tsx}'],
    },
  },
})
