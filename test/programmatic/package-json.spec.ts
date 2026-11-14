import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectIndent, updatePackageJsonCatalogRefs } from '../../src/catalog/package-json'

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

describe('detectIndent', () => {
  it('ignores line breaks on CRLF files and leading blank lines', () => {
    expect(detectIndent('{\r\n  "name": "test"\r\n}\r\n')).toBe('  ')
    expect(detectIndent('{\r\n    "name": "test"\r\n}\r\n')).toBe('    ')
    expect(detectIndent('{\r\n\t"name": "test"\r\n}\r\n')).toBe('\t')
    expect(detectIndent('{\n\n  "name": "test"\n}\n')).toBe('  ')
    expect(detectIndent('{\r\n  \r\n  "name": "test"\r\n}\r\n')).toBe('  ')
  })

  it('falls back to two spaces for single-line JSON', () => {
    expect(detectIndent('{"name":"test"}')).toBe('  ')
  })
})

describe('updatePackageJsonCatalogRefs - formatting preservation', () => {
  it('does not insert extra blank lines and preserves CRLF line endings', () => {
    const dir = fs.mkdtempSync(path.join(tmpdir(), 'ni-pkg-json-crlf-'))
    const filePath = path.join(dir, 'package.json')
    const initial = [
      '{',
      '  "name": "test",',
      '  "version": "1.0.0"',
      '}',
      '',
    ].join('\r\n')
    fs.writeFileSync(filePath, initial)

    updatePackageJsonCatalogRefs(filePath, [
      { name: 'is-number', catalogRef: 'catalog:' },
    ], 'devDependencies')

    const updated = fs.readFileSync(filePath, 'utf-8')
    expect(updated).toBe([
      '{',
      '  "name": "test",',
      '  "version": "1.0.0",',
      '  "devDependencies": {',
      '    "is-number": "catalog:"',
      '  }',
      '}',
      '',
    ].join('\r\n'))
  })

  it('preserves 4-space and tab indentation on CRLF files without blank lines', () => {
    for (const indent of ['    ', '\t']) {
      const dir = fs.mkdtempSync(path.join(tmpdir(), 'ni-pkg-json-indent-'))
      const filePath = path.join(dir, 'package.json')
      const initial = [
        '{',
        `${indent}"name": "test"`,
        '}',
        '',
      ].join('\r\n')
      fs.writeFileSync(filePath, initial)

      updatePackageJsonCatalogRefs(filePath, [
        { name: 'is-number', catalogRef: 'catalog:' },
      ], 'devDependencies')

      const updated = fs.readFileSync(filePath, 'utf-8')
      expect(updated).toBe([
        '{',
        `${indent}"name": "test",`,
        `${indent}"devDependencies": {`,
        `${indent}${indent}"is-number": "catalog:"`,
        `${indent}}`,
        '}',
        '',
      ].join('\r\n'))
    }
  })

  it('keeps LF line endings on LF files', () => {
    const filePath = createTempPkgJson({ name: 'test' })

    updatePackageJsonCatalogRefs(filePath, [
      { name: 'is-number', catalogRef: 'catalog:' },
    ], 'dependencies')

    const updated = fs.readFileSync(filePath, 'utf-8')
    expect(updated).not.toContain('\r\n')
    expect(updated).toBe([
      '{',
      '  "name": "test",',
      '  "dependencies": {',
      '    "is-number": "catalog:"',
      '  }',
      '}',
      '',
    ].join('\n'))
  })
})
