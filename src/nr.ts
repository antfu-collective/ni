import prompts, { Choice } from 'prompts'
import { dump, load } from './storage'
import { parseNr } from './commands'
import { getPackageJSON } from './fs'
import { runCli } from './runner'

runCli(async(agent, args) => {
  if (args.length === 0) {
    const scripts = getPackageJSON().scripts || {}

    const names = Object.entries(scripts) as [string, string][]

    if (!names.length)
      return

    const storage = await load()
    const choices: Choice[] = names.map(([value, description]) => ({ title: value, value, description }))

    if (storage.lastRunCommand) {
      const last = choices.find(i => i.value === storage.lastRunCommand)
      if (last)
        choices.unshift(last)
    }

    try {
      const { fn } = await prompts({
        name: 'fn',
        message: 'script to run',
        type: 'select',
        choices,
      })
      if (!fn)
        return
      if (storage.lastRunCommand !== fn) {
        storage.lastRunCommand = fn
        dump()
      }
      args.push(fn)
    }
    catch (e) {
      console.error(e)
      process.exit(1)
    }
  }

  return parseNr(agent, args)
})
