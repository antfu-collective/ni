import fs from 'fs'
import path from 'path'
import ini from 'ini'
import { Agent } from './agents'

const customRcPath = process.env.NI_CONFIG_FILE

const home = process.platform === 'win32'
  ? process.env.USERPROFILE
  : process.env.HOME

const defaultRcPath = path.join(home || '~/', '.nirc')

const rcPath = customRcPath || defaultRcPath

interface Config {
  defaultAgent: Agent | 'prompt'
  globalAgent: Agent
}

const defaultConfig: Config = {
  defaultAgent: 'prompt',
  globalAgent: 'npm',
}

let config: Config | undefined

export function getConfig() {
  if (!config) {
    if (!fs.existsSync(rcPath))
      config = defaultConfig
    else
      config = Object.assign({}, defaultConfig, ini.parse(fs.readFileSync(rcPath, 'utf-8')))
  }
  return config
}

export function getDefaultAgent() {
  const agent = getConfig().defaultAgent
  if (agent === 'prompt' && process.env.CI)
    return 'npm'
  return agent
}

export function getGlobalAgent() {
  return getConfig().globalAgent
}
