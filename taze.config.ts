import { defineConfig } from 'taze'

export default defineConfig({
  ignorePaths: [
    'test/fixtures',
  ],
  exclude: [
    // v7.0.0 has some bundle issue
    'find-up',
  ],
})
