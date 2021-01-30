import { parseNi } from './commands'
import { runCli } from './runner'

runCli(
  (agent, _, hasLock) => parseNi(agent, ['--frozen-if-present'], hasLock),
  { autoInstall: true },
)
