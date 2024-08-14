import { basename } from 'node:path'
import { defineBuildConfig } from 'unbuild'
import fg from 'fast-glob'

export default defineBuildConfig({
  entries: [
    ...fg.sync('src/commands/*.ts').map(i => ({
      input: i.slice(0, -3),
      name: basename(i).slice(0, -3),
    })),
  ],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
})
