import fs from 'fs'
import path from 'path'
import ini from 'ini'

const home = process.platform === 'win32'
  ? process.env.USERPROFILE
  : process.env.HOME
const rcPath = path.join(home || '~/', '.nirc')

const defaultConfig = {
  defaultAgent: 'npm',
}

let config: typeof defaultConfig | undefined

export async function getConfig() {
  if (!config) {
    if (!fs.existsSync(rcPath))
      config = defaultConfig
    else
      config = Object.assign({}, defaultConfig, ini.parse(await fs.promises.readFile(rcPath, 'utf-8')))
  }
  return config
}

export async function getDefaultAgent() {
  return (await getConfig())?.defaultAgent
}
