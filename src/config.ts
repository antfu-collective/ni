import fs from 'fs'
import path from 'path'
import { findUp } from 'find-up'
import type { Agent } from './agents'
import { LOCKS } from './agents'
import { loadConfig } from './config_74'

const customRcPath = process.env.NI_CONFIG_FILE

const home = process.platform === 'win32'
  ? process.env.USERPROFILE
  : process.env.HOME

const defaultRcPath = path.join(home || '~/', '.nirc')

const rcPath = customRcPath || defaultRcPath

export interface Config {
  defaultAgent: Agent | 'prompt'
  globalAgent: Agent
}

export interface Options {
  cwd: string
}

const defaultConfig: Config = {
  defaultAgent: 'prompt',
  globalAgent: 'npm',
}

let config: Config | undefined

export async function getConfig({ cwd }: Options): Promise<Config> {
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
      config = Object.assign({}, defaultConfig, await loadConfig(rcPath, { home, cwd }))
  }
  return config
}

export async function getDefaultAgent({ cwd }: Options) {
  const { defaultAgent } = await getConfig({ cwd })
  if (defaultAgent === 'prompt' && process.env.CI)
    return 'npm'
  return defaultAgent
}

export async function getGlobalAgent() {
  const { globalAgent } = await getConfig({ cwd: process.cwd() })
  return globalAgent
}
