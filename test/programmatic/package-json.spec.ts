import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { updatePackageJsonCatalogRefs } from '../../src/catalog/package-json'

function createTempPkgJson(content: Record<string, unknown>): string {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'ni-pkg-json-'))
  const filePath = path.join(dir, 'package.json')
  fs.writeFileSync(filePath, `${JSON.stringify(content, null, 2)}\n`)
  return filePath
}

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

describe('updatePackageJsonCatalogRefs - alphabetical sorting', () => {
  it('sorts new entries alphabetically in dependencies', () => {
    const filePath = createTempPkgJson({
      name: 'test',
      dependencies: {},
    })

    updatePackageJsonCatalogRefs(filePath, [
      { name: 'zod', catalogRef: 'catalog:' },
      { name: 'axios', catalogRef: 'catalog:' },
      { name: 'react', catalogRef: 'catalog:' },
    ], 'dependencies')

    const pkg = readJson(filePath)
    expect(Object.keys(pkg.dependencies)).toEqual(['axios', 'react', 'zod'])
  })

  it('inserts new entries in sorted order among existing entries', () => {
    const filePath = createTempPkgJson({
      name: 'test',
      dependencies: {
        express: '^4.0.0',
        lodash: '^4.0.0',
      },
    })

    updatePackageJsonCatalogRefs(filePath, [
      { name: 'axios', catalogRef: 'catalog:' },
      { name: 'zod', catalogRef: 'catalog:' },
    ], 'dependencies')

    const pkg = readJson(filePath)
    expect(Object.keys(pkg.dependencies)).toEqual(['axios', 'express', 'lodash', 'zod'])
  })

  it('does not alter other top-level fields', () => {
    const filePath = createTempPkgJson({
      name: 'test',
      version: '1.0.0',
      scripts: { build: 'tsc', dev: 'vite', test: 'vitest' },
      dependencies: {},
    })

    updatePackageJsonCatalogRefs(filePath, [
      { name: 'react', catalogRef: 'catalog:' },
    ], 'dependencies')

    const pkg = readJson(filePath)
    expect(Object.keys(pkg)).toEqual(['name', 'version', 'scripts', 'dependencies'])
    expect(Object.keys(pkg.scripts)).toEqual(['build', 'dev', 'test'])
  })
})
