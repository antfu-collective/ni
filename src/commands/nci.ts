import { parseNi } from '../parse'
import { runCli } from '../runner'

runCli(
  (agent, args, hasLock) => parseNi(agent, [...args, '--frozen-if-present'], hasLock),
  { autoInstall: true },
)
