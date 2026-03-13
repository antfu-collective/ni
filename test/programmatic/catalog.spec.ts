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

vi.mock('@posva/prompts', () => ({
  default: vi.fn(async () => ({})),
}))

async function createTempDir(fixture: string): Promise<string> {
  const tmp = await fs.promises.mkdtemp(path.join(tmpdir(), 'ni-catalog-'))
  const fixtureDir = path.join(__dirname, '..', 'fixtures', 'catalog', fixture)
  await fs.promises.cp(fixtureDir, tmp, { recursive: true })
  return tmp
}

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('catalog handler - named catalogs', () => {
  it('package found in catalog → updates package.json, returns pnpm install', async () => {
    const cwd = await createTempDir('pnpm')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    const result = await handleCatalogInstall('pnpm', ['react'], { cwd, programmatic: true })

    expect(result).toBeDefined()
    expect(result!.command).toBe('pnpm')
    expect(result!.args).toEqual(['i'])

    const pkg = readJson(path.join(cwd, 'package.json'))
    expect(pkg.dependencies.react).toBe('catalog:prod')
  })

  it('multiple packages in different catalogs', async () => {
    const cwd = await createTempDir('pnpm')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    const result = await handleCatalogInstall('pnpm', ['react', 'typescript'], { cwd, programmatic: true })

    expect(result).toBeDefined()
    expect(result!.command).toBe('pnpm')
    expect(result!.args).toEqual(['i'])

    const pkg = readJson(path.join(cwd, 'package.json'))
    expect(pkg.dependencies.react).toBe('catalog:prod')
    expect(pkg.dependencies.typescript).toBe('catalog:dev')
  })

  it('-D flag → writes to devDependencies', async () => {
    const cwd = await createTempDir('pnpm')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    const result = await handleCatalogInstall('pnpm', ['react', '-D'], { cwd, programmatic: true })

    expect(result).toBeDefined()
    const pkg = readJson(path.join(cwd, 'package.json'))
    expect(pkg.devDependencies.react).toBe('catalog:prod')
    expect(pkg.dependencies?.react).toBeUndefined()
  })

  it('unknown package in programmatic mode → skips catalog', async () => {
    const cwd = await createTempDir('pnpm')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    const result = await handleCatalogInstall('pnpm', ['unknown-pkg'], { cwd, programmatic: true })

    // In programmatic mode, unknown packages are skipped → falls through
    expect(result).toBeUndefined()
  })

  it('mixed known/unknown packages in programmatic mode', async () => {
    const cwd = await createTempDir('pnpm')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    const result = await handleCatalogInstall('pnpm', ['react', 'unknown-pkg'], { cwd, programmatic: true })

    // react is cataloged, unknown-pkg is skipped → add command for skipped ones
    expect(result).toBeDefined()
    expect(result!.command).toBe('pnpm')
    expect(result!.args).toContain('unknown-pkg')

    const pkg = readJson(path.join(cwd, 'package.json'))
    expect(pkg.dependencies.react).toBe('catalog:prod')
  })
})

describe('catalog handler - default catalog only', () => {
  it('package found → uses catalog: ref (no name)', async () => {
    const cwd = await createTempDir('pnpm-default-only')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    const result = await handleCatalogInstall('pnpm', ['react'], { cwd, programmatic: true })

    expect(result).toBeDefined()
    expect(result!.args).toEqual(['i'])

    const pkg = readJson(path.join(cwd, 'package.json'))
    expect(pkg.dependencies.react).toBe('catalog:')
  })

  it('new package → adds to default catalog without prompt', async () => {
    const cwd = await createTempDir('pnpm-default-only')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    const result = await handleCatalogInstall('pnpm', ['lodash'], { cwd, programmatic: true })

    expect(result).toBeDefined()
    expect(result!.args).toEqual(['i'])

    // Check workspace yaml was updated
    const yamlContent = fs.readFileSync(path.join(cwd, 'pnpm-workspace.yaml'), 'utf-8')
    expect(yamlContent).toContain('lodash')

    // Check package.json uses catalog:
    const pkg = readJson(path.join(cwd, 'package.json'))
    expect(pkg.dependencies.lodash).toBe('catalog:')
  })
})

describe('catalog handler - skip conditions', () => {
  it('returns undefined for non-pnpm agent', async () => {
    const cwd = await createTempDir('pnpm')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    const result = await handleCatalogInstall('npm', ['react'], { cwd, programmatic: true })
    expect(result).toBeUndefined()
  })

  it('returns undefined when no packages in args (bare install)', async () => {
    const cwd = await createTempDir('pnpm')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    const result = await handleCatalogInstall('pnpm', [], { cwd, programmatic: true })
    expect(result).toBeUndefined()
  })

  it('returns undefined when only flags', async () => {
    const cwd = await createTempDir('pnpm')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    const result = await handleCatalogInstall('pnpm', ['--frozen'], { cwd, programmatic: true })
    expect(result).toBeUndefined()
  })

  it('returns undefined when catalog config disabled', async () => {
    const { getCatalog } = await import('../../src/config')
    vi.mocked(getCatalog).mockResolvedValueOnce(false)

    const cwd = await createTempDir('pnpm')
    const { handleCatalogInstall } = await import('../../src/catalog/handler')

    const result = await handleCatalogInstall('pnpm', ['react'], { cwd, programmatic: true })
    expect(result).toBeUndefined()
  })
})

describe('catalog handler - subdirectory', () => {
  it('finds closest package.json from subdirectory', async () => {
    const cwd = await createTempDir('pnpm')
    const subDir = path.join(cwd, 'packages', 'app')

    const { handleCatalogInstall } = await import('../../src/catalog/handler')
    const result = await handleCatalogInstall('pnpm', ['react'], { cwd: subDir, programmatic: true })

    expect(result).toBeDefined()

    // Should write to the subdirectory's package.json (closest)
    const pkg = readJson(path.join(subDir, 'package.json'))
    expect(pkg.dependencies.react).toBe('catalog:prod')
  })

  it('-w flag targets workspace root package.json', async () => {
    const cwd = await createTempDir('pnpm')
    const subDir = path.join(cwd, 'packages', 'app')

    const { handleCatalogInstall } = await import('../../src/catalog/handler')
    const result = await handleCatalogInstall('pnpm', ['react', '-w'], { cwd: subDir, programmatic: true })

    expect(result).toBeDefined()

    // Should write to root package.json, not subdirectory
    const rootPkg = readJson(path.join(cwd, 'package.json'))
    expect(rootPkg.dependencies.react).toBe('catalog:prod')

    // Subdirectory package.json should be unchanged
    const subPkg = readJson(path.join(subDir, 'package.json'))
    expect(subPkg.dependencies.react).toBeUndefined()
  })
})
