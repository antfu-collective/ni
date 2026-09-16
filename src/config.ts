import type { Agent } from 'package-manager-detector'
import fs from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import ini from 'ini'
import { detect } from './detect'
import { findConfigFiles } from './fs'

const RC_FILE_NAME = '.nirc'

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

/**
 * Every `.nirc` that applies to `cwd`, nearest last.
 *
 * `NI_CONFIG_FILE` keeps its original meaning: it names the one and only file
 * to read, and no traversal happens.
 */
function resolveRcPaths(cwd: string): string[] {
  const customRcPath = process.env.NI_CONFIG_FILE
  if (customRcPath)
    return fs.existsSync(customRcPath) ? [customRcPath] : []

  return findConfigFiles(cwd, RC_FILE_NAME).reverse()
}

function readRcFiles(cwd: string): Partial<Config> {
  let merged: Partial<Config> = {}

  for (const path of resolveRcPaths(cwd))
    merged = { ...merged, ...readRcFile(path) }

  return merged
}

async function loadConfig(cwd: string): Promise<Config> {
  const config: Config = { ...defaultConfig, ...readRcFiles(cwd) }

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

  const agent = await detect({ programmatic: true, cwd })
  if (agent)
    config.defaultAgent = agent

  return config
}

// Holds the pending promise rather than the result, so concurrent calls for
// the same directory share one read and print any `.nirc` warnings once.
const configs = new Map<string, Promise<Config>>()

export function getConfig(cwd: string = process.cwd()): Promise<Config> {
  const key = resolve(cwd)
  let config = configs.get(key)

  if (!config) {
    config = loadConfig(key)
    configs.set(key, config)
  }

  return config
}

export async function getDefaultAgent(programmatic?: boolean, cwd?: string) {
  const { defaultAgent } = await getConfig(cwd)
  if (defaultAgent === 'prompt' && (programmatic || process.env.CI))
    return 'npm'
  return defaultAgent
}

export async function getGlobalAgent(cwd?: string) {
  const { globalAgent } = await getConfig(cwd)
  return globalAgent
}

export async function getRunAgent(cwd?: string) {
  const { runAgent } = await getConfig(cwd)
  return runAgent
}

export async function getUseSfw(cwd?: string) {
  const { useSfw } = await getConfig(cwd)
  return useSfw
}

export async function getCatalog(cwd?: string) {
  const { catalog } = await getConfig(cwd)
  return catalog
}
