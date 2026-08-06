import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

vi.mock('../../src/detect', () => ({
  detect: vi.fn(() => 'pnpm'),
}))

vi.mock('../../src/config', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/config')>()
  return {
    ...original,
    getConfig: vi.fn(async () => ({
      defaultAgent: 'pnpm',
      globalAgent: 'npm',
      runAgent: undefined,
      useSfw: false,
      catalog: true,
    })),
    getDefaultAgent: vi.fn(async () => 'pnpm'),
    getGlobalAgent: vi.fn(async () => 'npm'),
    getRunAgent: vi.fn(async () => undefined),
    getUseSfw: vi.fn(async () => false),
    getCatalog: vi.fn(async () => true),
  }
})

vi.mock('fast-npm-meta', () => ({
  getLatestVersion: vi.fn(async (name: string) => ({
    name,
    version: '1.0.0',
  })),
}))

// Shared prompt state: `responders` is a queue of functions, one per prompt
// call, each returning the value to select for that prompt. `calls` records the
// options every prompt was invoked with so we can assert on the choice list.
const promptState = vi.hoisted(() => ({
  responders: [] as Array<(opts: any) => any>,
  calls: [] as any[],
}))

vi.mock('@posva/prompts', () => ({
  default: vi.fn(async (opts: any) => {
    promptState.calls.push(opts)
    const responder = promptState.responders.shift()
    const value = responder ? responder(opts) : undefined
    return { [opts.name]: value }
  }),
}))

async function createTempDir(fixture: string): Promise<string> {
  const tmp = await fs.promises.mkdtemp(path.join(tmpdir(), 'ni-catalog-interactive-'))
  const fixtureDir = path.join(__dirname, '..', 'fixtures', 'catalog', fixture)
  await fs.promises.cp(fixtureDir, tmp, { recursive: true })
  return tmp
}

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

/** Select the choice whose (styled) title contains the given substring. */
function chooseByTitle(sub: string) {
  return (opts: any) => opts.choices.find((c: any) => c.title.includes(sub))?.value
}

/** Select the choice whose value matches exactly. */
function chooseValue(value: string) {
  return () => value
}

beforeEach(() => {
  promptState.responders.length = 0
  promptState.calls.length = 0
})

describe('catalog handler - interactive prompt reordering', () => {
  it('first package has no shortcuts; following packages surface "same as previous"', async () => {
    const cwd = await createTempDir('pnpm')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    promptState.responders.push(
      chooseValue('prod'), // lodash → prod
      chooseByTitle('(same as previous)'), // axios → same as previous (prod)
      chooseValue('dev'), // dayjs → dev
    )

    const result = await handleCatalogInstall('pnpm', ['lodash', 'axios', 'dayjs'], { cwd })
    expect(result).toBeDefined()

    // First prompt: no shortcut options yet.
    const first = promptState.calls[0]
    expect(first.choices.some((c: any) => c.title.includes('(same as previous)'))).toBe(false)
    expect(first.choices.some((c: any) => c.title.includes('(apply to all remaining)'))).toBe(false)

    // Second prompt: "same as previous" is the first (default) choice, and since
    // a package still remains, "apply to all remaining" is offered too.
    const second = promptState.calls[1]
    expect(second.choices[0].title).toContain('(same as previous)')
    expect(second.choices[0].title).toContain('prod')
    expect(second.choices[1].title).toContain('(apply to all remaining)')

    // Third (last) prompt: no packages remain, so no "apply to all remaining".
    const third = promptState.calls[2]
    expect(third.choices[0].title).toContain('(same as previous)')
    expect(third.choices.some((c: any) => c.title.includes('(apply to all remaining)'))).toBe(false)

    const pkg = readJson(path.join(cwd, 'package.json'))
    expect(pkg.dependencies.lodash).toBe('catalog:prod')
    expect(pkg.dependencies.axios).toBe('catalog:prod')
    expect(pkg.dependencies.dayjs).toBe('catalog:dev')
  })

  it('"apply to all remaining" assigns the previous catalog to every remaining package without prompting', async () => {
    const cwd = await createTempDir('pnpm')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    promptState.responders.push(
      chooseValue('dev'), // lodash → dev
      chooseByTitle('(apply to all remaining)'), // axios + dayjs → dev, no more prompts
    )

    const result = await handleCatalogInstall('pnpm', ['lodash', 'axios', 'dayjs'], { cwd })
    expect(result).toBeDefined()

    // Only two prompts: the third package was resolved automatically.
    expect(promptState.calls).toHaveLength(2)

    const pkg = readJson(path.join(cwd, 'package.json'))
    expect(pkg.dependencies.lodash).toBe('catalog:dev')
    expect(pkg.dependencies.axios).toBe('catalog:dev')
    expect(pkg.dependencies.dayjs).toBe('catalog:dev')
  })

  it('packages already in a catalog are skipped from prompting and do not become the "previous" selection', async () => {
    const cwd = await createTempDir('pnpm')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    // react is already in `prod`; only lodash and axios prompt.
    promptState.responders.push(
      chooseValue('dev'), // lodash → dev
      chooseByTitle('(same as previous)'), // axios → same as previous (dev)
    )

    const result = await handleCatalogInstall('pnpm', ['react', 'lodash', 'axios'], { cwd })
    expect(result).toBeDefined()

    expect(promptState.calls).toHaveLength(2)
    // lodash is the first prompted package → no shortcuts.
    expect(promptState.calls[0].choices.some((c: any) => c.title.includes('(same as previous)'))).toBe(false)
    // axios follows → "same as previous" points at dev (react was never prompted).
    expect(promptState.calls[1].choices[0].title).toContain('(same as previous)')
    expect(promptState.calls[1].choices[0].title).toContain('dev')

    const pkg = readJson(path.join(cwd, 'package.json'))
    expect(pkg.dependencies.react).toBe('catalog:prod')
    expect(pkg.dependencies.lodash).toBe('catalog:dev')
    expect(pkg.dependencies.axios).toBe('catalog:dev')
  })
})
