import prompts from 'prompts'
import { parseNr } from './commands'
import { getPackageJSON } from './fs'
import { runCli } from './runner'

runCli(async(agent, args) => {
  if (args.length === 0) {
    const scripts = getPackageJSON().scripts || {}

    const names = Object.entries(scripts) as [string, string][]

    if (!names.length)
      return

    try {
      const { fn } = await prompts({
        name: 'fn',
        message: 'script to run',
        type: 'select',
        choices: names.map(([value, description]) => ({ title: value, value, description })),
      })
      if (!fn)
        return
      args.push(fn)
    }
    catch (e) {
      process.exit(0)
    }
  }

  return parseNr(agent, args)
})
