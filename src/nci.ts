import { parseNi } from './commands'
import { run } from './runner'

run(
  async(agent, _, hasLock) => {
    return parseNi(agent, ['--frozen-if-present'], hasLock)
  },
  { autoInstall: true },
)
