import process from 'node:process'
import { detect as detectPM } from 'package-manager-detector'
import { x } from 'tinyexec'
import terminalLink from 'terminal-link'
import prompts from '@posva/prompts'
import { INSTALL_PAGE } from './agents'
import { cmdExists } from './utils'

export interface DetectOptions {
  autoInstall?: boolean
  programmatic?: boolean
  cwd?: string
}

export async function detect({ autoInstall, programmatic, cwd }: DetectOptions = {}) {
  const pmDetection = await detectPM({
    cwd,
    onUnknown: (packageManager) => {
      if (!programmatic) {
        console.warn('[ni] Unknown packageManager:', packageManager)
      }
    },
  })

  const agent = pmDetection?.agent ?? null
  const version = pmDetection?.version ?? null

  // auto install
  if (agent && !cmdExists(agent.split('@')[0]) && !programmatic) {
    if (!autoInstall) {
      console.warn(`[ni] Detected ${agent} but it doesn't seem to be installed.\n`)

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

    await x(
      'npm',
      ['i', '-g', `${agent.split('@')[0]}${version ? `@${version}` : ''}`],
      {
        nodeOptions: {
          stdio: 'inherit',
          cwd,
        },
        throwOnError: true,
      },
    )
  }

  return agent
}
