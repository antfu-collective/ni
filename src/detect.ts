import path from 'path'
import { execSync } from 'child_process'
import findUp from 'find-up'
import terminalLink from 'terminal-link'
import prompts from 'prompts'
import { LOCKS, INSTALL_PAGE } from './agents'
import { cmdExists } from './utils'

export interface DetectOptions {
  autoInstall?: boolean
}

export async function detect({ autoInstall }: DetectOptions) {
  const result = await findUp(Object.keys(LOCKS))
  const agent = (result ? LOCKS[path.basename(result)] : null)

  if (agent && !cmdExists(agent)) {
    if (!autoInstall) {
      console.warn(`Detected ${agent} but it doesn't seem to be installed.\n`)

      if (process.env.CI)
        process.exit(1)

      const link = terminalLink(agent, INSTALL_PAGE[agent])
      const { tryInstall } = await prompts({
        name: 'tryInstall',
        type: 'confirm',
        message: `Would you like to globally install ${link}?`,
      })
      if (!tryInstall)
        process.exit(1)
    }

    execSync(`npm i -g ${agent}`, { stdio: 'inherit' })
  }

  return agent
}
