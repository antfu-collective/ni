import { Agent, AGENTS, Command } from './agents'
import { exclude } from './utils'

export function getCommand(agent: Agent, commnad: Command, args: string[] = []) {
  if (!(agent in AGENTS))
    throw new Error(`Unsupported agent "${agent}"`)

  const c = AGENTS[agent][commnad]

  if (typeof c === 'function')
    return c(args)

  if (!c)
    throw new Error(`Command "${commnad}" is not support by agent "${agent}"`)

  return c.replace('{0}', args.join(' '))
}

export function parseNi(agent: Agent, args: string[], hasLock?: boolean): string {
  if (args.length === 0)
    return getCommand(agent, 'install')

  if (args.includes('-g'))
    return getCommand(agent, 'global', exclude(args, '-g'))

  if (args.includes('--frozen-if-present')) {
    args = exclude(args, '--frozen-if-present')
    return getCommand(agent, hasLock ? 'frozen' : 'install', args)
  }

  if (args.includes('--frozen'))
    return getCommand(agent, 'frozen', exclude(args, '--frozen'))

  return getCommand(agent, 'add', args)
}

export function parseNr(agent: Agent, args: string[]): string {
  if (args.length === 0)
    args.push('start')

  if (args.includes('--if-present')) {
    args = exclude(args, '--if-present')
    args[0] = `--if-present ${args[0]}`
  }

  return getCommand(agent, 'run', args)
}

export function parseNu(agent: Agent, args: string[]): string {
  if (args.includes('-i'))
    return getCommand(agent, 'upgrade-interactive', exclude(args, '-i'))

  return getCommand(agent, 'upgrade', args)
}
