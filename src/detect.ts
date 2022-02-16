import fs from 'fs'
import path from 'path'
import execa from 'execa'
import findUp from 'find-up'
import terminalLink from 'terminal-link'
import prompts from 'prompts'
import { LOCKS, INSTALL_PAGE, Agent } from './agents'
import { cmdExists } from './utils'

export interface DetectOptions {
  autoInstall?: boolean
  cwd?: string
}

export async function detect({ autoInstall, cwd }: DetectOptions) {
  const result = await findUp(Object.keys(LOCKS), { cwd })

  let agent: Agent | null = null
  // handle "packageManager"
  if (result) {
    const packageJSON = path.resolve(result, '../package.json')
    if (fs.existsSync(packageJSON)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJSON, 'utf8'))
        if (pkg.packageManager) {
          const [name, version] = pkg.packageManager.split('@')
          if (name === 'yarn' && version > '1') agent = 'yarn@berry'
        }
      }
      catch {}
    }
    agent ||= LOCKS[path.basename(result)]
  }

  if (agent && !cmdExists(agent.split('@')[0])) {
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

    await execa.command(`npm i -g ${agent}`, { stdio: 'inherit', cwd })
  }

  return agent
}
