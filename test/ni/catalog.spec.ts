import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { pnpmCatalogProvider } from '../../src/catalog/pnpm'
import { getCatalogRef } from '../../src/catalog/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixtureDir = join(__dirname, '..', 'fixtures', 'catalog', 'pnpm')
const defaultOnlyFixtureDir = join(__dirname, '..', 'fixtures', 'catalog', 'pnpm-default-only')

describe('getCatalogRef', () => {
  it('returns "catalog:" for default', () => {
    expect(getCatalogRef('default')).toBe('catalog:')
  })

  it('returns "catalog:name" for named', () => {
    expect(getCatalogRef('dev')).toBe('catalog:dev')
    expect(getCatalogRef('prod')).toBe('catalog:prod')
  })
})

describe('pnpmCatalogProvider.detect', () => {
  it('detects named catalogs', async () => {
    const config = await pnpmCatalogProvider.detect(fixtureDir)
    expect(config).not.toBeNull()
    expect(config!.hasDefaultCatalog).toBe(false)
    expect(config!.hasNamedCatalogs).toBe(true)
    expect(config!.catalogs).toHaveLength(2)
    expect(config!.catalogs.map(c => c.name)).toEqual(['prod', 'dev'])
  })

  it('detects default catalog only', async () => {
    const config = await pnpmCatalogProvider.detect(defaultOnlyFixtureDir)
    expect(config).not.toBeNull()
    expect(config!.hasDefaultCatalog).toBe(true)
    expect(config!.hasNamedCatalogs).toBe(false)
    expect(config!.catalogs).toHaveLength(1)
    expect(config!.catalogs[0].name).toBe('default')
  })

  it('detects from subdirectory', async () => {
    const subDir = join(fixtureDir, 'packages', 'app')
    const config = await pnpmCatalogProvider.detect(subDir)
    expect(config).not.toBeNull()
    expect(config!.catalogs).toHaveLength(2)
  })

  it('returns null when no workspace file', async () => {
    const config = await pnpmCatalogProvider.detect('/tmp')
    expect(config).toBeNull()
  })
})

describe('pnpmCatalogProvider.findPackage', () => {
  it('finds package in named catalog', async () => {
    const config = (await pnpmCatalogProvider.detect(fixtureDir))!
    const result = pnpmCatalogProvider.findPackage(config, 'react')
    expect(result).not.toBeUndefined()
    expect(result!.name).toBe('prod')
  })

  it('finds package in dev catalog', async () => {
    const config = (await pnpmCatalogProvider.detect(fixtureDir))!
    const result = pnpmCatalogProvider.findPackage(config, 'typescript')
    expect(result).not.toBeUndefined()
    expect(result!.name).toBe('dev')
  })

  it('returns undefined for unknown package', async () => {
    const config = (await pnpmCatalogProvider.detect(fixtureDir))!
    const result = pnpmCatalogProvider.findPackage(config, 'unknown-pkg')
    expect(result).toBeUndefined()
  })

  it('finds package in default catalog', async () => {
    const config = (await pnpmCatalogProvider.detect(defaultOnlyFixtureDir))!
    const result = pnpmCatalogProvider.findPackage(config, 'react')
    expect(result).not.toBeUndefined()
    expect(result!.name).toBe('default')
  })
})
