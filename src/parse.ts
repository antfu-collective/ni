import type { Agent, Command, ResolvedCommand } from 'package-manager-detector'
import type { Runner } from './runner'
import { COMMANDS, constructCommand } from '.'
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
): ResolvedCommand {
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

export const parseNr = <Runner>((agent, args) => {
  if (args.length === 0)
    args.push('start')

  let hasIfPresent = false
  if (args.includes('--if-present')) {
    args = exclude(args, '--if-present')
    hasIfPresent = true
  }

  const cmd = getCommand(agent, 'run', args)
  if (!cmd)
    return cmd

  if (hasIfPresent)
    cmd.args.splice(1, 0, '--if-present')

  return cmd
})

export const parseNup = <Runner>((agent, args) => {
  if (args.includes('-i'))
    return getCommand(agent, 'upgrade-interactive', exclude(args, '-i'))

  return getCommand(agent, 'upgrade', args)
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
