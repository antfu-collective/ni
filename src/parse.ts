import os from 'node:os'
import type { Agent, Command } from './agents'
import { AGENTS } from './agents'
import { exclude } from './utils'
import type { CommandWithPrompt, Runner } from './runner'

export function getCommand(
  agent: Agent,
  command: Command,
  args: string[] = [],
) {
  if (!(agent in AGENTS))
    throw new Error(`Unsupported agent "${agent}"`)

  const c = AGENTS[agent][command]

  if (typeof c === 'function')
    return c(args)

  if (!c)
    throw new Error(`Command "${command}" is not support by agent "${agent}"`)
  return c.replace('{0}', args.join(' ')).trim()
}

export const parseNi = <Runner>((agent, args, ctx) => {
  // bun use `-d` instead of `-D`, #90
  if (agent === 'bun')
    args = args.map(i => i === '-D' ? '-d' : i)

  let before_actions: (CommandWithPrompt & { tag: 'clean_node_modules' })[] = []
  if (args.includes('--reinstall') || args.includes('-R')) {
    args = exclude(args, '--reinstall')
    args = exclude(args, '-R')

    const node_modules = `${ctx?.cwd || '.'}/node_modules`
    const command = os.platform() === 'win32' ? `rmdir /s /q ${node_modules}` : `rm -rf ${node_modules}`

    before_actions = [
      { command, tag: 'clean_node_modules', prompt: `Remove ${node_modules} folder?` },
    ]
  }

  if (args.includes('-g')) {
    if (before_actions.some(action => action.tag === 'clean_node_modules'))
      console.warn('`--reinstall` / `-R` is not supported with `-g`')

    return [getCommand(agent, 'global', exclude(args, '-g'))]
  }

  if (args.includes('--frozen-if-present')) {
    args = exclude(args, '--frozen-if-present')
    return [...before_actions, getCommand(agent, ctx?.hasLock ? 'frozen' : 'install', args)]
  }

  if (args.includes('--frozen'))
    return [...before_actions, getCommand(agent, 'frozen', exclude(args, '--frozen'))]

  if (args.length === 0 || args.every(i => i.startsWith('-')))
    return [...before_actions, getCommand(agent, 'install', args)]

  return [...before_actions, getCommand(agent, 'add', args)]
})

export const parseNr = <Runner>((agent, args) => {
  if (args.length === 0)
    args.push('start')

  if (args.includes('--if-present')) {
    args = exclude(args, '--if-present')
    args[0] = `--if-present ${args[0]}`
  }

  return getCommand(agent, 'run', args)
})

export const parseNu = <Runner>((agent, args) => {
  if (args.includes('-i'))
    return getCommand(agent, 'upgrade-interactive', exclude(args, '-i'))

  return getCommand(agent, 'upgrade', args)
})

export const parseNun = <Runner>((agent, args) => {
  if (args.includes('-g'))
    return getCommand(agent, 'global_uninstall', exclude(args, '-g'))
  return getCommand(agent, 'uninstall', args)
})

export const parseNx = <Runner>((agent, args) => {
  return getCommand(agent, 'execute', args)
})

export const parseNa = <Runner>((agent, args) => {
  return getCommand(agent, 'agent', args)
})
