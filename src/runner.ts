import { execSync } from 'child_process'
import prompts from 'prompts'
import { Agent, agents } from './agents'
import { getDefaultAgent, getGlobalAgent } from './config'
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
    command = await fn(getGlobalAgent(), args)
  }
  else {
    let agent = await detect(options) || getDefaultAgent()
    if (agent === 'prompt') {
      agent = (await prompts({
        name: 'agent',
        type: 'select',
        message: 'Choose the agent',
        choices: agents.map(value => ({ title: value, value })),
      })).agent
      if (!agent)
        return
    }
    command = await fn(agent as Agent, args, Boolean(agent))
  }

  if (!command)
    return

  if (debug)
    console.log(command)
  else
    execSync(command, { stdio: 'inherit', encoding: 'utf-8' })
}
