import { parseNi } from './commands'
import { run } from './runner'

run(async(agent, args, hasLock) => {
  return parseNi(agent, args, hasLock)
})
