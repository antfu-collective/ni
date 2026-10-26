import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Disable global ni config in test to make the results more predictable
process.env.NI_CONFIG_FILE = fileURLToPath(new URL('./test/config/.nirc-empty', import.meta.url))

export default defineConfig({
  test: {

  },
})
