import type { Agent, ResolvedCommand } from 'package-manager-detector'
import type { Options as TinyExecOptions } from 'tinyexec'
import type { DetectOptions } from './detect'
/* eslint-disable no-console */
import { resolve } from 'node:path'
import process from 'node:process'
import prompts from '@posva/prompts'
import c from 'ansis'
import { AGENTS } from 'package-manager-detector'
import { x } from 'tinyexec'
import { version } from '../package.json'
import { getDefaultAgent, getGlobalAgent } from './config'
import { detect } from './detect'
import { getEnvironmentOptions } from './environment'
import { getCommand, UnsupportedCommand } from './parse'
import { cmdExists, remove } from './utils'

const DEBUG_SIGN = '?'

export interface RunnerContext {
  programmatic?: boolean
  hasLock?: boolean
  cwd?: string
}

export type Runner = (agent: Agent, args: string[], ctx?: RunnerContext) => Promise<ResolvedCommand | undefined> | ResolvedCommand | undefined

export async function runCli(fn: Runner, options: DetectOptions & { args?: string[] } = {}) {
  options = {
    ...getEnvironmentOptions(),
    ...options,
  }
  const {
    args = process.argv.slice(2).filter(Boolean),
  } = options
  try {
    await run(fn, args, options)
  }
  catch (error) {
    if (error instanceof UnsupportedCommand && !options.programmatic)
      console.log(c.red(`\u2717 ${error.message}`))

    if (!options.programmatic)
      process.exit(1)

    throw error
  }
}

export async function getCliCommand(
  fn: Runner,
  args: string[],
  options: DetectOptions = {},
  cwd: string = options.cwd ?? process.cwd(),
) {
  const isGlobal = args.includes('-g')
  if (isGlobal)
    return await fn(await getGlobalAgent(), args)

  let agent = (await detect({ ...options, cwd })) || (await getDefaultAgent(options.programmatic))
  if (agent === 'prompt') {
    agent = (
      await prompts({
        name: 'agent',
        type: 'select',
        message: 'Choose the agent',
        choices: AGENTS.filter(i => !i.includes('@')).map(value => ({ title: value, value })),
      })
    ).agent
    if (!agent)
      return
  }

  return await fn(agent as Agent, args, {
    programmatic: options.programmatic,
    hasLock: Boolean(agent),
    cwd,
  })
}

export async function run(fn: Runner, args: string[], options: DetectOptions = {}) {
  const {
    detectVolta = true,
  } = options

  const debug = args.includes(DEBUG_SIGN)
  if (debug)
    remove(args, DEBUG_SIGN)

  let cwd = options.cwd ?? process.cwd()
  if (args[0] === '-C') {
    cwd = resolve(cwd, args[1])
    args.splice(0, 2)
  }

  if (args.length === 1 && (args[0]?.toLowerCase() === '-v' || args[0] === '--version')) {
    const getCmd = (a: Agent) => AGENTS.includes(a)
      ? getCommand(a, 'agent', ['-v'])
      : { command: a, args: ['-v'] }
    const xVersionOptions = {
      nodeOptions: {
        cwd,
      },
      throwOnError: true,
    } satisfies Partial<TinyExecOptions>
    const getV = (a: string) => {
      const { command, args } = getCmd(a as Agent)
      return x(command, args, xVersionOptions)
        .then(e => e.stdout)
        .then(e => e.startsWith('v') ? e : `v${e}`)
    }
    const globalAgentPromise = getGlobalAgent()
    const globalAgentVersionPromise = globalAgentPromise.then(getV)
    const agentPromise = detect({ ...options, cwd }).then(a => a || '')
    const agentVersionPromise = agentPromise.then(a => a && getV(a))
    const nodeVersionPromise = getV('node')

    console.log(`@antfu/ni  ${c.cyan`v${version}`}`)
    console.log(`node       ${c.green(await nodeVersionPromise)}`)
    const [agent, agentVersion] = await Promise.all([agentPromise, agentVersionPromise])
    if (agent)
      console.log(`${agent.padEnd(10)} ${c.blue(agentVersion)}`)
    else
      console.log('agent      no lock file')
    const [globalAgent, globalAgentVersion] = await Promise.all([globalAgentPromise, globalAgentVersionPromise])
    console.log(`${(`${globalAgent} -g`).padEnd(10)} ${c.blue(globalAgentVersion)}`)
    return
  }

  if (args.length === 1 && ['-h', '--help'].includes(args[0])) {
    const dash = c.dim('-')
    console.log(c.green.bold('@antfu/ni') + c.dim` use the right package manager v${version}\n`)
    console.log(`ni    ${dash}  install`)
    console.log(`nr    ${dash}  run`)
    console.log(`nlx   ${dash}  execute`)
    console.log(`nup   ${dash}  upgrade`)
    console.log(`nun   ${dash}  uninstall`)
    console.log(`nci   ${dash}  clean install`)
    console.log(`na    ${dash}  agent alias`)
    console.log(`ni -v ${dash}  show used agent`)
    console.log(`ni -i ${dash}  interactive package management`)
    console.log(c.yellow('\ncheck https://github.com/antfu/ni for more documentation.'))
    return
  }

  const command = await getCliCommand(fn, args, options, cwd)

  if (!command)
    return

  if (detectVolta && cmdExists('volta')) {
    command.args = ['run', command.command, ...command.args]
    command.command = 'volta'
  }

  if (debug) {
    const commandStr = [command.command, ...command.args].join(' ')
    console.log(commandStr)
    return
  }

  await x(
    command.command,
    command.args,
    {
      nodeOptions: {
        stdio: 'inherit',
        cwd,
      },
      throwOnError: true,
    },
  )
}
