import process from 'node:process'
import prompts from '@posva/prompts'
import { detect as detectPM } from 'package-manager-detector'
import { INSTALL_PAGE } from 'package-manager-detector/constants'
import terminalLink from 'terminal-link'
import { x } from 'tinyexec'
import { cmdExists } from './utils'

export interface DetectOptions {
  autoInstall?: boolean
  programmatic?: boolean
  cwd?: string
  /**
   * Should use Volta when present
   *
   * @see https://volta.sh/
   * @default true
   */
  detectVolta?: boolean
}

export async function detect({ autoInstall, programmatic, cwd }: DetectOptions = {}) {
  const {
    name,
    agent,
    version,
  } = await detectPM({
    cwd,
    onUnknown: (packageManager) => {
      if (!programmatic) {
        console.warn('[ni] Unknown packageManager:', packageManager)
      }
      return undefined
    },
  }) || {}

  // auto install
  if (name && !cmdExists(name) && !programmatic) {
    if (!autoInstall) {
      console.warn(`[ni] Detected ${name} but it doesn't seem to be installed.\n`)

      if (process.env.CI)
        process.exit(1)

      const link = terminalLink(name, INSTALL_PAGE[name])
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
      ['i', '-g', `${name}${version ? `@${version}` : ''}`],
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
