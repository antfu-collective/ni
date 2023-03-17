import fs from 'fs'
import path from 'path'
import ini from 'ini'
import { findUp } from 'find-up'
import type { Agent } from './agents'
import { LOCKS } from './agents'

const customRcPath = process.env.NI_CONFIG_FILE

const home = process.platform === 'win32'
  ? process.env.USERPROFILE
  : process.env.HOME

const defaultRcPath = path.join(home || '~/', '.nirc')

const rcPath = customRcPath || defaultRcPath

interface Config {
  defaultAgent: Agent | 'prompt'
  globalAgent: Agent
  projectAgent?: Record<string, Agent | 'prompt'>
}

const defaultConfig: Config = {
  defaultAgent: 'prompt',
  globalAgent: 'npm',
  projectAgent: {},
}

let config: Config | undefined

export async function getConfig(): Promise<Config> {
  if (!config) {
    const result = await findUp('package.json') || ''
    let packageManager = ''
    if (result)
      packageManager = JSON.parse(fs.readFileSync(result, 'utf8')).packageManager ?? ''
    const [, agent, version] = packageManager.match(new RegExp(`^(${Object.values(LOCKS).join('|')})@(\d).*?$`)) || []
    if (agent)
      config = Object.assign({}, defaultConfig, { defaultAgent: (agent === 'yarn' && parseInt(version) > 1) ? 'yarn@berry' : agent })
    else if (!fs.existsSync(rcPath))
      config = defaultConfig
    else
      config = Object.assign({}, defaultConfig, ini.parse(fs.readFileSync(rcPath, 'utf-8')))
  }
  return config
}

export async function getDefaultAgent({ projectPath } = { projectPath: process.cwd() }) {
  const agent = await getAgentByProject(projectPath, { isFullMatch: false })
  if (agent === 'prompt' && process.env.CI)
    return 'npm'
  return agent
}

export async function getGlobalAgent() {
  const { globalAgent } = await getConfig()
  return globalAgent
}

export async function getAgentByProject(
  projectPath = process.cwd(),
  options?: { isFullMatch?: boolean },
): Promise<Agent | 'prompt'> {
  const {
    projectAgent,
    defaultAgent,
  } = await getConfig()

  const variableMap: Record<string, string> = {
    '{HOME}': home || '~/',
  }

  const finallyProjectAgent: Record<string, Agent | 'prompt'> = {}
  // replace the variable
  for (const key in projectAgent) {
    let cloneKey = key
    for (const variable in variableMap)
      cloneKey = cloneKey.replace(variable, variableMap[variable])

    finallyProjectAgent[cloneKey] = projectAgent[key]
  }

  // find the full match
  if (options?.isFullMatch)
    return finallyProjectAgent[projectPath]

  // find the longest match
  let maxMatch = -1
  for (const key in finallyProjectAgent) {
    if (projectPath.startsWith(key))
      maxMatch = Math.max(maxMatch, key.length)
  }

  for (const key in finallyProjectAgent) {
    if (key.length === maxMatch)
      return finallyProjectAgent[key]
  }

  return defaultAgent
}
