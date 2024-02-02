import process from 'node:process'
import type { Choice, PromptType } from '@posva/prompts'
import prompts from '@posva/prompts'
import { Fzf } from 'fzf'
import { parseNun } from '../parse'
import { runCli } from '../runner'
import { getPackageJSON } from '../fs'
import { exclude } from '../utils'

runCli(async (agent, args, ctx) => {
  const isEmpty = args.length === 0 && !ctx?.programmatic

  if (isEmpty || args[0] === '-m') {
    const pkg = getPackageJSON(ctx)

    const allDependencies = { ...pkg.dependencies, ...pkg.devDependencies }

    const raw = Object.entries(allDependencies) as [string, string][]

    if (!raw.length) {
      console.error('No dependencies found')
      process.exit(1)
    }

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
        message: 'dependencies to remove',
        async suggest(input: string, choices: Choice[]) {
          const results = fzf.find(input)
          return results.map(r => choices.find(c => c.value === r.item[0]))
        },
      })

      if (typeof depsToRemove === 'string') {
        const singleDependency = depsToRemove

        args.push(singleDependency)
      }
      else { args.push(...depsToRemove) }
    }
    catch (e) {
      process.exit(1)
    }
  }

  return parseNun(agent, args, ctx)
})
