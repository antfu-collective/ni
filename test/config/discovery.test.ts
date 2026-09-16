import fs from 'node:fs'
import os from 'node:os'
import { join, relative } from 'node:path'
import process from 'node:process'
import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest'

// Built outside the repository so that a real `.nirc` in the developer's home
// directory cannot be picked up by the upward traversal.
const root = fs.mkdtempSync(join(os.tmpdir(), 'ni-config-'))
const home = join(root, 'home')
const project = join(root, 'project')
const nested = join(project, 'nested')
const noisy = join(root, 'noisy')

fs.mkdirSync(home)
fs.mkdirSync(nested, { recursive: true })
fs.mkdirSync(noisy)
fs.writeFileSync(join(home, '.nirc'), 'globalAgent=pnpm\nuseSfw=true\n')
fs.writeFileSync(join(project, '.nirc'), 'defaultAgent=bun\nglobalAgent=yarn\n')
fs.writeFileSync(join(noisy, '.nirc'), 'unknownOption=1\n')

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

vi.mock('../../src/detect', () => ({
  detect: vi.fn(),
}))

beforeEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  // vitest.config.ts pins this to disable discovery for the rest of the suite.
  vi.stubEnv('NI_CONFIG_FILE', '')
  vi.stubEnv('HOME', home)
  vi.stubEnv('USERPROFILE', home)
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('discovers a .nirc above the cwd', async () => {
  const { getConfig } = await import('../../src/config')

  expect(await getConfig(nested)).toMatchObject({ defaultAgent: 'bun' })
})

it('lets the nearest .nirc override the one in the home directory', async () => {
  const { getConfig } = await import('../../src/config')

  expect(await getConfig(nested)).toEqual({
    defaultAgent: 'bun',
    globalAgent: 'yarn',
    runAgent: undefined,
    useSfw: true,
    catalog: true,
    noLastCommand: false,
  })
})

it('falls back to the home config when no .nirc is found above the cwd', async () => {
  const { getConfig } = await import('../../src/config')

  expect(await getConfig(home)).toMatchObject({
    globalAgent: 'pnpm',
    useSfw: true,
    defaultAgent: 'prompt',
  })
})

it('does not traverse when NI_CONFIG_FILE is set', async () => {
  vi.stubEnv('NI_CONFIG_FILE', join(home, '.nirc'))

  const { getConfig } = await import('../../src/config')

  expect(await getConfig(nested)).toMatchObject({
    globalAgent: 'pnpm',
    defaultAgent: 'prompt',
  })
})

it('lets environment variables override a discovered .nirc', async () => {
  vi.stubEnv('NI_GLOBAL_AGENT', 'npm')

  const { getConfig } = await import('../../src/config')

  expect(await getConfig(nested)).toMatchObject({ globalAgent: 'npm' })
})

it('caches per cwd', async () => {
  const { getConfig } = await import('../../src/config')

  expect(await getConfig(nested)).toMatchObject({ defaultAgent: 'bun' })
  expect(await getConfig(home)).toMatchObject({ defaultAgent: 'prompt' })
})

it('reads the .nirc files once for concurrent calls on the same cwd', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const { getConfig } = await import('../../src/config')

  const [first, second] = await Promise.all([getConfig(noisy), getConfig(noisy)])

  expect(first).toBe(second)
  expect(warn).toHaveBeenCalledTimes(1)
})

it('shares the cache between equivalent spellings of the cwd', async () => {
  const { getConfig } = await import('../../src/config')

  const config = await getConfig(nested)

  expect(await getConfig(`${nested}/`)).toBe(config)
  expect(await getConfig(relative(process.cwd(), nested))).toBe(config)
})
