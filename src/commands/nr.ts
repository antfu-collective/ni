import type { Choice } from '@posva/prompts'
import type { PackageScript } from '../package'
import process from 'node:process'
import prompts from '@posva/prompts'
import { byLengthAsc, Fzf } from 'fzf'
import { getCompletionSuggestions, rawBashCompletionScript, rawFishCompletionScript, rawZshCompletionScript } from '../completion'
import { readPackageScripts, readWorkspaceScripts } from '../package'
import { parseNr } from '../parse'
import { runCli } from '../runner'
import { dump, load } from '../storage'
import { limitText } from '../utils'

runCli(async (agent, args, ctx) => {
  const storage = await load()

  const promptSelectScript = async (raw: PackageScript[]) => {
    const terminalColumns = process.stdout?.columns || 80

    const last = storage.lastRunCommand
    const choices = raw.reduce<Choice[]>((acc, { key, description }) => {
      const item = {
        title: key,
        value: key,
        description: limitText(description, terminalColumns - 15),
      }
      if (last && key === last) {
        return [item, ...acc]
      }
      return [...acc, item]
    }, [])

    const fzf = new Fzf(raw, {
      selector: item => `${item.key} ${item.description}`,
      casing: 'case-insensitive',
      tiebreakers: [byLengthAsc],
    })

    // Workaround for @posva/prompts autocomplete bug where ESC key submits instead of canceling
    // https://github.com/terkelg/prompts/issues/362
    let isExited = false

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
        onState(state) {
          if (state.exited)
            isExited = true
        },
      })
      if (!fn || isExited)
        process.exit(1)
      args.push(fn)
    }
    catch {
      process.exit(1)
    }
  }

  // Use --completion to generate completion script and do completion logic
  // (No package manager would have an argument named --completion)
  if (args[0] === '--completion') {
    const compLine = process.env.COMP_LINE
    const rawCompCword = process.env.COMP_CWORD
    // In bash
    if (compLine !== undefined && rawCompCword !== undefined) {
      const compCword = Number.parseInt(rawCompCword, 10)
      const compWords = args.slice(1)
      // Only complete the second word (nr __here__ ...)
      if (compCword === 1) {
        const suggestions = getCompletionSuggestions(compWords, ctx)

        // eslint-disable-next-line no-console
        console.log(suggestions.join('\n'))
      }
    }
    // In other shells, return suggestions directly
    else {
      const suggestions = getCompletionSuggestions(args, ctx)

      // eslint-disable-next-line no-console
      console.log(suggestions.join('\n'))
    }
    return
  }

  // Print ZSH completion script
  if (args[0] === '--completion-zsh') {
    // eslint-disable-next-line no-console
    console.log(rawZshCompletionScript)
    return
  }

  // Print Bash completion script
  if (args[0] === '--completion-bash') {
    // eslint-disable-next-line no-console
    console.log(rawBashCompletionScript)
    return
  }

  // Print Fish completion script
  if (args[0] === '--completion-fish') {
    // eslint-disable-next-line no-console
    console.log(rawFishCompletionScript)
    return
  }

  // -p is a flag attempt to read scripts from monorepo
  if (args[0] === '-p') {
    const raw = await readWorkspaceScripts(ctx, args)
    // Show prompt if there are multiple scripts
    if (raw.length > 1) {
      await promptSelectScript(raw)
    }
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
    await promptSelectScript(raw)
  }

  if (storage.lastRunCommand !== args[0]) {
    storage.lastRunCommand = args[0]
    dump()
  }

  return parseNr(agent, args, ctx)
})
