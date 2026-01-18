import type { Agent, Command, ResolvedCommand } from 'package-manager-detector'
import type { ExtendedResolvedCommand, Runner } from './runner'
import process from 'node:process'
import { COMMANDS, constructCommand, getRunAgent } from '.'
import { exclude } from './utils'

export class UnsupportedCommand extends Error {
  constructor({ agent, command }: { agent: Agent, command: Command }) {
    super(`Command "${command}" is not support by agent "${agent}"`)
  }
}

export function getCommand(
  agent: Agent,
  command: Command,
  args: string[] = [],
): ExtendedResolvedCommand {
  if (!COMMANDS[agent])
    throw new Error(`Unsupported agent "${agent}"`)
  if (!COMMANDS[agent][command])
    throw new UnsupportedCommand({ agent, command })

  return constructCommand(COMMANDS[agent][command], args)!
}

export const parseNi = <Runner>((agent, args, ctx) => {
  // bun use `-d` instead of `-D`, #90
  if (agent === 'bun')
    args = args.map(i => i === '-D' ? '-d' : i)

  // npm use `--omit=dev` instead of `--production`
  if (agent === 'npm')
    args = args.map(i => i === '-P' ? '--omit=dev' : i)

  if (args.includes('-P'))
    args = args.map(i => i === '-P' ? '--production' : i)

  if (['npm', 'pnpm'].includes(agent)) {
    args = args.map(i => i === '-p' ? '--save-peer' : i)
  }

  if (['bun', 'yarn', 'yarn@berry'].includes(agent)) {
    args = args.map(i => i === '-p' ? '--peer' : i)
  }

  if (args.includes('-g'))
    return getCommand(agent, 'global', exclude(args, '-g'))

  if (args.includes('--frozen-if-present')) {
    args = exclude(args, '--frozen-if-present')
    return getCommand(agent, ctx?.hasLock ? 'frozen' : 'install', args)
  }

  if (args.includes('--frozen'))
    return getCommand(agent, 'frozen', exclude(args, '--frozen'))

  if (args.length === 0 || args.every(i => i.startsWith('-')))
    return getCommand(agent, 'install', args)

  return getCommand(agent, 'add', args)
})

export const parseNr = <Runner>(async (agent, args, ctx) => {
  if (args.length === 0)
    args.push('start')

  const runAgent = await getRunAgent()

  let runWithNode = false
  if (runAgent === 'node') {
    const [majorNodeVersion] = process.versions.node.split('.').map(Number)
    if (majorNodeVersion < 22) {
      throw new Error('The runAgent "node" requires Node.js 22.0.0 or higher')
    }
    runWithNode = true
    args = ['--run', ...args]
  }

  let hasIfPresent = false
  if (args.includes('--if-present')) {
    args = exclude(args, '--if-present')
    hasIfPresent = true
  }

  if (args.includes('-p'))
    args = exclude(args, '-p')

  const cmd = runWithNode ? { command: 'node', args } : getCommand(agent, 'run', args)

  if (ctx?.cwd)
    cmd.cwd = ctx.cwd

  if (!cmd)
    return cmd

  if (hasIfPresent && !runWithNode)
    cmd.args.splice(1, 0, '--if-present')

  return cmd
})

export const parseNup = <Runner>((agent, args) => {
  if (args.includes('-i'))
    return getCommand(agent, 'upgrade-interactive', exclude(args, '-i'))

  return getCommand(agent, 'upgrade', args)
})

export const parseNd = <Runner>((agent, args) => {
  // https://yarnpkg.com/cli/dedupe#options
  // https://pnpm.io/cli/dedupe#--check
  if (agent === 'pnpm')
    args = args.map(i => i === '-c' ? '--check' : i)

  // https://docs.npmjs.com/cli/v11/commands/npm-dedupe#dry-run
  if (agent === 'npm')
    args = args.map(i => i === '-c' ? '--dry-run' : i)

  return getCommand(agent, 'dedupe', args)
})

export const parseNun = <Runner>((agent, args) => {
  if (args.includes('-g'))
    return getCommand(agent, 'global_uninstall', exclude(args, '-g'))
  return getCommand(agent, 'uninstall', args)
})

export const parseNlx = <Runner>((agent, args) => {
  return getCommand(agent, 'execute', args)
})

export const parseNa = <Runner>((agent, args) => {
  return getCommand(agent, 'agent', args)
})

export function serializeCommand(command?: ResolvedCommand) {
  if (!command)
    return undefined
  if (command.args.length === 0)
    return command.command
  return `${command.command} ${command.args.map(i => i.includes(' ') ? `"${i}"` : i).join(' ')}`
}
