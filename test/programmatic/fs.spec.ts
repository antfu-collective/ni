import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { getClosestPackageJSON, getPackageJSON } from '../../src/fs'
import { readPackageScripts, readWorkspaceScripts } from '../../src/package'

function createTempProject(pkg: Record<string, unknown>, subDirs: string[] = []): { root: string, cwd: string } {
  const root = fs.mkdtempSync(path.join(tmpdir(), 'ni-fs-'))
  fs.writeFileSync(path.join(root, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`)
  const cwd = path.join(root, ...subDirs)
  fs.mkdirSync(cwd, { recursive: true })
  return { root, cwd }
}

describe('getClosestPackageJSON', () => {
  it('finds package.json in a parent directory when cwd has none', () => {
    const { cwd } = createTempProject(
      { name: 'parent-pkg', scripts: { dev: 'vite' } },
      ['packages'],
    )

    const pkg = getClosestPackageJSON({ programmatic: true, cwd })

    expect(pkg).toMatchObject({ name: 'parent-pkg', scripts: { dev: 'vite' } })
  })

  it('prefers the nearest package.json over ancestors', () => {
    const { cwd } = createTempProject(
      { name: 'workspace-root' },
      ['packages', 'child'],
    )
    fs.writeFileSync(
      path.join(cwd, 'package.json'),
      JSON.stringify({ name: 'child-pkg', scripts: { test: 'vitest' } }),
    )

    const pkg = getClosestPackageJSON({ programmatic: true, cwd })

    expect(pkg).toMatchObject({ name: 'child-pkg', scripts: { test: 'vitest' } })
  })

  it('finds package.json across multiple directory levels', () => {
    const { cwd } = createTempProject(
      { name: 'deep-root' },
      ['a', 'b', 'c'],
    )

    const pkg = getClosestPackageJSON({ programmatic: true, cwd })

    expect(pkg).toMatchObject({ name: 'deep-root' })
  })

  it('throws on a malformed nearest package.json instead of walking past it', () => {
    const { cwd } = createTempProject(
      { name: 'valid-ancestor' },
      ['packages', 'broken'],
    )
    fs.writeFileSync(path.join(cwd, 'package.json'), '{ not json')

    expect(() => getClosestPackageJSON({ programmatic: true, cwd })).toThrow()
  })
})

describe('getPackageJSON', () => {
  it('reads package.json from the exact cwd only', () => {
    const { root } = createTempProject({ name: 'exact-pkg' })

    const pkg = getPackageJSON({ programmatic: true, cwd: root })

    expect(pkg).toMatchObject({ name: 'exact-pkg' })
  })

  it('does not walk up to parent directories', () => {
    const { cwd } = createTempProject({ name: 'parent-pkg' }, ['packages'])

    const pkg = getPackageJSON({ programmatic: true, cwd })

    expect(pkg).toBeUndefined()
  })
})

describe('readPackageScripts', () => {
  it('lists scripts when run from a subdirectory of the project', () => {
    const { cwd } = createTempProject(
      { name: 'my-app', scripts: { 'build': 'tsc', 'dev': 'vite', '?dev': 'start dev server' } },
      ['src', 'components'],
    )

    const scripts = readPackageScripts({ programmatic: true, cwd }, { closest: true })

    expect(scripts).toEqual([
      { key: 'build', cmd: 'tsc', description: 'tsc' },
      { key: 'dev', cmd: 'vite', description: 'start dev server' },
    ])
  })
})

describe('readWorkspaceScripts', () => {
  it('does not walk up from a subdirectory (workspace mode needs the exact root)', async () => {
    const { cwd } = createTempProject(
      { name: 'workspace-root', scripts: { build: 'tsc' } },
      ['packages', 'app', 'src'],
    )

    // No package.json in the exact cwd: workspace mode must not fall back to
    // an ancestor, matching the behavior before the walk-up was introduced.
    await expect(readWorkspaceScripts({ programmatic: true, cwd }, ['-p'])).rejects.toThrow()
  })
})
