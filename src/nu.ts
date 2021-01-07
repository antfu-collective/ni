import { parseNu } from './commands'
import { run } from './runner'

run(async(agent, args) => {
  return parseNu(agent, args)
})
