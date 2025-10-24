import type { Agent } from 'package-manager-detector'
import type { RunnerContext } from '../../src'
import process from 'node:process'
import prompts from '@posva/prompts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchNpmPackages } from '../../src/fetch'
import { parseNi } from '../../src/parse'
import { exclude } from '../../src/utils'

vi.mock('@posva/prompts')
vi.mock('../../src/fetch')

describe('interactive mode - Ctrl+C cancellation', () => {
  let originalExitCode: typeof process.exitCode

  beforeEach(() => {
    originalExitCode = process.exitCode
    process.exitCode = 0
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.exitCode = originalExitCode
  })

  async function niRunner(agent: Agent, args: string[], ctx?: RunnerContext) {
    const isInteractive = args[0] === '-i'

    if (isInteractive) {
      let fetchPattern: string

      if (args[1] && !args[1].startsWith('-')) {
        fetchPattern = args[1]
      }
      else {
        const { pattern } = await prompts({
          type: 'text',
          name: 'pattern',
          message: 'search for package',
        })

        fetchPattern = pattern
      }

      if (!fetchPattern) {
        process.exitCode = 1
        return
      }

      const packages = await fetchNpmPackages(fetchPattern)

      if (!packages.length) {
        console.error('No results found')
        process.exitCode = 1
        return
      }

      const { dependency } = await prompts({
        type: 'autocomplete',
        name: 'dependency',
        choices: packages,
        instructions: false,
        message: 'choose a package to install',
        limit: 15,
      })

      if (!dependency) {
        process.exitCode = 1
        return
      }

      args = exclude(args, '-d', '-p', '-i')

      const canInstallPeers = ['npm', 'pnpm'].includes(agent)

      const { mode } = await prompts({
        type: 'select',
        name: 'mode',
        message: `install ${dependency.name} as`,
        choices: [
          {
            title: 'prod',
            value: '',
            selected: true,
          },
          {
            title: 'dev',
            value: '-D',
          },
          {
            title: `peer`,
            value: '--save-peer',
            disabled: !canInstallPeers,
          },
        ],
      })

      if (mode === undefined) {
        process.exitCode = 1
        return
      }

      args.push(dependency.name, mode)
    }

    return parseNi(agent, args, ctx)
  }

  it('should exit gracefully when user cancels package selection with Ctrl+C', async () => {
    vi.mocked(prompts)
      .mockResolvedValueOnce({ pattern: 'react' }) // First prompt: search pattern
      .mockResolvedValueOnce({ dependency: undefined }) // Second prompt: cancelled with Ctrl+C

    vi.mocked(fetchNpmPackages).mockResolvedValue([
      { title: 'react', value: 'react' },
      { title: 'react-dom', value: 'react-dom' },
    ])

    const result = await niRunner('npm', ['-i'])

    expect(process.exitCode).toBe(1)
    expect(result).toBeUndefined()
  })

  it('should exit gracefully when user cancels installation mode selection with Ctrl+C', async () => {
    vi.mocked(prompts)
      .mockResolvedValueOnce({ pattern: 'react' }) // First prompt: search pattern
      .mockResolvedValueOnce({ dependency: { name: 'react', value: 'react' } }) // Second prompt: select package
      .mockResolvedValueOnce({ mode: undefined }) // Third prompt: cancelled with Ctrl+C

    vi.mocked(fetchNpmPackages).mockResolvedValue([
      { title: 'react', value: 'react' },
    ])

    const result = await niRunner('npm', ['-i'])

    expect(process.exitCode).toBe(1)
    expect(result).toBeUndefined()
  })

  it('should exit gracefully when user cancels initial search pattern with Ctrl+C', async () => {
    vi.mocked(prompts)
      .mockResolvedValueOnce({ pattern: undefined }) // First prompt: cancelled with Ctrl+C

    const result = await niRunner('npm', ['-i'])

    expect(process.exitCode).toBe(1)
    expect(result).toBeUndefined()
  })
})
