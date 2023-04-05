import { resolve } from 'node:path'
import type { RunnerContext } from './runner'
import fs from 'node:fs'

export function getPackageJSON({ cwd = process.cwd(), silent }: RunnerContext): any {
  const path = resolve(cwd, 'package.json')

  if (fs.existsSync(path)) {
    try {
      const raw = fs.readFileSync(path, 'utf-8')
      const data = JSON.parse(raw)
      return data
    }
    catch (e) {
      !options.silent ? console.warn('Failed to parse package.json') : 0
      process.exit(0)
    }
  }
}
