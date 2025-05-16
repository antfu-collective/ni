import { basename } from 'node:path'
import { globSync } from 'tinyglobby'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: globSync(
    ['src/commands/*.ts'],
    { expandDirectories: false },
  ).map(i => ({
    input: i.slice(0, -3),
    name: basename(i).slice(0, -3),
  })),
  clean: true,
  declaration: 'node16',
  rollup: {
    inlineDependencies: [
      'which',
      'ini',
      '@posva/prompts',

      'terminal-link',
      'ansi-escapes',
      'environment',
      'supports-hyperlinks',
      'isexe',
      'supports-color',
      'has-flag',
      'kleur',
      'sisteransi',
    ],
  },
})
