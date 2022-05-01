import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/commands/*.ts',
  ],
  format: [
    'esm',
    'cjs',
  ],
  dts: true,
  clean: true,
  splitting: true,
})
