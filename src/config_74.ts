import fs from 'fs'
import ini from 'ini'
import type { Config } from './config'

export function loadConfig(filepath: string, {
  home = '',
  cwd = process.cwd(),
}): Config {
  const config = ini.parse(fs.readFileSync(filepath, 'utf-8'))
  const globalAgent = config.globalAgent ?? 'npm'

  const projectAgent = config.projectAgent ?? {}

  const finallyProjectAgent = Object.entries(projectAgent)
    .reduce((obj, [key, agent]) => {
      const path = key.replace('{HOME}', home)
      return { ...obj, [path]: [path.length, agent] }
    }, {})

  let maxMatch = -1
  Object.entries(finallyProjectAgent)
    .forEach(([key, [matchValue]]: any) => {
      if (cwd.startsWith(key))
        maxMatch = Math.max(maxMatch, matchValue)
    })

  const defaultAgent = Object.entries<any>(finallyProjectAgent)
    .find(([_, [matchValue]]) => {
      return matchValue === maxMatch
    })?.[1]?.[1] ?? (config.defaultAgent || 'prompt')

  return { defaultAgent, globalAgent }
}
