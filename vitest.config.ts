import process from 'node:process'
import { defineConfig } from 'vitest/config'

// Disable global ni config in test to make the results more predictable
process.env.NI_CONFIG_FILE = 'false'

export default defineConfig({
  test: {

  },
})
