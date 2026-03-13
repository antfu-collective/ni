import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/commands/*.ts'],
  clean: true,
  dts: true,
  exports: true,
  deps: {
    alwaysBundle: [
      'which',
      'ini',
      '@posva/prompts',
      'pnpm-workspace-yaml',
      'yaml',
      'fast-npm-meta',
      'isexe',
      'supports-color',
      'has-flag',
      'kleur',
      'sisteransi',
    ],
  },
})
