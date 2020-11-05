import { execSync } from 'child_process'
import { Agent } from './agents'
import { getDefaultAgent } from './config'
import { detect } from './detect'
import { remove } from './utils'

const args = process.argv.slice(2).filter(Boolean)
const DEBUG_SIGN = '?'

export type Runner = (agent: Agent, args: string[], debug: boolean) => Promise<string>

export async function run(fn: Runner) {
  const isGlobal = args.includes('-g')
  const agent = isGlobal
    ? await getDefaultAgent()
    : await detect()

  const debug = args.includes(DEBUG_SIGN)
  if (debug)
    remove(args, DEBUG_SIGN)

  const command = await fn(agent, args, debug)

  if (debug)
    console.log(command)
  else
    execSync(command, { stdio: 'inherit' })
}
