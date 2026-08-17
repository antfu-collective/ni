import type { RunnerContext } from './runner'
import fs from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

/**
 * Remove JSONC comments and trailing commas, leaving string contents alone.
 *
 * Single pass on purpose: a regex sweep over the whole text would also eat a
 * `//` inside a URL, or a comma inside a string that happens to be followed by
 * a closing brace.
 */
function stripJsonc(raw: string): string {
  const out: string[] = []
  let inString = false

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]

    if (inString) {
      out.push(c)
      if (c === '\\')
        out.push(raw[++i] ?? '')
      else if (c === '"')
        inString = false
      continue
    }

    if (c === '"') {
      inString = true
      out.push(c)
      continue
    }

    // Line comment: drop to the newline, keeping the newline so positions in a
    // later parse error still point at a plausible line.
    if (c === '/' && raw[i + 1] === '/') {
      while (i < raw.length && raw[i] !== '\n')
        i++
      out.push('\n')
      continue
    }

    // Block comment: replace with a space so `1/* x */2` cannot become `12`.
    if (c === '/' && raw[i + 1] === '*') {
      i += 2
      while (i < raw.length && !(raw[i] === '*' && raw[i + 1] === '/'))
        i++
      i++
      out.push(' ')
      continue
    }

    if (c === '}' || c === ']') {
      let j = out.length - 1
      while (j >= 0 && /\s/.test(out[j]!))
        j--
      if (j >= 0 && out[j] === ',')
        out.splice(j, 1)
    }

    out.push(c)
  }

  return out.join('')
}

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
      return JSON.parse(stripJsonc(raw))
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
