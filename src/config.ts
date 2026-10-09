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
  runAgent: 'node' | undefined
  useSfw: boolean
  /**
   * `true` to use catalogs whenever they are detected, `false` to disable
   * catalog mode, `'existing'` to only reuse catalog entries that already exist
   * and install any other package normally.
   */
  catalog: boolean | 'existing'
  noLastCommand: boolean
}

const defaultConfig: Config = {
  defaultAgent: 'prompt',
  globalAgent: 'npm',
  runAgent: undefined,
  useSfw: false,
  catalog: true,
  noLastCommand: false,
}

const configKeys = Object.keys(defaultConfig)

/**
 * The option `key` was probably meant to be, if any. `ini` lowercases nothing
 * and validates nothing, so a `defaultagent=npm` parses cleanly and then does
 * nothing at all.
 */
function suggestKey(key: string): string | undefined {
  const lowerCased = key.toLowerCase()
  return configKeys.find(known => known.toLowerCase() === lowerCased)
}

function readRcFile(path: string): Partial<Config> {
  let contents: string

  try {
    contents = fs.readFileSync(path, 'utf-8')
  }
  catch (error) {
    console.warn(`[ni] cannot read ${path}: ${(error as Error).message}`)
    return {}
  }

  let parsed: Record<string, unknown>

  // `ini` accepts almost anything, but it does throw: dotted sections are
  // merged into the values already parsed, and a `null` value passes its
  // `typeof === 'object'` check on the way in.
  try {
    parsed = ini.parse(contents)
  }
  catch (error) {
    console.warn(`[ni] cannot parse ${path}: ${(error as Error).message}`)
    return {}
  }

  const known: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(parsed)) {
    if (configKeys.includes(key)) {
      known[key] = value
      continue
    }

    const suggestion = suggestKey(key)
    console.warn(
      `[ni] unknown option "${key}" in ${path}${suggestion ? ` (did you mean "${suggestion}"?)` : ''}`,
    )
  }

  return known as Partial<Config>
}

let config: Config | undefined

export async function getConfig(): Promise<Config> {
  if (!config) {
    const rcExists = fs.existsSync(rcPath)
    if (customRcPath && !rcExists) {
      console.warn(`[ni] NI_CONFIG_FILE points to ${path.resolve(rcPath)}, which does not exist`)
    }

    config = { ...defaultConfig, ...rcExists ? readRcFile(rcPath) : null }

    if (process.env.NI_DEFAULT_AGENT)
      config.defaultAgent = process.env.NI_DEFAULT_AGENT as Agent

    if (process.env.NI_GLOBAL_AGENT)
      config.globalAgent = process.env.NI_GLOBAL_AGENT as Agent

    if (process.env.NI_RUN_AGENT === 'node')
      config.runAgent = process.env.NI_RUN_AGENT

    if (process.env.NI_USE_SFW !== undefined)
      config.useSfw = process.env.NI_USE_SFW === 'true'

    if (process.env.NI_CATALOG !== undefined) {
      config.catalog = process.env.NI_CATALOG === 'existing'
        ? 'existing'
        : process.env.NI_CATALOG !== 'false'
    }

    if (process.env.NI_NO_LAST_COMMAND !== undefined)
      config.noLastCommand = process.env.NI_NO_LAST_COMMAND === 'true'

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

export async function getRunAgent() {
  const { runAgent } = await getConfig()
  return runAgent
}

export async function getUseSfw() {
  const { useSfw } = await getConfig()
  return useSfw
}

export async function getCatalog() {
  const { catalog } = await getConfig()
  return catalog
}
