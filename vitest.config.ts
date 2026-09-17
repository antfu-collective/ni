import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Keep the developer's own ~/.nirc out of the tests. An empty file is used
// instead of a missing path so NI_CONFIG_FILE does not warn.
process.env.NI_CONFIG_FILE = join(dirname(fileURLToPath(import.meta.url)), 'test/config/.nirc-empty')

export default defineConfig({
  test: {

  },
})
