/* eslint-disable no-console */
import { resolve } from 'path'
import prompts from 'prompts'
import { execaCommand } from 'execa'
import c from 'kleur'
import { version } from '../package.json'
import type { Agent } from './agents'
import { agents } from './agents'
import { getDefaultAgent, getGlobalAgent } from './config'
import type { DetectOptions } from './detect'
import { detect } from './detect'
import { getVoltaPrefix, remove } from './utils'
import { UnsupportedCommand } from './parse'

const DEBUG_SIGN = '?'

export interface RunnerContext {
  hasLock?: boolean
  cwd?: string
}

export interface CommandWithPrompt { command: string; tag?: string; prompt?: string }
export type RunnerReturn = string | string[] | (string | CommandWithPrompt)[] | undefined

function isObjCommand(cmd: string | CommandWithPrompt): cmd is CommandWithPrompt {
  return typeof cmd === 'object'
}

export type Runner = (agent: Agent, args: string[], ctx?: RunnerContext) => Promise<RunnerReturn> | RunnerReturn

export async function runCli(fn: Runner, options: DetectOptions = {}) {
  const args = process.argv.slice(2).filter(Boolean)
  try {
    await run(fn, args, options)
  }
  catch (error) {
    if (error instanceof UnsupportedCommand)
      console.log(c.red(`\u2717 ${error.message}`))

    process.exit(1)
  }
}

export async function run(fn: Runner, args: string[], options: DetectOptions = {}) {
  const debug = args.includes(DEBUG_SIGN)
  if (debug)
    remove(args, DEBUG_SIGN)

  let cwd = process.cwd()
  let commands: Awaited<RunnerReturn>

  if (args.length === 1 && (args[0] === '--version' || args[0] === '-v')) {
    console.log(`@antfu/ni v${version}`)
    return
  }

  if (args.length === 1 && ['-h', '--help'].includes(args[0])) {
    const dash = c.dim('-')
    console.log(c.green(c.bold('@antfu/ni')) + c.dim(` use the right package manager v${version}\n`))
    console.log(`ni   ${dash}  install`)
    console.log(`nr   ${dash}  run`)
    console.log(`nix  ${dash}  execute`)
    console.log(`nu   ${dash}  upgrade`)
    console.log(`nun  ${dash}  uninstall`)
    console.log(`nci  ${dash}  clean install`)
    console.log(`na   ${dash}  agent alias`)
    console.log(c.yellow('\ncheck https://github.com/antfu/ni for more documentation.'))
    return
  }

  if (args[0] === '-C') {
    cwd = resolve(cwd, args[1])
    args.splice(0, 2)
  }

  const isGlobal = args.includes('-g')
  if (isGlobal) {
    commands = await fn(await getGlobalAgent(), args)
  }
  else {
    let agent = await detect({ ...options, cwd }) || await getDefaultAgent()
    if (agent === 'prompt') {
      agent = (await prompts({
        name: 'agent',
        type: 'select',
        message: 'Choose the agent',
        choices: agents.filter(i => !i.includes('@')).map(value => ({ title: value, value })),
      })).agent
      if (!agent)
        return
    }
    commands = await fn(agent as Agent, args, {
      hasLock: Boolean(agent),
      cwd,
    })
  }

  if (!commands)
    return

  const voltaPrefix = getVoltaPrefix()
  const mappedCommands = (
    Array.isArray(commands)
      ? commands.map(c => (isObjCommand(c) ? c : { command: c }))
      : ([{ command: commands }] as CommandWithPrompt[])
  ).map(c => (voltaPrefix ? { ...c, command: voltaPrefix.concat(' ').concat(c.command) } : c))

  if (debug) {
    console.log(commands)
    return
  }

  for (const { command, prompt } of mappedCommands) {
    if (prompt) {
      const { confirm } = await prompts({ name: 'confirm', type: 'confirm', message: prompt })
      if (!confirm)
        return
    }

    await execaCommand(command, { stdio: 'inherit', encoding: 'utf-8', cwd })
  }
}
