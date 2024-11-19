import type { Choice } from '@posva/prompts'
import process from 'node:process'
import prompts from '@posva/prompts'
import { byLengthAsc, Fzf } from 'fzf'
import { getPackageJSON } from '../fs'
import { parseNr } from '../parse'
import { runCli } from '../runner'
import { dump, load } from '../storage'
import { limitText } from '../utils'

runCli(async (agent, args, ctx) => {
  const storage = await load()

  if (args[0] === '-') {
    if (!storage.lastRunCommand) {
      if (!ctx?.programmatic) {
        console.error('No last command found')
        process.exit(1)
      }

      throw new Error('No last command found')
    }
    args[0] = storage.lastRunCommand
  }

  if (args.length === 0 && !ctx?.programmatic) {
    // support https://www.npmjs.com/package/npm-scripts-info conventions
    const pkg = getPackageJSON(ctx)
    const scripts = pkg.scripts || {}
    const scriptsInfo = pkg['scripts-info'] || {}

    const names = Object.entries(scripts) as [string, string][]

    if (!names.length)
      return

    const raw = names
      .filter(i => !i[0].startsWith('?'))
      .map(([key, cmd]) => ({
        key,
        cmd,
        description: scriptsInfo[key] || scripts[`?${key}`] || cmd,
      }))

    const terminalColumns = process.stdout?.columns || 80

    const choices: Choice[] = raw
      .map(({ key, description }) => ({
        title: key,
        value: key,
        description: limitText(description, terminalColumns - 15),
      }))

    const fzf = new Fzf(raw, {
      selector: item => `${item.key} ${item.description}`,
      casing: 'case-insensitive',
      tiebreakers: [byLengthAsc],
    })

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
        async suggest(input: string, choices: Choice[]) {
          if (!input)
            return choices
          const results = fzf.find(input)
          return results.map(r => choices.find(c => c.value === r.item.key))
        },
      })
      if (!fn)
        return
      args.push(fn)
    }
    catch {
      process.exit(1)
    }
  }

  if (storage.lastRunCommand !== args[0]) {
    storage.lastRunCommand = args[0]
    dump()
  }

  return parseNr(agent, args)
})
