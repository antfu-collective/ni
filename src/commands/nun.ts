import process from 'node:process'
import type { Choice, PromptType } from '@posva/prompts'
import prompts from '@posva/prompts'
import { Fzf } from 'fzf'
import { parseNun } from '../parse'
import { runCli } from '../runner'
import { getPackageJSON } from '../fs'
import { exclude, invariant } from '../utils'

import { dump, load } from '../storage'

runCli(async (agent, args, ctx) => {
  const storage = await load()

  const isLastCmd = args[0] === '-'
  const isInteractive = !args.length && !ctx?.programmatic

  if (isLastCmd) {
    if (!storage.lastUninstalledPkg) {
      invariant(ctx?.programmatic, 'No last uninstalled package found')

      throw new Error('No last uninstalled package')
    }

    args[0] = storage.lastUninstalledPkg
  }

  if (isInteractive || args[0] === '-m') {
    const pkg = getPackageJSON(ctx)

    const allDependencies = { ...pkg.dependencies, ...pkg.devDependencies }

    const raw = Object.entries(allDependencies) as [string, string][]

    invariant(raw.length, 'No dependencies found')

    const fzf = new Fzf(raw, {
      selector: ([dep, version]) => `${dep} ${version}`,
      casing: 'case-insensitive',
    })

    const choices: Choice[] = raw.map(([dependency, version]) => ({
      title: dependency,
      value: dependency,
      description: version,
    }))

    const isMultiple = args[0] === '-m'

    const type: PromptType = isMultiple
      ? 'autocompleteMultiselect'
      : 'autocomplete'

    if (isMultiple)
      args = exclude(args, '-m')

    try {
      const { depsToRemove } = await prompts({
        type,
        name: 'depsToRemove',
        choices,
        instructions: false,
        message: `remove ${isMultiple ? 'dependencies' : 'dependency'}`,
        async suggest(input: string, choices: Choice[]) {
          const results = fzf.find(input)
          return results.map(r => choices.find(c => c.value === r.item[0]))
        },
      })

      invariant(depsToRemove.length)

      const isSingleDependency = typeof depsToRemove === 'string'

      if (isSingleDependency)
        args.push(depsToRemove)
      else args.push(...depsToRemove)
    }
    catch (e) {
      process.exit(1)
    }
  }

  if (storage.lastInstalledPkg !== args[0]) {
    storage.lastInstalledPkg = args[0]
    await dump()
  }

  return parseNun(agent, args, ctx)
})
