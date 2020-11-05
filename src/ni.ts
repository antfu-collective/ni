import { parseNi } from './commands'
import { run } from './runner'

run(async(agent, args) => {
  return parseNi(agent, args)
})
