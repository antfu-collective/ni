import type { Choice } from 'prompts'
import prompts from 'prompts'
import c from 'kleur'
import { Fzf } from 'fzf'
import { dump, load } from '../storage'
import { parseNr } from '../parse'
import { getConfig } from '../fs'
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
    const pkg = getConfig(agent, ctx?.cwd)
    const scripts = (agent === 'deno' ? pkg.tasks : pkg.scripts) || {}

    // support https://www.npmjs.com/package/npm-scripts-info conventions
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

    function limitText(text: string, maxWidth: number) {
      if (text.length <= maxWidth)
        return text
      return `${text.slice(0, maxWidth)}${c.dim('…')}`
    }
    const choices: Choice[] = raw
      .map(({ key, description }) => ({
        title: key,
        value: key,
        description: limitText(description, terminalColumns - 15),
      }))

    const fzf = new Fzf(raw, {
      selector: item => `${item.key} ${item.description}`,
      casing: 'case-insensitive',
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
          const results = fzf.find(input)
          return results.map(r => choices.find(c => c.value === r.item.key))
        },
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
