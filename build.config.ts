import { basename } from 'node:path'
import { defineBuildConfig } from 'unbuild'
import { globSync } from 'tinyglobby'

export default defineBuildConfig({
  entries: globSync(['src/commands/*.ts'], { onlyFiles: true, absolute: false, expandDirectories: false }).map(i => ({
    input: i.slice(0, -3),
    name: basename(i).slice(0, -3),
  })),
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
})
