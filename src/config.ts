import type { Agent } from 'package-manager-detector'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ini from 'ini'
import { detect } from './detect'

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

export async function getConfig(): Promise<Config> {
  if (!config) {
    config = Object.assign(
      {},
      defaultConfig,
      fs.existsSync(rcPath)
        ? ini.parse(fs.readFileSync(rcPath, 'utf-8'))
        : null,
    )

    if (process.env.NI_DEFAULT_AGENT)
      config.defaultAgent = process.env.NI_DEFAULT_AGENT as Agent

    if (process.env.NI_GLOBAL_AGENT)
      config.globalAgent = process.env.NI_GLOBAL_AGENT as Agent

    const agent = await detect({ programmatic: true })
    if (agent)
      config.defaultAgent = agent
  }

  return config
}

export async function getDefaultAgent(programmatic?: boolean) {
  const { defaultAgent } = await getConfig()
  if (defaultAgent === 'prompt' && (programmatic || process.env.CI))
    return 'npm'
  return defaultAgent
}

export async function getGlobalAgent() {
  const { globalAgent } = await getConfig()
  return globalAgent
}
