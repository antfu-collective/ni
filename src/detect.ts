import path from 'path'
import execa from 'execa'
import {findUpMultiple} from 'find-up'
import terminalLink from 'terminal-link'
import prompts from 'prompts'
import { LOCKS, INSTALL_PAGE } from './agents'
import { cmdExists } from './utils'

export interface DetectOptions {
  autoInstall?: boolean
  cwd?: string
}

export async function detect({ autoInstall, cwd }: DetectOptions) {
  const result = await findUpMultiple(Object.keys(LOCKS), { cwd })
  const agents = result.map(filePath => LOCKS[path.basename(filePath)]) || []

  if (agents.length === 1 && !cmdExists(agents[0])) {
    if (!autoInstall) {
      console.warn(`Detected ${agents[0]} but it doesn't seem to be installed.\n`)

      if (process.env.CI)
        process.exit(1)

      const link = terminalLink(agents[0], INSTALL_PAGE[agents[0]])
      const { tryInstall } = await prompts({
        name: 'tryInstall',
        type: 'confirm',
        message: `Would you like to globally install ${link}?`,
      })
      if (!tryInstall)
        process.exit(1)
    }

    await execa.command(`npm i -g ${agents[0]}`, { stdio: 'inherit', cwd })
  }

  return agents
}
