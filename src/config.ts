import fs, { type PathLike } from 'fs'
import path from 'path'
import ini from 'ini'
import { findUp } from 'find-up'
import type { Agent } from './agents'
import { LOCKS } from './agents'

const CONFIG_FILE_NAME = '.nirc'

const customRcPath = process.env.NI_CONFIG_FILE

const home = process.platform === 'win32'
  ? process.env.USERPROFILE
  : process.env.HOME

const rootRcPath = path.join(home || '~/', CONFIG_FILE_NAME)

interface Config {
  defaultAgent: Agent | 'prompt'
  globalAgent: Agent
}

interface Options {
  cwd?: string
}

interface ConfigOptions {
  rcPath: PathLike
}

const defaultConfig: Config = {
  defaultAgent: 'prompt',
  globalAgent: 'npm',
}

let config: Config | undefined

export async function getConfig({ rcPath }: ConfigOptions): Promise<Config> {
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

export async function getDefaultAgent({ cwd }: Options) {
  const defaultRcPath = await findUp(CONFIG_FILE_NAME, { cwd, stopAt: rootRcPath }) || ''

  const { defaultAgent } = await getConfig({ rcPath: customRcPath || defaultRcPath })
  if (defaultAgent === 'prompt' && process.env.CI)
    return 'npm'
  return defaultAgent
}

export async function getGlobalAgent() {
  const { globalAgent } = await getConfig({ rcPath: customRcPath || rootRcPath })
  return globalAgent
}
