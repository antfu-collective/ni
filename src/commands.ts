import { Agent, AGENTS, Command } from './agents'
import { exclude } from './utils'

export function getCommand(agent: Agent, commnad: Command, args: string[]) {
  const c = AGENTS[agent][commnad]

  if (typeof c === 'function')
    return c(args)

  return c.replace('{0}', args.join(' '))
}

export function parseNi(agent: Agent, _args: string[]): string {
  let command: Command = 'install'
  let args: string[] = []

  if (_args.length === 0) {
    command = 'install'
    args = []
  }
  else if (_args.includes('-g')) {
    command = 'global'
    args = exclude(_args, '-g')
  }
  else if (_args.includes('--ci')) {
    command = 'frozen'
    args = exclude(_args, '--ci')
  }
  else {
    command = 'add'
    args = _args
  }

  return getCommand(agent, command, args)
}

export function parseNr(agent: Agent, args: string[]): string {
  if (args.length === 0)
    args.push('start')

  return getCommand(agent, 'run', args)
}
