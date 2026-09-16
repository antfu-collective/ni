import type { RunnerContext } from './runner'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import stripJsonComments from 'strip-json-comments'

/**
 * Bun 1.2 reads `package.json` as JSONC, so a manifest in a Bun project can
 * carry comments and trailing commas that `JSON.parse` rejects.
 *
 * Plain JSON keeps the straight `JSON.parse`: it is the common case, and a
 * manifest that is broken rather than merely JSONC still reports its original
 * error rather than one from the rewritten text.
 */
function parsePackageJSON(raw: string): any {
  try {
    return JSON.parse(raw)
  }
  catch (e) {
    try {
      return JSON.parse(stripJsonComments(raw, { trailingCommas: true }))
    }
    catch {
      throw e
    }
  }
}

export function getPackageJSON(ctx?: RunnerContext): any {
  const cwd = ctx?.cwd ?? process.cwd()
  const path = resolve(cwd, 'package.json')

  if (fs.existsSync(path)) {
    try {
      const raw = fs.readFileSync(path, 'utf-8')
      const data = parsePackageJSON(raw)
      return data
    }
    catch (e) {
      if (!ctx?.programmatic) {
        console.warn('Failed to parse package.json')
        process.exit(1)
      }

      throw e
    }
  }
}

/**
 * The home directory the current platform reports, if any.
 */
export function getHomeDir(): string | undefined {
  return process.platform === 'win32'
    ? process.env.USERPROFILE
    : process.env.HOME
}

/**
 * Every `fileName` from `cwd` up to the filesystem root, nearest first, with the
 * one in the home directory appended last. This is how npm and yarn layer their
 * own configuration files.
 */
export function findConfigFiles(cwd: string, fileName: string, home = getHomeDir()): string[] {
  const found: string[] = []
  let dir = resolve(cwd)
  while (true) {
    const filePath = resolve(dir, fileName)
    if (fs.existsSync(filePath))
      found.push(filePath)
    const parent = dirname(dir)
    if (parent === dir)
      break
    dir = parent
  }

  if (home) {
    const homeConfig = resolve(home, fileName)
    if (!found.includes(homeConfig) && fs.existsSync(homeConfig))
      found.push(homeConfig)
  }

  return found
}
