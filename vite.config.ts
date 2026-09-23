import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    // Vitest's default is 5s per test. With ten files each spinning up jsdom
    // in parallel, a worker can be starved long enough for even a one-render
    // test to blow that — it failed about one run in four, on a different test
    // each time. Nothing here is slow on purpose; the budget was just tight
    // enough that machine load decided the result, which is worse than useless
    // in a suite you are meant to trust.
    testTimeout: 20_000,
  },
})
