import { resolve } from 'path'
import fs from 'fs'

export function getPackageJSON(): any {
  const path = resolve(process.cwd(), 'package.json')

  if (fs.existsSync(path)) {
    try {
      const raw = fs.readFileSync(path, 'utf-8')
      const data = JSON.parse(raw)
      return data
    }
    catch (e) {
      console.warn('Failed to parse package.json')
      process.exit(0)
    }
  }
}
