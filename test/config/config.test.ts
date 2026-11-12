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
    lastCommand: 'shared',
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
    lastCommand: 'shared',
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
    lastCommand: 'shared',
  })
})

it('reads lastCommand from .nirc', async () => {
  vi.stubEnv('NI_CONFIG_FILE', join(__dirname, './.nirc-last-command'))

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config.lastCommand).toBe('terminal')
})

it('reads lastCommand from NI_LAST_COMMAND', async () => {
  vi.stubEnv('NI_LAST_COMMAND', 'terminal')

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config.lastCommand).toBe('terminal')
})

it('ignores an unknown NI_LAST_COMMAND value', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.stubEnv('NI_LAST_COMMAND', 'terminals')

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config.lastCommand).toBe('shared')
  expect(warn).toHaveBeenCalledOnce()
  expect(warn.mock.calls[0][0]).toContain('NI_LAST_COMMAND')
  warn.mockRestore()
})

it('maps the legacy NI_NO_LAST_COMMAND=true to lastCommand=off', async () => {
  vi.stubEnv('NI_NO_LAST_COMMAND', 'true')

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config.lastCommand).toBe('off')
})

it('keeps lastCommand shared when NI_NO_LAST_COMMAND is not "true"', async () => {
  vi.stubEnv('NI_NO_LAST_COMMAND', 'false')

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config.lastCommand).toBe('shared')
})

it('maps the legacy NI_NO_LAST_COMMAND without warning', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.stubEnv('NI_NO_LAST_COMMAND', 'true')

  const { getConfig } = await import('../../src/config')
  await getConfig()

  expect(warn).not.toHaveBeenCalled()
  warn.mockRestore()
})

it('prefers NI_LAST_COMMAND over the legacy NI_NO_LAST_COMMAND', async () => {
  vi.stubEnv('NI_LAST_COMMAND', 'terminal')
  vi.stubEnv('NI_NO_LAST_COMMAND', 'true')

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config.lastCommand).toBe('terminal')
})

it('maps the legacy noLastCommand from .nirc and warns', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.stubEnv('NI_CONFIG_FILE', join(__dirname, './.nirc-no-last-command'))

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config.lastCommand).toBe('off')
  expect(warn).toHaveBeenCalledOnce()
  expect(warn.mock.calls[0][0]).toContain('lastCommand')
  warn.mockRestore()
})

it('reads catalog=existing from .nirc', async () => {
  vi.stubEnv('NI_CONFIG_FILE', join(__dirname, './.nirc-catalog-existing'))

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config.catalog).toBe('existing')
})

it('sets catalog to "existing" via NI_CATALOG env var', async () => {
  vi.stubEnv('NI_CATALOG', 'existing')

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config.catalog).toBe('existing')
})

it('disables catalog via NI_CATALOG=false', async () => {
  vi.stubEnv('NI_CATALOG', 'false')

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config.catalog).toBe(false)
})

it('keeps catalog enabled for any other NI_CATALOG value', async () => {
  vi.stubEnv('NI_CATALOG', 'true')

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(config.catalog).toBe(true)
})
