import type { RunnerContext } from './runner'
import fs from 'node:fs'
import { resolve } from 'node:path'
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
