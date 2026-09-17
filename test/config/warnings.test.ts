import fs from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeEach, expect, it, vi } from 'vitest'

const root = fs.mkdtempSync(join(os.tmpdir(), 'ni-warn-'))

function writeRc(name: string, contents: string) {
  const path = join(root, name)
  fs.writeFileSync(path, contents)
  return path
}

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

vi.mock('../../src/detect', () => ({
  detect: vi.fn(),
}))

let warn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

it('warns about an option it does not recognise', async () => {
  const path = writeRc('unknown.nirc', 'nonsense=1\n')
  vi.stubEnv('NI_CONFIG_FILE', path)

  const { getConfig } = await import('../../src/config')
  await getConfig()

  expect(warn).toHaveBeenCalledTimes(1)
  expect(warn.mock.calls[0][0]).toContain('nonsense')
  expect(warn.mock.calls[0][0]).toContain(path)
})

it('suggests the correct option when only the casing is wrong', async () => {
  vi.stubEnv('NI_CONFIG_FILE', writeRc('casing.nirc', 'defaultagent=npm\n'))

  const { getConfig } = await import('../../src/config')
  await getConfig()

  expect(warn.mock.calls[0][0]).toContain('defaultAgent')
})

it('keeps unrecognised options out of the config', async () => {
  vi.stubEnv('NI_CONFIG_FILE', writeRc('junk.nirc', 'defaultAgent=bun\nnonsense=1\n'))

  const { getConfig } = await import('../../src/config')

  expect(await getConfig()).toEqual({
    defaultAgent: 'bun',
    globalAgent: 'npm',
    runAgent: undefined,
    useSfw: false,
    catalog: true,
    noLastCommand: false,
  })
})

it('stays quiet when every option is recognised', async () => {
  vi.stubEnv('NI_CONFIG_FILE', writeRc('good.nirc', 'defaultAgent=bun\nuseSfw=true\n'))

  const { getConfig } = await import('../../src/config')
  await getConfig()

  expect(warn).not.toHaveBeenCalled()
})

it('warns when the config file cannot be parsed', async () => {
  // `ini` walks dotted sections into the values already parsed, and a `null`
  // value satisfies its `typeof === 'object'` guard.
  const path = writeRc('unparsable.nirc', 'defaultAgent=null\n[defaultAgent.foo]\nx=1\n')
  vi.stubEnv('NI_CONFIG_FILE', path)

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(warn).toHaveBeenCalledTimes(1)
  expect(warn.mock.calls[0][0]).toContain('parse')
  expect(warn.mock.calls[0][0]).toContain(path)
  expect(config.defaultAgent).toBe('prompt')
})

it('warns when the config file cannot be read', async () => {
  const path = join(root, 'directory.nirc')
  fs.mkdirSync(path, { recursive: true })
  vi.stubEnv('NI_CONFIG_FILE', path)

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(warn).toHaveBeenCalledTimes(1)
  expect(warn.mock.calls[0][0]).toContain(path)
  expect(config.defaultAgent).toBe('prompt')
})

it('warns when NI_CONFIG_FILE points to a file that does not exist', async () => {
  const missing = join(root, 'missing.nirc')
  vi.stubEnv('NI_CONFIG_FILE', missing)

  const { getConfig } = await import('../../src/config')
  const config = await getConfig()

  expect(warn).toHaveBeenCalledTimes(1)
  expect(warn.mock.calls[0][0]).toBe(
    `[ni] NI_CONFIG_FILE points to ${missing}, which does not exist`,
  )
  expect(config).toEqual({
    defaultAgent: 'prompt',
    globalAgent: 'npm',
    runAgent: undefined,
    useSfw: false,
    catalog: true,
    noLastCommand: false,
  })
})

it('does not warn when NI_CONFIG_FILE is unset', async () => {
  vi.stubEnv('NI_CONFIG_FILE', '')

  const { getConfig } = await import('../../src/config')
  await getConfig()

  expect(warn).not.toHaveBeenCalled()
})
