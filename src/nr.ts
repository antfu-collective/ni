import inquirer from 'inquirer'
import { parseNr } from './commands'
import { getPackageJSON } from './fs'
import { run } from './runner'

run(async(agent, args) => {
  if (args.length === 0) {
    const scripts = getPackageJSON().scripts || {}

    const names = Object.keys(scripts)

    if (!names.length)
      return

    try {
      const { fn } = await inquirer.prompt({
        name: 'fn',
        message: 'script to run',
        pageSize: 20,
        type: 'list',
        choices: names,
      })
      if (!fn)
        return
      args.push(fn)
    }
    catch (e) {
      console.error(e)
      process.exit(1)
    }
  }
  return parseNr(agent, args)
})
