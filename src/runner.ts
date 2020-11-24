import { execSync } from 'child_process'
import { Agent } from './agents'
import { getDefaultAgent } from './config'
import { detect } from './detect'
import { remove } from './utils'

const args = process.argv.slice(2).filter(Boolean)
const DEBUG_SIGN = '?'

export type Runner = (agent: Agent, args: string[], hasLock?: boolean) => Promise<string>

export async function run(fn: Runner, options? = {}) {
  const debug = args.includes(DEBUG_SIGN)
  if (debug)
    remove(args, DEBUG_SIGN)

  const isGlobal = args.includes('-g')
  let command

  if (isGlobal) {
    command = await fn(await getDefaultAgent(), args)
  }
  else {
    const agent = await detect(options)
    command = await fn(agent || await getDefaultAgent(), args, Boolean(agent))
  }

  if (debug)
    console.log(command)
  else
    execSync(command, { stdio: 'inherit' })
}
