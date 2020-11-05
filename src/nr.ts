import { parseNr } from './commands'
import { run } from './runner'

run(async(agent, args) => {
  return parseNr(agent, args)
})
