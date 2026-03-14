import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/commands/*.ts'],
  clean: true,
  dts: true,
  exports: true,
  deps: {
    onlyBundle: [
      'which',
      'ini',
      '@posva/prompts',
      'pnpm-workspace-yaml',
      'yaml',
      'fast-npm-meta',
      'isexe',
      'kleur',
      'sisteransi',
    ],
  },
})
