import type { Agent } from 'package-manager-detector'
import fs from 'node:fs'
import process from 'node:process'
import ini from 'ini'
import { parsePnpmWorkspaceYaml } from 'pnpm-workspace-yaml'
import { findConfigFiles } from '../fs'

const DEFAULT_PREFIX = '^'

function isTrue(value: unknown): boolean {
  return value === true || value === 'true'
}

// npm/pnpm: `save-exact` wins over `save-prefix`, both overridable through the
// `npm_config_*` environment variables.
function npmRangePrefix(cwd: string): string {
  if (isTrue(process.env.npm_config_save_exact))
    return ''
  if (process.env.npm_config_save_prefix !== undefined)
    return process.env.npm_config_save_prefix

  for (const filePath of findConfigFiles(cwd, '.npmrc')) {
    let parsed: Record<string, unknown>
    try {
      parsed = ini.parse(fs.readFileSync(filePath, 'utf-8'))
    }
    catch {
      continue
    }
    if (isTrue(parsed['save-exact']))
      return ''
    if (typeof parsed['save-prefix'] === 'string')
      return parsed['save-prefix']
  }

  return DEFAULT_PREFIX
}

// yarn berry: `defaultSemverRangePrefix`, where an empty string means exact.
function yarnRangePrefix(cwd: string): string {
  const fromEnv = process.env.YARN_DEFAULT_SEMVER_RANGE_PREFIX
  if (fromEnv !== undefined)
    return fromEnv

  for (const filePath of findConfigFiles(cwd, '.yarnrc.yml')) {
    let json: Record<string, unknown>
    try {
      json = parsePnpmWorkspaceYaml(fs.readFileSync(filePath, 'utf-8')).toJSON() as Record<string, unknown>
    }
    catch {
      continue
    }
    if (typeof json.defaultSemverRangePrefix === 'string')
      return json.defaultSemverRangePrefix
  }

  return DEFAULT_PREFIX
}

/**
 * The range prefix the agent would itself use when saving a resolved version.
 * Bun has no equivalent setting outside of `bunfig.toml`, so it keeps `^`.
 */
export function getRangePrefix(agent: Agent, cwd: string): string {
  if (agent === 'yarn@berry')
    return yarnRangePrefix(cwd)
  if (agent === 'pnpm')
    return npmRangePrefix(cwd)
  return DEFAULT_PREFIX
}
