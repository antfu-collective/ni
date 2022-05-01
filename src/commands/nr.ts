import type { Choice } from 'prompts'
import prompts from 'prompts'
import { dump, load } from '../storage'
import { parseNr } from '../parse'
import { getPackageJSON } from '../fs'
import { runCli } from '../runner'

runCli(async (agent, args, ctx) => {
  const storage = await load()

  if (args[0] === '-') {
    if (!storage.lastRunCommand) {
      console.error('No last command found')
      process.exit(1)
    }
    args[0] = storage.lastRunCommand
  }

  if (args.length === 0) {
    // support https://www.npmjs.com/package/npm-scripts-info conventions
    const pkg = getPackageJSON(ctx?.cwd)
    const scripts = pkg.scripts || {}
    const scriptsInfo = pkg['scripts-info'] || {}

    const names = Object.entries(scripts) as [string, string][]

    if (!names.length)
      return

    const choices: Choice[] = names
      .filter(i => !i[0].startsWith('?'))
      .map(([value, cmd]) => ({
        title: value,
        value,
        description: scriptsInfo[value] || scripts[`?${value}`] || cmd,
      }))

    if (storage.lastRunCommand) {
      const last = choices.find(i => i.value === storage.lastRunCommand)
      if (last)
        choices.unshift(last)
    }

    try {
      const { fn } = await prompts({
        name: 'fn',
        message: 'script to run',
        type: 'autocomplete',
        choices,
      })
      if (!fn)
        return
      args.push(fn)
    }
    catch (e) {
      process.exit(1)
    }
  }

  if (storage.lastRunCommand !== args[0]) {
    storage.lastRunCommand = args[0]
    dump()
  }

  return parseNr(agent, args)
})
