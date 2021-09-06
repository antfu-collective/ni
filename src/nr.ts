import prompts, { Choice } from 'prompts'
import { dump, load } from './storage'
import { parseNr } from './commands'
import { getPackageJSON } from './fs'
import { runCli } from './runner'

runCli(async(agent, args) => {
  if (args.length === 0) {
    // support https://www.npmjs.com/package/npm-scripts-info conventions
    const scripts = getPackageJSON().scripts || {}
    const scriptsInfo = getPackageJSON()['scripts-info'] || {}

    const names = Object.entries(scripts) as [string, string][]

    if (!names.length)
      return

    const storage = await load()
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
