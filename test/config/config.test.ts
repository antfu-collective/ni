import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, expect, it, vi } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))

beforeEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

vi.mock('../../src/detect', () => ({
  detect: vi.fn(),
}))

it('has correct defaults', async () => {
  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config).toEqual({
    defaultAgent: 'prompt',
    globalAgent: 'npm',
    runAgent: undefined,
    useSfw: false,
    catalog: true,
    noLastCommand: false,
  })
})

it('loads .nirc', async () => {
  vi.stubEnv('NI_CONFIG_FILE', join(__dirname, './.nirc'))

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config).toEqual({
    defaultAgent: 'npm',
    globalAgent: 'pnpm',
    runAgent: undefined,
    useSfw: true,
    catalog: true,
    noLastCommand: false,
  })
})

it('reads environment variable config', async () => {
  vi.stubEnv('NI_DEFAULT_AGENT', 'npm')
  vi.stubEnv('NI_GLOBAL_AGENT', 'pnpm')
  vi.stubEnv('NI_USE_SFW', 'true')

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config).toEqual({
    defaultAgent: 'npm',
    globalAgent: 'pnpm',
    runAgent: undefined,
    useSfw: true,
    catalog: true,
    noLastCommand: false,
  })
})

it('enables noLastCommand via NI_NO_LAST_COMMAND env var', async () => {
  vi.stubEnv('NI_NO_LAST_COMMAND', 'true')

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config.noLastCommand).toBe(true)
})

it('keeps noLastCommand false when NI_NO_LAST_COMMAND is not "true"', async () => {
  vi.stubEnv('NI_NO_LAST_COMMAND', 'false')

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config.noLastCommand).toBe(false)
})
