import { execSync } from 'child_process'
import { Agent } from './agents'
import { getDefaultAgent } from './config'
import { detect, DetectOptions } from './detect'
import { remove } from './utils'

const args = process.argv.slice(2).filter(Boolean)
const DEBUG_SIGN = '?'

export type Runner = (agent: Agent, args: string[], hasLock?: boolean) => Promise<string | undefined>

export async function run(fn: Runner, options: DetectOptions = {}) {
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

  if (!command)
    return

  if (debug)
    console.log(command)
  else
    execSync(command, { stdio: 'inherit' })
}
