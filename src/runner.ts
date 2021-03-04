import prompts from 'prompts'
import execa from 'execa'
import { Agent, agents } from './agents'
import { getDefaultAgent, getGlobalAgent } from './config'
import { detect, DetectOptions } from './detect'
import { remove } from './utils'

const DEBUG_SIGN = '?'

export type Runner = (agent: Agent, args: string[], hasLock?: boolean) => Promise<string | undefined> | string | undefined

export async function runCli(fn: Runner, options: DetectOptions = {}) {
  const args = process.argv.slice(2).filter(Boolean)
  try {
    await run(fn, args, options)
  }
  catch (error) {
    process.exit(1)
  }
}

export async function run(fn: Runner, args: string[], options: DetectOptions = {}) {
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

  if (debug) {
    console.log(command)
    return
  }

  await execa.command(command, { stdio: 'inherit', encoding: 'utf-8' })
}
