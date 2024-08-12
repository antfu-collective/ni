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
  })
})

it('loads .nirc', async () => {
  vi.stubEnv('NI_CONFIG_FILE', join(__dirname, './.nirc'))

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config).toEqual({
    defaultAgent: 'npm',
    globalAgent: 'pnpm',
  })
})

it('reads environment variable config', async () => {
  vi.stubEnv('NI_DEFAULT_AGENT', 'npm')
  vi.stubEnv('NI_GLOBAL_AGENT', 'pnpm')

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config).toEqual({
    defaultAgent: 'npm',
    globalAgent: 'pnpm',
  })
})
