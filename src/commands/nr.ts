import type { Choice } from '@posva/prompts'
import type { RunnerContext } from '../runner'
import process from 'node:process'
import prompts from '@posva/prompts'
import { byLengthAsc, Fzf } from 'fzf'
import { rawCompletionScript } from '../completion'
import { getPackageJSON } from '../fs'
import { parseNr } from '../parse'
import { runCli } from '../runner'
import { dump, load } from '../storage'
import { limitText } from '../utils'

function readPackageScripts(ctx: RunnerContext | undefined) {
  // support https://www.npmjs.com/package/npm-scripts-info conventions
  const pkg = getPackageJSON(ctx)
  const rawScripts = pkg.scripts || {}
  const scriptsInfo = pkg['scripts-info'] || {}

  const scripts = Object.entries(rawScripts)
    .filter(i => !i[0].startsWith('?'))
    .map(([key, cmd]) => ({
      key,
      cmd,
      description: scriptsInfo[key] || rawScripts[`?${key}`] || cmd,
    }))

  if (scripts.length === 0 && !ctx?.programmatic) {
    console.warn('No scripts found in package.json')
  }

  return scripts
}

runCli(async (agent, args, ctx) => {
  const storage = await load()

  // Use --completion to generate completion script and do completion logic
  // (No package manager would have an argument named --completion)
  if (args[0] === '--completion') {
    const compLine = process.env.COMP_LINE
    const rawCompCword = process.env.COMP_CWORD
    if (compLine !== undefined && rawCompCword !== undefined) {
      const compCword = Number.parseInt(rawCompCword, 10)
      const compWords = args.slice(1)
      // Only complete the second word (nr __here__ ...)
      if (compCword === 1) {
        const raw = readPackageScripts(ctx)
        const fzf = new Fzf(raw, {
          selector: item => item.key,
          casing: 'case-insensitive',
          tiebreakers: [byLengthAsc],
        })

        // compWords will be ['nr'] when the user does not type anything after `nr` so fallback to empty string
        const results = fzf.find(compWords[1] || '')

        // eslint-disable-next-line no-console
        console.log(results.map(r => r.item.key).join('\n'))
      }
    }
    else {
      // eslint-disable-next-line no-console
      console.log(rawCompletionScript)
    }
    return
  }

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
    const raw = readPackageScripts(ctx)

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
