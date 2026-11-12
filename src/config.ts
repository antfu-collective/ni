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

/**
 * Where the last script run by `nr` is remembered:
 * - `shared`: one record for every terminal and every project (default).
 * - `terminal`: one record per terminal, so two tabs cannot overwrite each
 *   other's last script.
 * - `off`: nothing is remembered, `nr -` is disabled.
 */
const LAST_COMMAND_MODES = ['shared', 'terminal', 'off'] as const

export type LastCommandMode = typeof LAST_COMMAND_MODES[number]

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
  lastCommand: LastCommandMode
}

const defaultConfig: Config = {
  defaultAgent: 'prompt',
  globalAgent: 'npm',
  runAgent: undefined,
  useSfw: false,
  catalog: true,
  lastCommand: 'shared',
}

const configKeys = Object.keys(defaultConfig)

/**
 * Resolves a configured value, reporting unknown ones instead of letting a typo
 * silently move the record somewhere else.
 */
function resolveLastCommandMode(value: string, source: string): LastCommandMode | undefined {
  const normalized = value.trim().toLowerCase()
  const mode = LAST_COMMAND_MODES.find(mode => mode === normalized)
  if (mode)
    return mode

  console.warn(
    `[ni] unknown value "${value}" for ${source}, expected one of ${LAST_COMMAND_MODES.join(', ')}`,
  )
}

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
    if (key === 'lastCommand') {
      const mode = resolveLastCommandMode(String(value), `"lastCommand" in ${path}`)
      if (mode)
        known[key] = mode
      continue
    }

    // https://github.com/antfu-collective/ni/pull/333
    // Renamed to `lastCommand`, still honoured so existing configs keep working
    if (key === 'noLastCommand') {
      known.lastCommand = value === true || value === 'true' ? 'off' : 'shared'
      console.warn(`[ni] "noLastCommand" is deprecated in ${path}, use "lastCommand" instead`)
      continue
    }

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
    config = { ...defaultConfig, ...fs.existsSync(rcPath) ? readRcFile(rcPath) : null }

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

    if (process.env.NI_LAST_COMMAND !== undefined)
      config.lastCommand = resolveLastCommandMode(process.env.NI_LAST_COMMAND, 'NI_LAST_COMMAND') ?? config.lastCommand
    // https://github.com/antfu-collective/ni/pull/333
    // Predates `lastCommand`, mapped silently so nobody has to migrate
    else if (process.env.NI_NO_LAST_COMMAND !== undefined)
      config.lastCommand = process.env.NI_NO_LAST_COMMAND === 'true' ? 'off' : 'shared'

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
