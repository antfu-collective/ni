import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { getPackageJSON } from '../src/fs'

async function withManifest(contents: string) {
  const cwd = await fs.mkdtemp(path.join(tmpdir(), 'ni-pkg-'))
  await fs.writeFile(path.join(cwd, 'package.json'), contents)
  return cwd
}

describe('getPackageJSON', () => {
  it('reads a plain JSON manifest', async () => {
    const cwd = await withManifest(JSON.stringify({
      name: 'plain',
      scripts: { dev: 'vite' },
    }))

    expect(getPackageJSON({ programmatic: true, cwd } as any).scripts).toEqual({ dev: 'vite' })
  })

  // Bun 1.2 reads package.json as JSONC: https://bun.sh/blog/bun-v1.2#jsonc-support-in-package-json
  it('reads a manifest with line and block comments', async () => {
    const cwd = await withManifest(`{
  // the package name
  "name": "jsonc",
  "scripts": {
    /* the dev server */
    "dev": "vite",
    "build": "vite build"
  }
}`)

    expect(getPackageJSON({ programmatic: true, cwd } as any).scripts).toEqual({
      dev: 'vite',
      build: 'vite build',
    })
  })

  it('reads a manifest with trailing commas', async () => {
    const cwd = await withManifest(`{
  "name": "trailing",
  "scripts": {
    "dev": "vite",
  },
}`)

    expect(getPackageJSON({ programmatic: true, cwd } as any).scripts).toEqual({ dev: 'vite' })
  })

  it('does not treat a comment marker inside a string as a comment', async () => {
    const cwd = await withManifest(JSON.stringify({
      name: 'urls',
      scripts: { docs: 'open https://example.com/docs' },
      homepage: 'https://example.com/a//b',
      description: 'uses /* glob */ syntax',
    }))

    const pkg = getPackageJSON({ programmatic: true, cwd } as any)
    expect(pkg.scripts.docs).toBe('open https://example.com/docs')
    expect(pkg.homepage).toBe('https://example.com/a//b')
    expect(pkg.description).toBe('uses /* glob */ syntax')
  })

  it('does not drop a comma that belongs to a string', async () => {
    // A naive trailing-comma sweep would rewrite "a, }" here.
    const cwd = await withManifest(`{
  "name": "commas",
  "description": "a, } and a, ] inside a string",
  "scripts": { "dev": "vite" }
}`)

    const pkg = getPackageJSON({ programmatic: true, cwd } as any)
    expect(pkg.description).toBe('a, } and a, ] inside a string')
    expect(pkg.scripts).toEqual({ dev: 'vite' })
  })

  it('keeps an escaped quote from ending a string early', async () => {
    const cwd = await withManifest(`{
  // a quote inside a value
  "name": "escapes",
  "scripts": { "say": "node -e \\"console.log('hi // not a comment')\\"" }
}`)

    expect(getPackageJSON({ programmatic: true, cwd } as any).scripts.say)
      .toBe(`node -e "console.log('hi // not a comment')"`)
  })

  it('does not glue tokens together when a block comment separates them', async () => {
    const cwd = await withManifest(`{
  "name": "adjacent",
  "version": "1"/* pinned */,
  "scripts": { "dev": "vite" }
}`)

    const pkg = getPackageJSON({ programmatic: true, cwd } as any)
    expect(pkg.version).toBe('1')
    expect(pkg.name).toBe('adjacent')
  })

  it('handles comments and trailing commas together in nested objects', async () => {
    const cwd = await withManifest(`{
  "name": "nested",
  "scripts": {
    "dev": "vite", // start
    "build": "vite build",
  },
  "keywords": [
    "a",
    "b",
  ],
}`)

    const pkg = getPackageJSON({ programmatic: true, cwd } as any)
    expect(pkg.scripts).toEqual({ dev: 'vite', build: 'vite build' })
    expect(pkg.keywords).toEqual(['a', 'b'])
  })

  it('still throws on a genuinely broken manifest', async () => {
    const cwd = await withManifest('{ "name": "broken", ')

    expect(() => getPackageJSON({ programmatic: true, cwd } as any)).toThrow()
  })

  it('returns undefined when there is no manifest', async () => {
    const cwd = await fs.mkdtemp(path.join(tmpdir(), 'ni-pkg-'))

    expect(getPackageJSON({ programmatic: true, cwd } as any)).toBeUndefined()
  })
})
